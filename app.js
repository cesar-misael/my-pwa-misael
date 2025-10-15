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

// ======================
// IndexedDB (almacenamiento offline)
// ======================

// Verificamos si IndexedDB está disponible
if (!('indexedDB' in window)) {
  console.error("IndexedDB no está soportado en este navegador.");
}

// Abrir o crear la base de datos
const dbPromise = indexedDB.open("activities-db", 1);

dbPromise.onupgradeneeded = (event) => {
  const db = event.target.result;
  if (!db.objectStoreNames.contains("activities")) {
    db.createObjectStore("activities", { keyPath: "id", autoIncrement: true });
  }
};

// Guardar actividad
function saveActivity(activity) {
  const dbRequest = indexedDB.open("activities-db", 1);
  dbRequest.onsuccess = (event) => {
    const db = event.target.result;
    const tx = db.transaction("activities", "readwrite");
    const store = tx.objectStore("activities");
    store.add(activity);
  };
}

// Mostrar actividades
function loadActivities() {
  const dbRequest = indexedDB.open("activities-db", 1);
  dbRequest.onsuccess = (event) => {
    const db = event.target.result;
    const tx = db.transaction("activities", "readonly");
    const store = tx.objectStore("activities");
    const request = store.getAll();
    request.onsuccess = () => {
      const list = document.getElementById("activity-list");
      list.innerHTML = "";
      request.result.forEach((activity) => {
        const li = document.createElement("li");
        li.textContent = `${activity.title}: ${activity.description}`;
        list.appendChild(li);
      });
    };
  };
}

// Escuchar envío del formulario
document.getElementById("activity-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const title = document.getElementById("title").value;
  const description = document.getElementById("description").value;

  const activity = {
    title,
    description,
    date: new Date().toISOString(),
    synced: false,
  };

  // Si hay conexión, simular envío al servidor
  if (navigator.onLine) {
    document.getElementById("status").textContent = "✅ Enviado al servidor.";
  } else {
    saveActivity(activity);
    document.getElementById("status").textContent = "📦 Guardado offline.";
  }

  e.target.reset();
  loadActivities();
});

// Mostrar estado de conexión
window.addEventListener("online", () => {
  document.getElementById("status").textContent = "🟢 Conectado.";
});
window.addEventListener("offline", () => {
  document.getElementById("status").textContent = "🔴 Sin conexión (modo offline).";
});

// Cargar actividades al abrir
window.addEventListener("load", loadActivities);
