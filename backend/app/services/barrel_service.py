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
        if data.available_liters > data.capacity_liters:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Los litros disponibles no pueden superar la capacidad",
            )

        barrel = Barrel(
            name=data.name,
            capacity_liters=data.capacity_liters,
            available_liters=data.available_liters,
        )
        return self.repository.create(barrel)

    def update_barrel(self, barrel_id: int, data: BarrelUpdate) -> Barrel:
        barrel = self.get_barrel(barrel_id)

        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(barrel, key, value)

        return self.repository.update(barrel)

    def discount_liters(self, barrel_id: int, liters: float) -> Barrel:
        barrel = self.get_barrel(barrel_id)

        if barrel.available_liters < liters:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"No hay suficientes litros disponibles. Disponible: {barrel.available_liters}L",
            )

        barrel.available_liters -= liters

        if barrel.available_liters <= 0:
            barrel.available_liters = 0
            barrel.is_active = False

        return self.repository.update(barrel)

    def delete_barrel(self, barrel_id: int) -> Barrel:
        barrel = self.get_barrel(barrel_id)
        return self.repository.soft_delete(barrel)
