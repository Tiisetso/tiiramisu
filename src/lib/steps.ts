/**
 * Graded steps (behavioural activation): on harder days the same suggestion gets smaller,
 * so starting feels possible. The smaller step is never framed as "less".
 */
import type { Intervention } from "@/lib/analysis";
import type { DriftLevel } from "@/lib/signals";

export interface Step {
  /** chip label on Today */
  chip: string;
  title: string;
  body: string;
  /** label of the "I did it" button */
  done: string;
  /** breaths in the breathing guide */
  rounds?: number;
}

type Table = Record<Exclude<Intervention, "message_friend" | "soundscape">, Record<DriftLevel, Step>>;

const STEPS: Table = {
  walk: {
    steady: { chip: "Walk outside · 10 min", title: "A short walk outside", body: "Ten minutes is plenty. If you like, notice three things you can hear on the way.", done: "I went" },
    watch: { chip: "Short walk · 5 min", title: "Five minutes outside", body: "Around the block, or just to the corner and back. That counts.", done: "I went" },
    drifting: { chip: "Step outside · 2 min", title: "Just step outside the door", body: "Two minutes is enough. Feel the air on your face, then come back in if you like.", done: "I did it" },
  },
  light: {
    steady: { chip: "Morning light · 10 min", title: "Some morning light", body: "Open the curtains or step outside for ten minutes. Light early in the day helps your body find its rhythm again.", done: "Done" },
    watch: { chip: "Light · 5 min by a window", title: "Five minutes by a window", body: "Sit somewhere bright for a few minutes. Your body notices, even if you don't.", done: "Done" },
    drifting: { chip: "Open the curtains", title: "Open the curtains", body: "Just let some daylight in. That's all for now.", done: "Done" },
  },
  breathe: {
    steady: { chip: "Breathe · 3 min", title: "Breathe with me", body: "In for four, out for six. A few rounds is enough.", done: "Done", rounds: 5 },
    watch: { chip: "Three slow breaths", title: "Three slow breaths", body: "In for four, out for six. Just three.", done: "Done", rounds: 3 },
    drifting: { chip: "One slow breath", title: "One slow breath", body: "Just one, with me. In for four, out for six.", done: "Done", rounds: 1 },
  },
  rest: {
    steady: { chip: "Permission to rest", title: "Permission to rest", body: "You don't have to do anything today. Rest is part of staying well, not a step back.", done: "Thank you" },
    watch: { chip: "Permission to rest", title: "Permission to rest", body: "You don't have to do anything today. Rest is part of staying well, not a step back.", done: "Thank you" },
    drifting: { chip: "Permission to rest", title: "Permission to rest", body: "Today can be a resting day. That's allowed, and it's part of getting through.", done: "Thank you" },
  },
};

const SOUNDS: Record<DriftLevel, string> = { steady: "Calm sounds · 5 min", watch: "Calm sounds · 3 min", drifting: "Calm sounds · 1 min" };

export function stepFor(i: Intervention, level: DriftLevel, friend = "Maya"): Step {
  if (i === "message_friend") {
    const chip = level === "drifting" ? `Send ${friend} a wave` : `Wave to ${friend}`;
    return { chip, title: `Wave to ${friend}`, body: "No need for a long message. One tap is enough.", done: "Done" };
  }
  if (i === "soundscape") {
    return { chip: SOUNDS[level], title: "Some calm sounds", body: "A few minutes of sound that follows how you're doing today.", done: "Open Calm" };
  }
  return STEPS[i][level];
}
