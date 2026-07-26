from flask import Blueprint, jsonify, request
from extensions import db
from models import Producto, CategoriaInventario
from controllers.auth_controller import requiere_acceso

producto_bp = Blueprint("productos_admin", __name__, url_prefix="/api/admin/productos")


@producto_bp.before_request
@requiere_acceso
def _proteger_productos_admin():
    """Todo este blueprint es solo para el vendedor autenticado."""
    pass

@producto_bp.get("")
def listar_productos_admin():
    """Lista todos los productos con inventario de categoría visible para el vendedor"""
    productos = Producto.query.order_by(Producto.categoria, Producto.orden, Producto.nombre).all()
    
    # Obtener inventario por categoría
    categorias_inv = {}
    for cat_inv in CategoriaInventario.query.all():
        categorias_inv[cat_inv.categoria] = cat_inv.inventario
    
    # Agregar inventario de categoría a cada producto
    resultado = []
    for p in productos:
        prod_dict = p.to_dict(incluir_inventario=False)
        prod_dict["inventario_categoria"] = categorias_inv.get(p.categoria, 0)
        resultado.append(prod_dict)
    
    return jsonify(resultado)


@producto_bp.post("")
def crear_producto():
    """Crea un nuevo producto"""
    data = request.get_json(silent=True) or {}
    
    nombre = (data.get("nombre") or "").strip()
    categoria = (data.get("categoria") or "").strip()
    
    if not nombre:
        return jsonify({"error": "El nombre es obligatorio"}), 400
    if not categoria:
        return jsonify({"error": "La categoría es obligatoria"}), 400
    
    # Crear inventario de categoría si no existe
    cat_inv = CategoriaInventario.query.filter_by(categoria=categoria).first()
    if not cat_inv:
        cat_inv = CategoriaInventario(categoria=categoria, inventario=data.get("inventario_categoria", 0))
        db.session.add(cat_inv)
    
    producto = Producto(
        nombre=nombre,
        categoria=categoria,
        descripcion=(data.get("descripcion") or "").strip() or None,
        disponible=data.get("disponible", True),
        imagen_url=(data.get("imagen_url") or "").strip() or None,
        orden=data.get("orden", 0)
    )
    
    db.session.add(producto)
    db.session.commit()
    
    prod_dict = producto.to_dict(incluir_inventario=False)
    prod_dict["inventario_categoria"] = cat_inv.inventario
    return jsonify(prod_dict), 201


@producto_bp.get("/<int:producto_id>")
def obtener_producto(producto_id):
    """Obtiene un producto específico con inventario de categoría"""
    producto = Producto.query.get_or_404(producto_id)
    cat_inv = CategoriaInventario.query.filter_by(categoria=producto.categoria).first()
    
    prod_dict = producto.to_dict(incluir_inventario=False)
    prod_dict["inventario_categoria"] = cat_inv.inventario if cat_inv else 0
    return jsonify(prod_dict)


@producto_bp.patch("/<int:producto_id>")
def actualizar_producto(producto_id):
    """Actualiza un producto"""
    producto = Producto.query.get_or_404(producto_id)
    data = request.get_json(silent=True) or {}
    
    categoria_anterior = producto.categoria
    
    if "nombre" in data:
        producto.nombre = data["nombre"].strip()
    if "categoria" in data:
        producto.categoria = data["categoria"].strip()
    if "descripcion" in data:
        producto.descripcion = (data["descripcion"] or "").strip() or None
    if "disponible" in data:
        producto.disponible = data["disponible"]
    if "imagen_url" in data:
        producto.imagen_url = (data["imagen_url"] or "").strip() or None
    if "orden" in data:
        producto.orden = data["orden"]
    
    # Manejar cambio de categoría
    if "categoria" in data and data["categoria"] != categoria_anterior:
        # Crear inventario para la nueva categoría si no existe
        cat_inv_nueva = CategoriaInventario.query.filter_by(categoria=data["categoria"]).first()
        if not cat_inv_nueva:
            cat_inv_nueva = CategoriaInventario(categoria=data["categoria"], inventario=0)
            db.session.add(cat_inv_nueva)
    
    # Manejar inventario de categoría
    if "inventario_categoria" in data:
        cat_inv = CategoriaInventario.query.filter_by(categoria=producto.categoria).first()
        if cat_inv:
            cat_inv.inventario = data["inventario_categoria"]
            if cat_inv.inventario <= 0:
                cat_inv.inventario = 0
                # Desactivar todos los productos de esta categoría
                Producto.query.filter_by(categoria=producto.categoria).update({"disponible": False})
            else:
                # Reactivar productos de esta categoría si hay inventario
                Producto.query.filter_by(categoria=producto.categoria).update({"disponible": True})
    
    db.session.commit()
    
    cat_inv_final = CategoriaInventario.query.filter_by(categoria=producto.categoria).first()
    prod_dict = producto.to_dict(incluir_inventario=False)
    prod_dict["inventario_categoria"] = cat_inv_final.inventario if cat_inv_final else 0
    return jsonify(prod_dict)


@producto_bp.delete("/<int:producto_id>")
def eliminar_producto(producto_id):
    """Elimina un producto"""
    producto = Producto.query.get_or_404(producto_id)
    db.session.delete(producto)
    db.session.commit()
    return jsonify({"mensaje": "Producto eliminado"}), 200
