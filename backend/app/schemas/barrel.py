from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class BarrelBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    capacity_liters: float = Field(..., gt=0)
    available_liters: float = Field(..., ge=0)


class BarrelCreate(BarrelBase):
    pass


class BarrelUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=150)
    capacity_liters: Optional[float] = Field(None, gt=0)
    available_liters: Optional[float] = Field(None, ge=0)
    is_active: Optional[bool] = None


class BarrelResponse(BarrelBase):
    id: int
    is_active: bool
    percentage_remaining: float
    is_empty: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class BarrelListResponse(BaseModel):
    items: list[BarrelResponse]
    total: int


class BarrelDiscountRequest(BaseModel):
    liters: float = Field(..., gt=0)
