"use client";

import { useSyncExternalStore } from "react";

/**
 * What the person has agreed to (onboarding #32). Stored on this device only.
 * Every feature that measures or shares something reads this first.
 */
export interface Consent {
  onboarded: boolean;
  /** analyse voice check-ins (features on device; words transcribed, audio never stored) */
  voice: boolean;
  /** send a short check-in summary to the clinic */
  shareWithClinic: boolean;
  /** friends in the circle see "checked in today" (never data) */
  shareStatus: boolean;
  /** join the anonymous after-TMS peer room */
  peers: boolean;
  /** gentle reminders / clinic outreach notifications (#38) */
  reminders: boolean;
  /** Apple Health via Shortcut (#10) */
  appleHealth: boolean;
  /** which friends are in the circle */
  circle: string[];
}

const KEY = "tiiramisu.consent.v1";

export const DEFAULT_CONSENT: Consent = {
  onboarded: false,
  voice: true,
  shareWithClinic: true,
  shareStatus: true,
  peers: true,
  reminders: false,
  appleHealth: false,
  circle: ["maya", "juho", "mum"],
};

let cache: Consent | null = null;
const listeners = new Set<() => void>();

function read(): Consent {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? { ...DEFAULT_CONSENT, ...(JSON.parse(raw) as Partial<Consent>) } : DEFAULT_CONSENT;
  } catch {
    cache = DEFAULT_CONSENT;
  }
  return cache;
}

export function setConsent(patch: Partial<Consent>) {
  cache = { ...read(), ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    /* private mode: lasts this session */
  }
  listeners.forEach((l) => l());
}

export function resetConsent() {
  cache = DEFAULT_CONSENT;
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

/** Read consent outside React (e.g. inside event handlers). */
export const getConsent = () => (typeof window === "undefined" ? DEFAULT_CONSENT : read());

export function useConsent(): Consent {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    read,
    () => DEFAULT_CONSENT,
  );
}
