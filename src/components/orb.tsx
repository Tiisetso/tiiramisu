"use client";

import { useAnimationFrame, useReducedMotion } from "motion/react";
import { useRef } from "react";

/**
 * The check-in orb (DESIGN.md → Components → Orb).
 * idle: breathes on a 10 s cycle · listening: swells with the voice · thinking: slow pulse.
 */
export function Orb({
  levelRef,
  state,
  size = 220,
}: {
  levelRef: React.RefObject<number>;
  state: "idle" | "listening" | "thinking" | "done";
  size?: number;
}) {
  const core = useRef<HTMLDivElement>(null);
  const halo = useRef<HTMLDivElement>(null);
  const smooth = useRef(0);
  const reduced = useReducedMotion();

  useAnimationFrame((t) => {
    const lvl = state === "listening" ? (levelRef.current ?? 0) : 0;
    smooth.current += (lvl - smooth.current) * 0.18;
    const s = t / 1000;
    let scale = 1;
    if (!reduced) {
      if (state === "idle" || state === "done") {
        // 4 s in, 6 s out
        const phase = (s % 10) / 10;
        const breath = phase < 0.4 ? Math.sin((phase / 0.4) * (Math.PI / 2)) : Math.cos(((phase - 0.4) / 0.6) * (Math.PI / 2));
        scale = 1 + 0.05 * breath;
      } else if (state === "thinking") {
        scale = 1 + 0.03 * Math.sin(s * 1.6);
      } else {
        scale = 1 + smooth.current * 0.22;
      }
    }
    if (core.current) core.current.style.transform = `scale(${scale})`;
    if (halo.current) {
      halo.current.style.transform = `scale(${1 + (scale - 1) * 2.2})`;
      halo.current.style.opacity = String(0.45 + smooth.current * 0.5);
    }
  });

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }} aria-hidden>
      <div
        ref={halo}
        className="absolute inset-[-18%] rounded-full bg-[radial-gradient(circle,rgba(221,190,120,0.55),rgba(201,212,234,0.25)_45%,transparent_70%)] blur-xl"
      />
      <div
        ref={core}
        className="absolute inset-0 rounded-full bg-linear-to-br from-gold-pale via-blush to-dusk-pale shadow-[inset_0_-12px_40px_rgba(107,68,61,0.18),0_20px_60px_rgba(221,190,120,0.35)]"
      >
        <div className="absolute inset-[18%] rounded-full bg-white/25 blur-md" />
      </div>
    </div>
  );
}
