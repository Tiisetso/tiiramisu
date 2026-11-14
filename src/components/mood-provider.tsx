"use client";

import { createContext, useContext, useMemo } from "react";
import type { Mood } from "@/lib/mood";

interface MoodContextValue {
  mood: Mood;
  /** sets a manual override (presenter controls); null returns to automatic */
  setMood: (m: Mood | null) => void;
}

const MoodContext = createContext<MoodContextValue | null>(null);

/** Controlled: the demo state decides the mood; this just shares it. */
export function MoodProvider({
  mood,
  setMood,
  children,
}: MoodContextValue & { children: React.ReactNode }) {
  const value = useMemo(() => ({ mood, setMood }), [mood, setMood]);
  return <MoodContext.Provider value={value}>{children}</MoodContext.Provider>;
}

export function useMood() {
  const ctx = useContext(MoodContext);
  if (!ctx) throw new Error("useMood must be used inside <MoodProvider>");
  return ctx;
}
