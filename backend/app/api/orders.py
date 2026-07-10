from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database.session import get_db
from app.schemas.order import (
    OrderCreate,
    OrderUpdate,
    OrderResponse,
    OrderListResponse,
    OrderAddItem,
    OrderItemUpdate,
)
from app.services.order_service import OrderService
from app.auth.dependencies import get_current_employee, require_roles
from app.models.employee import Employee, RoleEnum
from app.models.order import OrderStatus

router = APIRouter(prefix="/orders", tags=["Pedidos"])


@router.get("", response_model=OrderListResponse)
def get_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    table_id: Optional[int] = None,
    status: Optional[OrderStatus] = None,
    today_only: bool = False,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee),
):
    service = OrderService(db)
    from datetime import datetime, timezone, timedelta
    date_from = None
    if today_only:
        # Colombia is UTC-5
        colombia_tz = timezone(timedelta(hours=-5))
        now_colombia = datetime.now(colombia_tz)
        date_from = now_colombia.replace(hour=0, minute=0, second=0, microsecond=0).astimezone(timezone.utc)
    return service.get_orders(
        skip=skip, limit=limit, table_id=table_id, status_filter=status, date_from=date_from
    )


@router.get("/{order_id}", response_model=OrderResponse)
def get_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee),
):
    service = OrderService(db)
    return service.get_order(order_id)


@router.post("", response_model=OrderResponse, status_code=201)
def create_order(
    data: OrderCreate,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(
        require_roles(RoleEnum.ADMIN, RoleEnum.MESERO)
    ),
):
    service = OrderService(db)
    return service.create_order(data, current_employee.id)


@router.put("/{order_id}", response_model=OrderResponse)
def update_order(
    order_id: int,
    data: OrderUpdate,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(
        require_roles(RoleEnum.ADMIN, RoleEnum.MESERO)
    ),
):
    service = OrderService(db)
    return service.update_order(order_id, data)


@router.post("/{order_id}/items", response_model=OrderResponse)
def add_items(
    order_id: int,
    data: OrderAddItem,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(
        require_roles(RoleEnum.ADMIN, RoleEnum.MESERO)
    ),
):
    service = OrderService(db)
    return service.add_items(order_id, data.items)


@router.delete("/{order_id}/items/{item_id}", response_model=OrderResponse)
def remove_item(
    order_id: int,
    item_id: int,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(
        require_roles(RoleEnum.ADMIN, RoleEnum.MESERO)
    ),
):
    service = OrderService(db)
    return service.remove_item(order_id, item_id)


@router.patch("/{order_id}/items/{item_id}")
def update_item_quantity(
    order_id: int,
    item_id: int,
    data: OrderItemUpdate,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(
        require_roles(RoleEnum.ADMIN, RoleEnum.MESERO)
    ),
):
    service = OrderService(db)
    return service.update_item_quantity(order_id, item_id, data.quantity)
