"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { MoodProvider } from "@/components/mood-provider";
import type { AnalyzeResponse, VoiceDeltas } from "@/lib/analysis";
import { PATIENTS, type Patient } from "@/lib/demo/patients";
import { DAYS, PERSONA, type DayData } from "@/lib/demo/persona";
import type { Mood } from "@/lib/mood";
import { computeDayState, type DayState, type DriftLevel } from "@/lib/signals";

/**
 * Single source of truth for the demo: which day of Aino's 60 we're on,
 * the derived signals/drift state, and the resulting mood.
 * `?day=44` in the URL sets the starting day; presenter controls change it live.
 */

interface DemoContextValue {
  persona: typeof PERSONA;
  /** which caseload patient this app is showing (`?patient=elias`) */
  patient: Patient;
  days: DayData[];
  day: number;
  setDay: (d: number) => void;
  today: DayData;
  state: DayState;
  moodOverride: Mood | null;
  /** live mic level 0..1 for the orb + light field */
  levelRef: React.RefObject<number>;
  /** temporary mood while an activity runs (e.g. "listening"); null = automatic */
  setActivityMood: (m: Mood | null) => void;
  /** today's check-in result, shared with Today (#6) and the response loop (#8) */
  checkin: CheckinResult | null;
  setCheckin: (c: CheckinResult | null) => void;
}

export interface CheckinResult {
  day: number;
  response: AnalyzeResponse;
  voice: { phrase: string; deltas: VoiceDeltas } | null;
  isBaseline: boolean;
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

function useUrlPatient(): Patient {
  const id = useSyncExternalStore(
    () => () => {},
    () => new URLSearchParams(window.location.search).get("patient"),
    () => null,
  );
  return PATIENTS.find((p) => p.id === id) ?? PATIENTS[0];
}

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const urlDay = useUrlDay();
  const patient = useUrlPatient();
  const persona = useMemo(() => ({ ...PERSONA, name: patient.name.split(" ")[0] }), [patient]);
  const [chosenDay, setChosenDay] = useState<number | null>(null);
  const [moodOverride, setMoodOverride] = useState<Mood | null>(null);
  const [activityMood, setActivityMood] = useState<Mood | null>(null);
  const [checkin, setCheckin] = useState<CheckinResult | null>(null);
  const levelRef = useRef(0);

  const day = chosenDay ?? urlDay ?? DAYS - 1;
  const setDay = useCallback((d: number) => setChosenDay(clampDay(d)), []);

  const state = useMemo(() => computeDayState(patient.days, day), [patient, day]);
  const mood = moodOverride ?? activityMood ?? LEVEL_MOOD[state.level];

  const value = useMemo<DemoContextValue>(
    () => ({
      persona,
      patient,
      days: patient.days,
      day,
      setDay,
      today: patient.days[day],
      state,
      moodOverride,
      levelRef,
      setActivityMood,
      checkin: checkin?.day === day ? checkin : null,
      setCheckin,
    }),
    [persona, patient, day, setDay, state, moodOverride, checkin],
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
