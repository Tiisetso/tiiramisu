/**
 * Signals vs personal baseline. Shared by Today (#6), check-in (#4),
 * response loop (#8) and clinician view (#11).
 *
 * Baseline = the 28 days before the most recent week. Each signal is compared
 * as a z-score of the last-7-day value vs that baseline, signed so that
 * positive = "moving away from your usual in the concerning direction".
 */
import type { DayData } from "@/lib/demo/persona";

export type SignalKey = "sleepTiming" | "sleepEfficiency" | "rhythm" | "activity" | "hrv" | "voice" | "mood";

export interface Signal {
  key: SignalKey;
  label: string;
  /** recent value (7-day mean) */
  value: number;
  baselineMean: number;
  baselineSd: number;
  /** signed: + = concerning direction */
  z: number;
  /** last 14 days of daily values for sparklines (null = no data) */
  series: (number | null)[];
  /** plain-language delta, DESIGN.md voice rules */
  phrase: string;
}

export type DriftLevel = "steady" | "watch" | "drifting";

export interface DayState {
  day: number;
  signals: Signal[];
  /** weighted mean of positive z-scores */
  driftScore: number;
  level: DriftLevel;
  /** signals contributing most to drift, most first */
  top: Signal[];
  missedCheckins: number;
}

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / Math.max(xs.length, 1);
const sd = (xs: number[]) => {
  const m = mean(xs);
  return Math.sqrt(mean(xs.map((x) => (x - m) ** 2))) || 1e-6;
};
const defined = <T,>(xs: (T | null)[]) => xs.filter((x): x is T => x !== null);

/** Relative amplitude of the rest-activity rhythm: (M10 − L5) / (M10 + L5). 1 = strong day/night contrast. */
export function relativeAmplitude(hourly: number[]) {
  const roll = (n: number) =>
    hourly.map((_, i) => mean(Array.from({ length: n }, (_, k) => hourly[(i + k) % 24])));
  const m10 = Math.max(...roll(10));
  const l5 = Math.min(...roll(5));
  return (m10 - l5) / (m10 + l5 || 1);
}

/** Composite voice energy: higher = livelier. Speech rate, pitch variability, loudness up; pauses down. */
export function voiceEnergy(v: NonNullable<DayData["voice"]>) {
  return (v.speechRate - 4.3) / 0.3 + (v.pitchVar - 2.6) / 0.35 + (v.loudness + 22) / 1.5 - (v.pauseRatio - 0.21) / 0.04;
}

interface Extractor {
  key: SignalKey;
  label: string;
  /** +1 if higher is concerning, −1 if lower is concerning */
  direction: 1 | -1;
  weight: number;
  get: (d: DayData) => number | null;
  /** smallest SD treated as meaningful, so tiny baseline noise can't inflate z */
  sdFloor: number;
  phrases: [steady: string, up: string];
}

const EXTRACTORS: Extractor[] = [
  {
    key: "sleepTiming",
    sdFloor: 0.35,
    label: "Sleep timing",
    direction: 1,
    weight: 1.2,
    get: (d) => d.sleep.midpoint,
    phrases: ["Around your usual time", "Drifting later than usual"],
  },
  {
    key: "sleepEfficiency",
    sdFloor: 0.02,
    label: "Sleep quality",
    direction: -1,
    weight: 1,
    get: (d) => d.sleep.efficiency,
    phrases: ["Restful, like usual", "A bit more restless than usual"],
  },
  {
    key: "rhythm",
    sdFloor: 0.03,
    label: "Day & night rhythm",
    direction: -1,
    weight: 1.4,
    get: (d) => relativeAmplitude(d.hourlySteps),
    phrases: ["Clear days, quiet nights", "Days and nights blending together"],
  },
  {
    key: "activity",
    sdFloor: 700,
    label: "Movement",
    direction: -1,
    weight: 0.8,
    get: (d) => d.steps,
    phrases: ["About as active as usual", "Moving less than usual"],
  },
  {
    key: "hrv",
    sdFloor: 3,
    label: "Body calm (HRV)",
    direction: -1,
    weight: 0.8,
    get: (d) => d.hrv,
    phrases: ["Your body seems settled", "Your body seems a little more strained"],
  },
  {
    key: "voice",
    sdFloor: 1,
    label: "Voice",
    direction: -1,
    weight: 1.2,
    get: (d) => (d.voice ? voiceEnergy(d.voice) : null),
    phrases: ["Sounding like yourself", "Sounding a bit quieter and slower"],
  },
  {
    key: "mood",
    sdFloor: 0.5,
    label: "Mood",
    direction: -1,
    weight: 1,
    get: (d) => d.mood,
    phrases: ["Steady", "Lower than usual"],
  },
];

const RECENT = 7;
const Z_CAP = 4;
const BASELINE = 28;

export function computeDayState(days: DayData[], day: number): DayState {
  const upto = days.slice(0, day + 1);
  const recent = upto.slice(-RECENT);
  const base = upto.slice(-(RECENT + BASELINE), -RECENT);
  const baseDays = base.length >= 7 ? base : upto.slice(0, Math.max(7, upto.length)); // early days: use what we have

  const signals: Signal[] = EXTRACTORS.map((x) => {
    const recentVals = defined(recent.map(x.get));
    const baseVals = defined(baseDays.map(x.get));
    const value = recentVals.length ? mean(recentVals) : mean(baseVals);
    const bm = mean(baseVals);
    const bs = Math.max(sd(baseVals), x.sdFloor);
    const rawZ = recentVals.length ? ((value - bm) / bs) * x.direction : 0;
    const z = Math.max(-Z_CAP, Math.min(Z_CAP, rawZ));
    return {
      key: x.key,
      label: x.label,
      value,
      baselineMean: bm,
      baselineSd: bs,
      z,
      series: upto.slice(-14).map(x.get),
      phrase: z > 1 ? x.phrases[1] : x.phrases[0],
    };
  });

  const weights = Object.fromEntries(EXTRACTORS.map((x) => [x.key, x.weight]));
  const wsum = EXTRACTORS.reduce((a, x) => a + x.weight, 0);
  const driftScore = signals.reduce((a, s) => a + Math.max(0, s.z) * weights[s.key], 0) / wsum;
  const missedCheckins = recent.filter((d) => d.voice === null).length;

  const level: DriftLevel = driftScore >= 1.1 ? "drifting" : driftScore >= 0.6 ? "watch" : "steady";
  // ties (z is capped) go to the signal with stronger evidence (higher weight)
  const top = [...signals].filter((s) => s.z > 1).sort((a, b) => b.z - a.z || weights[b.key] - weights[a.key]);

  return { day, signals, driftScore, level, top, missedCheckins };
}
