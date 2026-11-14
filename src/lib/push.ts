"use client";

/**
 * Gentle push on the client. iPhone rules: only works when installed to the Home Screen
 * (iOS 16.4+), and permission must be asked inside a tap: callers pass the click through.
 */

export type PushResult = "on" | "denied" | "needs-install" | "unsupported" | "unavailable";

const supported = () =>
  typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

const isIOS = () => typeof navigator !== "undefined" && /iPhone|iPad|iPod/.test(navigator.userAgent);
const isStandalone = () =>
  typeof window !== "undefined" &&
  (window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true);

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

export async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return null;
  try {
    return await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  } catch {
    return null;
  }
}

/** Never a growing number on the icon. */
export function clearBadge() {
  const n = navigator as unknown as { clearAppBadge?: () => Promise<void> };
  n.clearAppBadge?.().catch(() => {});
}

/** Call directly from a tap handler. */
export async function enablePush(patientId: string): Promise<PushResult> {
  if (isIOS() && !isStandalone()) return "needs-install";
  if (!supported()) return "unsupported";
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return "denied";
  const { key } = (await fetch("/api/push/key").then((r) => r.json()).catch(() => ({ key: null }))) as { key: string | null };
  if (!key) return "unavailable";
  const reg = (await registerServiceWorker()) ?? (await navigator.serviceWorker.ready);
  const sub =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(key) }));
  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ patientId, subscription: sub.toJSON() }),
  });
  return res.ok ? "on" : "unavailable";
}

export async function disablePush() {
  if (!supported()) return;
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  if (!sub) return;
  await fetch("/api/push/subscribe", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint: sub.endpoint }),
  }).catch(() => {});
  await sub.unsubscribe().catch(() => {});
}

export const PUSH_MESSAGE: Record<Exclude<PushResult, "on">, string> = {
  "needs-install": "On iPhone, add Tiiramisu to your Home Screen first (Share → Add to Home Screen), then turn this on there.",
  denied: "Notifications are off for Tiiramisu in your phone's settings. That's okay. Nothing else changes.",
  unsupported: "This browser can't show notifications.",
  unavailable: "Reminders aren't available right now. Try again a little later.",
};
