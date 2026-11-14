/**
 * Demo persona "Aino": 60 days of synthetic daily data.
 * Days 0–47 stable with natural variation (weekends, one wobble that recovers);
 * days 48–59 drift toward relapse along the signals in AGENTS.md → Evidence.
 * Deterministic (seeded) so the demo is identical every time.
 */

export const DAYS = 60;
export const DRIFT_START = 48;

export interface VoiceFeatures {
  /** syllables per second (proxy) */
  speechRate: number;
  /** fraction of the clip that is silence between words */
  pauseRatio: number;
  /** pitch variability, semitones SD */
  pitchVar: number;
  /** mean loudness, dBFS */
  loudness: number;
}

export interface DayData {
  day: number;
  weekday: number; // 0 = Sunday
  sleep: {
    /** minutes asleep */
    duration: number;
    /** hours after midnight, e.g. 3.5 = 03:30 (can be > 24 handled as wrap) */
    midpoint: number;
    /** asleep / in bed, 0..1 */
    efficiency: number;
  };
  hourlySteps: number[]; // 24 values
  steps: number;
  restingHr: number;
  /** Apple Health reports SDNN (ms) */
  hrv: number;
  /** 1–5 self-report, null if skipped */
  mood: number | null;
  /** null if no voice check-in that day */
  voice: VoiceFeatures | null;
}

export const PERSONA = {
  name: "Aino",
  age: 34,
  context: "Finished a 6-week TMS course six weeks ago. Lives in Helsinki, works part-time.",
  circle: ["Maya", "Juho", "Mum"],
};

// ── seeded PRNG ──
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20261114);
const gauss = (sd = 1) => {
  // Box–Muller
  const u = Math.max(rand(), 1e-9);
  const v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v) * sd;
};
const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));
const round = (x: number, d = 0) => Math.round(x * 10 ** d) / 10 ** d;

/** 0 before the drift, easing to 1 on the last day. */
function driftAmount(day: number) {
  if (day < DRIFT_START) return 0;
  const t = (day - DRIFT_START) / (DAYS - 1 - DRIFT_START);
  return t * t * (3 - 2 * t); // smoothstep
}

/** A small mid-period wobble (days 30–33) that recovers: shows the app isn't jumpy. */
function wobble(day: number) {
  return day >= 30 && day <= 33 ? 0.5 * Math.sin(((day - 30) / 3) * Math.PI) : 0;
}

/** Typical activity curve by hour (0..1), active day, quiet night. */
const ACTIVITY_SHAPE = [
  0.03, 0.02, 0.015, 0.015, 0.02, 0.03, 0.08, 0.35, 0.6, 0.45, 0.4, 0.5,
  0.7, 0.55, 0.45, 0.5, 0.65, 0.8, 0.6, 0.4, 0.3, 0.18, 0.08, 0.04,
];
const SHAPE_SUM = ACTIVITY_SHAPE.reduce((a, b) => a + b, 0);

function generate(): DayData[] {
  const days: DayData[] = [];
  // day 59 is "today"; anchor weekday so today is a Saturday (demo day)
  const todayWeekday = 6;

  for (let day = 0; day < DAYS; day++) {
    const weekday = (((todayWeekday - (DAYS - 1 - day)) % 7) + 7) % 7;
    const weekend = weekday === 0 || weekday === 6;
    const d = Math.max(driftAmount(day), wobble(day));

    // Sleep: later, more irregular, less efficient
    const midpoint = 3.4 + (weekend ? 0.6 : 0) + d * 1.8 + gauss(0.25 + d * 0.6);
    const duration = 445 + (weekend ? 25 : 0) - d * 35 + gauss(22 + d * 45);
    const efficiency = 0.9 - d * 0.12 + gauss(0.015 + d * 0.02);

    // Activity: less overall, flatter day/night contrast
    const totalSteps = 7600 + (weekend ? 900 : 0) - d * 4200 + gauss(900);
    const hourlySteps = ACTIVITY_SHAPE.map((w, h) => {
      const night = h < 6 || h >= 23;
      const flattened = w * (1 - d * 0.45) + d * 0.12 * (night ? 1 : 0.6);
      const noise = night ? 1 + gauss(0.5) : 1 + gauss(0.15);
      return Math.max(0, Math.round((flattened / SHAPE_SUM) * totalSteps * noise));
    });

    // Autonomic: resting HR up, HRV down
    const restingHr = 58 + d * 6 + gauss(1.5);
    const hrv = 48 - d * 13 + gauss(4);

    // Self-report
    const moodRaw = 3.9 - d * 1.8 + gauss(0.45);
    const skipped = (day === 55 || day === 57) ? true : day % 9 === 4; // fewer check-ins late
    const mood = skipped ? null : clamp(Math.round(moodRaw), 1, 5);

    // Voice: slower, more pauses, flatter, quieter
    const voice: VoiceFeatures | null = skipped
      ? null
      : {
          speechRate: round(4.3 - d * 0.75 + gauss(0.15), 2),
          pauseRatio: round(clamp(0.21 + d * 0.12 + gauss(0.02), 0.05, 0.6), 3),
          pitchVar: round(2.6 - d * 0.9 + gauss(0.18), 2),
          loudness: round(-22 - d * 4 + gauss(0.8), 1),
        };

    days.push({
      day,
      weekday,
      sleep: {
        duration: Math.round(clamp(duration, 240, 660)),
        midpoint: round(midpoint, 2),
        efficiency: round(clamp(efficiency, 0.6, 0.98), 3),
      },
      hourlySteps,
      steps: hourlySteps.reduce((a, b) => a + b, 0),
      restingHr: round(restingHr, 1),
      hrv: round(hrv, 1),
      mood,
      voice,
    });
  }
  return days;
}

export const DEMO_DAYS: DayData[] = generate();
