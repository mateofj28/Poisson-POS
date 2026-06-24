from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.employee import Employee
from app.repositories.employee_repository import EmployeeRepository
from app.schemas.employee import EmployeeCreate, EmployeeUpdate
from app.core.security import get_password_hash


class EmployeeService:
    def __init__(self, db: Session):
        self.repository = EmployeeRepository(db)

    def get_employee(self, employee_id: int) -> Employee:
        employee = self.repository.get_by_id(employee_id)
        if not employee:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Empleado no encontrado",
            )
        return employee

    def get_employees(
        self,
        skip: int = 0,
        limit: int = 20,
        search: str = None,
        role: str = None,
        is_active: bool = None,
    ):
        employees, total = self.repository.get_all(
            skip=skip, limit=limit, search=search, role=role, is_active=is_active
        )
        pages = (total + limit - 1) // limit
        page = (skip // limit) + 1
        return {
            "items": employees,
            "total": total,
            "page": page,
            "size": limit,
            "pages": pages,
        }

    def create_employee(self, data: EmployeeCreate) -> Employee:
        # Check unique email
        existing = self.repository.get_by_email(data.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ya existe un empleado con ese correo",
            )

        # Check unique document
        existing = self.repository.get_by_document(data.document)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ya existe un empleado con ese documento",
            )

        employee = Employee(
            first_name=data.first_name,
            last_name=data.last_name,
            document=data.document,
            phone=data.phone,
            email=data.email,
            password_hash=get_password_hash(data.password),
            role=data.role,
        )

        return self.repository.create(employee)

    def update_employee(self, employee_id: int, data: EmployeeUpdate) -> Employee:
        employee = self.get_employee(employee_id)

        if data.email and data.email != employee.email:
            existing = self.repository.get_by_email(data.email)
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Ya existe un empleado con ese correo",
                )

        if data.document and data.document != employee.document:
            existing = self.repository.get_by_document(data.document)
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Ya existe un empleado con ese documento",
                )

        update_data = data.model_dump(exclude_unset=True)

        if "password" in update_data:
            update_data["password_hash"] = get_password_hash(update_data.pop("password"))
        else:
            update_data.pop("password", None)

        for key, value in update_data.items():
            setattr(employee, key, value)

        return self.repository.update(employee)

    def delete_employee(self, employee_id: int) -> Employee:
        employee = self.get_employee(employee_id)
        return self.repository.soft_delete(employee)
