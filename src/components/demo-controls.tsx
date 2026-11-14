"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useDemo } from "@/components/demo-provider";
import { useLearning } from "@/components/learning-provider";
import { useMood } from "@/components/mood-provider";
import { EASE_SOFT } from "@/components/motion";
import { DAYS } from "@/lib/demo/persona";
import { MOODS } from "@/lib/mood";
import { clearVoiceBaseline } from "@/lib/voice/baseline";
import { useDemoMode } from "@/lib/use-client";

const JUMPS = [
  { label: "Steady", day: 44 },
  { label: "Wobble", day: 33 },
  { label: "Watch", day: 52 },
  { label: "Drifting", day: 58 },
];

/** Presenter drawer, visible only with ?demo in the URL. */
export function DemoControls() {
  const enabled = useDemoMode();
  const [open, setOpen] = useState(false);
  const [voiceReset, setVoiceReset] = useState(false);
  const { day, setDay, state, moodOverride } = useDemo();
  const { mood, setMood } = useMood();
  const { fresh, setFresh } = useLearning();
  if (!enabled) return null;

  const chip = (active: boolean) =>
    `rounded-full px-3 py-1.5 text-[13px] font-medium ${active ? "bg-neutral text-on-neutral" : "border border-line"}`;

  return (
    <div className="fixed right-3 bottom-[max(96px,calc(env(safe-area-inset-bottom)+84px))] z-50 flex flex-col items-end gap-2">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.3, ease: EASE_SOFT }}
            className="w-[min(340px,calc(100vw-24px))] rounded-[24px] border border-line bg-bg/95 p-4 text-fg shadow-[var(--shadow)] backdrop-blur-xl"
          >
            <div className="flex items-baseline justify-between">
              <p className="eyebrow text-fg-2">Demo · day {day + 1} of {DAYS}</p>
              <p className="text-[13px] text-fg-2">
                {state.level} · {state.driftScore.toFixed(2)}
              </p>
            </div>

            <input
              type="range"
              min={0}
              max={DAYS - 1}
              value={day}
              onChange={(e) => setDay(Number(e.target.value))}
              className="mt-3 w-full accent-[var(--action)]"
              aria-label="Demo day"
            />

            <div className="mt-2 flex flex-wrap gap-1.5">
              {JUMPS.map((j) => (
                <button key={j.label} onClick={() => setDay(j.day)} className={chip(day === j.day)}>
                  {j.label}
                </button>
              ))}
              <button onClick={() => setDay(DAYS - 1)} className={chip(day === DAYS - 1)}>
                Today
              </button>
            </div>

            {state.top.length > 0 && (
              <p className="mt-3 text-[13px] leading-snug text-fg-2">
                Top: {state.top.slice(0, 3).map((s) => `${s.label} (${s.z.toFixed(1)})`).join(", ")}
              </p>
            )}

            <p className="eyebrow mt-4 text-fg-2">Learning</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <button onClick={() => setFresh(false)} className={chip(!fresh)}>
                Aino&rsquo;s history
              </button>
              <button onClick={() => setFresh(true)} className={chip(fresh)}>
                Fresh user
              </button>
            </div>

            <p className="eyebrow mt-4 text-fg-2">Light field</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <button onClick={() => setMood(null)} className={chip(moodOverride === null)}>
                auto
              </button>
              {MOODS.map((m) => (
                <button key={m} onClick={() => setMood(m)} className={chip(moodOverride === m)}>
                  {m}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[12px] text-fg-2">Current: {mood}</p>

            <button
              onClick={() => {
                clearVoiceBaseline();
                setVoiceReset(true);
              }}
              className="mt-4 w-full rounded-full border border-line py-2 text-[13px] font-medium"
            >
              {voiceReset ? "Voice baseline cleared · next check-in sets it" : "Reset voice baseline"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close demo controls" : "Open demo controls"}
        className="glass-raised flex size-11 items-center justify-center rounded-full text-lg text-fg"
      >
        {open ? "×" : "◐"}
      </button>
    </div>
  );
}
