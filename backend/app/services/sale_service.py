from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import Optional

from app.models.sale import Sale, SalePayment
from app.models.order import OrderStatus
from app.models.table import TableStatus
from app.models.inventory import InventoryMovement, MovementType
from app.repositories.sale_repository import SaleRepository
from app.repositories.order_repository import OrderRepository
from app.repositories.product_repository import ProductRepository
from app.repositories.table_repository import TableRepository
from app.repositories.cash_register_repository import CashRegisterRepository
from app.repositories.barrel_repository import BarrelRepository
from app.schemas.sale import SaleCreate


class SaleService:
    def __init__(self, db: Session):
        self.db = db
        self.repository = SaleRepository(db)
        self.order_repo = OrderRepository(db)
        self.product_repo = ProductRepository(db)
        self.table_repo = TableRepository(db)
        self.cash_register_repo = CashRegisterRepository(db)
        self.barrel_repo = BarrelRepository(db)

    def get_sale(self, sale_id: int) -> Sale:
        sale = self.repository.get_by_id(sale_id)
        if not sale:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Venta no encontrada",
            )
        return sale

    def get_sales(
        self,
        skip: int = 0,
        limit: int = 20,
        employee_id: Optional[int] = None,
        date_from=None,
    ):
        sales, total = self.repository.get_all(
            skip=skip, limit=limit, employee_id=employee_id, date_from=date_from
        )
        pages = (total + limit - 1) // limit
        page = (skip // limit) + 1
        return {
            "items": sales,
            "total": total,
            "page": page,
            "size": limit,
            "pages": pages,
        }

    def create_sale(self, data: SaleCreate, employee_id: int) -> Sale:
        # Get the order
        order = self.order_repo.get_by_id(data.order_id)
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pedido no encontrado",
            )

        if order.status == OrderStatus.CANCELADO:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se puede generar venta de un pedido cancelado",
            )

        # Check if order already has a sale
        existing_sale = self.db.query(Sale).filter(Sale.order_id == data.order_id).first()
        if existing_sale:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Este pedido ya tiene una venta registrada",
            )

        # Validate payment amounts match total
        total_payments = sum(p.amount for p in data.payments)
        if round(total_payments, 2) < round(order.total, 2):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"El total de pagos ({total_payments}) no cubre el total del pedido ({order.total})",
            )

        # Get active cash register
        cash_register = self.cash_register_repo.get_open_register()

        # Create sale
        sale = Sale(
            order_id=order.id,
            employee_id=employee_id,
            cash_register_id=cash_register.id if cash_register else None,
            total=order.total,
            notes=data.notes,
        )

        # Add payments
        for payment_data in data.payments:
            payment = SalePayment(
                payment_method=payment_data.payment_method,
                amount=payment_data.amount,
                reference=payment_data.reference,
            )
            sale.payments.append(payment)

        self.repository.create(sale)

        # Discount inventory
        for item in order.items:
            product = item.product
            if product:
                previous_stock = product.stock
                product.stock = max(0, product.stock - item.quantity)

                # Create inventory movement
                movement = InventoryMovement(
                    product_id=product.id,
                    movement_type=MovementType.VENTA,
                    quantity=item.quantity,
                    previous_stock=previous_stock,
                    new_stock=product.stock,
                    reason=f"Venta #{sale.id} - Pedido #{order.id}",
                    employee_id=employee_id,
                )
                self.db.add(movement)

                # Discount barrel if product is chop
                if product.barrel_id:
                    barrel = self.barrel_repo.get_by_id(product.barrel_id)
                    if barrel:
                        liters_per_unit = 0.5  # 500ml per unit
                        liters_to_discount = liters_per_unit * item.quantity
                        barrel.available_liters = max(
                            0, barrel.available_liters - liters_to_discount
                        )
                        if barrel.available_liters <= 0:
                            barrel.is_active = False

        # Update order status
        order.status = OrderStatus.ENTREGADO

        # Set table to "en_pago" then free
        table = self.table_repo.get_by_id(order.table_id)
        if table:
            table.status = TableStatus.LIBRE
            table.waiter_id = None
            table.occupied_at = None

        self.db.commit()
        self.db.refresh(sale)

        return sale
