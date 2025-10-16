// app.js

document.addEventListener("DOMContentLoaded", () => {
  // --- Control del Splash Screen ---
  setTimeout(() => {
    const splash = document.getElementById("splash-screen");
    const app = document.getElementById("app");

    if (splash) splash.style.display = "none";
    if (app) {
      app.style.display = "block";
      app.classList.add("show");
    }
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

if (!("indexedDB" in window)) {
  console.error("IndexedDB no está soportado en este navegador.");
}

// Abrir o crear la base de datos
const dbPromise = indexedDB.open("activities-db", 1);

dbPromise.onerror = () => {
  console.error("❌ Error al abrir la base de datos IndexedDB.");
};

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

// Mostrar actividades guardadas
function loadActivities() {
  const dbRequest = indexedDB.open("activities-db", 1);
  dbRequest.onsuccess = (event) => {
    const db = event.target.result;
    const tx = db.transaction("activities", "readonly");
    const store = tx.objectStore("activities");
    const request = store.getAll();

    request.onsuccess = () => {
      const list = document.getElementById("activity-list");
      if (!list) return;
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
const form = document.getElementById("activity-form");
if (form) {
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = document.getElementById("title").value.trim();
    const description = document.getElementById("description").value.trim();

    if (!title || !description) {
      document.getElementById("status").textContent = "⚠️ Completa todos los campos.";
      return;
    }

    const activity = {
      title,
      description,
      date: new Date().toISOString(),
      synced: false,
    };

    if (navigator.onLine) {
      document.getElementById("status").textContent = "✅ Enviado al servidor.";
    } else {
      saveActivity(activity);
      document.getElementById("status").textContent = "📦 Guardado offline.";

      // Registrar sincronización en segundo plano (si está disponible)
      if ("serviceWorker" in navigator && "SyncManager" in window) {
        navigator.serviceWorker.ready.then((reg) => {
          reg.sync.register("sync-activities")
            .then(() => console.log("🕒 Sincronización en segundo plano registrada"))
            .catch((err) => console.error("Error al registrar sync:", err));
        });
      }
    }

    e.target.reset();
    loadActivities();
  });
}

// Mostrar estado de conexión
window.addEventListener("online", () => {
  document.getElementById("status").textContent = "🟢 Conectado.";
});
window.addEventListener("offline", () => {
  document.getElementById("status").textContent = "🔴 Sin conexión (modo offline).";
});

// Cargar actividades al abrir
window.addEventListener("load", loadActivities);

// ======================
// Notificaciones Push
// ======================

if ("Notification" in window && "serviceWorker" in navigator) {
  // Preguntar permiso al usuario
  Notification.requestPermission().then(permission => {
    if (permission === "granted") {
      console.log("🔔 Permiso para notificaciones concedido.");
    } else {
      console.log("🚫 Permiso de notificaciones denegado.");
    }
  });
}

