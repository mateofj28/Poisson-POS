from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database.session import get_db
from app.schemas.sale import SaleCreate, SaleResponse, SaleListResponse
from app.services.sale_service import SaleService
from app.auth.dependencies import get_current_employee, require_roles
from app.models.employee import Employee, RoleEnum

router = APIRouter(prefix="/sales", tags=["Ventas"])


@router.get("", response_model=SaleListResponse)
def get_sales(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    employee_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(
        require_roles(RoleEnum.ADMIN, RoleEnum.CAJERO)
    ),
):
    service = SaleService(db)
    return service.get_sales(skip=skip, limit=limit, employee_id=employee_id)


@router.get("/{sale_id}", response_model=SaleResponse)
def get_sale(
    sale_id: int,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(
        require_roles(RoleEnum.ADMIN, RoleEnum.CAJERO)
    ),
):
    service = SaleService(db)
    return service.get_sale(sale_id)


@router.post("", response_model=SaleResponse, status_code=201)
def create_sale(
    data: SaleCreate,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(
        require_roles(RoleEnum.ADMIN, RoleEnum.CAJERO)
    ),
):
    service = SaleService(db)
    return service.create_sale(data, current_employee.id)
