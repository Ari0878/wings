import os
from dotenv import load_dotenv

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"))


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "supersecretkey")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "jwt-super-secret")

    # Si USE_SQLITE=1 usa SQLite.
    # En cualquier otro caso usa PostgreSQL.
    if os.getenv("USE_SQLITE", "0") == "1":
        SQLALCHEMY_DATABASE_URI = "sqlite:///" + os.path.join(BASE_DIR, "wal.db")
    else:
        SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URI")

    SQLALCHEMY_TRACK_MODIFICATIONS = False

    WHATSAPP_VENDEDOR = os.getenv("WHATSAPP_VENDEDOR")
    NOMBRE_NEGOCIO = os.getenv("NOMBRE_NEGOCIO")
    PIN_VENDEDOR = os.getenv("PIN_VENDEDOR")