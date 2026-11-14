"use client";

import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/** false during SSR/hydration, true on the client afterwards. */
export function useHydrated() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

export function useMediaQuery(query: string, serverValue = false) {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia(query).matches,
    () => serverValue,
  );
}

/** `?demo` in the URL turns on presenter controls. */
export function useDemoMode() {
  return useSyncExternalStore(
    noopSubscribe,
    () => new URLSearchParams(window.location.search).has("demo"),
    () => false,
  );
}
