from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

from app.models.table import TableStatus


class TableBase(BaseModel):
    number: int = Field(..., gt=0)


class TableCreate(TableBase):
    pass


class TableUpdate(BaseModel):
    number: Optional[int] = Field(None, gt=0)
    status: Optional[TableStatus] = None
    waiter_id: Optional[int] = None


class TableResponse(TableBase):
    id: int
    status: TableStatus
    waiter_id: Optional[int]
    occupied_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    waiter_name: Optional[str] = None
    occupation_time: Optional[str] = None

    class Config:
        from_attributes = True


class TableListResponse(BaseModel):
    items: list[TableResponse]
    total: int


class TableOpenRequest(BaseModel):
    waiter_id: int


class TableCloseRequest(BaseModel):
    pass
