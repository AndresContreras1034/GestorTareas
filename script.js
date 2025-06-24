// 📌 Referencias del DOM
const form = document.getElementById("form-tarea");
const listaTareas = document.getElementById("lista-tareas");
const totalEl = document.getElementById("total-tareas");
const hechasEl = document.getElementById("tareas-hechas");
const pendientesEl = document.getElementById("tareas-pendientes");
const buscador = document.getElementById("buscador");
const filtroPrioridad = document.getElementById("filtro-prioridad");
const filtroEstado = document.getElementById("filtro-estado");
const toggleTema = document.getElementById("toggle-tema");
const graficoCanvas = document.getElementById("graficoProgreso");

// 📊 Datos
let tareas = JSON.parse(localStorage.getItem("tareas")) || [];
let grafico = null;

// 🧩 Utilidad para crear elementos
function crearElemento(tag, clase, contenido) {
  const el = document.createElement(tag);
  if (clase) el.className = clase;
  if (contenido) el.innerText = contenido;
  return el;
}

// 🆕 Crear nueva tarea
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const titulo = document.getElementById("titulo").value.trim();
  const descripcion = document.getElementById("descripcion").value.trim();
  const fecha = document.getElementById("fecha").value;
  const prioridad = document.getElementById("prioridad").value;
  const categoria = document.getElementById("categoria").value.trim();

  if (!titulo) return alert("Debes escribir un título para la tarea.");

  const nueva = {
    id: Date.now(),
    titulo,
    descripcion,
    fecha,
    prioridad,
    categoria,
    completada: false
  };

  tareas.push(nueva);
  guardarYActualizar();
  form.reset();
});

// 🖥 Renderizar tareas
function renderTareas() {
  listaTareas.innerHTML = "";

  const filtradas = tareas.filter(({ titulo, descripcion, prioridad, completada }) => {
    const matchBusqueda =
      titulo.toLowerCase().includes(buscador.value.toLowerCase()) ||
      descripcion.toLowerCase().includes(buscador.value.toLowerCase());

    const matchPrioridad = !filtroPrioridad.value || prioridad === filtroPrioridad.value;
    const matchEstado =
      !filtroEstado.value ||
      (filtroEstado.value === "completada" && completada) ||
      (filtroEstado.value === "pendiente" && !completada);

    return matchBusqueda && matchPrioridad && matchEstado;
  });

  if (filtradas.length === 0) {
    const li = crearElemento("li", "tarea-vacia", "No se encontraron tareas.");
    listaTareas.appendChild(li);
    return;
  }

  filtradas.forEach(t => {
    const li = crearElemento("li", "tarea");
    if (t.completada) li.classList.add("tarea-hecha");

    const info = crearElemento("div", "tarea-info");
    const titulo = crearElemento("div", "tarea-titulo", t.titulo);
    const desc = crearElemento("small", null, t.descripcion);
    const meta = crearElemento("small", null, `${t.fecha || "Sin fecha"} - ${t.categoria || "Sin categoría"}`);

    if (t.prioridad) titulo.classList.add(`tarea-prioridad-${t.prioridad}`);

    info.append(titulo, desc, meta);

    const controles = crearElemento("div", "tarea-controles");

    const btnCompletar = document.createElement("button");
    btnCompletar.innerHTML = `<img src="assets/icons/check.svg" alt="Hecho" />`;
    btnCompletar.title = "Marcar como hecha";
    btnCompletar.setAttribute("aria-label", "Marcar como hecha");
    btnCompletar.onclick = () => toggleCompletada(t.id);

    const btnEliminar = document.createElement("button");
    btnEliminar.innerHTML = `<img src="assets/icons/delete.svg" alt="Eliminar" />`;
    btnEliminar.title = "Eliminar";
    btnEliminar.setAttribute("aria-label", "Eliminar tarea");
    btnEliminar.onclick = () => eliminarTarea(t.id);

    controles.append(btnCompletar, btnEliminar);
    li.append(info, controles);
    listaTareas.appendChild(li);
  });
}

// 🔄 Alternar tarea como completada
function toggleCompletada(id) {
  tareas = tareas.map(t =>
    t.id === id ? { ...t, completada: !t.completada } : t
  );
  guardarYActualizar();
}

// 🗑 Eliminar tarea
function eliminarTarea(id) {
  if (confirm("¿Estás seguro de eliminar esta tarea?")) {
    tareas = tareas.filter(t => t.id !== id);
    guardarYActualizar();
  }
}

// 💾 Guardar en localStorage y actualizar interfaz
function guardarYActualizar() {
  localStorage.setItem("tareas", JSON.stringify(tareas));
  renderTareas();
  actualizarEstadisticas();
  renderGrafico();
}

// 📈 Actualizar estadísticas
function actualizarEstadisticas() {
  const total = tareas.length;
  const hechas = tareas.filter(t => t.completada).length;
  const pendientes = total - hechas;

  totalEl.textContent = total;
  hechasEl.textContent = hechas;
  pendientesEl.textContent = pendientes;
}

// 📊 Renderizar gráfico
function renderGrafico() {
  const hechas = tareas.filter(t => t.completada).length;
  const pendientes = tareas.length - hechas;

  if (grafico) grafico.destroy();

  grafico = new Chart(graficoCanvas, {
    type: 'doughnut',
    data: {
      labels: ['Completadas', 'Pendientes'],
      datasets: [{
        data: [hechas, pendientes],
        backgroundColor: ['#2ecc71', '#e74c3c'],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            boxWidth: 15,
            padding: 15
          }
        },
        tooltip: {
          callbacks: {
            label: (context) => `${context.label}: ${context.parsed}`
          }
        }
      },
      animation: {
        animateScale: true
      }
    }
  });
}

// 🔍 Filtros y búsqueda
[buscador, filtroPrioridad, filtroEstado].forEach(el =>
  el.addEventListener("input", renderTareas)
);

// 🌗 Cambio de tema claro / oscuro
toggleTema.addEventListener("click", () => {
  const actualHref = document.getElementById("tema-actual").getAttribute("href");
  const nuevoTema = actualHref.includes("light") ? "dark" : "light";
  cambiarTema(nuevoTema);
});

function cambiarTema(modo) {
  const link = document.getElementById("tema-actual");
  link.href = `assets/themes/${modo}.css`;
  localStorage.setItem("tema", modo);

  const icono = modo === "dark" ? "sun.svg" : "moon.svg";
  toggleTema.querySelector("img").src = `assets/icons/${icono}`;
}

// 🚀 Inicializar app
window.addEventListener("DOMContentLoaded", () => {
  const temaGuardado = localStorage.getItem("tema") || "light";
  cambiarTema(temaGuardado);
  guardarYActualizar();
});
