from sqlalchemy import Column, Integer, String, Float, Boolean
from sqlalchemy.orm import relationship

from app.database.base import Base, TimestampMixin, SoftDeleteMixin


class Barrel(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "barrels"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    capacity_liters = Column(Float, nullable=False)
    available_liters = Column(Float, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    product = relationship("Product", back_populates="barrel", uselist=False)

    @property
    def percentage_remaining(self) -> float:
        if self.capacity_liters == 0:
            return 0.0
        return round((self.available_liters / self.capacity_liters) * 100, 2)

    @property
    def is_empty(self) -> bool:
        return self.available_liters <= 0
