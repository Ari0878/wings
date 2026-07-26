import json
from datetime import datetime
from extensions import db

ESTADOS_VALIDOS = ["pendiente", "en_preparacion", "listo", "entregado", "cancelado"]


class Pedido(db.Model):
    __tablename__ = "pedidos"

    id = db.Column(db.Integer, primary_key=True)
    cliente_nombre = db.Column(db.String(120), nullable=False)
    cliente_telefono = db.Column(db.String(30), nullable=True)
    notas = db.Column(db.String(500), nullable=True)
    items_json = db.Column(db.Text, nullable=False)  # lista de items del carrito
    total = db.Column(db.Numeric(10, 2), nullable=True)
    estado = db.Column(db.String(20), default="pendiente", nullable=False)
    forma_pago = db.Column(db.String(20), nullable=False)  # efectivo o tarjeta
    tiempo_estimado = db.Column(db.String(60), nullable=True)  # ej. "20 minutos"
    creado_en = db.Column(db.DateTime, default=datetime.utcnow)
    actualizado_en = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    @property
    def items(self):
        return json.loads(self.items_json)

    @items.setter
    def items(self, value):
        self.items_json = json.dumps(value, ensure_ascii=False)

    def to_dict(self):
        return {
            "id": self.id,
            "cliente_nombre": self.cliente_nombre,
            "cliente_telefono": self.cliente_telefono,
            "notas": self.notas,
            "items": self.items,
            # "total": float(self.total),
            "estado": self.estado,
            "forma_pago": self.forma_pago,
            "tiempo_estimado": self.tiempo_estimado,
            "creado_en": self.creado_en.isoformat(),
            "actualizado_en": self.actualizado_en.isoformat(),
        }
