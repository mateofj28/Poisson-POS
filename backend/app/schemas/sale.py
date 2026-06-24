from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

from app.models.sale import PaymentMethod


class PaymentCreate(BaseModel):
    payment_method: PaymentMethod
    amount: float = Field(..., gt=0)
    reference: Optional[str] = Field(None, max_length=100)


class SaleCreate(BaseModel):
    order_id: int
    payments: list[PaymentCreate] = Field(..., min_length=1)
    notes: Optional[str] = Field(None, max_length=500)


class PaymentResponse(BaseModel):
    id: int
    payment_method: PaymentMethod
    amount: float
    reference: Optional[str]

    class Config:
        from_attributes = True


class SaleResponse(BaseModel):
    id: int
    order_id: int
    employee_id: int
    total: float
    sale_date: datetime
    notes: Optional[str]
    payments: list[PaymentResponse] = []
    employee_name: Optional[str] = None
    table_number: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class SaleListResponse(BaseModel):
    items: list[SaleResponse]
    total: int
    page: int
    size: int
    pages: int
