from sqlalchemy import Column, Integer, String, Boolean, Enum as SAEnum
from sqlalchemy.orm import relationship
import enum

from app.database.base import Base, TimestampMixin, SoftDeleteMixin


class RoleEnum(str, enum.Enum):
    ADMIN = "admin"
    CAJERO = "cajero"
    MESERO = "mesero"
    BARTENDER = "bartender"


class Employee(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    document = Column(String(20), unique=True, nullable=False, index=True)
    phone = Column(String(20), nullable=True)
    email = Column(String(150), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(SAEnum(RoleEnum), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    orders = relationship("Order", back_populates="employee")
    tables = relationship("Table", back_populates="assigned_waiter")
    cash_registers = relationship("CashRegister", back_populates="employee")
    sales = relationship("Sale", back_populates="employee")
