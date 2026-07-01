from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class BarrelCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    shot_price: float = Field(..., gt=0)


class BarrelUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=150)
    shot_price: Optional[float] = Field(None, gt=0)
    is_active: Optional[bool] = None


class BarrelResponse(BaseModel):
    id: int
    name: str
    shot_price: float
    shots_sold_today: int
    revenue_today: float
    is_active: bool
    created_at: datetime
    updated_at: datetime

    # Legacy fields for compatibility
    capacity_liters: Optional[float] = 0
    available_liters: Optional[float] = 0
    percentage_remaining: float = 0
    is_empty: bool = False

    class Config:
        from_attributes = True


class BarrelListResponse(BaseModel):
    items: list[BarrelResponse]
    total: int


class BarrelShotRequest(BaseModel):
    shots: int = Field(1, gt=0)
