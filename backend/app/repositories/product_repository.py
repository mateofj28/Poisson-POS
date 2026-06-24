from sqlalchemy.orm import Session
from typing import Optional

from app.models.product import Product


class ProductRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, product_id: int) -> Optional[Product]:
        return (
            self.db.query(Product)
            .filter(Product.id == product_id, Product.is_deleted == False)
            .first()
        )

    def get_all(
        self,
        skip: int = 0,
        limit: int = 20,
        search: Optional[str] = None,
        category_id: Optional[int] = None,
        is_active: Optional[bool] = None,
    ) -> tuple[list[Product], int]:
        query = self.db.query(Product).filter(Product.is_deleted == False)

        if search:
            query = query.filter(Product.name.ilike(f"%{search}%"))

        if category_id:
            query = query.filter(Product.category_id == category_id)

        if is_active is not None:
            query = query.filter(Product.is_active == is_active)

        total = query.count()
        products = query.order_by(Product.name.asc()).offset(skip).limit(limit).all()

        return products, total

    def get_low_stock(self) -> list[Product]:
        return (
            self.db.query(Product)
            .filter(
                Product.is_deleted == False,
                Product.is_active == True,
                Product.stock <= Product.min_stock,
            )
            .all()
        )

    def get_out_of_stock(self) -> list[Product]:
        return (
            self.db.query(Product)
            .filter(
                Product.is_deleted == False,
                Product.is_active == True,
                Product.stock <= 0,
            )
            .all()
        )

    def create(self, product: Product) -> Product:
        self.db.add(product)
        self.db.commit()
        self.db.refresh(product)
        return product

    def update(self, product: Product) -> Product:
        self.db.commit()
        self.db.refresh(product)
        return product

    def soft_delete(self, product: Product) -> Product:
        from datetime import datetime, timezone

        product.is_deleted = True
        product.deleted_at = datetime.now(timezone.utc)
        self.db.commit()
        return product
