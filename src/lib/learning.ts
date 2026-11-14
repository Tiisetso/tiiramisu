/**
 * "Learn what works for this person" (Smart sensing criterion).
 * Each intervention keeps a Beta(helped+1, notHelped+1) posterior from the person's own
 * "did that help?" answers. Ranking = posterior mean + a relevance bonus when the
 * intervention fits what's shifted today. Deterministic, so the demo is repeatable.
 */
import { INTERVENTIONS, type Intervention } from "@/lib/analysis";
import type { DayState, SignalKey } from "@/lib/signals";

export interface Outcome {
  day: number;
  intervention: Intervention;
  /** null = "not sure" (counted as neither) */
  helped: boolean | null;
}

/** Aino's past answers: mostly around the day-32 wobble, which recovered. */
export const SEED_HISTORY: Outcome[] = [
  { day: 9, intervention: "breathe", helped: false },
  { day: 12, intervention: "walk", helped: true },
  { day: 15, intervention: "light", helped: true },
  { day: 17, intervention: "soundscape", helped: true },
  { day: 19, intervention: "walk", helped: true },
  { day: 21, intervention: "message_friend", helped: true },
  { day: 24, intervention: "breathe", helped: true },
  { day: 26, intervention: "walk", helped: false },
  { day: 29, intervention: "soundscape", helped: false },
  { day: 31, intervention: "rest", helped: true },
  { day: 32, intervention: "light", helped: true },
  { day: 33, intervention: "walk", helped: true },
  { day: 33, intervention: "breathe", helped: false },
  { day: 34, intervention: "light", helped: false },
  { day: 35, intervention: "message_friend", helped: true },
  { day: 36, intervention: "rest", helped: false },
  { day: 38, intervention: "breathe", helped: true },
  { day: 40, intervention: "soundscape", helped: true },
  { day: 41, intervention: "walk", helped: true },
  { day: 44, intervention: "light", helped: true },
  { day: 46, intervention: "message_friend", helped: true },
];

/** Which intervention fits which shifted signal. */
const FITS: Record<SignalKey, Intervention[]> = {
  sleepTiming: ["light", "walk"],
  rhythm: ["light", "walk"],
  sleepEfficiency: ["breathe", "soundscape"],
  activity: ["walk"],
  hrv: ["breathe", "soundscape"],
  voice: ["message_friend"],
  mood: ["message_friend", "rest"],
};

const RELEVANCE_BONUS = 0.15;
const ANALYSIS_BONUS = 0.1;

export interface Tally {
  helped: number;
  tried: number;
  /** posterior mean of "helps" */
  mean: number;
}

export function tally(history: Outcome[], upToDay: number): Record<Intervention, Tally> {
  const out = Object.fromEntries(INTERVENTIONS.map((i) => [i, { helped: 0, tried: 0, mean: 0.5 }])) as Record<Intervention, Tally>;
  for (const o of history) {
    if (o.day > upToDay || o.helped === null) continue;
    out[o.intervention].tried++;
    if (o.helped) out[o.intervention].helped++;
  }
  for (const i of INTERVENTIONS) {
    const t = out[i];
    t.mean = (t.helped + 1) / (t.tried + 2);
  }
  return out;
}

export interface Ranked {
  intervention: Intervention;
  score: number;
  tally: Tally;
  /** the shifted signal that made it relevant today, if any */
  because?: SignalKey;
}

export function rank(history: Outcome[], state: DayState, analysisSuggestion?: Intervention): Ranked[] {
  const t = tally(history, state.day);
  const shifted = state.top.map((s) => s.key);
  return INTERVENTIONS.map((i, order) => {
    const idx = shifted.findIndex((k) => FITS[k].includes(i));
    const because = idx >= 0 ? shifted[idx] : undefined;
    // the most-shifted signal earns the biggest bonus
    const relevance = idx >= 0 ? Math.max(0.05, RELEVANCE_BONUS - idx * 0.02) : 0;
    const score = t[i].mean + relevance + (analysisSuggestion === i ? ANALYSIS_BONUS : 0) - order * 1e-4; // stable tie-break
    return { intervention: i, score, tally: t[i], because };
  }).sort((a, b) => b.score - a.score);
}

const NAME: Record<Intervention, string> = {
  walk: "Walks",
  light: "Morning light",
  message_friend: "Reaching out to Maya",
  breathe: "Breathing",
  soundscape: "Calm sounds",
  rest: "Resting",
};

const BECAUSE: Record<SignalKey, string> = {
  sleepTiming: "your sleep has shifted later",
  rhythm: "your days and nights are blending",
  sleepEfficiency: "your nights have been restless",
  activity: "you've been moving less",
  hrv: "your body seems strained",
  voice: "you've sounded quieter",
  mood: "your mood has been lower",
};

export const interventionName = (i: Intervention, friend = "Maya") => (NAME[i] ?? "That").replace("Maya", friend);

/** "Walks have" / "Breathing has" */
export const hasHave = (i: Intervention) => (i === "walk" || i === "soundscape" ? "have" : "has");

/** One-line "why this?" in the DESIGN.md voice. */
export function explain(r: Ranked, friend = "Maya"): string {
  const name = interventionName(r.intervention, friend);
  const why = r.because ? `${BECAUSE[r.because]}` : "";
  if (r.tally.tried === 0) {
    return why ? `Suggested because ${why}. I'll learn what works for you.` : "Something small to try. I'll learn what works for you.";
  }
  const record =
    r.tally.helped === r.tally.tried
      ? `${name} ${hasHave(r.intervention)} helped you every time you've tried it`
      : `${name} ${hasHave(r.intervention)} helped you ${r.tally.helped} of ${r.tally.tried} times`;
  return why ? `${record}, and ${why}.` : `${record}.`;
}
