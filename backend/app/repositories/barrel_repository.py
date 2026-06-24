from sqlalchemy.orm import Session
from typing import Optional

from app.models.barrel import Barrel


class BarrelRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, barrel_id: int) -> Optional[Barrel]:
        return (
            self.db.query(Barrel)
            .filter(Barrel.id == barrel_id, Barrel.is_deleted == False)
            .first()
        )

    def get_all(self, is_active: Optional[bool] = None) -> tuple[list[Barrel], int]:
        query = self.db.query(Barrel).filter(Barrel.is_deleted == False)

        if is_active is not None:
            query = query.filter(Barrel.is_active == is_active)

        barrels = query.order_by(Barrel.name.asc()).all()
        total = len(barrels)

        return barrels, total

    def create(self, barrel: Barrel) -> Barrel:
        self.db.add(barrel)
        self.db.commit()
        self.db.refresh(barrel)
        return barrel

    def update(self, barrel: Barrel) -> Barrel:
        self.db.commit()
        self.db.refresh(barrel)
        return barrel

    def soft_delete(self, barrel: Barrel) -> Barrel:
        from datetime import datetime, timezone

        barrel.is_deleted = True
        barrel.deleted_at = datetime.now(timezone.utc)
        self.db.commit()
        return barrel
