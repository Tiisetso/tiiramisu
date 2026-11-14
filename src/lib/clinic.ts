/** Shared contract for POST /api/clinic-summary (client-safe). */
import { z } from "zod";
import type { CheckinAnalysis, VoiceDeltas } from "@/lib/analysis";

export const ClinicSummarySchema = z.object({
  /** 2–3 sentences, clinical but plain */
  summary: z.string(),
  /** up to 3 short things to ask about or watch */
  watch_points: z.array(z.string()),
  suggested_action: z.enum(["call_today", "call_this_week", "message", "routine"]),
});
export type ClinicSummary = z.infer<typeof ClinicSummarySchema>;

export interface ClinicPatientInput {
  name: string;
  weeksSinceTms: number;
  level: "steady" | "watch" | "drifting";
  driftScore: number;
  missedCheckins: number;
  signals: { label: string; phrase: string; z: number }[];
  quotes: string[];
}

export const ACTION_LABEL: Record<ClinicSummary["suggested_action"], string> = {
  call_today: "Call today",
  call_this_week: "Call this week",
  message: "Send a message",
  routine: "Routine follow-up",
};

/** A check-in shared with the clinic (stored in Aiven; never audio). */
export interface StoredCheckin {
  id: string;
  patientId: string;
  day: number;
  transcript: string | null;
  analysis: CheckinAnalysis;
  voice: { phrase: string; deltas: VoiceDeltas } | null;
  source: string | null;
  createdAt: string;
}
