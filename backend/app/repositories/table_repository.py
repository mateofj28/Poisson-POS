from sqlalchemy.orm import Session
from typing import Optional

from app.models.table import Table, TableStatus


class TableRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, table_id: int) -> Optional[Table]:
        return (
            self.db.query(Table)
            .filter(Table.id == table_id, Table.is_deleted == False)
            .first()
        )

    def get_by_number(self, number: int) -> Optional[Table]:
        return (
            self.db.query(Table)
            .filter(Table.number == number, Table.is_deleted == False)
            .first()
        )

    def get_all(self, status: Optional[TableStatus] = None) -> tuple[list[Table], int]:
        query = self.db.query(Table).filter(Table.is_deleted == False)

        if status:
            query = query.filter(Table.status == status)

        tables = query.order_by(Table.number.asc()).all()
        total = len(tables)

        return tables, total

    def count_by_status(self, status: TableStatus) -> int:
        return (
            self.db.query(Table)
            .filter(Table.status == status, Table.is_deleted == False)
            .count()
        )

    def create(self, table: Table) -> Table:
        self.db.add(table)
        self.db.commit()
        self.db.refresh(table)
        return table

    def update(self, table: Table) -> Table:
        self.db.commit()
        self.db.refresh(table)
        return table

    def soft_delete(self, table: Table) -> Table:
        from datetime import datetime, timezone

        table.is_deleted = True
        table.deleted_at = datetime.now(timezone.utc)
        self.db.commit()
        return table
