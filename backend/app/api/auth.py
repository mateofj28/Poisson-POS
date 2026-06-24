from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.auth import LoginRequest, TokenResponse
from app.services.auth_service import AuthService
from app.auth.dependencies import get_current_employee
from app.models.employee import Employee

router = APIRouter(prefix="/auth", tags=["Autenticación"])


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    service = AuthService(db)
    return service.login(data)


@router.get("/me")
def get_me(current_employee: Employee = Depends(get_current_employee)):
    return {
        "id": current_employee.id,
        "email": current_employee.email,
        "first_name": current_employee.first_name,
        "last_name": current_employee.last_name,
        "role": current_employee.role.value,
        "is_active": current_employee.is_active,
    }
