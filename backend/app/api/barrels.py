from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional

from app.database.session import get_db
from app.schemas.barrel import (
    BarrelCreate,
    BarrelUpdate,
    BarrelResponse,
    BarrelListResponse,
    BarrelDiscountRequest,
)
from app.services.barrel_service import BarrelService
from app.auth.dependencies import get_current_employee, require_roles
from app.models.employee import Employee, RoleEnum

router = APIRouter(prefix="/barrels", tags=["Barriles"])


@router.get("", response_model=BarrelListResponse)
def get_barrels(
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee),
):
    service = BarrelService(db)
    return service.get_barrels(is_active=is_active)


@router.get("/{barrel_id}", response_model=BarrelResponse)
def get_barrel(
    barrel_id: int,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee),
):
    service = BarrelService(db)
    return service.get_barrel(barrel_id)


@router.post("", response_model=BarrelResponse, status_code=201)
def create_barrel(
    data: BarrelCreate,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(require_roles(RoleEnum.ADMIN)),
):
    service = BarrelService(db)
    return service.create_barrel(data)


@router.put("/{barrel_id}", response_model=BarrelResponse)
def update_barrel(
    barrel_id: int,
    data: BarrelUpdate,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(require_roles(RoleEnum.ADMIN)),
):
    service = BarrelService(db)
    return service.update_barrel(barrel_id, data)


@router.post("/{barrel_id}/discount", response_model=BarrelResponse)
def discount_liters(
    barrel_id: int,
    data: BarrelDiscountRequest,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(
        require_roles(RoleEnum.ADMIN, RoleEnum.BARTENDER)
    ),
):
    service = BarrelService(db)
    return service.discount_liters(barrel_id, data.liters)


@router.delete("/{barrel_id}")
def delete_barrel(
    barrel_id: int,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(require_roles(RoleEnum.ADMIN)),
):
    service = BarrelService(db)
    service.delete_barrel(barrel_id)
    return {"message": "Barril eliminado correctamente"}
