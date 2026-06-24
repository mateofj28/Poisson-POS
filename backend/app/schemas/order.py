from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

from app.models.order import OrderStatus


class OrderItemBase(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0)
    notes: Optional[str] = Field(None, max_length=255)


class OrderItemCreate(OrderItemBase):
    pass


class OrderItemUpdate(BaseModel):
    quantity: Optional[int] = Field(None, gt=0)
    notes: Optional[str] = Field(None, max_length=255)


class OrderItemResponse(OrderItemBase):
    id: int
    unit_price: float
    subtotal: float
    product_name: Optional[str] = None

    class Config:
        from_attributes = True


class OrderBase(BaseModel):
    table_id: int
    notes: Optional[str] = Field(None, max_length=500)


class OrderCreate(OrderBase):
    items: list[OrderItemCreate] = Field(..., min_length=1)


class OrderUpdate(BaseModel):
    status: Optional[OrderStatus] = None
    notes: Optional[str] = Field(None, max_length=500)


class OrderAddItem(BaseModel):
    items: list[OrderItemCreate] = Field(..., min_length=1)


class OrderResponse(OrderBase):
    id: int
    employee_id: int
    status: OrderStatus
    total: float
    order_date: datetime
    created_at: datetime
    updated_at: datetime
    items: list[OrderItemResponse] = []
    employee_name: Optional[str] = None
    table_number: Optional[int] = None

    class Config:
        from_attributes = True


class OrderListResponse(BaseModel):
    items: list[OrderResponse]
    total: int
    page: int
    size: int
    pages: int
