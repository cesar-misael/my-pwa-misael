const CACHE_NAME = "my-pwa-cache-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

// Instalación y guardado en caché
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

// Activación y limpieza de cachés viejas
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
    )
  );
});

// Intercepta peticiones (fetch)
self.addEventListener("fetch", event => {
  const req = event.request;

  // Simulamos el endpoint de sincronización
  if (req.url.endsWith("/api/sync")) {
    event.respondWith(new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" }
    }));
    return;
  }

  // Estrategia básica de cache para recursos estáticos
  event.respondWith(
    caches.match(req).then(cacheRes => {
      return cacheRes || fetch(req).then(fetchRes => {
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(req, fetchRes.clone());
          return fetchRes;
        });
      });
    }).catch(() => {
      // Si no hay conexión ni caché y se pide una página HTML
      if (req.headers.get("accept").includes("text/html")) {
        return caches.match("/offline.html");
      }
    })
  );
});

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


// Intercepción de requests
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
