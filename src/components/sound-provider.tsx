"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useMood } from "@/components/mood-provider";
import { onFieldEvent } from "@/lib/field-events";
import { Soundscape, type Scene } from "@/lib/sound/engine";

interface SoundContextValue {
  /** true once audio has been unlocked by the Begin tap */
  started: boolean;
  muted: boolean;
  start: () => Promise<void>;
  toggleMute: () => void;
  duck: (on: boolean) => void;
  /** undefined = follow your day */
  scene: Scene | null | undefined;
  setScene: (s: Scene | null | undefined) => void;
  setLevel: (db: number) => void;
}

const SoundContext = createContext<SoundContextValue | null>(null);

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const { mood } = useMood();
  const engine = useRef<Soundscape | null>(null);
  const [started, setStarted] = useState(false);
  const [muted, setMuted] = useState(false);
  const [scene, setSceneState] = useState<Scene | null | undefined>(undefined);
  const moodRef = useRef(mood);

  useEffect(() => {
    moodRef.current = mood;
    engine.current?.setMood(mood);
  }, [mood]);

  useEffect(() => () => engine.current?.dispose(), []);

  // every bloom is heard as well as seen
  useEffect(() => onFieldEvent((e) => e.kind === "bloom" && engine.current?.chime(e.amp)), []);

  const start = useCallback(async () => {
    if (engine.current?.isRunning) return;
    try {
      const e = engine.current ?? new Soundscape();
      engine.current = e;
      await e.start(moodRef.current);
      setStarted(true);
    } catch (err) {
      console.warn("Soundscape unavailable", err);
    }
  }, []);

  const toggleMute = useCallback(() => setMuted((m) => !m), []);
  useEffect(() => {
    engine.current?.setMuted(muted);
  }, [muted]);

  const duck = useCallback((on: boolean) => engine.current?.duck(on), []);
  const setLevel = useCallback((db: number) => engine.current?.setLevel(db), []);
  const setScene = useCallback((s: Scene | null | undefined) => {
    setSceneState(s);
    engine.current?.setScene(s);
  }, []);

  const value = useMemo(
    () => ({ started, muted, start, toggleMute, duck, scene, setScene, setLevel }),
    [started, muted, start, toggleMute, duck, scene, setScene, setLevel],
  );
  return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>;
}

export function useSound() {
  const ctx = useContext(SoundContext);
  if (!ctx) throw new Error("useSound must be used inside <SoundProvider>");
  return ctx;
}
