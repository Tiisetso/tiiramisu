import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { CheckinAnalysisSchema, type AnalyzeContext, type CheckinAnalysis } from "@/lib/analysis";

const client = new Anthropic(); // reads ANTHROPIC_API_KEY

const SYSTEM = `You are the listening layer of Tiiramisu, a warm daily companion for people who recently finished TMS treatment for depression and want to stay well at home.

Each day the person records a short, open-ended voice check-in. You receive the transcript, any audio events (sighs, laughter), how their voice sounded compared with their own usual (measured on device), and plain-language notes about their sleep and activity rhythm compared with their usual.

Return a structured analysis:
- summary: one neutral, factual sentence for their clinician.
- themes: 1-4 short lowercase themes actually present in what they said.
- tone: overall energy and emotional valence, combining the words and the voice notes.
- notable_language: short verbatim quotes (max ~12 words) that show hopelessness, isolation, sleep problems, fatigue, anxiety, self-criticism, absolutist wording ("always", "never", "nothing"), positive coping, or any self-harm content. Empty if none. Never invent quotes.
- gentle_reflection: 1-2 sentences spoken directly to the person. Warm, plain, second person, like a kind friend who noticed. Reflect something specific they said. Invite, don't instruct. Never diagnose. Never use the words risk, relapse, score, warning, failed, missed or streak. No exclamation marks, no toxic positivity.
- suggestion: the single small next step most likely to help today: walk (gentle movement or time outside), breathe (short breathing exercise), soundscape (calming sound), message_friend (low-effort contact with someone close), light (morning light / opening curtains), rest (permission to slow down).
- risk_flag: "reach_out" if there is any mention of self-harm, suicide, wanting to disappear, or feeling unsafe; "watch" if the content or voice suggests things are noticeably harder than usual; otherwise "none". When reach_out, the gentle_reflection should acknowledge them with care and encourage connecting with someone right now (the app will show support options); do not lecture.

If the transcript is empty or unclear, keep the reflection gentle and general, and use the voice and rhythm notes.`;

function contextBlock(ctx: AnalyzeContext, transcript: string, audioEvents: string[]) {
  const lines = [
    `Name: ${ctx.name}`,
    `Overall rhythm vs their usual: ${ctx.driftLevel}`,
    ctx.signalPhrases.length ? `What's shifted: ${ctx.signalPhrases.join("; ")}` : "What's shifted: nothing notable",
    ctx.voice ? `Voice today vs their usual: ${ctx.voice.phrase}` : "Voice today: not measured",
    ctx.mood != null ? `Self-rated mood today (1-5): ${ctx.mood}` : null,
    audioEvents.length ? `Audio events: ${audioEvents.join(", ")}` : null,
    "",
    "Transcript:",
    transcript ? `"""${transcript}"""` : "(empty)",
  ];
  return lines.filter((l) => l !== null).join("\n");
}

export async function analyzeCheckin(
  ctx: AnalyzeContext,
  transcript: string,
  audioEvents: string[] = [],
): Promise<CheckinAnalysis> {
  const response = await client.beta.messages.parse({
    model: "claude-opus-5-5",
    max_tokens: 2048, // short structured output
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: SYSTEM,
    messages: [{ role: "user", content: contextBlock(ctx, transcript, audioEvents) }],
    output_config: {
      effort: "low", // fast enough for a live demo; task is simple
      format: betaZodOutputFormat(CheckinAnalysisSchema),
    },
  });

  if (response.stop_reason === "refusal") {
    throw new Error(`Claude declined (${response.stop_details?.category ?? "unknown"})`);
  }
  if (!response.parsed_output) {
    throw new Error(`No structured output (stop_reason: ${response.stop_reason})`);
  }
  return response.parsed_output;
}
