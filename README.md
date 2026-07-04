# 🐟 Poisson POS

Sistema web SaaS moderno para la gestión de licoreras, bares y gastrobares.

## Demo

- **Frontend:** https://poisson-pos.vercel.app
- **Backend API:** https://poisson-pos-production.up.railway.app
- **Swagger Docs:** https://poisson-pos-production.up.railway.app/docs

## Stack Tecnológico

### Frontend
- React 19 + TypeScript
- Vite 8
- HeroUI (componentes)
- Tailwind CSS v4
- React Router v7
- TanStack React Query
- Zustand (estado global)
- React Hook Form + Zod (validaciones)
- react-hot-toast (notificaciones)

### Backend
- FastAPI + Python 3.12
- SQLAlchemy 2 + Alembic
- PostgreSQL (Railway)
- JWT Authentication (bcrypt)

### Infraestructura
- Frontend: Vercel
- Backend: Railway
- Base de datos: Railway PostgreSQL

## Módulos

| # | Módulo | Descripción |
|---|--------|-------------|
| 1 | Autenticación | Login, JWT, roles, protección de rutas |
| 2 | Empleados | CRUD completo con roles diferenciados |
| 3 | Mesas | Dashboard visual, estados (libre/ocupada/en pago) |
| 4 | Productos | CRUD con categorías, stock, precios |
| 5 | Inventario | Movimientos, ajustes, alertas de bajo stock |
| 6 | Shots/Barriles | Conteo diario de shots, ingresos por botella |
| 7 | Pedidos | Crear por mesa, agregar/quitar productos |
| 8 | Ventas | Pagos mixtos, cálculo de cambio |
| 9 | Caja | Apertura/cierre, reporte exportable |
| 10 | Dashboard | Métricas del día en tiempo real |

## Roles del Sistema

| Rol | Acceso |
|-----|--------|
| Administrador | Acceso total |
| Cajero | Caja, ventas, inventario |
| Mesero | Mesas y pedidos |
| Bartender | Shots y pedidos |

## Instalación Local

### Requisitos
- Python 3.12+
- Node.js 20+
- PostgreSQL

### Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Editar .env con tu DATABASE_URL

# Crear tablas y datos iniciales
python -m app.seeders.run

# Iniciar servidor
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Variables de Entorno

### Backend (.env)
```
DATABASE_URL=postgresql://user:pass@host:port/dbname
SECRET_KEY=tu-clave-secreta-segura
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480
ENVIRONMENT=production
```

### Frontend (Vercel)
```
VITE_API_URL=https://tu-backend.up.railway.app/api/v1
```

## Credenciales de Prueba

| Rol | Email | Contraseña |
|-----|-------|------------|
| Admin | admin@poisson.com | admin123 |
| Cajero | cajero@poisson.com | cajero123 |
| Mesero | mesero@poisson.com | mesero123 |
| Bartender | bartender@poisson.com | bartender123 |

## Estructura del Proyecto

```
poisson-pos/
├── backend/
│   └── app/
│       ├── api/          # Endpoints REST
│       ├── core/         # Configuración, seguridad
│       ├── models/       # Modelos SQLAlchemy
│       ├── repositories/ # Acceso a datos
│       ├── services/     # Lógica de negocio
│       ├── schemas/      # Pydantic schemas
│       ├── middleware/   # Error handlers
│       ├── database/     # Conexión DB
│       ├── auth/         # JWT Dependencies
│       ├── seeders/      # Datos iniciales
│       └── utils/        # Utilidades
├── frontend/
│   └── src/
│       ├── pages/        # Vistas (11 páginas)
│       ├── layouts/      # MainLayout responsive
│       ├── routes/       # Router + ProtectedRoute
│       ├── services/     # Axios API calls
│       ├── store/        # Zustand (auth + theme)
│       └── types/        # TypeScript interfaces
└── README.md
```

## Características

- ✅ Dark/Light mode
- ✅ Responsive (mobile, tablet, desktop)
- ✅ Paginación en tablas
- ✅ Búsqueda con tolerancia a tildes
- ✅ Formato de miles en valores monetarios
- ✅ Validaciones frontend y backend
- ✅ Reporte de cierre exportable/imprimible
- ✅ Reseteo automático diario de shots
- ✅ Página 404 personalizada
- ✅ CORS habilitado
- ✅ Soft delete
- ✅ Swagger/OpenAPI documentación automática

## API

La documentación completa de la API está disponible en `/docs` (Swagger UI) y `/redoc`.

Endpoints principales:
- `POST /api/v1/auth/login` — Autenticación
- `GET /api/v1/dashboard` — Métricas del día
- `CRUD /api/v1/employees` — Empleados
- `CRUD /api/v1/tables` — Mesas
- `CRUD /api/v1/products` — Productos
- `CRUD /api/v1/categories` — Categorías
- `CRUD /api/v1/barrels` — Shots/Barriles
- `CRUD /api/v1/orders` — Pedidos
- `CRUD /api/v1/sales` — Ventas
- `CRUD /api/v1/inventory` — Inventario
- `CRUD /api/v1/cash-register` — Caja
