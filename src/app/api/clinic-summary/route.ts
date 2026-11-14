import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { ClinicSummarySchema, type ClinicPatientInput, type ClinicSummary } from "@/lib/clinic";

/**
 * POST /api/clinic-summary  { patient: ClinicPatientInput }
 * → { summary: ClinicSummary, source: "live" | "fallback" }
 * Short clinician-facing summary of the week. Cached per patient+state in memory.
 */

export const maxDuration = 60;

const client = new Anthropic();
const cache = new Map<string, ClinicSummary>();

const SYSTEM = `You support clinicians who follow patients at home after TMS treatment for depression. They have very little time.
From a week of passive signals (compared with the patient's own 4-week baseline, z-scores where positive = moving in a concerning direction) and short check-in quotes, write:
- summary: 2-3 plain, factual sentences on how the patient's week has changed and why it matters. Clinical tone, no jargon, no diagnosis, no alarmism.
- watch_points: up to 3 short, concrete things worth asking about on a call.
- suggested_action: call_today (any self-harm content, or a strong multi-signal drift plus concerning language), call_this_week (clear drift), message (mild change or missed check-ins only), routine (steady).
Only use what's in the data. Never invent events or quotes.`;

function fallback(p: ClinicPatientInput): ClinicSummary {
  const shifted = p.signals.filter((s) => s.z > 1).map((s) => s.label.toLowerCase());
  return {
    summary:
      p.level === "steady"
        ? `${p.name.split(" ")[0]} is close to their usual across sleep, activity and voice.${p.missedCheckins >= 3 ? ` ${p.missedCheckins} missed check-ins this week.` : ""}`
        : `${p.name.split(" ")[0]} has moved away from their usual this week: ${shifted.join(", ") || "several signals"}.`,
    watch_points: shifted.slice(0, 3).map((s) => `Ask about ${s}`),
    suggested_action: p.level === "drifting" ? "call_this_week" : p.level === "watch" || p.missedCheckins >= 3 ? "message" : "routine",
  };
}

export async function POST(request: Request) {
  let p: ClinicPatientInput;
  try {
    ({ patient: p } = (await request.json()) as { patient: ClinicPatientInput });
    if (!p?.name || !Array.isArray(p.signals)) throw new Error("bad input");
  } catch {
    return Response.json({ error: "Expected { patient }" }, { status: 400 });
  }

  const key = JSON.stringify([p.name, p.level, p.driftScore.toFixed(1), p.missedCheckins]);
  const hit = cache.get(key);
  if (hit) return Response.json({ summary: hit, source: "live" });

  const data = [
    `Patient: ${p.name}, ${p.weeksSinceTms} weeks after TMS`,
    `Overall: ${p.level} (drift score ${p.driftScore.toFixed(2)}; >1.1 = drifting)`,
    `Missed check-ins in the last 7 days: ${p.missedCheckins}`,
    "Signals vs own baseline:",
    ...p.signals.map((s) => `- ${s.label}: z=${s.z.toFixed(1)} (${s.phrase})`),
    "Recent check-in quotes:",
    ...p.quotes.slice(0, 5).map((q) => `- "${q.slice(0, 300)}"`),
  ].join("\n");

  try {
    const response = await client.beta.messages.parse({
      model: "claude-opus-5-5",
      max_tokens: 2048,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: SYSTEM,
      messages: [{ role: "user", content: data }],
      output_config: { effort: "low", format: betaZodOutputFormat(ClinicSummarySchema) },
    });
    if (response.stop_reason === "refusal" || !response.parsed_output) throw new Error(`no output (${response.stop_reason})`);
    cache.set(key, response.parsed_output);
    return Response.json({ summary: response.parsed_output, source: "live" });
  } catch (err) {
    console.error("[clinic-summary] falling back:", err instanceof Error ? err.message : err);
    return Response.json({ summary: fallback(p), source: "fallback" });
  }
}
