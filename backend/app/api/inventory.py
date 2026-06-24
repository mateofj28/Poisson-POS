from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database.session import get_db
from app.schemas.inventory import (
    InventoryMovementCreate,
    InventoryMovementResponse,
    InventoryMovementListResponse,
    LowStockProductResponse,
)
from app.services.inventory_service import InventoryService
from app.auth.dependencies import get_current_employee, require_roles
from app.models.employee import Employee, RoleEnum
from app.models.inventory import MovementType

router = APIRouter(prefix="/inventory", tags=["Inventario"])


@router.get("", response_model=InventoryMovementListResponse)
def get_movements(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    product_id: Optional[int] = None,
    movement_type: Optional[MovementType] = None,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(
        require_roles(RoleEnum.ADMIN, RoleEnum.CAJERO)
    ),
):
    service = InventoryService(db)
    return service.get_movements(
        skip=skip, limit=limit, product_id=product_id, movement_type=movement_type
    )


@router.post("", response_model=InventoryMovementResponse, status_code=201)
def create_movement(
    data: InventoryMovementCreate,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(require_roles(RoleEnum.ADMIN)),
):
    service = InventoryService(db)
    return service.create_movement(data, current_employee.id)


@router.get("/low-stock", response_model=list[LowStockProductResponse])
def get_low_stock(
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee),
):
    service = InventoryService(db)
    products = service.get_low_stock_products()
    return [
        LowStockProductResponse(
            id=p.id,
            name=p.name,
            stock=p.stock,
            min_stock=p.min_stock,
            category_name=p.category.name if p.category else None,
        )
        for p in products
    ]
