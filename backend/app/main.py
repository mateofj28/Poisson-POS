from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import IntegrityError
from contextlib import asynccontextmanager
import asyncio
from datetime import datetime, timezone

from app.core.config import settings
from app.middleware.error_handler import (
    validation_exception_handler,
    integrity_error_handler,
    general_exception_handler,
)
from app.api.auth import router as auth_router
from app.api.employees import router as employees_router
from app.api.tables import router as tables_router
from app.api.categories import router as categories_router
from app.api.products import router as products_router
from app.api.barrels import router as barrels_router
from app.api.orders import router as orders_router
from app.api.sales import router as sales_router
from app.api.inventory import router as inventory_router
from app.api.cash_register import router as cash_register_router
from app.api.dashboard import router as dashboard_router
from app.database.session import SessionLocal
from app.models.barrel import Barrel


async def reset_shots_daily():
    """Background task that resets barrel shots at midnight."""
    last_reset_date = datetime.now(timezone.utc).date()

    while True:
        await asyncio.sleep(60 * 30)  # Check every 30 minutes
        current_date = datetime.now(timezone.utc).date()

        if current_date > last_reset_date:
            try:
                db = SessionLocal()
                db.query(Barrel).update({Barrel.shots_sold_today: 0})
                db.commit()
                db.close()
                last_reset_date = current_date
                print(f"[SCHEDULER] Shots reseteados - {current_date}")
            except Exception as e:
                print(f"[SCHEDULER] Error reseteando shots: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: launch background task
    task = asyncio.create_task(reset_shots_daily())
    yield
    # Shutdown: cancel task
    task.cancel()


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Sistema POS para gestión de licoreras, bares y gastrobares",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://poisson-pos.vercel.app",
        "http://localhost:5173",
        "http://localhost:3000",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handlers
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(IntegrityError, integrity_error_handler)
app.add_exception_handler(Exception, general_exception_handler)

# Routers
app.include_router(auth_router, prefix="/api/v1")
app.include_router(employees_router, prefix="/api/v1")
app.include_router(tables_router, prefix="/api/v1")
app.include_router(categories_router, prefix="/api/v1")
app.include_router(products_router, prefix="/api/v1")
app.include_router(barrels_router, prefix="/api/v1")
app.include_router(orders_router, prefix="/api/v1")
app.include_router(sales_router, prefix="/api/v1")
app.include_router(inventory_router, prefix="/api/v1")
app.include_router(cash_register_router, prefix="/api/v1")
app.include_router(dashboard_router, prefix="/api/v1")


@app.get("/")
def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/docs",
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}
