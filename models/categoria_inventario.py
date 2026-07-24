from extensions import db


class CategoriaInventario(db.Model):
    __tablename__ = "categoria_inventario"

    id = db.Column(db.Integer, primary_key=True)
    categoria = db.Column(db.String(60), nullable=False, unique=True)
    inventario = db.Column(db.Integer, default=0, nullable=False)  # cantidad total disponible para la categoría

    def to_dict(self):
        return {
            "id": self.id,
            "categoria": self.categoria,
            "inventario": self.inventario,
        }
