from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import Optional

from app.models.barrel import Barrel
from app.repositories.barrel_repository import BarrelRepository
from app.schemas.barrel import BarrelCreate, BarrelUpdate


class BarrelService:
    def __init__(self, db: Session):
        self.repository = BarrelRepository(db)

    def get_barrel(self, barrel_id: int) -> Barrel:
        barrel = self.repository.get_by_id(barrel_id)
        if not barrel:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Barril no encontrado",
            )
        return barrel

    def get_barrels(self, is_active: Optional[bool] = None):
        barrels, total = self.repository.get_all(is_active=is_active)
        return {"items": barrels, "total": total}

    def create_barrel(self, data: BarrelCreate) -> Barrel:
        barrel = Barrel(
            name=data.name,
            shot_price=data.shot_price,
            shots_sold_today=0,
            capacity_liters=0,
            available_liters=0,
        )
        return self.repository.create(barrel)

    def update_barrel(self, barrel_id: int, data: BarrelUpdate) -> Barrel:
        barrel = self.get_barrel(barrel_id)

        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(barrel, key, value)

        return self.repository.update(barrel)

    def add_shot(self, barrel_id: int, shots: int = 1) -> Barrel:
        barrel = self.get_barrel(barrel_id)

        if not barrel.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Este barril no está activo",
            )

        barrel.shots_sold_today += shots
        return self.repository.update(barrel)

    def reset_shots(self, barrel_id: int) -> Barrel:
        barrel = self.get_barrel(barrel_id)
        barrel.shots_sold_today = 0
        return self.repository.update(barrel)

    def reset_all_shots(self):
        """Reset all barrel shot counts (for daily reset)"""
        barrels, _ = self.repository.get_all()
        for barrel in barrels:
            barrel.shots_sold_today = 0
        self.repository.db.commit()

    def discount_liters(self, barrel_id: int, liters: float) -> Barrel:
        """Legacy method - now just adds a shot"""
        return self.add_shot(barrel_id, 1)

    def delete_barrel(self, barrel_id: int) -> Barrel:
        barrel = self.get_barrel(barrel_id)
        return self.repository.soft_delete(barrel)
