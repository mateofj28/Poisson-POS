from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import Optional

from app.models.product import Product
from app.repositories.product_repository import ProductRepository
from app.schemas.product import ProductCreate, ProductUpdate


class ProductService:
    def __init__(self, db: Session):
        self.repository = ProductRepository(db)

    def get_product(self, product_id: int) -> Product:
        product = self.repository.get_by_id(product_id)
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Producto no encontrado",
            )
        return product

    def get_products(
        self,
        skip: int = 0,
        limit: int = 20,
        search: Optional[str] = None,
        category_id: Optional[int] = None,
        is_active: Optional[bool] = None,
    ):
        products, total = self.repository.get_all(
            skip=skip, limit=limit, search=search, category_id=category_id, is_active=is_active
        )
        pages = (total + limit - 1) // limit
        page = (skip // limit) + 1
        return {
            "items": products,
            "total": total,
            "page": page,
            "size": limit,
            "pages": pages,
        }

    def get_low_stock_products(self):
        return self.repository.get_low_stock()

    def get_out_of_stock_products(self):
        return self.repository.get_out_of_stock()

    def create_product(self, data: ProductCreate) -> Product:
        product = Product(
            name=data.name,
            category_id=data.category_id,
            sale_price=data.sale_price,
            stock=data.stock,
            min_stock=data.min_stock,
            is_active=data.is_active,
            barrel_id=data.barrel_id,
        )
        return self.repository.create(product)

    def update_product(self, product_id: int, data: ProductUpdate) -> Product:
        product = self.get_product(product_id)

        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(product, key, value)

        return self.repository.update(product)

    def delete_product(self, product_id: int) -> Product:
        product = self.get_product(product_id)
        return self.repository.soft_delete(product)
