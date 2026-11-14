/**
 * Shared contract for POST /api/analyze (server: src/app/api/analyze/route.ts).
 * Safe to import from client components (types + zod only, no secrets).
 */
import { z } from "zod";

export const INTERVENTIONS = ["walk", "breathe", "soundscape", "message_friend", "light", "rest"] as const;
export type Intervention = (typeof INTERVENTIONS)[number];

export const CheckinAnalysisSchema = z.object({
  /** neutral one-liner for the clinician view */
  summary: z.string(),
  /** 1–4 short lowercase themes, e.g. "work stress", "poor sleep" */
  themes: z.array(z.string()),
  tone: z.object({
    energy: z.enum(["low", "medium", "high"]),
    valence: z.enum(["negative", "mixed", "neutral", "positive"]),
  }),
  notable_language: z.array(
    z.object({
      kind: z.enum([
        "hopelessness",
        "isolation",
        "sleep",
        "fatigue",
        "anxiety",
        "self_criticism",
        "absolutist",
        "positive_coping",
        "self_harm",
      ]),
      quote: z.string(),
    }),
  ),
  /** 1–2 warm sentences back to the user (DESIGN.md voice rules) */
  gentle_reflection: z.string(),
  /** best next small step, feeds the response loop (#8) */
  suggestion: z.enum(INTERVENTIONS),
  /** reach_out → show the crisis sheet + notify clinician */
  risk_flag: z.enum(["none", "watch", "reach_out"]),
});

export type CheckinAnalysis = z.infer<typeof CheckinAnalysisSchema>;

/** On-device voice features relative to the person's usual (z-ish, + = livelier). */
export interface VoiceDeltas {
  speechRate: number;
  pauseRatio: number;
  pitchVar: number;
  loudness: number;
}

export interface AnalyzeContext {
  name: string;
  driftLevel: "steady" | "watch" | "drifting";
  /** plain-language phrases of signals moving away from usual */
  signalPhrases: string[];
  voice?: { phrase: string; deltas: VoiceDeltas } | null;
  mood?: number | null;
}

export interface AnalyzeResponse {
  transcript: string;
  analysis: CheckinAnalysis;
  /** where the analysis came from; "fallback" means a canned demo-safe response */
  source: "live" | "fallback";
  error?: string;
}
