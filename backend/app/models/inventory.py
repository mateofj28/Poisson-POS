from sqlalchemy import Column, Integer, Float, ForeignKey, String, Enum as SAEnum
from sqlalchemy.orm import relationship
import enum

from app.database.base import Base, TimestampMixin


class MovementType(str, enum.Enum):
    ENTRADA = "entrada"
    SALIDA = "salida"
    AJUSTE = "ajuste"
    PERDIDA = "perdida"
    DESPERDICIO = "desperdicio"
    VENTA = "venta"


class InventoryMovement(Base, TimestampMixin):
    __tablename__ = "inventory_movements"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    movement_type = Column(SAEnum(MovementType), nullable=False)
    quantity = Column(Integer, nullable=False)
    previous_stock = Column(Integer, nullable=False)
    new_stock = Column(Integer, nullable=False)
    reason = Column(String(500), nullable=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=True)

    # Relationships
    product = relationship("Product", back_populates="inventory_movements")
