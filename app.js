// app.js

document.addEventListener("DOMContentLoaded", () => {
  // --- Control del Splash Screen ---
  setTimeout(() => {
    const splash = document.getElementById("splash-screen");
    const app = document.getElementById("app");

    if (splash) splash.style.display = "none";
    if (app) app.style.display = "block";
  }, 2500); // coincide con la animación fadeOut en style.css (2.5s)

  // --- Registro del Service Worker ---
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("./sw.js")
      .then(reg => console.log("✅ Service Worker registrado:", reg.scope))
      .catch(err => console.error("❌ Error al registrar Service Worker:", err));
  }
});
