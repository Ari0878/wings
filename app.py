from flask import Flask
from config import Config
from extensions import db
from flask_migrate import Migrate


def create_app():
    app = Flask(__name__, template_folder="template", static_folder="static")
    app.config.from_object(Config)

    db.init_app(app)
    migrate = Migrate(app, db)

    from controllers.menu_controller import menu_bp
    from controllers.pedido_controller import pedido_bp
    from controllers.paginas_controller import paginas_bp
    from controllers.producto_controller import producto_bp
    from controllers.auth_controller import auth_bp

    app.register_blueprint(menu_bp)
    app.register_blueprint(pedido_bp)
    app.register_blueprint(paginas_bp)
    app.register_blueprint(producto_bp)
    app.register_blueprint(auth_bp)

    with app.app_context():
        db.create_all()

    return app


app = create_app()

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)