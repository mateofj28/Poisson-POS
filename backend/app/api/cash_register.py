from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database.session import get_db
from app.schemas.cash_register import (
    CashRegisterOpen,
    CashRegisterClose,
    CashRegisterResponse,
    CashRegisterListResponse,
)
from app.services.cash_register_service import CashRegisterService
from app.auth.dependencies import get_current_employee, require_roles
from app.models.employee import Employee, RoleEnum

router = APIRouter(prefix="/cash-register", tags=["Caja"])


@router.get("", response_model=CashRegisterListResponse)
def get_registers(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    is_open: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(
        require_roles(RoleEnum.ADMIN, RoleEnum.CAJERO)
    ),
):
    service = CashRegisterService(db)
    return service.get_registers(skip=skip, limit=limit, is_open=is_open)


@router.get("/active", response_model=Optional[CashRegisterResponse])
def get_active_register(
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(
        require_roles(RoleEnum.ADMIN, RoleEnum.CAJERO)
    ),
):
    service = CashRegisterService(db)
    return service.get_open_register()


@router.get("/{register_id}", response_model=CashRegisterResponse)
def get_register(
    register_id: int,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(
        require_roles(RoleEnum.ADMIN, RoleEnum.CAJERO)
    ),
):
    service = CashRegisterService(db)
    return service.get_register(register_id)


@router.post("/open", response_model=CashRegisterResponse, status_code=201)
def open_register(
    data: CashRegisterOpen,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(
        require_roles(RoleEnum.ADMIN, RoleEnum.CAJERO)
    ),
):
    service = CashRegisterService(db)
    return service.open_register(data, current_employee.id)


@router.post("/{register_id}/close", response_model=CashRegisterResponse)
def close_register(
    register_id: int,
    data: CashRegisterClose,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(
        require_roles(RoleEnum.ADMIN, RoleEnum.CAJERO)
    ),
):
    service = CashRegisterService(db)
    return service.close_register(register_id, data)
