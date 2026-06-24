from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database.session import get_db
from app.schemas.table import (
    TableCreate,
    TableUpdate,
    TableResponse,
    TableListResponse,
    TableOpenRequest,
)
from app.services.table_service import TableService
from app.auth.dependencies import get_current_employee, require_roles
from app.models.employee import Employee, RoleEnum
from app.models.table import TableStatus

router = APIRouter(prefix="/tables", tags=["Mesas"])


@router.get("", response_model=TableListResponse)
def get_tables(
    status: Optional[TableStatus] = None,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee),
):
    service = TableService(db)
    return service.get_tables(status_filter=status)


@router.get("/{table_id}", response_model=TableResponse)
def get_table(
    table_id: int,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee),
):
    service = TableService(db)
    table = service.get_table(table_id)
    return table


@router.post("", response_model=TableResponse, status_code=201)
def create_table(
    data: TableCreate,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(require_roles(RoleEnum.ADMIN)),
):
    service = TableService(db)
    return service.create_table(data)


@router.put("/{table_id}", response_model=TableResponse)
def update_table(
    table_id: int,
    data: TableUpdate,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(require_roles(RoleEnum.ADMIN)),
):
    service = TableService(db)
    return service.update_table(table_id, data)


@router.post("/{table_id}/open", response_model=TableResponse)
def open_table(
    table_id: int,
    data: TableOpenRequest,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(
        require_roles(RoleEnum.ADMIN, RoleEnum.MESERO)
    ),
):
    service = TableService(db)
    return service.open_table(table_id, data.waiter_id)


@router.post("/{table_id}/close", response_model=TableResponse)
def close_table(
    table_id: int,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(
        require_roles(RoleEnum.ADMIN, RoleEnum.CAJERO)
    ),
):
    service = TableService(db)
    return service.close_table(table_id)


@router.delete("/{table_id}")
def delete_table(
    table_id: int,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(require_roles(RoleEnum.ADMIN)),
):
    service = TableService(db)
    service.delete_table(table_id)
    return {"message": "Mesa eliminada correctamente"}
