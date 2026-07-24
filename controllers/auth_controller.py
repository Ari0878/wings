from functools import wraps
from flask import (
    Blueprint, render_template, request, redirect,
    url_for, session, current_app, jsonify
)

auth_bp = Blueprint("auth", __name__)


def requiere_acceso(f):
    """Protege una vista: si no hay sesión de vendedor, manda al candado.
    No es un login de usuarios, es solo un código de acceso compartido."""
    @wraps(f)
    def decorador(*args, **kwargs):
        if not session.get("vendedor_ok"):
            # Si es una llamada a la API, responde 401 en vez de redirigir
            if request.path.startswith("/api/"):
                return jsonify({"error": "Acceso no autorizado"}), 401
            return redirect(url_for("auth.acceso", next=request.path))
        return f(*args, **kwargs)
    return decorador


@auth_bp.route("/acceso", methods=["GET", "POST"])
def acceso():
    if request.method == "POST":
        codigo = (request.form.get("codigo") or "").strip()
        siguiente = request.form.get("next") or url_for("paginas.vendedor")

        if codigo == current_app.config["PIN_VENDEDOR"]:
            session["vendedor_ok"] = True
            return redirect(siguiente)

        return render_template(
            "acceso.html",
            nombre_negocio=current_app.config["NOMBRE_NEGOCIO"],
            error="Código incorrecto, intenta de nuevo.",
            next=siguiente,
        )

    return render_template(
        "acceso.html",
        nombre_negocio=current_app.config["NOMBRE_NEGOCIO"],
        error=None,
        next=request.args.get("next", url_for("paginas.vendedor")),
    )


@auth_bp.get("/salir")
def salir():
    session.pop("vendedor_ok", None)
    return redirect(url_for("auth.acceso"))