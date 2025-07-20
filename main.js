const GAS_URL = "https://script.google.com/macros/s/AKfycbwsXshOze1AzVq4Q65VVOQBv1oOngYKBvtTTTjSoqjCzN_ew0ckUrjYrVGr0ikFXxAM/exec";

async function verificarSesion() {
  const token = localStorage.getItem("sessionToken");
  if (!token) {
    window.location.href = "index.html"; // Redirige al login si no hay token
    return;
  }
  try {
    const response = await fetch(`${GAS_URL}?checkSession=1&session=${token}`);
    const resultado = await response.json();
    if (resultado.status === "OK") {
      // Mostrar contenido restringido
      const contenido = document.getElementById('contenido');
      if (contenido) contenido.style.display = 'block';
    } else {
      localStorage.removeItem("sessionToken");
      window.location.href = "index.html";
    }
  } catch (error) {
    console.error("Error al verificar sesión:", error);
    window.location.href = "index.html";
  }
}

function toggleSlider() {
  const slider = document.getElementById('slider');
  slider.classList.toggle('open');
}

function cerrarSesion() {
  localStorage.removeItem("sessionToken");
  window.location.href = "index.html";
}

document.addEventListener("DOMContentLoaded", verificarSesion);