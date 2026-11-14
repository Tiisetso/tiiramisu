import "server-only";

const STT_URL = "https://api.elevenlabs.io/v1/speech-to-text";
const MODELS = ["scribe_v2", "scribe_v1"];

export interface Transcription {
  text: string;
  /** e.g. "(sighs)", "(laughs)" when audio-event tagging is available */
  audioEvents: string[];
}

/** Speech-to-Text via ElevenLabs Scribe. Tries scribe_v2, falls back to scribe_v1. */
export async function transcribe(audio: Blob, filename = "checkin.webm"): Promise<Transcription> {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error("ELEVENLABS_API_KEY is not set");

  let lastError = "";
  for (const model of MODELS) {
    const form = new FormData();
    form.append("file", audio, filename);
    form.append("model_id", model);
    form.append("tag_audio_events", "true");

    const res = await fetch(STT_URL, {
      method: "POST",
      headers: { "xi-api-key": key },
      body: form,
      signal: AbortSignal.timeout(20_000),
    });

    if (res.ok) {
      const data = (await res.json()) as {
        text?: string;
        words?: { text: string; type?: string }[];
      };
      const audioEvents = (data.words ?? []).filter((w) => w.type === "audio_event").map((w) => w.text);
      return { text: (data.text ?? "").trim(), audioEvents };
    }

    lastError = `${model}: ${res.status} ${await res.text().catch(() => "")}`.slice(0, 300);
    // Only retry with the older model for request-shape errors; auth/quota errors won't improve.
    if (![400, 404, 422].includes(res.status)) break;
  }
  throw new Error(`ElevenLabs STT failed (${lastError})`);
}
