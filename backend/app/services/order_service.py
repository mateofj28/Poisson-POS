from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import Optional

from app.models.order import Order, OrderItem, OrderStatus
from app.models.table import TableStatus
from app.repositories.order_repository import OrderRepository
from app.repositories.product_repository import ProductRepository
from app.repositories.table_repository import TableRepository
from app.schemas.order import OrderCreate, OrderUpdate, OrderItemCreate


class OrderService:
    def __init__(self, db: Session):
        self.db = db
        self.repository = OrderRepository(db)
        self.product_repo = ProductRepository(db)
        self.table_repo = TableRepository(db)

    def get_order(self, order_id: int) -> Order:
        order = self.repository.get_by_id(order_id)
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pedido no encontrado",
            )
        return order

    def get_orders(
        self,
        skip: int = 0,
        limit: int = 20,
        table_id: Optional[int] = None,
        status_filter: Optional[OrderStatus] = None,
        employee_id: Optional[int] = None,
        date_from=None,
    ):
        orders, total = self.repository.get_all(
            skip=skip, limit=limit, table_id=table_id, status=status_filter, employee_id=employee_id, date_from=date_from
        )
        pages = (total + limit - 1) // limit
        page = (skip // limit) + 1
        return {
            "items": orders,
            "total": total,
            "page": page,
            "size": limit,
            "pages": pages,
        }

    def create_order(self, data: OrderCreate, employee_id: int) -> Order:
        # Verify table exists and is occupied
        table = self.table_repo.get_by_id(data.table_id)
        if not table:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Mesa no encontrada",
            )

        if table.status == TableStatus.LIBRE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La mesa debe estar ocupada para crear un pedido",
            )

        # Check if table already has an active order - if so, add items to it
        existing_order = self.repository.get_active_by_table(data.table_id)
        if existing_order:
            return self._add_items_to_order(existing_order, data.items, employee_id)

        # Create new order
        order = Order(
            table_id=data.table_id,
            employee_id=employee_id,
            status=OrderStatus.PENDIENTE,
            notes=data.notes,
        )

        total = 0.0
        items = []

        for item_data in data.items:
            product = self.product_repo.get_by_id(item_data.product_id)
            if not product:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Producto ID {item_data.product_id} no encontrado",
                )

            if not product.is_active:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Producto '{product.name}' no está activo",
                )

            subtotal = product.sale_price * item_data.quantity
            total += subtotal

            item = OrderItem(
                product_id=item_data.product_id,
                quantity=item_data.quantity,
                unit_price=product.sale_price,
                subtotal=subtotal,
                notes=item_data.notes,
            )
            items.append(item)

        order.total = round(total, 2)
        order.items = items

        return self.repository.create(order)

    def _add_items_to_order(self, order: Order, items_data: list, employee_id: int) -> Order:
        """Add items to an existing active order for a table."""
        for item_data in items_data:
            product = self.product_repo.get_by_id(item_data.product_id)
            if not product:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Producto ID {item_data.product_id} no encontrado",
                )

            if not product.is_active:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Producto '{product.name}' no está activo",
                )

            # Check if this product already exists in the order
            existing_item = next((i for i in order.items if i.product_id == item_data.product_id), None)

            if existing_item:
                # Update quantity and subtotal
                order.total -= existing_item.subtotal
                existing_item.quantity += item_data.quantity
                existing_item.subtotal = existing_item.unit_price * existing_item.quantity
                order.total += existing_item.subtotal
            else:
                # Add new item
                subtotal = product.sale_price * item_data.quantity
                order.total += subtotal

                item = OrderItem(
                    order_id=order.id,
                    product_id=item_data.product_id,
                    quantity=item_data.quantity,
                    unit_price=product.sale_price,
                    subtotal=subtotal,
                    notes=item_data.notes,
                )
                self.db.add(item)

        order.total = round(order.total, 2)
        return self.repository.update(order)

    def add_items(self, order_id: int, items_data: list[OrderItemCreate]) -> Order:
        order = self.get_order(order_id)

        if order.status in [OrderStatus.ENTREGADO, OrderStatus.CANCELADO]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se pueden agregar items a un pedido entregado o cancelado",
            )

        for item_data in items_data:
            product = self.product_repo.get_by_id(item_data.product_id)
            if not product:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Producto ID {item_data.product_id} no encontrado",
                )

            subtotal = product.sale_price * item_data.quantity
            order.total += subtotal

            item = OrderItem(
                order_id=order_id,
                product_id=item_data.product_id,
                quantity=item_data.quantity,
                unit_price=product.sale_price,
                subtotal=subtotal,
                notes=item_data.notes,
            )
            self.repository.add_item(item)

        order.total = round(order.total, 2)
        return self.repository.update(order)

    def remove_item(self, order_id: int, item_id: int) -> Order:
        order = self.get_order(order_id)

        if order.status in [OrderStatus.ENTREGADO, OrderStatus.CANCELADO]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se pueden eliminar items de un pedido entregado o cancelado",
            )

        item = self.repository.get_item_by_id(item_id)
        if not item or item.order_id != order_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Item no encontrado en este pedido",
            )

        order.total -= item.subtotal
        order.total = round(max(order.total, 0), 2)
        self.repository.remove_item(item)

        return self.repository.update(order)

    def update_order(self, order_id: int, data: OrderUpdate) -> Order:
        order = self.get_order(order_id)

        if data.status:
            order.status = data.status

        if data.notes is not None:
            order.notes = data.notes

        return self.repository.update(order)

    def update_item_quantity(self, order_id: int, item_id: int, quantity: int) -> Order:
        order = self.get_order(order_id)

        item = self.repository.get_item_by_id(item_id)
        if not item or item.order_id != order_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Item no encontrado en este pedido",
            )

        # Recalculate
        order.total -= item.subtotal
        item.quantity = quantity
        item.subtotal = item.unit_price * quantity
        order.total += item.subtotal
        order.total = round(order.total, 2)

        return self.repository.update(order)
