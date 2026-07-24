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
    {"nombre": "Alitas BBQ (6 pzas)", "categoria": "Alitas", "precio": 95, "descripcion": "Bañadas en salsa BBQ"},
    {"nombre": "Alitas Picantes (6 pzas)", "categoria": "Alitas", "precio": 95, "descripcion": "Estilo  en salsa picosa"},
    {"nombre": "Alitas Mango Habanero (6 pzas)", "categoria": "Alitas", "precio": 95, "descripcion": "Dulce picante"},

    # --- Gomiboing ---
    {"nombre": "Gomiboing grande", "categoria": "Gomiboing", "precio": 55, "descripcion": "Gomitas con chamoy y chile, tamaño grande"},

    # --- Vaquitas ---
    {"nombre": "Vaquita loca", "categoria": "Vaquitas", "precio": 50, "descripcion": ""},

    # --- Manzanas locas ---
    {"nombre": "Manzana loca", "categoria": "Manzanas Locas", "precio": 35, "descripcion": "Con chamoy y dulces"},


    # --- Micheladas ---
    {"nombre": "Michelada clásica", "categoria": "Micheladas", "precio": 60, "descripcion": ""},
    {"nombre": "Michelada especial", "categoria": "Micheladas", "precio": 75, "descripcion": ""},

    # --- Pitufos ---
    {"nombre": "Pitufo", "categoria": "Pitufos", "precio": 30, "descripcion": ""},

    # --- Lienternas ---
    {"nombre": "Lienterna", "categoria": "Lienternas", "precio": 25, "descripcion": ""},


    # --- Dorilocos ---

    {"nombre": "Doriloco grande", "categoria": "Dorilocos", "precio": 60, "descripcion": "Doritos con toppings variados"},
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
