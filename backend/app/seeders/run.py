"""
Seed script to populate the database with initial data.
Run: python -m app.seeders.run
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.database.session import SessionLocal
from app.database.base import Base
from app.database.session import engine
from app.models.employee import Employee, RoleEnum
from app.models.category import Category
from app.models.product import Product
from app.models.table import Table, TableStatus
from app.models.barrel import Barrel
from app.core.security import get_password_hash


def seed():
    # Create tables
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        # Check if already seeded
        existing = db.query(Employee).first()
        if existing:
            print("Database already seeded. Skipping...")
            return

        print("Seeding database...")

        # === EMPLOYEES ===
        employees = [
            Employee(
                first_name="Admin",
                last_name="Sistema",
                document="1000000001",
                phone="3001234567",
                email="admin@poisson.com",
                password_hash=get_password_hash("admin123"),
                role=RoleEnum.ADMIN,
            ),
            Employee(
                first_name="Carlos",
                last_name="Cajero",
                document="1000000002",
                phone="3009876543",
                email="cajero@poisson.com",
                password_hash=get_password_hash("cajero123"),
                role=RoleEnum.CAJERO,
            ),
            Employee(
                first_name="María",
                last_name="Mesera",
                document="1000000003",
                phone="3005551234",
                email="mesero@poisson.com",
                password_hash=get_password_hash("mesero123"),
                role=RoleEnum.MESERO,
            ),
            Employee(
                first_name="Pedro",
                last_name="Bartender",
                document="1000000004",
                phone="3007778899",
                email="bartender@poisson.com",
                password_hash=get_password_hash("bartender123"),
                role=RoleEnum.BARTENDER,
            ),
        ]
        db.add_all(employees)
        db.flush()
        print(f"  ✓ {len(employees)} empleados creados")

        # === CATEGORIES ===
        categories = [
            Category(name="Cervezas", description="Cervezas nacionales e importadas"),
            Category(name="Chops", description="Cervezas de barril (chop)"),
            Category(name="Licores", description="Licores, aguardiente, whisky, ron, etc."),
            Category(name="Cócteles", description="Cócteles preparados"),
            Category(name="Snacks", description="Acompañamientos y comida rápida"),
        ]
        db.add_all(categories)
        db.flush()
        print(f"  ✓ {len(categories)} categorías creadas")

        # === BARRELS ===
        barrels = [
            Barrel(name="BBC Lager", capacity_liters=30, available_liters=30, shot_price=5000),
            Barrel(name="Tres Cordilleras Mestiza", capacity_liters=30, available_liters=25, shot_price=6000),
            Barrel(name="Bogotá Beer Chapinero", capacity_liters=50, available_liters=50, shot_price=7000),
            Barrel(name="Apóstol Rubia", capacity_liters=30, available_liters=18, shot_price=5500),
        ]
        db.add_all(barrels)
        db.flush()
        print(f"  ✓ {len(barrels)} barriles creados")

        # === PRODUCTS ===
        cat_cervezas = categories[0]
        cat_chops = categories[1]
        cat_licores = categories[2]
        cat_cocteles = categories[3]
        cat_snacks = categories[4]

        products = [
            # Cervezas
            Product(name="Club Colombia Dorada", category_id=cat_cervezas.id, sale_price=7000, stock=48, min_stock=12),
            Product(name="Poker", category_id=cat_cervezas.id, sale_price=5000, stock=60, min_stock=12),
            Product(name="Águila", category_id=cat_cervezas.id, sale_price=5000, stock=36, min_stock=12),
            Product(name="Corona", category_id=cat_cervezas.id, sale_price=10000, stock=24, min_stock=6),
            Product(name="Heineken", category_id=cat_cervezas.id, sale_price=9000, stock=24, min_stock=6),
            # Chops
            Product(name="Chop BBC Lager (500ml)", category_id=cat_chops.id, sale_price=12000, stock=60, min_stock=10, barrel_id=barrels[0].id),
            Product(name="Chop Tres Cordilleras (500ml)", category_id=cat_chops.id, sale_price=13000, stock=50, min_stock=10, barrel_id=barrels[1].id),
            Product(name="Chop Bogotá Beer (500ml)", category_id=cat_chops.id, sale_price=14000, stock=100, min_stock=10, barrel_id=barrels[2].id),
            Product(name="Chop Apóstol (500ml)", category_id=cat_chops.id, sale_price=11000, stock=36, min_stock=10, barrel_id=barrels[3].id),
            # Licores
            Product(name="Aguardiente Antioqueño", category_id=cat_licores.id, sale_price=45000, stock=15, min_stock=5),
            Product(name="Ron Medellín 8 años", category_id=cat_licores.id, sale_price=65000, stock=10, min_stock=3),
            Product(name="Whisky Old Parr", category_id=cat_licores.id, sale_price=120000, stock=8, min_stock=2),
            Product(name="Tequila José Cuervo", category_id=cat_licores.id, sale_price=85000, stock=6, min_stock=2),
            # Cócteles
            Product(name="Mojito", category_id=cat_cocteles.id, sale_price=18000, stock=30, min_stock=5),
            Product(name="Piña Colada", category_id=cat_cocteles.id, sale_price=20000, stock=25, min_stock=5),
            Product(name="Margarita", category_id=cat_cocteles.id, sale_price=22000, stock=20, min_stock=5),
            Product(name="Cuba Libre", category_id=cat_cocteles.id, sale_price=16000, stock=30, min_stock=5),
            # Snacks
            Product(name="Porción de Papas", category_id=cat_snacks.id, sale_price=12000, stock=40, min_stock=10),
            Product(name="Alitas BBQ x6", category_id=cat_snacks.id, sale_price=22000, stock=30, min_stock=5),
            Product(name="Nachos con Queso", category_id=cat_snacks.id, sale_price=15000, stock=25, min_stock=5),
            Product(name="Hamburguesa Clásica", category_id=cat_snacks.id, sale_price=25000, stock=20, min_stock=5),
        ]
        db.add_all(products)
        db.flush()
        print(f"  ✓ {len(products)} productos creados")

        # === TABLES ===
        tables = [Table(number=i, status=TableStatus.LIBRE) for i in range(1, 13)]
        db.add_all(tables)
        db.flush()
        print(f"  ✓ {len(tables)} mesas creadas")

        db.commit()
        print("\n✅ Seed completado exitosamente!")

    except Exception as e:
        db.rollback()
        print(f"\n❌ Error durante el seed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
