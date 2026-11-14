"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useDemo } from "@/components/demo-provider";
import type { Intervention } from "@/lib/analysis";
import { rank, SEED_HISTORY, tally, type Outcome, type Ranked, type Tally } from "@/lib/learning";
import { liveGet, livePost, useLive } from "@/lib/live";

interface LearningContextValue {
  history: Outcome[];
  ranked: Ranked[];
  tallies: Record<Intervention, Tally>;
  record: (intervention: Intervention, helped: boolean | null) => void;
  /** demo: compare with someone the app knows nothing about */
  fresh: boolean;
  setFresh: (f: boolean) => void;
}

const LearningContext = createContext<LearningContextValue | null>(null);

export function LearningProvider({ children }: { children: React.ReactNode }) {
  const { day, state, checkin, patient } = useDemo();
  const [fresh, setFresh] = useState(false);
  const [added, setAdded] = useState<Outcome[]>([]);
  const live = useLive();

  // Live mode: this person's answers persist in Aiven and come back on any device
  useEffect(() => {
    if (live !== true) return;
    let cancelled = false;
    liveGet<{ outcomes: Outcome[] }>(`/api/outcomes?patient=${patient.id}`).then((d) => {
      if (!cancelled && d?.outcomes.length) setAdded(d.outcomes);
    });
    return () => {
      cancelled = true;
    };
  }, [live, patient.id]);

  // only Aino has a seeded history; other patients start fresh
  const history = useMemo(() => [...(fresh || !patient.isAino ? [] : SEED_HISTORY), ...added], [fresh, added, patient]);
  const ranked = useMemo(() => rank(history, state, checkin?.response.analysis.suggestion), [history, state, checkin]);
  const tallies = useMemo(() => tally(history, day), [history, day]);

  const record = useCallback((intervention: Intervention, helped: boolean | null) => {
    setAdded((a) => [...a, { day, intervention, helped }]);
    void livePost("/api/outcomes", { patientId: patient.id, day, intervention, helped });
  }, [day, patient.id]);

  const setFreshAndReset = useCallback((f: boolean) => {
    setFresh(f);
    setAdded([]);
  }, []);

  const value = useMemo(
    () => ({ history, ranked, tallies, record, fresh, setFresh: setFreshAndReset }),
    [history, ranked, tallies, record, fresh, setFreshAndReset],
  );
  return <LearningContext.Provider value={value}>{children}</LearningContext.Provider>;
}

export function useLearning() {
  const ctx = useContext(LearningContext);
  if (!ctx) throw new Error("useLearning must be used inside <LearningProvider>");
  return ctx;
}
