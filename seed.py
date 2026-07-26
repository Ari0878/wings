"""
Script para llenar el menú con productos de ejemplo.
Ejecutar una sola vez: python seed.py
Puedes editar/agregar productos aquí, o después desde la base de datos.
"""
from app import create_app
from extensions import db
from models import Producto, CategoriaInventario

PRODUCTOS = [
    # --- Alitas ---
    {"nombre": "Alitas BBQ (6 pzas)", "categoria": "Alitas", "descripcion": "Bañadas en salsa BBQ"},
    {"nombre": "Alitas Picantes (6 pzas)", "categoria": "Alitas", "descripcion": "Estilo  en salsa picosa"},
    {"nombre": "Alitas Mango Habanero (6 pzas)", "categoria": "Alitas", "descripcion": "Dulce picante"},

    # --- Gomiboing ---
    {"nombre": "Gomiboing grande", "categoria": "Gomiboing", "descripcion": "Gomitas con chamoy y chile, tamaño grande"},

    # --- Vaquitas ---
    {"nombre": "Vaquita loca", "categoria": "Vaquitas", "descripcion": ""},

    # --- Manzanas locas ---
    {"nombre": "Manzana loca", "categoria": "Manzanas Locas", "descripcion": "Con chamoy y dulces"},


    # --- Micheladas ---
    {"nombre": "Michelada clásica", "categoria": "Micheladas", "descripcion": ""},
    {"nombre": "Michelada especial", "categoria": "Micheladas", "descripcion": ""},

    # --- Pitufos ---
    {"nombre": "Pitufo", "categoria": "Pitufos", "descripcion": ""},

    # --- Lienternas ---
    {"nombre": "Lienterna", "categoria": "Lienternas", "descripcion": ""},


    # --- Dorilocos ---

    {"nombre": "Doriloco grande", "categoria": "Dorilocos", "descripcion": "Doritos con toppings variados"},
]

# Inventario por CATEGORÍA (compartido entre todos los productos de la misma categoría)
INVENTARIO_CATEGORIAS = {
    "Alitas": 13,  # 13 tiras de alitas en total para todos los tipos
    "Gomiboing": 30,
    "Vaquitas": 20,
    "Manzanas Locas": 25,
    "Micheladas": 40,
    "Pitufos": 50,
    "Lienternas": 60,
    "Dorilocos": 45,
}

app = create_app()

with app.app_context():
    if Producto.query.count() > 0:
        print("Ya hay productos en la base de datos. No se agregó nada nuevo.")
        print("Si quieres reiniciar el menú, borra la base de datos y vuelve a correr este script.")
    else:
        # Crear inventario por categoría
        for categoria, inventario in INVENTARIO_CATEGORIAS.items():
            cat_inv = CategoriaInventario(categoria=categoria, inventario=inventario)
            db.session.add(cat_inv)
        
        # Crear productos
        for i, p in enumerate(PRODUCTOS):
            db.session.add(Producto(orden=i, disponible=True, **p))
        
        db.session.commit()
        print(f"Se agregaron {len(PRODUCTOS)} productos y {len(INVENTARIO_CATEGORIAS)} categorías con inventario.")
