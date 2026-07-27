"""
Script para agregar la columna 'variantes' a la tabla productos.
Ejecutar: python add_variantes_column.py
"""
from app import create_app
from extensions import db
import sqlalchemy as sa

app = create_app()

with app.app_context():
    # Verificar si la columna ya existe
    inspector = sa.inspect(db.engine)
    columns = [col['name'] for col in inspector.get_columns('productos')]
    
    if 'variantes' in columns:
        print("La columna 'variantes' ya existe en la tabla productos.")
    else:
        # Agregar la columna
        with db.engine.connect() as conn:
            conn.execute(sa.text("ALTER TABLE productos ADD COLUMN variantes TEXT"))
            conn.commit()
        print("Columna 'variantes' agregada exitosamente a la tabla productos.")
