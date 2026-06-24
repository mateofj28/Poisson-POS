from sqlalchemy import Column, Integer, Float, ForeignKey, DateTime, Boolean, String
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

from app.database.base import Base, TimestampMixin


class CashRegister(Base, TimestampMixin):
    __tablename__ = "cash_registers"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    opening_amount = Column(Float, nullable=False)
    closing_amount = Column(Float, nullable=True)
    expected_amount = Column(Float, nullable=True)
    difference = Column(Float, nullable=True)
    total_sales = Column(Float, default=0.0, nullable=False)
    total_cash_sales = Column(Float, default=0.0, nullable=False)
    total_digital_sales = Column(Float, default=0.0, nullable=False)
    is_open = Column(Boolean, default=True, nullable=False)
    opened_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    closed_at = Column(DateTime(timezone=True), nullable=True)
    notes = Column(String(500), nullable=True)

    # Relationships
    employee = relationship("Employee", back_populates="cash_registers")
    sales = relationship("Sale", back_populates="cash_register")
