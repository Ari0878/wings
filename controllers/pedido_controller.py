from flask import Blueprint, jsonify, request, current_app
from extensions import db
from models import Pedido, Producto, CategoriaInventario
from models.pedido import ESTADOS_VALIDOS
from services.whatsapp_service import link_pedido_para_vendedor, link_aviso_para_cliente
from controllers.auth_controller import requiere_acceso

pedido_bp = Blueprint("pedidos", __name__, url_prefix="/api/pedidos")


@pedido_bp.before_request
def _proteger_pedidos_vendedor():
    """Solo crear pedido (POST) es público, el resto es del panel del vendedor."""
    if request.method == "POST":
        return None
    return requiere_acceso(lambda: None)()


@pedido_bp.post("")
def crear_pedido():
    data = request.get_json(silent=True) or {}

    nombre = (data.get("cliente_nombre") or "").strip()
    items = data.get("items") or []
    forma_pago = (data.get("forma_pago") or "").strip()

    if not nombre:
        return jsonify({"error": "El nombre del cliente es obligatorio"}), 400
    if not items:
        return jsonify({"error": "El carrito está vacío"}), 400
    if not forma_pago:
        return jsonify({"error": "La forma de pago es obligatoria"}), 400
    if forma_pago not in ["efectivo", "tarjeta"]:
        return jsonify({"error": "La forma de pago debe ser 'efectivo' o 'tarjeta'"}), 400

    # Verificar inventario disponible por CATEGORÍA
    # Agrupar items por categoría para verificar el inventario total
    categorias_solicitadas = {}
    for item in items:
        producto = Producto.query.get(item["id"])
        if not producto:
            return jsonify({"error": f"Producto con ID {item['id']} no encontrado"}), 404
        
        if not producto.disponible:
            return jsonify({"error": f"El producto {producto.nombre} no está disponible actualmente"}), 400
        
        if producto.categoria not in categorias_solicitadas:
            categorias_solicitadas[producto.categoria] = 0
        categorias_solicitadas[producto.categoria] += item["cantidad"]

    # Verificar inventario por categoría
    for categoria, cantidad_solicitada in categorias_solicitadas.items():
        cat_inv = CategoriaInventario.query.filter_by(categoria=categoria).first()
        if not cat_inv:
            return jsonify({"error": f"No hay inventario configurado para la categoría {categoria}"}), 400
        if cat_inv.inventario < cantidad_solicitada:
            return jsonify({
                "error": f"Por el momento no contamos con suficientes {categoria.lower()} para atender más pedidos. ¡Gracias por tu comprensión!"
            }), 400

    pedido = Pedido(
        cliente_nombre=nombre,
        cliente_telefono=(data.get("cliente_telefono") or "").strip() or None,
        notas=(data.get("notas") or "").strip() or None,
        estado="pendiente",
        forma_pago=forma_pago,
    )
    pedido.items = items

    # Reducir inventario por CATEGORÍA
    for categoria, cantidad_solicitada in categorias_solicitadas.items():
        cat_inv = CategoriaInventario.query.filter_by(categoria=categoria).first()
        cat_inv.inventario -= cantidad_solicitada
        if cat_inv.inventario <= 0:
            cat_inv.inventario = 0
            # Desactivar todos los productos de esta categoría
            Producto.query.filter_by(categoria=categoria).update({"disponible": False})

    db.session.add(pedido)
    db.session.commit()

    numero_vendedor = current_app.config["WHATSAPP_VENDEDOR"]
    whatsapp_link = link_pedido_para_vendedor(numero_vendedor, pedido)

    respuesta = pedido.to_dict()
    respuesta["whatsapp_link"] = whatsapp_link
    return jsonify(respuesta), 201


@pedido_bp.get("")
def listar_pedidos():
    estado = request.args.get("estado")
    query = Pedido.query
    if estado:
        query = query.filter_by(estado=estado)
    pedidos = query.order_by(Pedido.creado_en.desc()).all()
    return jsonify([p.to_dict() for p in pedidos])


@pedido_bp.get("/<int:pedido_id>")
def obtener_pedido(pedido_id):
    pedido = Pedido.query.get_or_404(pedido_id)
    return jsonify(pedido.to_dict())


@pedido_bp.patch("/<int:pedido_id>")
def actualizar_pedido(pedido_id):
    pedido = Pedido.query.get_or_404(pedido_id)
    data = request.get_json(silent=True) or {}

    if "tiempo_estimado" in data:
        pedido.tiempo_estimado = data["tiempo_estimado"]

    if "estado" in data:
        nuevo_estado = data["estado"]
        if nuevo_estado not in ESTADOS_VALIDOS:
            return jsonify({"error": "Estado inválido"}), 400
        pedido.estado = nuevo_estado

    db.session.commit()

    respuesta = pedido.to_dict()
    respuesta["whatsapp_link_cliente"] = link_aviso_para_cliente(pedido)
    return jsonify(respuesta)
