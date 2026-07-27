// ---------- Estado ----------
let productos = [];

const listaProductos = document.getElementById("lista-productos");
const modalProducto = document.getElementById("modal-producto");
const overlayModal = document.getElementById("overlay-modal");
const formProducto = document.getElementById("form-producto");
const modalTitulo = document.getElementById("modal-titulo");

// ---------- Cargar productos ----------
async function cargarProductos() {
  try {
    const res = await fetch("/api/admin/productos");
    productos = await res.json();
    renderProductos();
  } catch (err) {
    listaProductos.innerHTML = `<p class="sin-productos" style="color: var(--chile);">Error al cargar productos</p>`;
    console.error(err);
  }
}

function renderProductos() {
  if (productos.length === 0) {
    listaProductos.innerHTML = `<p class="sin-productos">No hay productos. Crea el primero.</p>`;
    return;
  }

  // Agrupar por categoría
  const agrupados = {};
  productos.forEach(p => {
    if (!agrupados[p.categoria]) {
      agrupados[p.categoria] = [];
    }
    agrupados[p.categoria].push(p);
  });

  let html = "";
  for (const categoria in agrupados) {
    html += `<div class="categoria-seccion">
      <h2>${categoria}</h2>
      <div class="grid-productos-admin">
        ${agrupados[categoria].map(productoCardHTML).join("")}
      </div>
    </div>`;
  }

  listaProductos.innerHTML = html;

  // Agregar event listeners
  document.querySelectorAll(".btn-editar").forEach(btn => {
    btn.addEventListener("click", () => editarProducto(parseInt(btn.dataset.id)));
  });

  document.querySelectorAll(".btn-eliminar").forEach(btn => {
    btn.addEventListener("click", () => eliminarProducto(parseInt(btn.dataset.id)));
  });

  if (window.lucide) lucide.createIcons();
}

function productoCardHTML(p) {
  const estadoClass = p.disponible ? "disponible" : "agotado";
  const estadoTexto = p.disponible ? "Disponible" : "Agotado";
  const inventarioTexto = p.inventario_categoria > 0 ? `${p.inventario_categoria} unidades` : "Sin stock";

  return `
    <div class="card-producto-admin">
      <div class="card-header">
        <span class="nombre">${p.nombre}</span>
        <span class="badge ${estadoClass}">${estadoTexto}</span>
      </div>
      <div class="card-body">
        <div class="info-row">
          <span class="label">Categoría:</span>
          <span class="valor">${p.categoria}</span>
        </div>
        <div class="info-row">
          <span class="label">Inventario (${p.categoria}):</span>
          <span class="valor">${inventarioTexto}</span>
        </div>
        ${p.descripcion ? `<div class="desc">${p.descripcion}</div>` : ""}
        ${p.variantes && Object.keys(p.variantes).length > 0 ? `
          <div class="variantes-preview">
            ${Object.entries(p.variantes).map(([grupo, opciones]) =>
              `<span class="chip-variante"><strong>${grupo}:</strong> ${opciones.join(", ")}</span>`
            ).join("")}
          </div>` : `<div class="sin-variantes">Sin opciones de selección — el cliente solo agrega el producto tal cual.</div>`}
      </div>
      <div class="card-footer">
        <button class="btn-editar" data-id="${p.id}">
          <i data-lucide="edit-2" class="icon"></i> Editar
        </button>
        <button class="btn-eliminar" data-id="${p.id}">
          <i data-lucide="trash-2" class="icon"></i> Eliminar
        </button>
      </div>
    </div>
  `;
}

// ---------- Modal ----------
function abrirModal(titulo = "Nuevo Producto") {
  modalTitulo.textContent = titulo;
  modalProducto.classList.add("abierto");
  overlayModal.classList.add("abierto");
}

function cerrarModal() {
  modalProducto.classList.remove("abierto");
  overlayModal.classList.remove("abierto");
  formProducto.reset();
  document.getElementById("producto-id").value = "";
  document.getElementById("producto-disponible").checked = true;
  document.getElementById("producto-inventario-categoria").value = "0";
  document.getElementById("producto-orden").value = "0";
  
  // Reset variantes
  const variantesContainer = document.getElementById("variantes-container");
  variantesContainer.innerHTML = "";
  agregarGrupoVariante();
}

document.getElementById("btn-nuevo-producto").addEventListener("click", () => {
  // Reset variantes
  const variantesContainer = document.getElementById("variantes-container");
  variantesContainer.innerHTML = "";
  agregarGrupoVariante();
  abrirModal("Nuevo Producto");
});

// ---------- Gestión de variantes ----------
function agregarGrupoVariante(nombre = "", opciones = "") {
  const container = document.getElementById("variantes-container");
  const div = document.createElement("div");
  div.className = "variante-grupo";
  div.innerHTML = `
    <div class="variante-campo">
      <span class="campo-mini-label">Nombre del grupo</span>
      <input type="text" class="variante-nombre" placeholder="Ej. Sabor, Salsa, Topping" value="${nombre}">
    </div>
    <div class="variante-campo">
      <span class="campo-mini-label">Opciones (separadas por coma)</span>
      <input type="text" class="variante-opciones" placeholder="Ej. Picosas, BBQ, Mango" value="${opciones}">
    </div>
    <button type="button" class="btn-eliminar-variante" title="Eliminar este grupo" onclick="eliminarVariante(this)"><i data-lucide="trash-2" class="icon"></i></button>
  `;
  container.appendChild(div);
  if (window.lucide) lucide.createIcons();
}

function eliminarVariante(btn) {
  const container = document.getElementById("variantes-container");
  if (container.children.length > 1) {
    btn.parentElement.remove();
  }
}

document.getElementById("btn-agregar-variante").addEventListener("click", () => {
  agregarGrupoVariante();
});

document.getElementById("btn-cerrar-modal").addEventListener("click", cerrarModal);
document.getElementById("btn-cancelar").addEventListener("click", cerrarModal);
overlayModal.addEventListener("click", cerrarModal);

// ---------- Crear/Editar producto ----------
formProducto.addEventListener("submit", async (e) => {
  e.preventDefault();

  const id = document.getElementById("producto-id").value;
  // Recopilar variantes
  const variantes = {};
  document.querySelectorAll(".variante-grupo").forEach(grupo => {
    const nombre = grupo.querySelector(".variante-nombre").value.trim();
    const opcionesStr = grupo.querySelector(".variante-opciones").value.trim();
    if (nombre && opcionesStr) {
      variantes[nombre] = opcionesStr.split(",").map(o => o.trim()).filter(o => o);
    }
  });

  const payload = {
    nombre: document.getElementById("producto-nombre").value.trim(),
    categoria: document.getElementById("producto-categoria").value.trim(),
    inventario_categoria: parseInt(document.getElementById("producto-inventario-categoria").value),
    orden: parseInt(document.getElementById("producto-orden").value),
    descripcion: document.getElementById("producto-descripcion").value.trim() || null,
    imagen_url: document.getElementById("producto-imagen").value.trim() || null,
    disponible: document.getElementById("producto-disponible").checked,
    variantes: Object.keys(variantes).length > 0 ? variantes : null,
  };

  try {
    let res;
    if (id) {
      // Editar
      res = await fetch(`/api/admin/productos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      // Crear
      res = await fetch("/api/admin/productos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Error al guardar el producto");
      return;
    }

    cerrarModal();
    cargarProductos();
  } catch (err) {
    alert("Error de conexión");
    console.error(err);
  }
});

function editarProducto(id) {
  const producto = productos.find(p => p.id === id);
  if (!producto) return;

  document.getElementById("producto-id").value = producto.id;
  document.getElementById("producto-nombre").value = producto.nombre;
  document.getElementById("producto-categoria").value = producto.categoria;
  document.getElementById("producto-inventario-categoria").value = producto.inventario_categoria || 0;
  document.getElementById("producto-orden").value = producto.orden;
  document.getElementById("producto-descripcion").value = producto.descripcion || "";
  document.getElementById("producto-imagen").value = producto.imagen_url || "";
  document.getElementById("producto-disponible").checked = producto.disponible;

  // Cargar variantes
  const variantesContainer = document.getElementById("variantes-container");
  variantesContainer.innerHTML = "";
  if (producto.variantes && Object.keys(producto.variantes).length > 0) {
    for (const [nombre, opciones] of Object.entries(producto.variantes)) {
      agregarGrupoVariante(nombre, opciones.join(", "));
    }
  } else {
    agregarGrupoVariante();
  }

  abrirModal("Editar Producto");
}

async function eliminarProducto(id) {
  if (!confirm("¿Estás seguro de eliminar este producto?")) return;

  try {
    const res = await fetch(`/api/admin/productos/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      alert("Error al eliminar el producto");
      return;
    }

    cargarProductos();
  } catch (err) {
    alert("Error de conexión");
    console.error(err);
  }
}

// ---------- Inicializar ----------
cargarProductos();
if (window.lucide) lucide.createIcons();
