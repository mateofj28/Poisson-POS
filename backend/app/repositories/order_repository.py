from sqlalchemy.orm import Session, joinedload
from typing import Optional
from datetime import datetime, timezone

from app.models.order import Order, OrderItem, OrderStatus


class OrderRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, order_id: int) -> Optional[Order]:
        return (
            self.db.query(Order)
            .options(joinedload(Order.items).joinedload(OrderItem.product))
            .filter(Order.id == order_id, Order.is_deleted == False)
            .first()
        )

    def get_all(
        self,
        skip: int = 0,
        limit: int = 20,
        table_id: Optional[int] = None,
        status: Optional[OrderStatus] = None,
        employee_id: Optional[int] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
    ) -> tuple[list[Order], int]:
        query = (
            self.db.query(Order)
            .options(joinedload(Order.items).joinedload(OrderItem.product))
            .filter(Order.is_deleted == False)
        )

        if table_id:
            query = query.filter(Order.table_id == table_id)

        if status:
            query = query.filter(Order.status == status)

        if employee_id:
            query = query.filter(Order.employee_id == employee_id)

        if date_from:
            query = query.filter(Order.order_date >= date_from)

        if date_to:
            query = query.filter(Order.order_date <= date_to)

        total = query.count()
        orders = query.order_by(Order.created_at.desc()).offset(skip).limit(limit).all()

        return orders, total

    def get_active_by_table(self, table_id: int) -> Optional[Order]:
        # Only consider orders from today (Colombia UTC-5)
        from datetime import timedelta
        colombia_tz = timezone(timedelta(hours=-5))
        today_start = datetime.now(colombia_tz).replace(hour=0, minute=0, second=0, microsecond=0).astimezone(timezone.utc)

        return (
            self.db.query(Order)
            .options(joinedload(Order.items).joinedload(OrderItem.product))
            .filter(
                Order.table_id == table_id,
                Order.is_deleted == False,
                Order.status.in_([OrderStatus.PENDIENTE, OrderStatus.EN_PREPARACION, OrderStatus.LISTO]),
                Order.order_date >= today_start,
            )
            .first()
        )

    def count_today(self) -> int:
        today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        return (
            self.db.query(Order)
            .filter(Order.order_date >= today_start, Order.is_deleted == False)
            .count()
        )

    def create(self, order: Order) -> Order:
        self.db.add(order)
        self.db.commit()
        self.db.refresh(order)
        return order

    def update(self, order: Order) -> Order:
        self.db.commit()
        self.db.refresh(order)
        return order

    def add_item(self, item: OrderItem) -> OrderItem:
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        return item

    def remove_item(self, item: OrderItem) -> None:
        self.db.delete(item)
        self.db.commit()

    def get_item_by_id(self, item_id: int) -> Optional[OrderItem]:
        return self.db.query(OrderItem).filter(OrderItem.id == item_id).first()
