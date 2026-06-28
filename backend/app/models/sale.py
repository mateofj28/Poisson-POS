from sqlalchemy import Column, Integer, Float, ForeignKey, DateTime, Enum as SAEnum, String
from sqlalchemy.orm import relationship
import enum
from datetime import datetime, timezone

from app.database.base import Base, TimestampMixin


class PaymentMethod(str, enum.Enum):
    EFECTIVO = "efectivo"
    NEQUI = "nequi"
    DAVIPLATA = "daviplata"
    TRANSFERENCIA = "transferencia"
    TARJETA = "tarjeta"


class Sale(Base, TimestampMixin):
    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    cash_register_id = Column(Integer, ForeignKey("cash_registers.id"), nullable=True)
    total = Column(Float, nullable=False)
    sale_date = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    notes = Column(String(500), nullable=True)

    # Relationships
    order = relationship("Order", back_populates="sale", lazy="joined")
    employee = relationship("Employee", back_populates="sales", lazy="joined")
    cash_register = relationship("CashRegister", back_populates="sales")
    payments = relationship("SalePayment", back_populates="sale", cascade="all, delete-orphan", lazy="joined")

    @property
    def employee_name(self):
        if self.employee:
            return f"{self.employee.first_name} {self.employee.last_name}"
        return None

    @property
    def table_number(self):
        if self.order and self.order.table:
            return self.order.table.number
        return None


class SalePayment(Base, TimestampMixin):
    __tablename__ = "sale_payments"

    id = Column(Integer, primary_key=True, index=True)
    sale_id = Column(Integer, ForeignKey("sales.id"), nullable=False)
    payment_method = Column(SAEnum(PaymentMethod), nullable=False)
    amount = Column(Float, nullable=False)
    reference = Column(String(100), nullable=True)

    # Relationships
    sale = relationship("Sale", back_populates="payments")
