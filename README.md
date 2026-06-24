# Poisson POS

Sistema web SaaS moderno para la gestión de licoreras, bares y gastrobares.

## Stack Tecnológico

### Backend
- FastAPI (Python 3.13)
- SQLAlchemy 2 + Alembic
- PostgreSQL (Neon Database)
- JWT Authentication

### Frontend
- React 19 + TypeScript
- Vite
- Material UI
- React Router + React Query + Zustand

## Requisitos Previos

- Python 3.13+
- Node.js 20+
- PostgreSQL (local o Neon Database)

## Instalación Local

### Backend

```bash
cd backend
python -m venv venv
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate
pip install -r requirements.txt
```

### Configurar variables de entorno

```bash
cp .env.example .env
# Editar .env con tus credenciales de base de datos
```

### Ejecutar migraciones

```bash
cd backend
alembic upgrade head
```

### Cargar datos iniciales (seeders)

```bash
cd backend
python -m app.seeders.run
```

### Iniciar backend

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

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
│       ├── middleware/   # Middlewares
│       ├── database/     # Conexión DB
│       ├── auth/         # JWT Auth
│       └── utils/        # Utilidades
├── frontend/
│   └── src/
│       ├── pages/        # Páginas/Vistas
│       ├── components/   # Componentes reutilizables
│       ├── layouts/      # Layouts
│       ├── routes/       # Configuración de rutas
│       ├── services/     # API calls
│       ├── hooks/        # Custom hooks
│       ├── store/        # Zustand stores
│       ├── types/        # TypeScript types
│       ├── utils/        # Utilidades
│       └── theme/        # Tema Material UI
└── README.md
```

## Roles del Sistema

| Rol | Acceso |
|-----|--------|
| Administrador | Acceso total |
| Cajero | Caja y ventas |
| Mesero | Mesas y pedidos |
| Bartender | Visualización de pedidos |

## API Documentation

Con el backend corriendo, accede a la documentación Swagger en:
- http://localhost:8000/docs
- http://localhost:8000/redoc

## Credenciales por defecto

- **Admin:** admin@poisson.com / admin123
- **Cajero:** cajero@poisson.com / cajero123
- **Mesero:** mesero@poisson.com / mesero123
- **Bartender:** bartender@poisson.com / bartender123
