from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional

from app.models.employee import Employee


class EmployeeRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, employee_id: int) -> Optional[Employee]:
        return (
            self.db.query(Employee)
            .filter(Employee.id == employee_id, Employee.is_deleted == False)
            .first()
        )

    def get_by_email(self, email: str) -> Optional[Employee]:
        return (
            self.db.query(Employee)
            .filter(Employee.email == email, Employee.is_deleted == False)
            .first()
        )

    def get_by_document(self, document: str) -> Optional[Employee]:
        return (
            self.db.query(Employee)
            .filter(Employee.document == document, Employee.is_deleted == False)
            .first()
        )

    def get_all(
        self,
        skip: int = 0,
        limit: int = 20,
        search: Optional[str] = None,
        role: Optional[str] = None,
        is_active: Optional[bool] = None,
    ) -> tuple[list[Employee], int]:
        query = self.db.query(Employee).filter(Employee.is_deleted == False)

        if search:
            search_filter = f"%{search}%"
            query = query.filter(
                (Employee.first_name.ilike(search_filter))
                | (Employee.last_name.ilike(search_filter))
                | (Employee.email.ilike(search_filter))
                | (Employee.document.ilike(search_filter))
            )

        if role:
            query = query.filter(Employee.role == role)

        if is_active is not None:
            query = query.filter(Employee.is_active == is_active)

        total = query.count()
        employees = query.order_by(Employee.created_at.desc()).offset(skip).limit(limit).all()

        return employees, total

    def create(self, employee: Employee) -> Employee:
        self.db.add(employee)
        self.db.commit()
        self.db.refresh(employee)
        return employee

    def update(self, employee: Employee) -> Employee:
        self.db.commit()
        self.db.refresh(employee)
        return employee

    def soft_delete(self, employee: Employee) -> Employee:
        from datetime import datetime, timezone

        employee.is_deleted = True
        employee.deleted_at = datetime.now(timezone.utc)
        self.db.commit()
        return employee
