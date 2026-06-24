from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from datetime import datetime, timezone
from typing import Optional

from app.models.table import Table, TableStatus
from app.repositories.table_repository import TableRepository
from app.repositories.employee_repository import EmployeeRepository
from app.schemas.table import TableCreate, TableUpdate


class TableService:
    def __init__(self, db: Session):
        self.repository = TableRepository(db)
        self.employee_repo = EmployeeRepository(db)

    def get_table(self, table_id: int) -> Table:
        table = self.repository.get_by_id(table_id)
        if not table:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Mesa no encontrada",
            )
        return table

    def get_tables(self, status_filter: Optional[TableStatus] = None):
        tables, total = self.repository.get_all(status=status_filter)
        return {"items": tables, "total": total}

    def create_table(self, data: TableCreate) -> Table:
        existing = self.repository.get_by_number(data.number)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Ya existe la mesa número {data.number}",
            )

        table = Table(number=data.number, status=TableStatus.LIBRE)
        return self.repository.create(table)

    def update_table(self, table_id: int, data: TableUpdate) -> Table:
        table = self.get_table(table_id)

        if data.number and data.number != table.number:
            existing = self.repository.get_by_number(data.number)
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Ya existe la mesa número {data.number}",
                )

        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(table, key, value)

        return self.repository.update(table)

    def open_table(self, table_id: int, waiter_id: int) -> Table:
        table = self.get_table(table_id)

        if table.status != TableStatus.LIBRE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La mesa no está libre",
            )

        waiter = self.employee_repo.get_by_id(waiter_id)
        if not waiter:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Mesero no encontrado",
            )

        table.status = TableStatus.OCUPADA
        table.waiter_id = waiter_id
        table.occupied_at = datetime.now(timezone.utc)

        return self.repository.update(table)

    def close_table(self, table_id: int) -> Table:
        table = self.get_table(table_id)

        if table.status == TableStatus.LIBRE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La mesa ya está libre",
            )

        table.status = TableStatus.LIBRE
        table.waiter_id = None
        table.occupied_at = None

        return self.repository.update(table)

    def delete_table(self, table_id: int) -> Table:
        table = self.get_table(table_id)
        return self.repository.soft_delete(table)
