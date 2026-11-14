"use client";

/**
 * Positive reinforcement through the light field (behavioural activation):
 * every small action blooms warmly from where it happened and leaves a little afterglow
 * for the rest of the day. Setbacks only soften the field slightly; never darker, never a penalty.
 */

export type BloomSize = "small" | "medium" | "big";
export type FieldEvent =
  | { kind: "bloom"; amp: number; x: number; y: number }
  | { kind: "soften" };

const AMP: Record<BloomSize, number> = { small: 0.45, medium: 0.75, big: 1 };
/** afterglow added per action, by size; capped so the room never gets garish */
const GLOW_STEP: Record<BloomSize, number> = { small: 0.03, medium: 0.06, big: 0.1 };
export const GLOW_CAP = 0.55;

const listeners = new Set<(e: FieldEvent) => void>();
export const onFieldEvent = (fn: (e: FieldEvent) => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};

const glowKey = () => `tiiramisu.afterglow.${new Date().toISOString().slice(0, 10)}`;

/** Today's afterglow (0..GLOW_CAP), resets each day. */
export function readAfterglow() {
  try {
    return Math.min(GLOW_CAP, Number(localStorage.getItem(glowKey()) ?? 0));
  } catch {
    return 0;
  }
}

function addAfterglow(step: number) {
  try {
    localStorage.setItem(glowKey(), String(Math.min(GLOW_CAP, readAfterglow() + step)));
  } catch {
    /* session only */
  }
}

type At = { clientX: number; clientY: number } | Element | null | undefined;

/** Normalised position with y up (WebGL coordinates). Defaults to the screen's centre. */
function position(at: At) {
  let x = window.innerWidth / 2;
  let y = window.innerHeight * 0.45;
  if (at && "getBoundingClientRect" in at) {
    const r = at.getBoundingClientRect();
    x = r.left + r.width / 2;
    y = r.top + r.height / 2;
  } else if (at && "clientX" in at && (at.clientX || at.clientY)) {
    x = at.clientX;
    y = at.clientY;
  }
  return { x: x / window.innerWidth, y: 1 - y / window.innerHeight };
}

/** A small step happened: celebrate it, from where it happened. */
export function bloom(size: BloomSize, at?: At) {
  if (typeof window === "undefined") return;
  addAfterglow(GLOW_STEP[size]);
  const { x, y } = position(at);
  listeners.forEach((l) => l({ kind: "bloom", amp: AMP[size], x, y }));
}

/** Something didn't help: acknowledge it, barely. */
export function soften() {
  listeners.forEach((l) => l({ kind: "soften" }));
}
