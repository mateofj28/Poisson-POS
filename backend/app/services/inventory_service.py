from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import Optional

from app.models.inventory import InventoryMovement, MovementType
from app.repositories.inventory_repository import InventoryRepository
from app.repositories.product_repository import ProductRepository
from app.schemas.inventory import InventoryMovementCreate


class InventoryService:
    def __init__(self, db: Session):
        self.db = db
        self.repository = InventoryRepository(db)
        self.product_repo = ProductRepository(db)

    def get_movements(
        self,
        skip: int = 0,
        limit: int = 20,
        product_id: Optional[int] = None,
        movement_type: Optional[MovementType] = None,
    ):
        movements, total = self.repository.get_all(
            skip=skip, limit=limit, product_id=product_id, movement_type=movement_type
        )
        pages = (total + limit - 1) // limit
        page = (skip // limit) + 1
        return {
            "items": movements,
            "total": total,
            "page": page,
            "size": limit,
            "pages": pages,
        }

    def create_movement(self, data: InventoryMovementCreate, employee_id: int) -> InventoryMovement:
        product = self.product_repo.get_by_id(data.product_id)
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Producto no encontrado",
            )

        previous_stock = product.stock

        if data.movement_type == MovementType.ENTRADA:
            product.stock += data.quantity
        elif data.movement_type in [
            MovementType.SALIDA,
            MovementType.PERDIDA,
            MovementType.DESPERDICIO,
        ]:
            if product.stock < data.quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Stock insuficiente. Disponible: {product.stock}",
                )
            product.stock -= data.quantity
        elif data.movement_type == MovementType.AJUSTE:
            product.stock = data.quantity

        movement = InventoryMovement(
            product_id=data.product_id,
            movement_type=data.movement_type,
            quantity=data.quantity,
            previous_stock=previous_stock,
            new_stock=product.stock,
            reason=data.reason,
            employee_id=employee_id,
        )

        self.db.commit()
        return self.repository.create(movement)

    def get_low_stock_products(self):
        return self.product_repo.get_low_stock()
