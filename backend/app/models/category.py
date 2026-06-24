from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from app.database.base import Base, TimestampMixin, SoftDeleteMixin


class Category(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(String(255), nullable=True)

    # Relationships
    products = relationship("Product", back_populates="category")
