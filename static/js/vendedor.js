const listaPedidos = document.getElementById("lista-pedidos");
const filtrosEl = document.getElementById("filtros");

const ESTADOS = [
  { valor: "", label: "Todos" },
  { valor: "pendiente", label: "Pendientes" },
  { valor: "en_preparacion", label: "En preparación" },
  { valor: "listo", label: "Listos" },
  { valor: "entregado", label: "Entregados" },
];

const ETIQUETAS_ESTADO = {
  pendiente: "Pendiente",
  en_preparacion: "En preparación",
  listo: "Listo para recoger",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

let filtroActual = "";

function renderFiltros() {
  filtrosEl.innerHTML = ESTADOS.map(
    (e) => `
    <button class="filtro-btn ${e.valor === filtroActual ? "activo" : ""}" data-valor="${e.valor}">
      ${e.label}
    </button>`
  ).join("");

  filtrosEl.querySelectorAll(".filtro-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      filtroActual = btn.dataset.valor;
      renderFiltros();
      cargarPedidos();
    });
  });
}

async function cargarPedidos() {
  const url = filtroActual ? `/api/pedidos?estado=${filtroActual}` : "/api/pedidos";
  try {
    const res = await fetch(url);
    const pedidos = await res.json();

    if (pedidos.length === 0) {
      listaPedidos.innerHTML = `<p class="sin-pedidos"><i data-lucide="clipboard-list" class="icon icon-lg"></i><br>No hay pedidos por aquí todavía</p>`;
      if (window.lucide) lucide.createIcons();
      return;
    }

    listaPedidos.innerHTML = pedidos.map(pedidoCardHTML).join("");
    if (window.lucide) lucide.createIcons();

    listaPedidos.querySelectorAll(".btn-mini.guardar").forEach((btn) => {
      btn.addEventListener("click", () => guardarCambios(btn.dataset.id));
    });
    listaPedidos.querySelectorAll(".btn-mini.avisar").forEach((btn) => {
      btn.addEventListener("click", () => avisarCliente(btn.dataset.id));
    });
  } catch (err) {
    listaPedidos.innerHTML = `<p class="sin-pedidos">Error al cargar pedidos.</p>`;
    console.error(err);
  }
}

function pedidoCardHTML(p) {
  const itemsHTML = p.items
    .map((i) => {
      let variantesTexto = "";
      if (i.variantes && Object.keys(i.variantes).length > 0) {
        variantesTexto = " <small>(" + Object.entries(i.variantes).map(([k, v]) => `${k}: ${v}`).join(", ") + ")</small>";
      }
      return `<div>${i.cantidad}x ${i.nombre}${variantesTexto}</div>`;
    })
    .join("");

  return `
    <div class="pedido-card" data-pedido='${JSON.stringify(p).replace(/'/g, "&apos;")}'>
      <div class="top">
        <div>
          <div class="id-pedido">Pedido #${p.id} · ${new Date(p.creado_en).toLocaleString()}</div>
          <div class="cliente">${p.cliente_nombre} ${p.cliente_telefono ? `· <i data-lucide="phone" class="icon"></i> ${p.cliente_telefono}` : ""}</div>
        </div>
        <span class="estado-pill estado-${p.estado}">${ETIQUETAS_ESTADO[p.estado] || p.estado}</span>
      </div>

      <div class="items-lista">${itemsHTML}</div>
      ${p.notas ? `<div class="notas"><i data-lucide="sticky-note" class="icon"></i> ${p.notas}</div>` : ""}

      <div class="controles-pedido">
        <input type="text" placeholder="Tiempo (ej. 20 minutos)" value="${p.tiempo_estimado || ""}" id="tiempo-${p.id}">
        <select id="estado-${p.id}">
          ${Object.entries(ETIQUETAS_ESTADO)
            .map(([val, label]) => `<option value="${val}" ${val === p.estado ? "selected" : ""}>${label}</option>`)
            .join("")}
        </select>
        <button class="btn-mini guardar" data-id="${p.id}">Guardar</button>
        ${p.cliente_telefono ? `<button class="btn-mini avisar" data-id="${p.id}"><i data-lucide="message-circle" class="icon"></i> Avisar por WhatsApp</button>` : ""}
      </div>
    </div>
  `;
}

async function guardarCambios(id) {
  const tiempo = document.getElementById(`tiempo-${id}`).value.trim();
  const estado = document.getElementById(`estado-${id}`).value;

  try {
    const res = await fetch(`/api/pedidos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tiempo_estimado: tiempo, estado }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "No se pudo actualizar el pedido.");
      return;
    }
    cargarPedidos();
  } catch (err) {
    alert("Error de conexión al guardar.");
    console.error(err);
  }
}

async function avisarCliente(id) {
  // Primero guarda el tiempo/estado actual, luego abre WhatsApp con el link generado por el servidor.
  const tiempo = document.getElementById(`tiempo-${id}`).value.trim();
  const estado = document.getElementById(`estado-${id}`).value;

  try {
    const res = await fetch(`/api/pedidos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tiempo_estimado: tiempo, estado }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "No se pudo actualizar el pedido.");
      return;
    }
    if (data.whatsapp_link_cliente) {
      window.open(data.whatsapp_link_cliente, "_blank");
    } else {
      alert("Este cliente no dejó un número de WhatsApp.");
    }
    cargarPedidos();
  } catch (err) {
    alert("Error de conexión.");
    console.error(err);
  }
}

renderFiltros();
cargarPedidos();
setInterval(cargarPedidos, 15000); // auto-refresh cada 15s