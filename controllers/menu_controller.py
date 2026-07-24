from flask import Blueprint, jsonify
from extensions import db
from models import Producto

menu_bp = Blueprint("menu", __name__, url_prefix="/api/productos")


@menu_bp.get("")
def listar_productos():
    """Lista productos para el cliente SIN mostrar inventario.
    Incluye los no disponibles para que el frontend los muestre atenuados
    en vez de ocultarlos por completo."""
    productos = (
        Producto.query
        .order_by(Producto.categoria, Producto.orden, Producto.nombre)
        .all()
    )

    agrupado = {}
    for p in productos:
        agrupado.setdefault(p.categoria, []).append(p.to_dict(incluir_inventario=False))

    return jsonify(agrupado)