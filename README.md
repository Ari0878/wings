# WAL — Menú de antojitos con carrito y aviso por WhatsApp

Proyecto para tu puesto de antojitos (alitas, gomiboing, vaquitas, manzanas
locas, micheladas, pitufos, lienternas, verdes, dorilocos, etc).

## ¿Qué hace?

- **Página del cliente (`/`)**: menú por categorías, carrito tipo "ticket",
  el cliente pone su nombre, teléfono (opcional) y notas, y confirma su
  pedido.
- Al confirmar, se guarda el pedido y aparece un botón para **enviarlo por
  WhatsApp** al negocio (número configurado en `.env`), con todo el detalle
  ya escrito — así el vendedor recibe la notificación directo en su WhatsApp.
- **Panel del vendedor (`/vendedor`)**: lista de pedidos que se actualiza
  sola cada 15 segundos. El vendedor puede escribir el **tiempo estimado**
  (ej. "20 minutos"), cambiar el estado del pedido (pendiente / en
  preparación / listo / entregado) y, si el cliente dejó su teléfono, hay un
  botón **"Avisar por WhatsApp"** que abre un WhatsApp ya redactado avisando
  al cliente cuándo puede pasar a recoger su pedido.
- No tiene login (como pediste), para que sea rápido de usar desde el
  celular del negocio. Si más adelante quieres protegerlo con
  usuario/contraseña, se puede agregar.

## Instalación

```bash
cd WAL
python3 -m venv venv
source venv/bin/activate        # en Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## Configurar tu número de WhatsApp

Abre el archivo `.env` y cambia esta línea por el número real del negocio
(con código de país, sin "+", sin espacios):

```
WHATSAPP_VENDEDOR=5215512345678
```

## Cargar el menú

El proyecto trae productos de ejemplo de tus categorías. Para cargarlos a
la base de datos (solo la primera vez):

```bash
python seed.py
```

Puedes editar/agregar productos abriendo `seed.py` y volviendo a correrlo
después de borrar el archivo `wal.db` (así reinicias el menú), o
directamente insertando filas en la tabla `productos`.

## Correr el proyecto

```bash
python app.py
```

Luego abre en el navegador:

- Menú del cliente: **http://localhost:5000/**
- Panel del vendedor: **http://localhost:5000/vendedor**

En el celular del negocio, si está en la misma red WiFi que la
computadora, puedes usar la IP local en vez de `localhost` (ej.
`http://192.168.1.X:5000/vendedor`).

## Usar MySQL en vez de SQLite

Por defecto el proyecto usa SQLite (archivo `wal.db`, cero configuración).
Si prefieres MySQL (como venía tu `.env` original):

1. En `.env` cambia `USE_SQLITE=1` a `USE_SQLITE=0`.
2. Ajusta `DATABASE_URI` con tus datos reales de MySQL.
3. Crea la base de datos vacía en MySQL (ej. `apiwings`).
4. Corre `python app.py` (crea las tablas solo) y luego `python seed.py`.

## Estructura del proyecto

```
WAL/
├── app.py                  # Arranque de Flask
├── config.py                # Configuración (lee .env)
├── extensions.py            # Instancia de SQLAlchemy
├── seed.py                  # Carga el menú inicial
├── models/                  # Producto, Pedido
├── controllers/             # Rutas: menú, pedidos, páginas
├── services/                # Generador de links de WhatsApp
├── template/                 # HTML (menú cliente + panel vendedor)
└── static/                  # CSS y JS
```

## Próximos pasos posibles

- Agregar fotos reales a cada producto (`imagen_url` en la tabla productos).
- Agregar login simple al panel del vendedor.
- Marcar productos como "agotado" desde el panel.
- Migrar de wa.me a un bot automático (WhatsApp Business API / Twilio) si
  el negocio crece y quieres respuestas 100% automáticas.
