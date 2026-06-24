from sqlalchemy.orm import Session
from typing import Optional

from app.models.cash_register import CashRegister


class CashRegisterRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, register_id: int) -> Optional[CashRegister]:
        return self.db.query(CashRegister).filter(CashRegister.id == register_id).first()

    def get_open_register(self) -> Optional[CashRegister]:
        return self.db.query(CashRegister).filter(CashRegister.is_open == True).first()

    def get_all(
        self,
        skip: int = 0,
        limit: int = 20,
        is_open: Optional[bool] = None,
    ) -> tuple[list[CashRegister], int]:
        query = self.db.query(CashRegister)

        if is_open is not None:
            query = query.filter(CashRegister.is_open == is_open)

        total = query.count()
        registers = query.order_by(CashRegister.opened_at.desc()).offset(skip).limit(limit).all()

        return registers, total

    def create(self, register: CashRegister) -> CashRegister:
        self.db.add(register)
        self.db.commit()
        self.db.refresh(register)
        return register

    def update(self, register: CashRegister) -> CashRegister:
        self.db.commit()
        self.db.refresh(register)
        return register
