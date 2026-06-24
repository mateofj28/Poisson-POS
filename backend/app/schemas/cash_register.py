from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class CashRegisterOpen(BaseModel):
    opening_amount: float = Field(..., ge=0)
    notes: Optional[str] = Field(None, max_length=500)


class CashRegisterClose(BaseModel):
    closing_amount: float = Field(..., ge=0)
    notes: Optional[str] = Field(None, max_length=500)


class CashRegisterResponse(BaseModel):
    id: int
    employee_id: int
    opening_amount: float
    closing_amount: Optional[float]
    expected_amount: Optional[float]
    difference: Optional[float]
    total_sales: float
    total_cash_sales: float
    total_digital_sales: float
    is_open: bool
    opened_at: datetime
    closed_at: Optional[datetime]
    notes: Optional[str]
    employee_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class CashRegisterListResponse(BaseModel):
    items: list[CashRegisterResponse]
    total: int
    page: int
    size: int
    pages: int
