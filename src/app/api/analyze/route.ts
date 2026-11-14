import type { AnalyzeContext, AnalyzeResponse, CheckinAnalysis } from "@/lib/analysis";
import { analyzeCheckin } from "@/lib/server/claude";
import { transcribe } from "@/lib/server/elevenlabs";

/**
 * POST /api/analyze (multipart/form-data)
 *   audio?:      the check-in recording (webm/mp4/wav), max 10 MB
 *   transcript?: text instead of audio (typed check-in or sample)
 *   context:     JSON AnalyzeContext (persona name, drift level, signal + voice phrases)
 *
 * Audio → ElevenLabs Speech-to-Text → Claude structured analysis.
 * Never fails the demo: on any error returns a canned analysis with source "fallback".
 */

export const maxDuration = 60;

const MAX_BYTES = 10 * 1024 * 1024;

const FALLBACKS: Record<AnalyzeContext["driftLevel"], CheckinAnalysis> = {
  steady: {
    summary: "Brief check-in; content and voice in keeping with usual.",
    themes: ["daily routine"],
    tone: { energy: "medium", valence: "neutral" },
    notable_language: [],
    gentle_reflection: "Thanks for checking in. It sounds like today has a familiar, steady shape to it.",
    suggestion: "walk",
    risk_flag: "none",
  },
  watch: {
    summary: "Check-in suggests somewhat lower energy than usual.",
    themes: ["tiredness"],
    tone: { energy: "low", valence: "mixed" },
    notable_language: [],
    gentle_reflection: "You sound a little more tired than usual today. That's okay, small things count.",
    suggestion: "light",
    risk_flag: "watch",
  },
  drifting: {
    summary: "Lower energy and flatter voice than usual; rhythm shifting over the past week.",
    themes: ["tiredness", "low energy"],
    tone: { energy: "low", valence: "negative" },
    notable_language: [],
    gentle_reflection: "It sounds like things have felt heavier lately. You don't have to fix it all today.",
    suggestion: "message_friend",
    risk_flag: "watch",
  },
};

function parseContext(raw: FormDataEntryValue | null): AnalyzeContext {
  const fallback: AnalyzeContext = { name: "there", driftLevel: "steady", signalPhrases: [] };
  if (typeof raw !== "string") return fallback;
  try {
    const c = JSON.parse(raw) as Partial<AnalyzeContext>;
    return {
      name: typeof c.name === "string" ? c.name.slice(0, 40) : fallback.name,
      driftLevel: c.driftLevel === "watch" || c.driftLevel === "drifting" ? c.driftLevel : "steady",
      signalPhrases: Array.isArray(c.signalPhrases) ? c.signalPhrases.filter((s) => typeof s === "string").slice(0, 8) : [],
      voice: c.voice && typeof c.voice.phrase === "string" ? c.voice : null,
      mood: typeof c.mood === "number" ? c.mood : null,
    };
  } catch {
    return fallback;
  }
}

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "Expected multipart/form-data" }, { status: 400 });
  }

  const ctx = parseContext(form.get("context"));
  const audio = form.get("audio");
  const typed = form.get("transcript");

  let transcript = typeof typed === "string" ? typed.slice(0, 5000).trim() : "";
  let audioEvents: string[] = [];

  try {
    if (!transcript && audio instanceof Blob && audio.size > 0) {
      if (audio.size > MAX_BYTES) {
        return Response.json({ error: "Recording too large" }, { status: 413 });
      }
      const name = audio instanceof File && audio.name ? audio.name : "checkin.webm";
      const t = await transcribe(audio, name);
      transcript = t.text;
      audioEvents = t.audioEvents;
    }

    const analysis = await analyzeCheckin(ctx, transcript, audioEvents);
    return Response.json({ transcript, analysis, source: "live" } satisfies AnalyzeResponse);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[analyze] falling back:", message);
    return Response.json({
      transcript,
      analysis: FALLBACKS[ctx.driftLevel],
      source: "fallback",
      error: message,
    } satisfies AnalyzeResponse);
  }
}
