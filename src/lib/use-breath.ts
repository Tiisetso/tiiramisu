"use client";

import { useEffect, useState } from "react";

/** 4 s in · 6 s out, matching the orb's breath (DESIGN.md → Motion). */
export function useBreathPhase(active: boolean) {
  const [phase, setPhase] = useState<"in" | "out">("in");
  useEffect(() => {
    if (!active) return;
    let t: ReturnType<typeof setTimeout>;
    const loop = (p: "in" | "out") => {
      setPhase(p);
      t = setTimeout(() => loop(p === "in" ? "out" : "in"), p === "in" ? 4000 : 6000);
    };
    t = setTimeout(() => loop("in"), 0);
    return () => clearTimeout(t);
  }, [active]);
  return phase;
}
