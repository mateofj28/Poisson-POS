from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timezone

from app.models.table import Table, TableStatus
from app.models.product import Product
from app.models.order import Order, OrderItem
from app.models.sale import Sale
from app.models.cash_register import CashRegister
from app.repositories.sale_repository import SaleRepository
from app.repositories.order_repository import OrderRepository
from app.repositories.table_repository import TableRepository
from app.repositories.product_repository import ProductRepository
from app.repositories.cash_register_repository import CashRegisterRepository
from app.schemas.dashboard import DashboardResponse


class DashboardService:
    def __init__(self, db: Session):
        self.db = db
        self.sale_repo = SaleRepository(db)
        self.order_repo = OrderRepository(db)
        self.table_repo = TableRepository(db)
        self.product_repo = ProductRepository(db)
        self.cash_register_repo = CashRegisterRepository(db)

    def get_dashboard(self) -> DashboardResponse:
        today_start = datetime.now(timezone.utc).replace(
            hour=0, minute=0, second=0, microsecond=0
        )

        # Sales today
        total_sales_today = self.sale_repo.get_total_today()

        # Orders today
        total_orders_today = self.order_repo.count_today()

        # Tables
        occupied_tables = self.table_repo.count_by_status(TableStatus.OCUPADA)
        en_pago_tables = self.table_repo.count_by_status(TableStatus.EN_PAGO)
        free_tables = self.table_repo.count_by_status(TableStatus.LIBRE)

        # Products
        out_of_stock = len(self.product_repo.get_out_of_stock())
        low_stock = len(self.product_repo.get_low_stock())

        # Best seller today
        best_seller_result = (
            self.db.query(
                Product.name,
                func.sum(OrderItem.quantity).label("total_qty"),
            )
            .join(OrderItem, OrderItem.product_id == Product.id)
            .join(Order, Order.id == OrderItem.order_id)
            .filter(Order.order_date >= today_start)
            .group_by(Product.name)
            .order_by(func.sum(OrderItem.quantity).desc())
            .first()
        )

        best_seller_name = None
        best_seller_qty = 0
        if best_seller_result:
            best_seller_name = best_seller_result[0]
            best_seller_qty = int(best_seller_result[1])

        # Active cash register
        active_register = self.cash_register_repo.get_open_register()

        return DashboardResponse(
            total_sales_today=total_sales_today,
            total_orders_today=total_orders_today,
            occupied_tables=occupied_tables + en_pago_tables,
            free_tables=free_tables,
            out_of_stock_products=out_of_stock,
            low_stock_products=low_stock,
            best_seller_today=best_seller_name,
            best_seller_quantity=best_seller_qty,
            active_cash_register=active_register is not None,
        )
