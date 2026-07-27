let ultimoMenuJSON = null;

// ---------- Estado ----------
let carrito = []; // [{id, nombre, cantidad, variantes}]
let productoSeleccionado = null; // Producto actual para seleccionar variantes
let productosPorId = {}; // Catálogo completo, para poder reabrir opciones al editar
let itemEnEdicion = null; // {id, variantesJSON, cantidad} cuando el cliente está editando un producto ya agregado

const menuContenedor = document.getElementById("menu-contenedor");
const ticket = document.getElementById("ticket");
const overlay = document.getElementById("overlay");
const ticketItems = document.getElementById("ticket-items");
const badgeCarrito = document.getElementById("badge-carrito");
const mensajeError = document.getElementById("mensaje-error");
const modalVariantes = document.getElementById("modal-variantes");
const variantesTitulo = document.getElementById("variantes-titulo");
const variantesOpciones = document.getElementById("variantes-opciones");

const inputNombre = document.getElementById("input-nombre");
const inputTelefono = document.getElementById("input-telefono");
const inputFormaPago = document.getElementById("input-forma-pago");

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
    productosPorId = {};

    // Se unen todos los productos de todas las categorías en una sola lista,
    // para que se acomoden en una única cuadrícula continua (sin cortes por
    // categoría que dejen espacios en blanco). Cada tarjeta muestra su
    // categoría como una pequeña etiqueta.
    const todosProductos = [];
    for (const categoria in data) {
      data[categoria].forEach(p => {
        productosPorId[p.id] = p;
        todosProductos.push(p);
      });
    }

    menuContenedor.innerHTML = `
      <div class="grid-productos">
        ${todosProductos.map(productoCardHTML).join("")}
      </div>
    `;

    document.querySelectorAll(".btn-agregar").forEach((btn) => {
      btn.addEventListener("click", () => {
        const { id, nombre } = btn.dataset;
        const producto = productosPorId[id];
        if (producto && producto.variantes && Object.keys(producto.variantes).length > 0) {
          abrirModalVariantes(producto);
        } else {
          agregarAlCarrito({ id, nombre });
        }
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
  const imagenHTML = p.imagen_url
    ? `<img class="card-producto-imagen" src="${p.imagen_url}" alt="${p.nombre}" loading="lazy" onerror="this.remove()">`
    : "";

  if (!p.disponible) {
    return `
      <div class="card-producto no-disponible">
        ${imagenHTML}
        <div class="card-producto-body">
          <span class="card-categoria-badge">${p.categoria}</span>
          <div class="nombre">${p.nombre}</div>
          <div class="desc">${p.descripcion || ""}</div>
          <span class="badge-agotado">Agotado</span>
        </div>
      </div>
    `;
  }

  return `
    <div class="card-producto">
      ${imagenHTML}
      <div class="card-producto-body">
        <span class="card-categoria-badge">${p.categoria}</span>
        <div class="nombre">${p.nombre}</div>
        <div class="desc">${p.descripcion || ""}</div>
        <button
          class="btn-agregar"
          data-id="${p.id}"
          data-nombre="${p.nombre}"
          data-categoria="${p.categoria}">
          <i data-lucide="plus" class="icon"></i>
        </button>
      </div>
    </div>
  `;
}

// ---------- Carrito ----------
function agregarAlCarrito(producto) {
  const existente = carrito.find((i) => String(i.id) === String(producto.id) && JSON.stringify(i.variantes) === JSON.stringify(producto.variantes));

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

function cambiarCantidad(id, delta, variantesEncoded = "") {
  const variantes = variantesEncoded ? JSON.parse(decodeURIComponent(variantesEncoded)) : {};
  const item = carrito.find((i) => String(i.id) === String(id) && JSON.stringify(i.variantes) === JSON.stringify(variantes));

  if (!item) return;

  item.cantidad += delta;

  if (item.cantidad <= 0) {
    carrito = carrito.filter((i) => String(i.id) !== String(id) || JSON.stringify(i.variantes) !== JSON.stringify(variantes));
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
      ticketItems.innerHTML = carrito.map(item => {
        let variantesTexto = "";
        if (item.variantes && Object.keys(item.variantes).length > 0) {
          variantesTexto = "<div class=\"item-variantes\">" +
            Object.entries(item.variantes).map(([k, v]) => `<span>${k}: ${v}</span>`).join(" · ") +
            "</div>";
        }
        const variantesEncoded = encodeURIComponent(JSON.stringify(item.variantes || {}));
        const tieneVariantes = item.variantes && Object.keys(item.variantes).length > 0;
        const btnEditar = tieneVariantes
          ? `<button class="btn-editar-item" onclick="editarItemDelCarrito('${item.id}','${variantesEncoded}')"><i data-lucide="pencil" class="icon"></i> Editar</button>`
          : "";
        return `
        <div class="linea-item">

          <span class="nombre-item">
            ${item.nombre}
          </span>
          ${variantesTexto}
          ${btnEditar}

          <div class="cantidad-controles">
            <button onclick="cambiarCantidad('${item.id}',-1,'${variantesEncoded}')">−</button>

            <span>${item.cantidad}</span>

            <button onclick="cambiarCantidad('${item.id}',1,'${variantesEncoded}')">+</button>
          </div>

        </div>
      `;
      }).join("");
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

// ---------- Modal de variantes ----------
function abrirModalVariantes(producto, seleccionActual = {}) {
  productoSeleccionado = producto;
  variantesTitulo.textContent = itemEnEdicion ? `Editar: ${producto.nombre}` : producto.nombre;
  variantesOpciones.innerHTML = "";

  for (const [grupoNombre, opciones] of Object.entries(producto.variantes)) {
    const grupoDiv = document.createElement("div");
    grupoDiv.className = "variante-grupo-cliente";
    grupoDiv.innerHTML = `<label>${grupoNombre}</label>`;

    const opcionesDiv = document.createElement("div");
    opcionesDiv.className = "opciones-radio";

    const valorActual = seleccionActual[grupoNombre];

    opciones.forEach((opcion, index) => {
      const radioId = `variante-${grupoNombre}-${index}`;
      const marcada = valorActual ? opcion === valorActual : index === 0;
      const label = document.createElement("label");
      if (marcada) label.classList.add("seleccionada");
      label.innerHTML = `
        <input type="radio" name="${grupoNombre}" value="${opcion}" id="${radioId}" ${marcada ? "checked" : ""}>
        ${opcion}
      `;
      label.addEventListener("click", () => {
        opcionesDiv.querySelectorAll("label").forEach(l => l.classList.remove("seleccionada"));
        label.classList.add("seleccionada");
      });
      opcionesDiv.appendChild(label);
    });

    grupoDiv.appendChild(opcionesDiv);
    variantesOpciones.appendChild(grupoDiv);
  }

  document.getElementById("btn-confirmar-variantes").textContent = itemEnEdicion ? "Guardar cambios" : "Agregar al pedido";

  modalVariantes.classList.add("abierto");
  overlay.classList.add("abierto");
}

// Reabre el modal de opciones para un producto que ya está en el carrito, con su selección actual marcada
function editarItemDelCarrito(id, variantesEncoded) {
  const variantesActuales = JSON.parse(decodeURIComponent(variantesEncoded));
  const item = carrito.find((i) => String(i.id) === String(id) && JSON.stringify(i.variantes) === JSON.stringify(variantesActuales));
  const producto = productosPorId[id];

  if (!item || !producto || !producto.variantes) return;

  itemEnEdicion = { id, variantesJSON: JSON.stringify(variantesActuales), cantidad: item.cantidad };
  cerrarTicket();
  abrirModalVariantes(producto, variantesActuales);
}

function cerrarModalVariantes() {
  modalVariantes.classList.remove("abierto");
  overlay.classList.remove("abierto");
  productoSeleccionado = null;
  if (itemEnEdicion) {
    itemEnEdicion = null;
    abrirTicket();
  }
}

document.getElementById("btn-cerrar-variantes").addEventListener("click", cerrarModalVariantes);
document.getElementById("btn-cancelar-variantes").addEventListener("click", cerrarModalVariantes);

document.getElementById("btn-confirmar-variantes").addEventListener("click", () => {
  if (!productoSeleccionado) return;

  const variantesSeleccionadas = {};
  for (const grupoNombre of Object.keys(productoSeleccionado.variantes)) {
    const seleccionado = document.querySelector(`input[name="${grupoNombre}"]:checked`);
    if (seleccionado) {
      variantesSeleccionadas[grupoNombre] = seleccionado.value;
    }
  }

  if (itemEnEdicion) {
    // Quitamos la versión anterior del producto y ponemos la nueva selección con la misma cantidad
    carrito = carrito.filter((i) => !(String(i.id) === String(itemEnEdicion.id) && JSON.stringify(i.variantes) === itemEnEdicion.variantesJSON));

    const yaExiste = carrito.find((i) => String(i.id) === String(itemEnEdicion.id) && JSON.stringify(i.variantes) === JSON.stringify(variantesSeleccionadas));
    if (yaExiste) {
      yaExiste.cantidad += itemEnEdicion.cantidad;
    } else {
      carrito.push({
        id: itemEnEdicion.id,
        nombre: productoSeleccionado.nombre,
        variantes: variantesSeleccionadas,
        cantidad: itemEnEdicion.cantidad,
      });
    }

    itemEnEdicion = null;
    renderCarrito();
    cerrarModalVariantes();
    abrirTicket();
  } else {
    agregarAlCarrito({
      id: productoSeleccionado.id,
      nombre: productoSeleccionado.nombre,
      variantes: variantesSeleccionadas,
    });
    cerrarModalVariantes();
  }
});

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
    items: carrito.map((i) => ({
      id: i.id,
      nombre: i.nombre,
      cantidad: i.cantidad,
      variantes: i.variantes || {}
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