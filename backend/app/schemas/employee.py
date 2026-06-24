from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

from app.models.employee import RoleEnum


class EmployeeBase(BaseModel):
    first_name: str = Field(..., min_length=2, max_length=100)
    last_name: str = Field(..., min_length=2, max_length=100)
    document: str = Field(..., min_length=5, max_length=20)
    phone: Optional[str] = Field(None, max_length=20)
    email: EmailStr
    role: RoleEnum


class EmployeeCreate(EmployeeBase):
    password: str = Field(..., min_length=6)


class EmployeeUpdate(BaseModel):
    first_name: Optional[str] = Field(None, min_length=2, max_length=100)
    last_name: Optional[str] = Field(None, min_length=2, max_length=100)
    document: Optional[str] = Field(None, min_length=5, max_length=20)
    phone: Optional[str] = Field(None, max_length=20)
    email: Optional[EmailStr] = None
    role: Optional[RoleEnum] = None
    is_active: Optional[bool] = None
    password: Optional[str] = Field(None, min_length=6)


class EmployeeResponse(EmployeeBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class EmployeeListResponse(BaseModel):
    items: list[EmployeeResponse]
    total: int
    page: int
    size: int
    pages: int
