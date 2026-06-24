from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    employee_id: int
    role: str
    full_name: str


class TokenData(BaseModel):
    employee_id: int
    email: str
    role: str
