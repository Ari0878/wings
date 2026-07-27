from urllib.parse import quote


def _limpiar_numero(numero: str) -> str:
    """Deja solo dígitos en el número de teléfono."""
    return "".join(ch for ch in (numero or "") if ch.isdigit())


def link_pedido_para_vendedor(numero_vendedor: str, pedido) -> str:
    """Genera el enlace wa.me que el CLIENTE abre para avisarle al vendedor."""
    lineas = [f"*NUEVO PEDIDO #{pedido.id}*", ""]
    lineas.append(f"Cliente: {pedido.cliente_nombre}")
    if pedido.cliente_telefono:
        lineas.append(f"Tel: {pedido.cliente_telefono}")
    lineas.append("")
    lineas.append("*Detalle:*")
    for item in pedido.items:
        item_text = f"- {item['cantidad']}x {item['nombre']}"
        if item.get('variantes') and item['variantes']:
            variantes_text = " (" + ", ".join([f"{k}: {v}" for k, v in item['variantes'].items()]) + ")"
            item_text += variantes_text
        lineas.append(item_text)
    if pedido.notas:
        lineas.append(f"Notas: {pedido.notas}")

    mensaje = "\n".join(lineas)
    numero = _limpiar_numero(numero_vendedor)
    return f"https://wa.me/{numero}?text={quote(mensaje)}"


def link_aviso_para_cliente(pedido) -> str | None:
    """Genera el enlace wa.me que el VENDEDOR abre para avisarle al cliente
    en cuanto tiempo estara listo su pedido. Requiere que el cliente haya
    dejado su telefono."""
    if not pedido.cliente_telefono:
        return None

    tiempo = pedido.tiempo_estimado or "unos minutos"
    mensaje = (
        f"Hola {pedido.cliente_nombre}, tu pedido #{pedido.id} "
        f"estara listo para recoger en aproximadamente *{tiempo}*. Gracias por tu compra!"
    )
    numero = _limpiar_numero(pedido.cliente_telefono)
    return f"https://wa.me/{numero}?text={quote(mensaje)}"