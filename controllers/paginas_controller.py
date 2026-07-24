from flask import Blueprint, render_template, current_app
from controllers.auth_controller import requiere_acceso

paginas_bp = Blueprint("paginas", __name__)


@paginas_bp.get("/")
def index():
    return render_template(
        "index.html", nombre_negocio=current_app.config["NOMBRE_NEGOCIO"]
    )


@paginas_bp.get("/vendedor")
@requiere_acceso
def vendedor():
    return render_template(
        "vendedor.html", nombre_negocio=current_app.config["NOMBRE_NEGOCIO"]
    )


@paginas_bp.get("/admin/productos")
@requiere_acceso
def admin_productos():
    return render_template(
        "productos.html", nombre_negocio=current_app.config["NOMBRE_NEGOCIO"]
    )