from sqlalchemy.orm import Session
from typing import Optional

from app.models.category import Category


class CategoryRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, category_id: int) -> Optional[Category]:
        return (
            self.db.query(Category)
            .filter(Category.id == category_id, Category.is_deleted == False)
            .first()
        )

    def get_by_name(self, name: str) -> Optional[Category]:
        return (
            self.db.query(Category)
            .filter(Category.name == name, Category.is_deleted == False)
            .first()
        )

    def get_all(self) -> tuple[list[Category], int]:
        query = self.db.query(Category).filter(Category.is_deleted == False)
        categories = query.order_by(Category.name.asc()).all()
        total = len(categories)
        return categories, total

    def create(self, category: Category) -> Category:
        self.db.add(category)
        self.db.commit()
        self.db.refresh(category)
        return category

    def update(self, category: Category) -> Category:
        self.db.commit()
        self.db.refresh(category)
        return category

    def soft_delete(self, category: Category) -> Category:
        from datetime import datetime, timezone

        category.is_deleted = True
        category.deleted_at = datetime.now(timezone.utc)
        self.db.commit()
        return category
