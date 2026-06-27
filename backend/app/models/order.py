from sqlalchemy import Column, Integer, Float, ForeignKey, DateTime, Enum as SAEnum, String
from sqlalchemy.orm import relationship
import enum
from datetime import datetime, timezone

from app.database.base import Base, TimestampMixin, SoftDeleteMixin


class OrderStatus(str, enum.Enum):
    PENDIENTE = "pendiente"
    EN_PREPARACION = "en_preparacion"
    LISTO = "listo"
    ENTREGADO = "entregado"
    CANCELADO = "cancelado"


class Order(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    table_id = Column(Integer, ForeignKey("tables.id"), nullable=False)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    status = Column(SAEnum(OrderStatus), default=OrderStatus.PENDIENTE, nullable=False)
    total = Column(Float, default=0.0, nullable=False)
    notes = Column(String(500), nullable=True)
    order_date = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    table = relationship("Table", back_populates="orders", lazy="joined")
    employee = relationship("Employee", back_populates="orders", lazy="joined")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    sale = relationship("Sale", back_populates="order", uselist=False)

    @property
    def employee_name(self):
        if self.employee:
            return f"{self.employee.first_name} {self.employee.last_name}"
        return None

    @property
    def table_number(self):
        if self.table:
            return self.table.number
        return None


class OrderItem(Base, TimestampMixin):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)
    subtotal = Column(Float, nullable=False)
    notes = Column(String(255), nullable=True)

    # Relationships
    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items", lazy="joined")

    @property
    def product_name(self):
        if self.product:
            return self.product.name
        return None
