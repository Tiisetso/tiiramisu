/**
 * "Your usual voice": the first check-in on a device becomes the baseline,
 * later check-ins are compared to it. Stored in localStorage (per device, demo-grade).
 */
import type { VoiceDeltas } from "@/lib/analysis";
import type { VoiceFeatures } from "@/lib/demo/persona";

const KEY = "tiiramisu.voiceBaseline.v1";

/** Typical day-to-day spread per feature: one "unit" of change. */
const SCALE: VoiceDeltas = { speechRate: 0.35, pauseRatio: 0.05, pitchVar: 0.4, loudness: 2.0 };

export function loadVoiceBaseline(): VoiceFeatures | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as VoiceFeatures) : null;
  } catch {
    return null;
  }
}

export function saveVoiceBaseline(f: VoiceFeatures) {
  try {
    localStorage.setItem(KEY, JSON.stringify(f));
  } catch {
    /* storage unavailable (private mode): baseline lasts this session only */
  }
}

export function clearVoiceBaseline() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

/** Signed deltas: + = livelier than usual (faster, fewer pauses, more melodic, louder). */
export function voiceDeltas(today: VoiceFeatures, usual: VoiceFeatures): VoiceDeltas {
  return {
    speechRate: (today.speechRate - usual.speechRate) / SCALE.speechRate,
    pauseRatio: -(today.pauseRatio - usual.pauseRatio) / SCALE.pauseRatio,
    pitchVar: (today.pitchVar - usual.pitchVar) / SCALE.pitchVar,
    loudness: (today.loudness - usual.loudness) / SCALE.loudness,
  };
}

const ADJ: Partial<Record<keyof VoiceDeltas, [lower: string, higher: string]>> = {
  loudness: ["quieter", "louder"],
  speechRate: ["slower", "quicker"],
  pitchVar: ["flatter", "more animated"],
};

const join = (ws: string[]) => ws.join(" and ");

/** Plain-language phrase following DESIGN.md voice rules, e.g. "A little quieter than usual, with more pauses". */
export function voicePhrase(d: VoiceDeltas): string {
  const keys = Object.keys(ADJ) as (keyof VoiceDeltas)[];
  const low = keys.filter((k) => d[k] <= -1).sort((a, b) => d[a] - d[b]).slice(0, 2);
  const high = keys.filter((k) => d[k] >= 1.2).sort((a, b) => d[b] - d[a]).slice(0, 2);
  const morePauses = d.pauseRatio <= -1;
  const fewerPauses = d.pauseRatio >= 1.2;

  if (low.length || morePauses) {
    const words = low.map((k) => ADJ[k]![0]);
    if (!words.length) return "More pauses than usual";
    return `A little ${join(words)} than usual${morePauses ? ", with more pauses" : ""}`;
  }
  if (high.length || fewerPauses) {
    const words = high.map((k) => ADJ[k]![1]);
    if (!words.length) return "More flowing than usual";
    return `A bit ${join(words)} than usual${fewerPauses ? ", and more flowing" : ""}`;
  }
  return "Sounding like yourself";
}

/** Mean delta (+ livelier), for the voice signal and the light field. */
export const voiceEnergyDelta = (d: VoiceDeltas) => (d.speechRate + d.pauseRatio + d.pitchVar + d.loudness) / 4;
