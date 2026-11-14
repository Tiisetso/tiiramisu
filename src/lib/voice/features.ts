/**
 * On-device voice features (no audio leaves the device for this part).
 * Frame-level RMS + pitch → speaking rate, pause ratio, pitch variability, loudness.
 * Pure functions: used by the live recorder and for analysing sample files.
 */
import type { VoiceFeatures } from "@/lib/demo/persona";

export interface Frame {
  /** seconds since start */
  t: number;
  /** RMS level, dBFS */
  db: number;
  /** fundamental frequency in Hz, null if unvoiced */
  f0: number | null;
}

const TARGET_RATE = 16000;

/** RMS of a buffer in dBFS. */
export function rmsDb(buf: Float32Array) {
  let sum = 0;
  for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
  const rms = Math.sqrt(sum / buf.length);
  return 20 * Math.log10(rms + 1e-9);
}

/**
 * Pitch by normalised autocorrelation on a decimated copy (cheap enough for phones).
 * Returns null for unvoiced/noisy frames.
 */
export function detectPitch(buf: Float32Array, sampleRate: number): number | null {
  const step = Math.max(1, Math.round(sampleRate / TARGET_RATE));
  const sr = sampleRate / step;
  const n = Math.floor(buf.length / step);
  if (n < 256) return null;
  const x = new Float32Array(n);
  let mean = 0;
  for (let i = 0; i < n; i++) {
    x[i] = buf[i * step];
    mean += x[i];
  }
  mean /= n;
  for (let i = 0; i < n; i++) x[i] -= mean;

  const minLag = Math.floor(sr / 400); // 400 Hz
  const maxLag = Math.min(n - 1, Math.ceil(sr / 70)); // 70 Hz
  let r0 = 0;
  for (let i = 0; i < n; i++) r0 += x[i] * x[i];
  if (r0 < 1e-6) return null;

  let bestLag = -1;
  let best = 0;
  for (let lag = minLag; lag <= maxLag; lag++) {
    let r = 0;
    for (let i = 0; i < n - lag; i++) r += x[i] * x[i + lag];
    r /= r0;
    if (r > best) {
      best = r;
      bestLag = lag;
    }
  }
  if (best < 0.55 || bestLag < 0) return null;
  return sr / bestLag;
}

const percentile = (xs: number[], p: number) => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.max(0, Math.floor(p * (s.length - 1))))];
};
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);

/** Turn frames into the four check-in features. Null if there's too little speech. */
export function computeFeatures(frames: Frame[]): VoiceFeatures | null {
  if (frames.length < 20) return null;
  const dbs = frames.map((f) => f.db);
  const floor = percentile(dbs, 0.1);
  const loud = percentile(dbs, 0.95);
  const thr = Math.max(floor + 6, floor + 0.35 * (loud - floor));
  const speech = frames.map((f) => f.db > thr);

  const first = speech.indexOf(true);
  const last = speech.lastIndexOf(true);
  if (first < 0 || last <= first) return null;
  const span = frames[last].t - frames[first].t;
  if (span < 1.5) return null;

  // Pauses: silent runs ≥ 200 ms inside the speaking span
  let pauseTime = 0;
  let runStart: number | null = null;
  for (let i = first; i <= last; i++) {
    if (!speech[i] && runStart === null) runStart = frames[i].t;
    if (speech[i] && runStart !== null) {
      const len = frames[i].t - runStart;
      if (len >= 0.2) pauseTime += len;
      runStart = null;
    }
  }
  const pauseRatio = pauseTime / span;

  // Syllable nuclei: peaks in the smoothed envelope, ≥100 ms apart, with a ≥2 dB dip between
  const env = dbs.map((_, i) => mean(dbs.slice(Math.max(0, i - 1), i + 2)));
  let peaks = 0;
  let lastPeakT = -1;
  let minSincePeak = Infinity;
  for (let i = first + 1; i < last; i++) {
    minSincePeak = Math.min(minSincePeak, env[i]);
    const isPeak = env[i] > env[i - 1] && env[i] >= env[i + 1] && env[i] > thr + 3;
    if (isPeak && frames[i].t - lastPeakT >= 0.1 && (lastPeakT < 0 || env[i] - minSincePeak >= 2)) {
      peaks++;
      lastPeakT = frames[i].t;
      minSincePeak = Infinity;
    }
  }
  const speechRate = peaks / span;

  // Pitch variability in semitones around the median, ignoring octave errors
  const f0s = frames.filter((f, i) => speech[i] && f.f0 !== null).map((f) => f.f0 as number);
  const med = percentile(f0s, 0.5);
  const semis = f0s.map((f) => 12 * Math.log2(f / med)).filter((s) => Math.abs(s) < 10);
  const pitchVar = semis.length > 5 ? Math.sqrt(mean(semis.map((s) => s * s)) - mean(semis) ** 2) : 0;

  const loudness = mean(frames.filter((_, i) => speech[i]).map((f) => f.db));

  const r = (x: number, d: number) => Math.round(x * 10 ** d) / 10 ** d;
  return {
    speechRate: r(speechRate, 2),
    pauseRatio: r(pauseRatio, 3),
    pitchVar: r(pitchVar, 2),
    loudness: r(loudness, 1),
  };
}

/** Offline: analyse a decoded file (e.g. a sample recording) with the same pipeline. */
export function framesFromBuffer(channel: Float32Array, sampleRate: number, win = 2048, hop = 800): Frame[] {
  const frames: Frame[] = [];
  for (let start = 0; start + win <= channel.length; start += hop) {
    const buf = channel.subarray(start, start + win);
    const db = rmsDb(buf);
    frames.push({ t: start / sampleRate, db, f0: db > -60 ? detectPitch(buf, sampleRate) : null });
  }
  return frames;
}
