"use client";

import { createContext, useCallback, useContext, useMemo, useState, useSyncExternalStore } from "react";
import { MoodProvider } from "@/components/mood-provider";
import { DAYS, DEMO_DAYS, PERSONA, type DayData } from "@/lib/demo/persona";
import type { Mood } from "@/lib/mood";
import { computeDayState, type DayState, type DriftLevel } from "@/lib/signals";

/**
 * Single source of truth for the demo: which day of Aino's 60 we're on,
 * the derived signals/drift state, and the resulting mood.
 * `?day=44` in the URL sets the starting day; presenter controls change it live.
 */

interface DemoContextValue {
  persona: typeof PERSONA;
  days: DayData[];
  day: number;
  setDay: (d: number) => void;
  today: DayData;
  state: DayState;
  moodOverride: Mood | null;
}

const DemoContext = createContext<DemoContextValue | null>(null);

const LEVEL_MOOD: Record<DriftLevel, Mood> = {
  steady: "calm",
  watch: "calm",
  drifting: "low",
};

const clampDay = (d: number) => Math.min(DAYS - 1, Math.max(0, Math.round(d)));

function useUrlDay() {
  return useSyncExternalStore(
    () => () => {},
    () => {
      const v = new URLSearchParams(window.location.search).get("day");
      return v === null || Number.isNaN(Number(v)) ? null : clampDay(Number(v));
    },
    () => null,
  );
}

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const urlDay = useUrlDay();
  const [chosenDay, setChosenDay] = useState<number | null>(null);
  const [moodOverride, setMoodOverride] = useState<Mood | null>(null);

  const day = chosenDay ?? urlDay ?? DAYS - 1;
  const setDay = useCallback((d: number) => setChosenDay(clampDay(d)), []);

  const state = useMemo(() => computeDayState(DEMO_DAYS, day), [day]);
  const mood = moodOverride ?? LEVEL_MOOD[state.level];

  const value = useMemo<DemoContextValue>(
    () => ({ persona: PERSONA, days: DEMO_DAYS, day, setDay, today: DEMO_DAYS[day], state, moodOverride }),
    [day, setDay, state, moodOverride],
  );

  return (
    <DemoContext.Provider value={value}>
      <MoodProvider mood={mood} setMood={setMoodOverride}>
        {children}
      </MoodProvider>
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("useDemo must be used inside <DemoProvider>");
  return ctx;
}
