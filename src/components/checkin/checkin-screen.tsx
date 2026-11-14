"use client";

import { AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";
import { CrisisSheet } from "@/components/crisis-sheet";
import { useDemo, type CheckinResult } from "@/components/demo-provider";
import { Button, FadeRise } from "@/components/motion";
import { Orb } from "@/components/orb";
import { useSound } from "@/components/sound-provider";
import type { AnalyzeContext, AnalyzeResponse, VoiceDeltas } from "@/lib/analysis";
import { loadVoiceBaseline, saveVoiceBaseline, voiceDeltas, voicePhrase } from "@/lib/voice/baseline";
import { MAX_SECONDS, useVoiceRecorder, type Recording } from "@/lib/voice/recorder";
import { useDemoMode } from "@/lib/use-client";

type Phase = "intro" | "recording" | "thinking" | "result" | "typed";

const PROMPTS = [
  "How has this morning been for you?",
  "What's been on your mind today?",
  "Tell me a little about yesterday.",
  "How did you sleep, and how are you feeling now?",
];

/** Demo-safe samples (used until real recordings are in public/samples). */
const SAMPLES: { label: string; transcript: string; deltas: VoiceDeltas }[] = [
  {
    label: "Steady day",
    transcript:
      "Morning. I slept fine, woke up around seven. I'm meeting Maya for a walk by the sea later, which I'm looking forward to. Work's a bit busy but manageable.",
    deltas: { speechRate: 0.2, pauseRatio: 0.1, pitchVar: 0.3, loudness: 0 },
  },
  {
    label: "Harder day",
    transcript:
      "I don't know. I'm just tired. I stayed in bed most of yesterday, didn't really want to see anyone. Nothing ever seems to get easier. I did make tea this morning though.",
    deltas: { speechRate: -1.6, pauseRatio: -1.9, pitchVar: -1.3, loudness: -1.5 },
  },
];

const fmt = (s: number) => `0:${String(Math.max(0, Math.ceil(s))).padStart(2, "0")}`;

export function CheckinScreen({ onDone }: { onDone: () => void }) {
  const { persona, day, today, state, levelRef, setActivityMood, setCheckin, checkin } = useDemo();
  const demo = useDemoMode();
  const recorder = useVoiceRecorder(levelRef);
  const { duck } = useSound();
  const [phase, setPhase] = useState<Phase>(checkin ? "result" : "intro");
  const [result, setResult] = useState<CheckinResult | null>(checkin);
  const [crisisOpen, setCrisisOpen] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [typedText, setTypedText] = useState("");
  const [typedMood, setTypedMood] = useState<number | null>(null);

  const prompt = PROMPTS[day % PROMPTS.length];

  // Leaving the screen: stop the mic and give the light field back
  useEffect(
    () => () => {
      setActivityMood(null);
      duck(false);
    },
    [setActivityMood, duck],
  );

  const context = (voice: CheckinResult["voice"], mood: number | null): AnalyzeContext => ({
    name: persona.name,
    driftLevel: state.level,
    signalPhrases: state.top.map((s) => s.phrase),
    voice,
    mood,
  });

  async function submit(body: FormData, voice: CheckinResult["voice"], isBaseline: boolean) {
    setPhase("thinking");
    setActivityMood("listening");
    let response: AnalyzeResponse;
    try {
      const res = await fetch("/api/analyze", { method: "POST", body });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      response = (await res.json()) as AnalyzeResponse;
    } catch {
      response = {
        transcript: "",
        source: "fallback",
        analysis: {
          summary: "Check-in recorded; analysis unavailable (offline).",
          themes: [],
          tone: { energy: "medium", valence: "neutral" },
          notable_language: [],
          gentle_reflection: "Thank you for checking in. Just pausing to notice how you are is a good thing.",
          suggestion: "breathe",
          risk_flag: "none",
        },
      };
    }
    const r: CheckinResult = { day, response, voice, isBaseline };
    setResult(r);
    setCheckin(r);
    setActivityMood(response.analysis.tone.valence === "positive" ? "bright" : null);
    setPhase("result");
    if (response.analysis.risk_flag === "reach_out") setCrisisOpen(true);
  }

  async function startRecording() {
    setNote(null);
    setActivityMood("listening");
    setPhase("recording");
    duck(true); // keep the soundscape out of the mic
    const status = await recorder.start();
    if (status === "denied" || status === "unsupported") {
      duck(false);
      // gentle typed path instead
      setActivityMood(null);
      setNote(
        status === "denied"
          ? "No problem, the microphone is off. You can tell me in a few words instead."
          : "Voice isn't available on this browser. You can tell me in a few words instead.",
      );
      setPhase("typed");
    }
  }

  async function finishRecording() {
    const rec = await recorder.stop();
    duck(false);
    if (!rec) return;
    if (rec.duration < 2) {
      setActivityMood(null);
      setNote("That was a little short. Whenever you're ready, try again.");
      setPhase("intro");
      return;
    }
    await sendRecording(rec);
  }

  async function sendRecording(rec: Recording) {
    let voice: CheckinResult["voice"] = null;
    let isBaseline = false;
    if (rec.features) {
      const usual = loadVoiceBaseline();
      if (!usual) {
        saveVoiceBaseline(rec.features);
        isBaseline = true;
        voice = { phrase: "I'll remember how you usually sound", deltas: { speechRate: 0, pauseRatio: 0, pitchVar: 0, loudness: 0 } };
      } else {
        const deltas = voiceDeltas(rec.features, usual);
        voice = { phrase: voicePhrase(deltas), deltas };
      }
    }
    const body = new FormData();
    body.append("audio", rec.blob, rec.filename);
    body.append("context", JSON.stringify(context(isBaseline ? null : voice, today.mood)));
    await submit(body, voice, isBaseline);
  }

  async function sendSample(i: number) {
    const s = SAMPLES[i];
    const voice = { phrase: voicePhrase(s.deltas), deltas: s.deltas };
    const body = new FormData();
    body.append("transcript", s.transcript);
    body.append("context", JSON.stringify(context(voice, today.mood)));
    await submit(body, voice, false);
  }

  async function sendTyped() {
    const body = new FormData();
    body.append("transcript", typedText.trim() || "(no words today, just a mood rating)");
    body.append("context", JSON.stringify(context(null, typedMood)));
    await submit(body, null, false);
  }

  const orbState = phase === "recording" ? "listening" : phase === "thinking" ? "thinking" : phase === "result" ? "done" : "idle";
  const remaining = MAX_SECONDS - recorder.elapsed;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[560px] flex-col px-5 pt-[max(40px,env(safe-area-inset-top))] safe-bottom">
      <div className="flex items-center justify-between">
        <button onClick={() => { recorder.cancel(); onDone(); }} className="py-2 pr-4 text-sm font-medium text-fg-2">
          ← Today
        </button>
        <button onClick={() => setCrisisOpen(true)} className="rounded-full border border-line bg-card px-3 py-1.5 text-[13px] font-medium text-fg-2">
          Talk to someone
        </button>
      </div>

      <AnimatePresence mode="wait">
        {(phase === "intro" || phase === "recording" || phase === "thinking") && (
          <FadeRise key="voice" className="flex flex-1 flex-col">
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <p className="eyebrow text-fg-2">
                {phase === "recording" ? "Listening" : phase === "thinking" ? "Taking it in" : "Check-in"}
              </p>
              <h1 className="mt-3 max-w-sm font-serif text-[28px] font-light leading-tight md:text-[36px]">
                {phase === "thinking" ? "Thank you. Give me a moment…" : prompt}
              </h1>
              <div className="my-10">
                <Orb levelRef={levelRef} state={orbState} />
              </div>
              {phase === "recording" ? (
                <p className="text-sm tabular-nums text-fg-2">{fmt(remaining)} left · speak as much or as little as you like</p>
              ) : phase === "intro" ? (
                <p className="max-w-xs text-sm text-fg-2">{note ?? "About 30 seconds. There are no right answers."}</p>
              ) : null}
            </div>

            {phase === "intro" && (
              <div className="flex flex-col gap-3">
                <Button onClick={startRecording} disabled={recorder.status === "starting"}>
                  Start talking
                </Button>
                <Button variant="ghost" onClick={() => setPhase("typed")}>
                  I&rsquo;d rather not talk today
                </Button>
                {demo && (
                  <div className="mt-2 flex justify-center gap-2">
                    {SAMPLES.map((s, i) => (
                      <button key={s.label} onClick={() => sendSample(i)} className="rounded-full border border-line px-3 py-1.5 text-[13px] text-fg-2">
                        Sample: {s.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {phase === "recording" && <Button onClick={finishRecording}>I&rsquo;m done</Button>}
            {phase === "thinking" && <div className="h-14" />}
          </FadeRise>
        )}

        {phase === "typed" && (
          <FadeRise key="typed" className="flex flex-1 flex-col pt-10">
            <p className="eyebrow text-fg-2">Check-in</p>
            <h1 className="mt-3 font-serif text-[28px] font-light leading-tight">How are you, today?</h1>
            {note && <p className="mt-3 text-sm text-fg-2">{note}</p>}
            <div className="mt-8 flex justify-between gap-2" role="radiogroup" aria-label="Mood from 1 to 5">
              {[1, 2, 3, 4, 5].map((m) => (
                <button
                  key={m}
                  role="radio"
                  aria-checked={typedMood === m}
                  aria-label={["Very low", "Low", "Okay", "Good", "Very good"][m - 1]}
                  onClick={() => setTypedMood(m)}
                  className={`size-13 rounded-full transition-transform ${typedMood === m ? "scale-110 ring-2 ring-action ring-offset-2 ring-offset-bg" : ""}`}
                  style={{ background: ["#b98f84", "#d2a98c", "#e3c39a", "#e4c27e", "#ddaa61"][m - 1] }}
                />
              ))}
            </div>
            <div className="mt-2 flex justify-between text-[12px] text-fg-2">
              <span>Heavy</span>
              <span>Bright</span>
            </div>
            <textarea
              value={typedText}
              onChange={(e) => setTypedText(e.target.value)}
              placeholder="A few words, if you like (optional)"
              rows={3}
              className="mt-8 w-full rounded-[12px] border border-line bg-surface/70 p-4 text-base text-ink outline-none focus:ring-2 focus:ring-action"
            />
            <div className="mt-auto flex flex-col gap-3 pt-8">
              <Button onClick={sendTyped} disabled={typedMood === null && !typedText.trim()}>
                Share
              </Button>
              <Button variant="ghost" onClick={() => { setNote(null); setPhase("intro"); }}>
                Use my voice instead
              </Button>
            </div>
          </FadeRise>
        )}

        {phase === "result" && result && (
          <FadeRise key="result" className="flex flex-1 flex-col pt-10">
            <p className="eyebrow text-fg-2">Thank you for checking in</p>
            <h1
              className={`mt-4 font-serif font-light leading-snug ${
                result.response.analysis.gentle_reflection.length > 140 ? "text-[22px] md:text-[28px]" : "text-[26px] md:text-[32px]"
              }`}
            >
              {result.response.analysis.gentle_reflection}
            </h1>

            <div className="mt-8 flex flex-col gap-3">
              {result.voice && (
                <div className="glass flex items-center gap-4 p-5">
                  <div className="size-10 shrink-0 rounded-full bg-linear-to-br from-gold-pale to-dusk-pale" />
                  <div>
                    <p className="eyebrow text-fg-2">Your voice</p>
                    <p className="mt-1 text-base">{result.voice.phrase}</p>
                  </div>
                </div>
              )}
              {result.response.analysis.themes.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {result.response.analysis.themes.map((t) => (
                    <span key={t} className="rounded-full border border-line bg-card px-4 py-2 text-sm">
                      {t}
                    </span>
                  ))}
                </div>
              )}
              {demo && result.response.source === "fallback" && (
                <p className="text-[12px] text-fg-2">Demo note: offline fallback ({result.response.error ?? "network"})</p>
              )}
            </div>

            <div className="mt-auto flex flex-col gap-3 pt-10">
              {result.response.analysis.risk_flag === "reach_out" && (
                <Button variant="care" onClick={() => setCrisisOpen(true)}>
                  Talk to someone now
                </Button>
              )}
              <Button onClick={onDone}>Back to today</Button>
            </div>
          </FadeRise>
        )}
      </AnimatePresence>

      <CrisisSheet open={crisisOpen} onClose={() => setCrisisOpen(false)} name={persona.name} contact={persona.circle[0]} />
    </main>
  );
}
