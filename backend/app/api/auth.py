from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from collections import defaultdict

from app.database.session import get_db
from app.schemas.auth import LoginRequest, TokenResponse
from app.services.auth_service import AuthService
from app.auth.dependencies import get_current_employee
from app.models.employee import Employee

router = APIRouter(prefix="/auth", tags=["Autenticación"])

# Simple rate limiter: max 5 attempts per IP per 5 minutes
_login_attempts: dict = defaultdict(list)
MAX_ATTEMPTS = 5
WINDOW_SECONDS = 300


def _check_rate_limit(request: Request):
    ip = request.client.host if request.client else "unknown"
    now = datetime.now(timezone.utc).timestamp()
    # Clean old attempts
    _login_attempts[ip] = [t for t in _login_attempts[ip] if now - t < WINDOW_SECONDS]
    if len(_login_attempts[ip]) >= MAX_ATTEMPTS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Demasiados intentos de inicio de sesión. Intente de nuevo en 5 minutos.",
        )
    _login_attempts[ip].append(now)


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, request: Request, db: Session = Depends(get_db)):
    _check_rate_limit(request)
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
