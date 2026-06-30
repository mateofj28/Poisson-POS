from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey
from sqlalchemy.orm import relationship

from app.database.base import Base, TimestampMixin, SoftDeleteMixin


class Product(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    sale_price = Column(Float, nullable=False)
    stock = Column(Integer, default=0, nullable=False)
    min_stock = Column(Integer, default=5, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    barrel_id = Column(Integer, ForeignKey("barrels.id"), nullable=True)

    # Relationships
    category = relationship("Category", back_populates="products", lazy="joined")
    barrel = relationship("Barrel", back_populates="product")
    order_items = relationship("OrderItem", back_populates="product")
    inventory_movements = relationship("InventoryMovement", back_populates="product")

    @property
    def category_name(self):
        if self.category:
            return self.category.name
        return None
