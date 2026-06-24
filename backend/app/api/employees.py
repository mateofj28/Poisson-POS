from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database.session import get_db
from app.schemas.employee import EmployeeCreate, EmployeeUpdate, EmployeeResponse, EmployeeListResponse
from app.services.employee_service import EmployeeService
from app.auth.dependencies import get_current_employee, require_roles
from app.models.employee import Employee, RoleEnum

router = APIRouter(prefix="/employees", tags=["Empleados"])


@router.get("", response_model=EmployeeListResponse)
def get_employees(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    role: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(require_roles(RoleEnum.ADMIN)),
):
    service = EmployeeService(db)
    return service.get_employees(
        skip=skip, limit=limit, search=search, role=role, is_active=is_active
    )


@router.get("/{employee_id}", response_model=EmployeeResponse)
def get_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(require_roles(RoleEnum.ADMIN)),
):
    service = EmployeeService(db)
    return service.get_employee(employee_id)


@router.post("", response_model=EmployeeResponse, status_code=201)
def create_employee(
    data: EmployeeCreate,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(require_roles(RoleEnum.ADMIN)),
):
    service = EmployeeService(db)
    return service.create_employee(data)


@router.put("/{employee_id}", response_model=EmployeeResponse)
def update_employee(
    employee_id: int,
    data: EmployeeUpdate,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(require_roles(RoleEnum.ADMIN)),
):
    service = EmployeeService(db)
    return service.update_employee(employee_id, data)


@router.delete("/{employee_id}")
def delete_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(require_roles(RoleEnum.ADMIN)),
):
    service = EmployeeService(db)
    service.delete_employee(employee_id)
    return {"message": "Empleado eliminado correctamente"}
