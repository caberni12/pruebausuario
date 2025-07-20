
const URL_GET = 'https://script.google.com/macros/s/AKfycbyF3Sm6EdMFACjlT1d_pOJl1AL6UiBzUzSXkdTPt26wRMNuJQ75Sz1Eny-oskfl7KlcbQ/exec';
const URL_POST = 'https://script.google.com/macros/s/AKfycbzUt7MvtE7XvuWL7p4VUilHQg3zoFwwrcGZgqJ7I71XfkxiR98ohLYPVuVWwJKv_bYjew/exec';

const form = document.getElementById("formulario");
const tabla = document.querySelector("#tabla tbody");

form.addEventListener("submit", e => {
  e.preventDefault();
  const datos = {
    accion: form.fila.value ? "modificar" : "guardar",
    fila: form.fila.value,
    nombre: form.nombre.value,
    email: form.email.value,
    telefono: form.telefono.value,
    mensaje: form.mensaje.value,
    status: form.status.value,
  };

  fetch(URL_POST, {
    method: "POST",
    body: JSON.stringify(datos),
  })
    .then(r => r.json())
    .then(res => {
      alert(res.resultado === "ok" ? "Registro guardado" : "Error al guardar");
      form.reset();
      obtenerDatos();
    })
    .catch(err => {
      console.error("Error al guardar:", err);
      alert("Error al guardar.");
    });
});

function cancelarEdicion() {
  form.reset();
}

function obtenerDatos() {
  fetch(URL_GET)
    .then(r => r.json())
    .then(data => {
      tabla.innerHTML = "";
      data.forEach((item, i) => {
        const fila = i + 2;
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${formatearFechaHora(item["fecha y hora"]) || ""}</td>
<td>${item.nombre || ""}</td>
<td>${item.email || ""}</td>
<td>${item.telefono || ""}</td>
<td>${item.mensaje || ""}</td>
<td>${item.status || ""}</td>


            <button onclick='editar(${JSON.stringify(item)}, ${fila})'>✏️</button>
            <button onclick='eliminar(${fila})'>🗑️</button>
          </td>
        `;
        tabla.appendChild(tr);
      });
    })
    .catch(err => {
      console.error("Error al obtener datos:", err);
      alert("Error al cargar los datos.");
    });

    


  }


function editar(item, fila) {
  form.fila.value = fila;
  form.nombre.value = item.nombre;
  form.email.value = item.email;
  form.telefono.value = item.telefono;
  form.mensaje.value = item.mensaje;
  form.status.value = item.status;
}

function eliminar(fila) {
  if (!confirm("¿Eliminar este registro?")) return;
  fetch(URL_POST, {
    method: "POST",
    body: JSON.stringify({ accion: "eliminar", id: fila }),
  })
    .then(r => r.json())
    .then(res => {
      if (res.resultado === "ok") {
        alert("Registro eliminado");
        obtenerDatos();
      } else {
        alert("Error al eliminar: " + res.mensaje);
      }
    })
    .catch(err => {
      console.error("Error al eliminar:", err);
      alert("Error al eliminar.");
    });
}

// Inicial
obtenerDatos();

function generarPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "landscape" });

  doc.setFontSize(12);
  doc.text("Reporte de Clientes - RapidFlex", 14, 15);

  let y = 30;
  doc.setFontSize(10);

  const cols = {
    fecha: 10,
    nombre: 60,
    email: 120,
    telefono: 180,
    status: 240
  };

  // Encabezados
  doc.setFont("helvetica", "bold");
  doc.text("Fecha", cols.fecha, y);
  doc.text("Nombre", cols.nombre, y);
  doc.text("Email", cols.email, y);
  doc.text("Teléfono", cols.telefono, y);
  doc.text("Status", cols.status, y);
  y += 10;

  doc.setFont("helvetica", "normal");

  // Solo filas visibles (filtradas)
  document.querySelectorAll("#tabla tbody tr").forEach(row => {
    if (row.style.display === "none") return;  // saltar filas ocultas

    const celdas = row.querySelectorAll("td");

    if (celdas.length >= 6) {
      const fechaRaw = celdas[0].innerText.trim();
      const fechaObj = new Date(fechaRaw);
      const fechaFormateada = isNaN(fechaObj)
        ? fechaRaw
        : `${String(fechaObj.getDate()).padStart(2, '0')}/${String(fechaObj.getMonth() + 1).padStart(2, '0')}/${fechaObj.getFullYear()}`;

      const datos = [
        fechaFormateada,
        celdas[1].innerText.trim(),
        celdas[2].innerText.trim(),
        celdas[3].innerText.trim(),
        celdas[5].innerText.trim()
      ];

      const maxWidths = {
        fecha: 45,
        nombre: 55,
        email: 55,
        telefono: 50,
        status: 45
      };

      const alturas = datos.map((dato, i) => {
        const key = Object.keys(cols)[i];
        const maxWidth = maxWidths[key] || 50;
        const lines = doc.splitTextToSize(dato, maxWidth);
        return lines.length * 7;
      });
      const maxHeight = Math.max(...alturas);

      datos.forEach((dato, i) => {
        const key = Object.keys(cols)[i];
        const x = cols[key];
        const maxWidth = maxWidths[key] || 50;
        const lines = doc.splitTextToSize(dato, maxWidth);
        doc.text(lines, x, y);
      });

      doc.setDrawColor(200);
      doc.line(10, y + maxHeight + 2, 280, y + maxHeight + 2);

      y += maxHeight + 8;

      if (y > 190) {
        doc.addPage();
        y = 20;
      }
    }
  });

  doc.save("reporte-clientes.pdf");
}

function exportarExcel() {
  // Requiere que XLSX esté cargado globalmente con:
  // <script src="https://cdn.sheetjs.com/xlsx-latest/package/dist/xlsx.full.min.js"></script>

  const wb = XLSX.utils.book_new();

  // Encabezados
  const ws_data = [
    ["Fecha", "Nombre", "Email", "Teléfono", "Mensaje", "Status"]
  ];

  document.querySelectorAll("#tabla tbody tr").forEach(row => {
    if (row.style.display === "none") return; // saltar filas ocultas

    const celdas = row.querySelectorAll("td");
    if (celdas.length >= 6) {
      // Formatear fecha igual que en PDF
      const fechaRaw = celdas[0].innerText.trim();
      const fechaObj = new Date(fechaRaw);
      const fechaFormateada = isNaN(fechaObj)
        ? fechaRaw
        : `${String(fechaObj.getDate()).padStart(2, '0')}/${String(fechaObj.getMonth() + 1).padStart(2, '0')}/${fechaObj.getFullYear()}`;

      ws_data.push([
        fechaFormateada,
        celdas[1].innerText.trim(),
        celdas[2].innerText.trim(),
        celdas[3].innerText.trim(),
        celdas[4].innerText.trim(),
        celdas[5].innerText.trim()
      ]);
    }
  });

  const ws = XLSX.utils.aoa_to_sheet(ws_data);
  XLSX.utils.book_append_sheet(wb, ws, "Clientes");
  XLSX.writeFile(wb, "reporte-clientes.xlsx");
}

function filtrarTabla() {
  const filtro = document.getElementById('buscador').value.toLowerCase().trim();
  const filas = document.querySelectorAll('#tabla tbody tr');

  filas.forEach(fila => {
    const celdas = fila.querySelectorAll('td');
    let textoFila = '';

    for(let i = 0; i < celdas.length; i++) {
      textoFila += celdas[i].textContent.trim().toLowerCase() + ' ';
    }

    console.log(textoFila);

    fila.style.display = textoFila.includes(filtro) ? '' : 'none';
  });
}




function limpiarFiltro() {
  document.getElementById('buscador').value = '';
  filtrarTabla();
}

function formatearFechaHora(isoString) {
  if (!isoString) return "";
  const fechaObj = new Date(isoString);
  if (isNaN(fechaObj)) return isoString;

  const dia = String(fechaObj.getDate()).padStart(2, '0');
  const mes = String(fechaObj.getMonth() + 1).padStart(2, '0');
  const año = fechaObj.getFullYear();

  const horas = String(fechaObj.getHours()).padStart(2, '0');
  const minutos = String(fechaObj.getMinutes()).padStart(2, '0');
  const segundos = String(fechaObj.getSeconds()).padStart(2, '0');

  return `${dia}/${mes}/${año} ${horas}:${minutos}:${segundos}`;
}

function llenarFiltrosSelect() {
  const columnas = [
    { id: "filtro-fecha", index: 0 },
    { id: "filtro-nombre", index: 1 },
    { id: "filtro-email", index: 2 },
    { id: "filtro-telefono", index: 3 },
    { id: "filtro-mensaje", index: 4 },
    { id: "filtro-status", index: 5 }
  ];

  columnas.forEach(({ id, index }) => {
    const select = document.getElementById(id);
    if (!select) return;

    // Obtener valores únicos de esa columna
    const valores = new Set();
    document.querySelectorAll("#tabla tbody tr").forEach(fila => {
      const celdas = fila.querySelectorAll("td");
      if (celdas.length > index) {
        valores.add(celdas[index].innerText.trim());
      }
    });

    // Limpiar select excepto la opción "Todos"
    select.innerHTML = '<option value="">Todos</option>';

    // Agregar opciones ordenadas alfabéticamente
    Array.from(valores).sort().forEach(valor => {
      const option = document.createElement("option");
      option.value = valor;
      option.textContent = valor;
      select.appendChild(option);
    });
  });
}



  
