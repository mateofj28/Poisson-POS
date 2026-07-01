from sqlalchemy import Column, Integer, String, Float, Boolean
from sqlalchemy.orm import relationship

from app.database.base import Base, TimestampMixin, SoftDeleteMixin


class Barrel(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "barrels"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    shot_price = Column(Float, nullable=False, default=0)
    shots_sold_today = Column(Integer, nullable=False, default=0)
    is_active = Column(Boolean, default=True, nullable=False)

    # Keep legacy columns for migration compatibility
    capacity_liters = Column(Float, nullable=True, default=0)
    available_liters = Column(Float, nullable=True, default=0)

    # Relationships
    product = relationship("Product", back_populates="barrel", uselist=False)

    @property
    def revenue_today(self) -> float:
        return round(self.shot_price * self.shots_sold_today, 2)

    @property
    def percentage_remaining(self) -> float:
        return 0.0

    @property
    def is_empty(self) -> bool:
        return False
