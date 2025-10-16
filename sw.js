// ===========================
// CONFIGURACIÓN BASE
// ===========================
const CACHE_NAME = "my-pwa-cache-v2";
const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "./offline.html",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

// ===========================
// INSTALACIÓN Y ACTIVACIÓN
// ===========================
self.addEventListener("install", event => {
  console.log("🧱 Instalando Service Worker...");
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener("activate", event => {
  console.log("🚀 Activando nuevo Service Worker...");
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    )
  );
});

// ===========================
// ESTRATEGIAS DE CACHE AVANZADAS
// ===========================
self.addEventListener("fetch", event => {
  const req = event.request;
  const url = new URL(req.url);

  // 🧩 Simulación de endpoint de sincronización
  if (url.pathname.endsWith("/api/sync")) {
    event.respondWith(new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" }
    }));
    return;
  }

  // 📦 Estrategia: App Shell (HTML, CSS, JS)
  if (ASSETS.some(asset => url.pathname.endsWith(asset.replace("./", "")))) {
    event.respondWith(cacheFirst(req));
    return;
  }

  // 🧠 Estrategia: Network First para peticiones dinámicas (ejemplo APIs)
  if (url.pathname.includes("/api/")) {
    event.respondWith(networkFirst(req));
    return;
  }

  // 🖼 Estrategia: Stale-While-Revalidate para imágenes
  if (req.destination === "image") {
    event.respondWith(staleWhileRevalidate(req));
    return;
  }

  // 🌐 Fallback general
  event.respondWith(networkFirst(req));
});

// --- Estrategia Cache First ---
async function cacheFirst(req) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(req);
  return cached || fetch(req);
}

// --- Estrategia Network First ---
async function networkFirst(req) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const fresh = await fetch(req);
    cache.put(req, fresh.clone());
    return fresh;
  } catch (err) {
    const cached = await cache.match(req);
    return cached || (req.headers.get("accept").includes("text/html")
      ? caches.match("./offline.html")
      : new Response("Offline", { status: 503, statusText: "Offline" }));
  }
}

// --- Estrategia Stale-While-Revalidate ---
async function staleWhileRevalidate(req) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(req);
  const networkFetch = fetch(req).then(fresh => {
    cache.put(req, fresh.clone());
    return fresh;
  });
  return cached || networkFetch;
}

// ===========================
// SINCRONIZACIÓN EN SEGUNDO PLANO
// ===========================
self.addEventListener("sync", event => {
  if (event.tag === "sync-activities") {
    console.log("📡 Ejecutando sincronización en segundo plano...");
    event.waitUntil(syncActivities());
  }
});

async function syncActivities() {
  const dbRequest = indexedDB.open("activities-db", 1);

  dbRequest.onsuccess = async event => {
    const db = event.target.result;
    const tx = db.transaction("activities", "readonly");
    const store = tx.objectStore("activities");
    const getAll = store.getAll();

    getAll.onsuccess = async () => {
      const all = getAll.result;

      for (const activity of all) {
        try {
          await fetch("/api/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(activity)
          });

          // Si se envió bien, la borramos del IndexedDB
          const txDel = db.transaction("activities", "readwrite");
          txDel.objectStore("activities").delete(activity.id);
        } catch (err) {
          console.error("Error al sincronizar:", err);
        }
      }
    };
  };
}

// ======================
// EVENTOS PUSH
// ======================
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  console.log("📨 Notificación push recibida:", data);

  const title = data.title || "Notificación de My PWA";
  const options = {
    body: data.body || "Tienes un nuevo mensaje.",
    icon: "./icons/icon-192.png",
    badge: "./icons/icon-192.png",
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});
