"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useDemo } from "@/components/demo-provider";
import type { Intervention } from "@/lib/analysis";
import { rank, SEED_HISTORY, tally, type Outcome, type Ranked, type Tally } from "@/lib/learning";

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
  const { day, state, checkin } = useDemo();
  const [fresh, setFresh] = useState(false);
  const [added, setAdded] = useState<Outcome[]>([]);

  const history = useMemo(() => [...(fresh ? [] : SEED_HISTORY), ...added], [fresh, added]);
  const ranked = useMemo(() => rank(history, state, checkin?.response.analysis.suggestion), [history, state, checkin]);
  const tallies = useMemo(() => tally(history, day), [history, day]);

  const record = useCallback((intervention: Intervention, helped: boolean | null) => {
    setAdded((a) => [...a, { day, intervention, helped }]);
  }, [day]);

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
