let ultimoMenuJSON = null;

// ---------- Estado ----------
let carrito = []; // [{id, nombre, cantidad}]

const menuContenedor = document.getElementById("menu-contenedor");
const ticket = document.getElementById("ticket");
const overlay = document.getElementById("overlay");
const ticketItems = document.getElementById("ticket-items");
const badgeCarrito = document.getElementById("badge-carrito");
const mensajeError = document.getElementById("mensaje-error");

const inputNombre = document.getElementById("input-nombre");
const inputTelefono = document.getElementById("input-telefono");
const inputFormaPago = document.getElementById("input-forma-pago");
const inputNotas = document.getElementById("input-notas");

// ---------- Cargar menú ----------
async function cargarMenu() {
  try {
    const res = await fetch("/api/productos");
    const data = await res.json();
    const dataJSON = JSON.stringify(data);

    if (dataJSON === ultimoMenuJSON) return;
    ultimoMenuJSON = dataJSON;

    if (Object.keys(data).length === 0) {
      menuContenedor.innerHTML = `
        <p style="text-align:center;color:var(--paper-dim);">
          Por ahora no hay productos disponibles. Vuelve a intentarlo más tarde.
        </p>`;
      return;
    }

    menuContenedor.innerHTML = "";

    for (const categoria in data) {
      const seccion = document.createElement("section");
      seccion.className = "categoria";
      seccion.innerHTML = `
        <h2>${categoria}</h2>
        <div class="grid-productos">
          ${data[categoria].map(productoCardHTML).join("")}
        </div>
      `;
      menuContenedor.appendChild(seccion);
    }

    document.querySelectorAll(".btn-agregar").forEach((btn) => {
      btn.addEventListener("click", () => {
        const { id, nombre } = btn.dataset;
        agregarAlCarrito({ id, nombre });
      });
    });

    if (window.lucide) lucide.createIcons();

  } catch (err) {
    menuContenedor.innerHTML = `
      <p style="text-align:center;color:var(--chile);">
        No se pudo cargar el menú. Intenta recargar la página.
      </p>`;
    console.error(err);
  }
}

function productoCardHTML(p) {
  if (!p.disponible) {
    return `
      <div class="card-producto no-disponible">
        <div class="nombre">${p.nombre}</div>
        <div class="desc">${p.descripcion || ""}</div>
        <span class="badge-agotado">Agotado</span>
      </div>
    `;
  }

  return `
    <div class="card-producto">
      <div class="nombre">${p.nombre}</div>
      <div class="desc">${p.descripcion || ""}</div>
      <button
        class="btn-agregar"
        data-id="${p.id}"
        data-nombre="${p.nombre}">
        <i data-lucide="plus" class="icon"></i>
      </button>
    </div>
  `;
}

// ---------- Carrito ----------
function agregarAlCarrito(producto) {
  const existente = carrito.find((i) => i.id === producto.id);

  if (existente) {
    existente.cantidad++;
  } else {
    carrito.push({
      ...producto,
      cantidad: 1,
    });
  }

  renderCarrito();
}

function cambiarCantidad(id, delta) {
  const item = carrito.find((i) => i.id === id);

  if (!item) return;

  item.cantidad += delta;

  if (item.cantidad <= 0) {
    carrito = carrito.filter((i) => i.id !== id);
  }

  renderCarrito();
}

function renderCarrito() {

  // Actualizar contador del carrito
  const totalItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);

  if (badgeCarrito) {
    badgeCarrito.textContent = totalItems;
  }

  // Mostrar productos
  if (carrito.length === 0) {

    if (ticketItems) {
      ticketItems.innerHTML = `
        <p class="ticket-vacio">
          <i data-lucide="shopping-cart" class="icon"></i>
          Aún no agregas nada
        </p>`;
    }

  } else {

    if (ticketItems) {
      ticketItems.innerHTML = carrito.map(item => `
        <div class="linea-item">

          <span class="nombre-item">
            ${item.nombre}
          </span>

          <div class="cantidad-controles">
            <button onclick="cambiarCantidad('${item.id}',-1)">−</button>

            <span>${item.cantidad}</span>

            <button onclick="cambiarCantidad('${item.id}',1)">+</button>
          </div>

        </div>
      `).join("");
    }

  }

  if (window.lucide) {
    lucide.createIcons();
  }
}

// ---------- Abrir / cerrar carrito ----------
function abrirTicket() {
  ticket.classList.add("abierto");
  overlay.classList.add("abierto");
}

function cerrarTicket() {
  ticket.classList.remove("abierto");
  overlay.classList.remove("abierto");
}

document.getElementById("btn-abrir-carrito").addEventListener("click", abrirTicket);
document.getElementById("btn-cerrar-ticket").addEventListener("click", cerrarTicket);
overlay.addEventListener("click", cerrarTicket);

// ---------- Confirmar pedido ----------
document.getElementById("btn-confirmar").addEventListener("click", async () => {

  mensajeError.style.display = "none";

  if (carrito.length === 0) {
    mostrarError("Agrega al menos un producto a tu pedido.");
    return;
  }

  if (!inputNombre.value.trim()) {
    mostrarError("Escribe tu nombre para continuar.");
    return;
  }

  if (!inputFormaPago.value) {
    mostrarError("Selecciona una forma de pago.");
    return;
  }

  const payload = {
    cliente_nombre: inputNombre.value.trim(),
    cliente_telefono: inputTelefono.value.trim(),
    forma_pago: inputFormaPago.value,
    notas: inputNotas.value.trim(),
    items: carrito.map((i) => ({
      id: i.id,
      nombre: i.nombre,
      cantidad: i.cantidad
    }))
  };

  try {

    const res = await fetch("/api/pedidos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok) {
      mostrarError(data.error || "No se pudo enviar el pedido.");
      return;
    }

    document.getElementById("link-whatsapp").href = data.whatsapp_link;
    document.getElementById("pantalla-confirmacion").classList.add("abierta");

    carrito = [];
    renderCarrito();

    inputNombre.value = "";
    inputTelefono.value = "";
    inputFormaPago.value = "";
    inputNotas.value = "";

    cerrarTicket();

  } catch (err) {
    console.error(err);
    mostrarError("Error de conexión. Intenta nuevamente.");
  }

});

function mostrarError(msg) {
  mensajeError.textContent = msg;
  mensajeError.style.display = "block";
}

document.getElementById("btn-cerrar-confirmacion").addEventListener("click", () => {
  document.getElementById("pantalla-confirmacion").classList.remove("abierta");
});

// ---------- Inicialización ----------
cargarMenu();

if (window.lucide) {
  lucide.createIcons();
}

setInterval(cargarMenu, 10000);

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    cargarMenu();
  }
});