from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime

from app.models.inventory import InventoryMovement, MovementType


class InventoryRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, movement_id: int) -> Optional[InventoryMovement]:
        return self.db.query(InventoryMovement).filter(InventoryMovement.id == movement_id).first()

    def get_all(
        self,
        skip: int = 0,
        limit: int = 20,
        product_id: Optional[int] = None,
        movement_type: Optional[MovementType] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
    ) -> tuple[list[InventoryMovement], int]:
        query = self.db.query(InventoryMovement)

        if product_id:
            query = query.filter(InventoryMovement.product_id == product_id)

        if movement_type:
            query = query.filter(InventoryMovement.movement_type == movement_type)

        if date_from:
            query = query.filter(InventoryMovement.created_at >= date_from)

        if date_to:
            query = query.filter(InventoryMovement.created_at <= date_to)

        total = query.count()
        movements = query.order_by(InventoryMovement.created_at.desc()).offset(skip).limit(limit).all()

        return movements, total

    def create(self, movement: InventoryMovement) -> InventoryMovement:
        self.db.add(movement)
        self.db.commit()
        self.db.refresh(movement)
        return movement
