"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { Mood } from "@/lib/mood";

interface MoodContextValue {
  mood: Mood;
  setMood: (m: Mood) => void;
}

const MoodContext = createContext<MoodContextValue | null>(null);

export function MoodProvider({
  initial = "calm",
  children,
}: {
  initial?: Mood;
  children: React.ReactNode;
}) {
  const [mood, setMood] = useState<Mood>(initial);
  const value = useMemo(() => ({ mood, setMood }), [mood]);
  return <MoodContext.Provider value={value}>{children}</MoodContext.Provider>;
}

export function useMood() {
  const ctx = useContext(MoodContext);
  if (!ctx) throw new Error("useMood must be used inside <MoodProvider>");
  return ctx;
}
