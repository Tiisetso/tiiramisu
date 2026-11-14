"use client";

import { motion, useReducedMotion } from "motion/react";
import { EASE_BREATHE } from "@/components/motion";
import { EXHALE_MS, INHALE_MS, useBreathCycle, type BreathPhase } from "@/lib/use-breath";
import { useEffect, useRef } from "react";
import { bloom } from "@/lib/field-events";

const SMALL = 0.58;
const WORDS: Record<BreathPhase, string> = {
  ready: "Tap to begin",
  in: "Breathe in…",
  out: "and slowly out",
  done: "Well done",
};

/**
 * Breathing guide: the orb grows over the 4 s inhale and shrinks over the 6 s exhale,
 * a ring fills and empties with it, and the words follow the same clock.
 * Reduced motion: no scaling; the glow and ring carry the rhythm instead.
 */
export function BreathingGuide({
  active,
  onToggle,
  size = 220,
  rounds = 5,
}: {
  active: boolean;
  onToggle?: () => void;
  size?: number;
  rounds?: number;
}) {
  const { phase, round } = useBreathCycle(active, rounds);
  const orbRef = useRef<HTMLButtonElement>(null);
  // each completed breath blooms a little; finishing blooms more
  useEffect(() => {
    if (phase === "in" && round > 1) bloom("small", orbRef.current);
    if (phase === "done") bloom("medium", orbRef.current, "breathed slowly");
  }, [phase, round]);
  const reduced = useReducedMotion();
  const breathing = phase === "in" || phase === "out";
  const dur = (phase === "in" ? INHALE_MS : EXHALE_MS) / 1000;

  const scale = reduced ? 1 : phase === "in" ? 1 : phase === "out" || phase === "ready" ? SMALL : 0.8;
  const glow = phase === "in" ? 0.95 : 0.35;
  const ring = phase === "in" ? 1 : 0;
  const r = size / 2 - 4;
  const transition = breathing ? { duration: dur, ease: EASE_BREATHE } : { duration: 1.2, ease: EASE_BREATHE };

  return (
    <div className="flex flex-col items-center">
      <button
        ref={orbRef}
        type="button"
        onClick={onToggle}
        disabled={!onToggle}
        aria-label={active ? "Stop breathing guide" : "Start breathing guide"}
        className="relative"
        style={{ width: size, height: size }}
      >
        {/* progress ring */}
        <svg className="absolute inset-0 -rotate-90" width={size} height={size} aria-hidden>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth="2" />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--spark)"
            strokeWidth="2.5"
            strokeLinecap="round"
            initial={false}
            animate={{ pathLength: breathing ? ring : 0, opacity: breathing ? 1 : 0 }}
            transition={transition}
          />
        </svg>

        {/* glow */}
        <motion.div
          aria-hidden
          className="absolute inset-[6%] rounded-full bg-[radial-gradient(circle,rgba(221,190,120,0.6),rgba(201,212,234,0.3)_50%,transparent_72%)] blur-2xl"
          initial={false}
          animate={{ opacity: breathing ? glow : 0.45, scale: reduced ? 1 : scale * 1.15 }}
          transition={transition}
        />

        {/* orb */}
        <motion.div
          aria-hidden
          className="absolute inset-[10%] rounded-full bg-linear-to-br from-gold-pale via-blush to-dusk-pale shadow-[inset_0_-12px_40px_rgba(107,68,61,0.18),0_20px_60px_rgba(221,190,120,0.35)]"
          initial={false}
          animate={{ scale }}
          transition={transition}
        >
          <div className="absolute inset-[18%] rounded-full bg-white/25 blur-md" />
        </motion.div>
      </button>

      <p className="mt-8 h-9 font-serif text-[26px] font-light" aria-live="polite">
        {active || phase === "done" ? WORDS[phase] : WORDS.ready}
      </p>
      <p className="mt-1 h-5 text-[13px] text-fg-2">
        {breathing
          ? `Breath ${round} of ${rounds} · ${phase === "in" ? "in for 4" : "out for 6"}`
          : phase === "done"
            ? "Notice how you feel now."
            : "In for 4, out for 6. Stop whenever you like."}
      </p>
    </div>
  );
}
