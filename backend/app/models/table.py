from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Enum as SAEnum
from sqlalchemy.orm import relationship
import enum
from datetime import datetime, timezone

from app.database.base import Base, TimestampMixin, SoftDeleteMixin


class TableStatus(str, enum.Enum):
    LIBRE = "libre"
    OCUPADA = "ocupada"
    EN_PAGO = "en_pago"


class Table(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "tables"

    id = Column(Integer, primary_key=True, index=True)
    number = Column(Integer, unique=True, nullable=False)
    status = Column(SAEnum(TableStatus), default=TableStatus.LIBRE, nullable=False)
    waiter_id = Column(Integer, ForeignKey("employees.id"), nullable=True)
    occupied_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    assigned_waiter = relationship("Employee", back_populates="tables")
    orders = relationship("Order", back_populates="table")
