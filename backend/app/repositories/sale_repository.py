from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import Optional
from datetime import datetime, timezone

from app.models.sale import Sale, SalePayment, PaymentMethod


class SaleRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, sale_id: int) -> Optional[Sale]:
        return (
            self.db.query(Sale)
            .options(joinedload(Sale.payments))
            .filter(Sale.id == sale_id)
            .first()
        )

    def get_all(
        self,
        skip: int = 0,
        limit: int = 20,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        employee_id: Optional[int] = None,
    ) -> tuple[list[Sale], int]:
        query = self.db.query(Sale).options(joinedload(Sale.payments))

        if date_from:
            query = query.filter(Sale.sale_date >= date_from)

        if date_to:
            query = query.filter(Sale.sale_date <= date_to)

        if employee_id:
            query = query.filter(Sale.employee_id == employee_id)

        total = query.count()
        sales = query.order_by(Sale.sale_date.desc()).offset(skip).limit(limit).all()

        return sales, total

    def get_total_today(self) -> float:
        today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        result = (
            self.db.query(func.coalesce(func.sum(Sale.total), 0.0))
            .filter(Sale.sale_date >= today_start)
            .scalar()
        )
        return float(result)

    def get_sales_by_cash_register(self, cash_register_id: int) -> list[Sale]:
        return (
            self.db.query(Sale)
            .options(joinedload(Sale.payments))
            .filter(Sale.cash_register_id == cash_register_id)
            .all()
        )

    def get_cash_total_for_register(self, cash_register_id: int) -> float:
        result = (
            self.db.query(func.coalesce(func.sum(SalePayment.amount), 0.0))
            .join(Sale)
            .filter(
                Sale.cash_register_id == cash_register_id,
                SalePayment.payment_method == PaymentMethod.EFECTIVO,
            )
            .scalar()
        )
        return float(result)

    def get_digital_total_for_register(self, cash_register_id: int) -> float:
        result = (
            self.db.query(func.coalesce(func.sum(SalePayment.amount), 0.0))
            .join(Sale)
            .filter(
                Sale.cash_register_id == cash_register_id,
                SalePayment.payment_method != PaymentMethod.EFECTIVO,
            )
            .scalar()
        )
        return float(result)

    def create(self, sale: Sale) -> Sale:
        self.db.add(sale)
        self.db.commit()
        self.db.refresh(sale)
        return sale
