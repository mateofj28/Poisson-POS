from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import IntegrityError

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

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Sistema POS para gestión de licoreras, bares y gastrobares",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
]

# In production, allow the Vercel deployment
if settings.ENVIRONMENT == "production":
    origins.append("https://*.vercel.app")
    origins = ["*"]  # Allow all for now, restrict in production with specific domain

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
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
