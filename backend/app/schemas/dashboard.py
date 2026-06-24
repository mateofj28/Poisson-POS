from pydantic import BaseModel
from typing import Optional


class DashboardResponse(BaseModel):
    total_sales_today: float
    total_orders_today: int
    occupied_tables: int
    free_tables: int
    out_of_stock_products: int
    low_stock_products: int
    best_seller_today: Optional[str] = None
    best_seller_quantity: int = 0
    active_cash_register: bool = False
