from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.dashboard import DashboardResponse
from app.services.dashboard_service import DashboardService
from app.auth.dependencies import get_current_employee
from app.models.employee import Employee

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("", response_model=DashboardResponse)
def get_dashboard(
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee),
):
    service = DashboardService(db)
    return service.get_dashboard()
