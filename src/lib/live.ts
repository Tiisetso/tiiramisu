"use client";

import { useSyncExternalStore } from "react";

/**
 * Live mode = the shared Aiven database is reachable (GET /api/health).
 * Checked once per page; everything still works locally when it isn't.
 */

let status: boolean | null = null;
let loading = false;
let store: string | null = null;
const listeners = new Set<() => void>();

function load() {
  if (status !== null || loading) return;
  loading = true;
  fetch("/api/health")
    .then((r) => r.json())
    .then((d: { db?: boolean; store?: string }) => {
      status = Boolean(d.db);
      store = d.store ?? null;
    })
    .catch(() => {
      status = false;
    })
    .finally(() => listeners.forEach((l) => l()));
}

/** null while checking, then true/false. */
export function useLive() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      load();
      return () => listeners.delete(cb);
    },
    () => status,
    () => null,
  );
}

export const liveStoreLabel = () => store;

/** Fire-and-forget write; silently skipped in local mode. */
export async function livePost(path: string, body: unknown) {
  if (status === false) return;
  try {
    await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  } catch {
    /* offline: local state still has it */
  }
}

export async function liveGet<T>(path: string): Promise<T | null> {
  if (status !== true) return null;
  try {
    const r = await fetch(path, { cache: "no-store" });
    return r.ok ? ((await r.json()) as T) : null;
  } catch {
    return null;
  }
}
