from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.repositories.employee_repository import EmployeeRepository
from app.core.security import verify_password, create_access_token
from app.schemas.auth import LoginRequest, TokenResponse


class AuthService:
    def __init__(self, db: Session):
        self.repository = EmployeeRepository(db)

    def login(self, data: LoginRequest) -> TokenResponse:
        employee = self.repository.get_by_email(data.email)

        if not employee or not verify_password(data.password, employee.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Credenciales inválidas",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not employee.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cuenta desactivada. Contacte al administrador.",
            )

        access_token = create_access_token(
            data={
                "sub": str(employee.id),
                "email": employee.email,
                "role": employee.role.value,
            }
        )

        return TokenResponse(
            access_token=access_token,
            employee_id=employee.id,
            role=employee.role.value,
            full_name=f"{employee.first_name} {employee.last_name}",
        )
