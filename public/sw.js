const CACHE_NAME = "oshxona-v2";
const STATIC_URLS = ["/menu", "/orders", "/cart", "/profile"];

// ─── Cache lifecycle ───────────────────────────────────────────────────────────

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_URLS).catch(() => {}))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (
    request.method !== "GET" ||
    url.origin !== self.location.origin ||
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/_next/")
  ) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return res;
        })
        .catch(() => cached ?? new Response("Offline", { status: 503 }));
      return cached ?? network;
    })
  );
});

// ─── Push notifications ────────────────────────────────────────────────────────

const STATUS_EMOJI = {
  pending_payment:   "⏳",
  payment_claimed:   "💸",
  payment_confirmed: "✅",
  preparing:         "🍳",
  ready:             "🎉",
  delivered:         "🛵",
  cancelled:         "❌",
};

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    return;
  }

  const { title, body, orderId, status, url } = payload;
  const emoji = STATUS_EMOJI[status] ?? "🍽️";

  event.waitUntil(
    self.registration.showNotification(`${emoji} ${title ?? "Oshxona"}`, {
      body: body ?? "",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: orderId ?? "oshxona-order",    // replaces previous notification for same order
      renotify: true,
      vibrate: [200, 100, 200, 100, 200],
      data: { url: url ?? "/orders" },
      actions: [
        { action: "open", title: "Ko'rish" },
        { action: "dismiss", title: "Yopish" },
      ],
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") return;

  const targetUrl = event.notification.data?.url ?? "/orders";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      // Focus existing tab if open
      for (const client of clients) {
        if (new URL(client.url).origin === self.location.origin) {
          client.focus();
          client.navigate(targetUrl);
          return;
        }
      }
      // Open a new tab
      return self.clients.openWindow(targetUrl);
    })
  );
});
