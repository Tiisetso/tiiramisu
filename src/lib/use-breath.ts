"use client";

import { useEffect, useState } from "react";

export const INHALE_MS = 4000;
export const EXHALE_MS = 6000;

export type BreathPhase = "ready" | "in" | "out" | "done";

/**
 * One clock for the breathing guide (DESIGN.md → Motion: 4 s in · 6 s out).
 * The orb, ring and words all read this, so they can never drift apart.
 */
export function useBreathCycle(active: boolean, rounds = 5) {
  const [state, setState] = useState<{ phase: BreathPhase; round: number }>({ phase: "ready", round: 0 });

  useEffect(() => {
    if (!active) return;
    let t: ReturnType<typeof setTimeout>;
    const inhale = (round: number) => {
      if (round > rounds) {
        setState({ phase: "done", round: rounds });
        return;
      }
      setState({ phase: "in", round });
      t = setTimeout(() => {
        setState({ phase: "out", round });
        t = setTimeout(() => inhale(round + 1), EXHALE_MS);
      }, INHALE_MS);
    };
    t = setTimeout(() => inhale(1), 600); // a beat to settle before the first breath
    return () => {
      clearTimeout(t);
      setTimeout(() => setState({ phase: "ready", round: 0 }), 0);
    };
  }, [active, rounds]);

  return state;
}
