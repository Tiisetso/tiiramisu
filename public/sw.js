/* Tiiramisu service worker: gentle push only (DESIGN.md → Notifications).
   One notification per kind (tag replaces, no renotify), never a badge count. */

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data && event.data.text() };
  }
  const title = data.title || "Tiiramisu";
  event.waitUntil(
    Promise.all([
      self.registration.showNotification(title, {
        body: data.body || "",
        tag: data.tag || "tiiramisu", // same kind replaces the previous one: never a pile
        renotify: false,
        icon: "/icons/icon-192.png",
        data: { url: data.url || "/" },
      }),
      // never a growing number on the icon
      self.navigator && self.navigator.clearAppBadge ? self.navigator.clearAppBadge().catch(() => {}) : Promise.resolve(),
    ]),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((wins) => {
      for (const w of wins) {
        if ("focus" in w) {
          w.navigate(url).catch(() => {});
          return w.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
