from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from datetime import datetime, timezone
from typing import Optional

from app.models.cash_register import CashRegister
from app.repositories.cash_register_repository import CashRegisterRepository
from app.repositories.sale_repository import SaleRepository
from app.schemas.cash_register import CashRegisterOpen, CashRegisterClose


class CashRegisterService:
    def __init__(self, db: Session):
        self.db = db
        self.repository = CashRegisterRepository(db)
        self.sale_repo = SaleRepository(db)

    def get_register(self, register_id: int) -> CashRegister:
        register = self.repository.get_by_id(register_id)
        if not register:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Caja no encontrada",
            )
        return register

    def get_registers(
        self,
        skip: int = 0,
        limit: int = 20,
        is_open: Optional[bool] = None,
    ):
        registers, total = self.repository.get_all(
            skip=skip, limit=limit, is_open=is_open
        )
        pages = (total + limit - 1) // limit
        page = (skip // limit) + 1
        return {
            "items": registers,
            "total": total,
            "page": page,
            "size": limit,
            "pages": pages,
        }

    def get_open_register(self) -> Optional[CashRegister]:
        register = self.repository.get_open_register()
        if register:
            # Calculate live totals from sales associated with this register
            cash_total = self.sale_repo.get_cash_total_for_register(register.id)
            digital_total = self.sale_repo.get_digital_total_for_register(register.id)
            register.total_sales = round(cash_total + digital_total, 2)
            register.total_cash_sales = round(cash_total, 2)
            register.total_digital_sales = round(digital_total, 2)
        return register

    def open_register(self, data: CashRegisterOpen, employee_id: int) -> CashRegister:
        # Check if there's already an open register
        existing = self.repository.get_open_register()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ya hay una caja abierta. Ciérrela primero.",
            )

        register = CashRegister(
            employee_id=employee_id,
            opening_amount=data.opening_amount,
            notes=data.notes,
        )
        return self.repository.create(register)

    def close_register(self, register_id: int, data: CashRegisterClose) -> CashRegister:
        register = self.get_register(register_id)

        if not register.is_open:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Esta caja ya está cerrada",
            )

        # Calculate totals
        cash_total = self.sale_repo.get_cash_total_for_register(register_id)
        digital_total = self.sale_repo.get_digital_total_for_register(register_id)
        total_sales = cash_total + digital_total
        expected_amount = register.opening_amount + cash_total

        register.is_open = False
        register.closed_at = datetime.now(timezone.utc)
        register.closing_amount = data.closing_amount
        register.expected_amount = round(expected_amount, 2)
        register.difference = round(data.closing_amount - expected_amount, 2)
        register.total_sales = round(total_sales, 2)
        register.total_cash_sales = round(cash_total, 2)
        register.total_digital_sales = round(digital_total, 2)
        register.notes = data.notes or register.notes

        return self.repository.update(register)
