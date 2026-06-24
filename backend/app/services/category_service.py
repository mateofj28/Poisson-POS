from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.category import Category
from app.repositories.category_repository import CategoryRepository
from app.schemas.category import CategoryCreate, CategoryUpdate


class CategoryService:
    def __init__(self, db: Session):
        self.repository = CategoryRepository(db)

    def get_category(self, category_id: int) -> Category:
        category = self.repository.get_by_id(category_id)
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Categoría no encontrada",
            )
        return category

    def get_categories(self):
        categories, total = self.repository.get_all()
        return {"items": categories, "total": total}

    def create_category(self, data: CategoryCreate) -> Category:
        existing = self.repository.get_by_name(data.name)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ya existe una categoría con ese nombre",
            )

        category = Category(name=data.name, description=data.description)
        return self.repository.create(category)

    def update_category(self, category_id: int, data: CategoryUpdate) -> Category:
        category = self.get_category(category_id)

        if data.name and data.name != category.name:
            existing = self.repository.get_by_name(data.name)
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Ya existe una categoría con ese nombre",
                )

        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(category, key, value)

        return self.repository.update(category)

    def delete_category(self, category_id: int) -> Category:
        category = self.get_category(category_id)
        return self.repository.soft_delete(category)
