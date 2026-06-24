from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

from app.models.inventory import MovementType


class InventoryMovementCreate(BaseModel):
    product_id: int
    movement_type: MovementType
    quantity: int = Field(..., gt=0)
    reason: Optional[str] = Field(None, max_length=500)


class InventoryMovementResponse(BaseModel):
    id: int
    product_id: int
    movement_type: MovementType
    quantity: int
    previous_stock: int
    new_stock: int
    reason: Optional[str]
    employee_id: Optional[int]
    created_at: datetime
    product_name: Optional[str] = None

    class Config:
        from_attributes = True


class InventoryMovementListResponse(BaseModel):
    items: list[InventoryMovementResponse]
    total: int
    page: int
    size: int
    pages: int


class LowStockProductResponse(BaseModel):
    id: int
    name: str
    stock: int
    min_stock: int
    category_name: Optional[str] = None
