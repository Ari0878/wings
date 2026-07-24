from extensions import db


class Producto(db.Model):
    __tablename__ = "productos"

    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(120), nullable=False)
    categoria = db.Column(db.String(60), nullable=False)
    descripcion = db.Column(db.String(255), nullable=True)
    precio = db.Column(db.Numeric(10, 2), nullable=False)
    disponible = db.Column(db.Boolean, default=True, nullable=False)
    imagen_url = db.Column(db.String(255), nullable=True)
    orden = db.Column(db.Integer, default=0)

    def to_dict(self, incluir_inventario=False):
        data = {
            "id": self.id,
            "nombre": self.nombre,
            "categoria": self.categoria,
            "descripcion": self.descripcion,
            "precio": float(self.precio),
            "disponible": self.disponible,
            "imagen_url": self.imagen_url,
        }
        if incluir_inventario:
            data["inventario"] = self.inventario
        return data
