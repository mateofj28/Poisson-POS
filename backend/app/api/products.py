from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database.session import get_db
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse, ProductListResponse
from app.services.product_service import ProductService
from app.auth.dependencies import get_current_employee, require_roles
from app.models.employee import Employee, RoleEnum

router = APIRouter(prefix="/products", tags=["Productos"])


@router.get("", response_model=ProductListResponse)
def get_products(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    category_id: Optional[int] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee),
):
    service = ProductService(db)
    return service.get_products(
        skip=skip, limit=limit, search=search, category_id=category_id, is_active=is_active
    )


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee),
):
    service = ProductService(db)
    return service.get_product(product_id)


@router.post("", response_model=ProductResponse, status_code=201)
def create_product(
    data: ProductCreate,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(require_roles(RoleEnum.ADMIN)),
):
    service = ProductService(db)
    return service.create_product(data)


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    data: ProductUpdate,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(require_roles(RoleEnum.ADMIN)),
):
    service = ProductService(db)
    return service.update_product(product_id, data)


@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(require_roles(RoleEnum.ADMIN)),
):
    service = ProductService(db)
    service.delete_product(product_id)
    return {"message": "Producto eliminado correctamente"}
