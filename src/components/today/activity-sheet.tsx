"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useChat } from "@/components/chat-provider";
import { useDemo } from "@/components/demo-provider";
import { useLearning } from "@/components/learning-provider";
import { Button, EASE_SOFT } from "@/components/motion";
import type { Intervention } from "@/lib/analysis";
import { hasHave, interventionName } from "@/lib/learning";
import { BreathingGuide } from "@/components/breathing-guide";
import { stepFor } from "@/lib/steps";
import { useConsent } from "@/lib/consent";
import { bloom, soften } from "@/lib/field-events";

type Step = "predict" | "do" | "ask" | "thanks";

/** Same scale before and after, so the gap is comparable (docs/references.md #8). */
const SCALE = ["Not at all", "A little", "Some", "Quite a bit", "A lot"];
const ORB = ["#b98f84", "#d2a98c", "#e3c39a", "#e4c27e", "#ddaa61"];

function Scale({ onPick }: { onPick: (v: number, el: Element) => void }) {
  return (
    <div className="mt-8">
      <div className="flex justify-between gap-2" role="radiogroup" aria-label="From not at all to a lot">
        {SCALE.map((label, i) => (
          <button
            key={label}
            role="radio"
            aria-checked={false}
            aria-label={label}
            onClick={(e) => onPick(i + 1, e.currentTarget)}
            className="flex flex-col items-center gap-2"
          >
            <span className="size-13 rounded-full shadow-[inset_0_-6px_16px_rgba(107,68,61,0.15)] transition-transform active:scale-95" style={{ background: ORB[i] }} />
            <span className="w-14 text-center text-[11px] leading-tight text-fg-2">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/** today's recap phrase per activity */
const DID: Record<Intervention, string> = {
  walk: "went outside",
  light: "let the light in",
  breathe: "breathed slowly",
  message_friend: "reached out to Maya",
  soundscape: "listened to calm sounds",
  rest: "let yourself rest",
};

/** First-person small win to share with the circle (never for messaging itself). */
const WIN: Partial<Record<Intervention, string>> = {
  walk: "Small win: I went outside today ✨",
  light: "Small win: I let some light in today ✨",
  breathe: "Small win: I took a few slow breaths ✨",
  soundscape: "Small win: I took a calm moment ✨",
  rest: "Small win: I let myself rest today ✨",
};

const PRESETS = ["Thinking of you", "Fancy a short walk this week?", "Just sending a wave"];

/**
 * One small step, then "did that help?" → updates what the app learns about this person (#8).
 */
export function ActivitySheet({
  intervention,
  onClose,
  onOpenCalm,
}: {
  intervention: Intervention | null;
  onClose: () => void;
  onOpenCalm: () => void;
}) {
  const { persona, setActivityMood, state } = useDemo();
  const graded = intervention ? stepFor(intervention, state.level, persona.circle[0]) : null;
  const simple = intervention && intervention !== "message_friend" && intervention !== "soundscape";
  const { record, tallies } = useLearning();
  const chat = useChat();
  const friend = persona.circle[0];
  const [step, setStep] = useState<Step>("do");
  const [sentAt, setSentAt] = useState<number | null>(null);
  const [answer, setAnswer] = useState<boolean | null>(null);
  const [expected, setExpected] = useState<number | null>(null);
  const [better, setBetter] = useState(false);
  const [shared, setShared] = useState(false);
  const consent = useConsent();

  // reset when a new step is opened
  const [openFor, setOpenFor] = useState<Intervention | null>(null);
  if (intervention !== openFor) {
    setOpenFor(intervention);
    setStep(intervention && intervention !== "soundscape" ? "predict" : "do");
    setSentAt(null);
    setAnswer(null);
    setExpected(null);
    setBetter(false);
    setShared(false);
  }


  /** actual: 1–5 on the same scale as the prediction, or null for "not sure" */
  const finish = (actual: number | null, el?: Element) => {
    const helped = actual === null ? null : actual >= 2;
    const beat = expected !== null && actual !== null && actual > expected;
    if (beat || (actual ?? 0) >= 3) bloom("big"); // in the open space above the sheet, where it can be seen
    else if (actual === 2) bloom("medium", el);
    else if (actual === null) bloom("small", el);
    else soften();
    if (!intervention) return;
    record(intervention, helped, expected, actual);
    setAnswer(helped);
    setBetter(beat);
    setStep("thanks");
    if (helped) {
      setActivityMood("bright");
      setTimeout(() => setActivityMood(null), 12000);
    }
  };

  // tallies already include this answer once recorded. Only computed while a step is open:
  // on close `intervention` is null for one render before the reset above applies.
  const t = intervention ? tallies[intervention] : null;
  const thanks =
    !intervention || answer === null
      ? "Thanks for telling me."
      : answer
        ? `Noted. ${interventionName(intervention, friend)} ${hasHave(intervention)} now helped you ${t?.helped} of ${t?.tried} times.`
        : "Thanks for being honest. I'll suggest something different next time.";

  return (
    <AnimatePresence>
      {intervention && (
        <motion.div className="fixed inset-0 z-40 flex items-end justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <button aria-label="Close" className="absolute inset-0 bg-ink/15" onClick={onClose} />
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.5, ease: EASE_SOFT }}
            className="relative w-full max-w-[560px] rounded-t-[40px] bg-bg px-6 pt-8 text-fg shadow-[var(--shadow)] safe-bottom"
          >
            <div className="mx-auto mb-6 h-1 w-10 rounded-full bg-line" />

            {step === "predict" && (
              <>
                <p className="eyebrow text-fg-2">Before you start</p>
                <h2 className="mt-2 font-serif text-[28px] font-light leading-tight">How much do you think this will help?</h2>
                <p className="mt-3 text-base text-fg-2">There&rsquo;s no right answer. Just a guess.</p>
                <Scale
                  onPick={(v) => {
                    setExpected(v);
                    setStep("do");
                  }}
                />
                <button onClick={() => setStep("do")} className="mt-6 w-full py-2 text-sm font-medium text-fg-2">
                  Skip
                </button>
              </>
            )}

            {step === "do" && intervention === "message_friend" && (
              <>
                <h2 className="font-serif text-[28px] font-light leading-tight">Wave to {friend}</h2>
                <p className="mt-3 text-base text-fg-2">No need for a long message. One tap is enough.</p>
                {sentAt === null ? (
                  <div className="mt-6 flex flex-col gap-2">
                    {PRESETS.map((m) => (
                      <button
                        key={m}
                        onClick={() => {
                          setSentAt(Date.now() - 1);
                          chat.send("maya", m);
                          bloom("small");
                        }}
                        className="rounded-full border border-line bg-card px-5 py-3 text-left text-base"
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="mt-6 flex flex-col gap-2">
                    {chat.messages
                      .filter((m) => m.room === "maya" && m.at >= sentAt)
                      .map((m) => (
                        <motion.p
                          key={m.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={
                            m.from === "aino"
                              ? "ml-auto max-w-[80%] rounded-[20px_20px_6px_20px] bg-action px-4 py-2.5 text-on-action"
                              : "mr-auto max-w-[80%] rounded-[20px_20px_20px_6px] bg-surface px-4 py-2.5 text-ink"
                          }
                        >
                          {m.text}
                        </motion.p>
                      ))}
                    {!chat.messages.some((m) => m.room === "maya" && m.at >= sentAt && m.from !== "aino") && (
                      <p className="text-[13px] text-fg-2">Sent to {friend}</p>
                    )}
                  </div>
                )}
                <div className="mt-8 flex flex-col gap-3">
                  <Button onClick={(e) => { bloom("medium", e.currentTarget, `waved to ${friend}`); setStep("ask"); }} disabled={sentAt === null}>
                    Done
                  </Button>
                  <Button variant="ghost" onClick={onClose}>
                    Not now
                  </Button>
                </div>
              </>
            )}

            {step === "do" && intervention === "soundscape" && (
              <>
                <h2 className="font-serif text-[28px] font-light leading-tight">Some calm sounds</h2>
                <p className="mt-3 text-base text-fg-2">A few minutes of sound that follows how you&rsquo;re doing today.</p>
                <div className="mt-8 flex flex-col gap-3">
                  <Button
                    onClick={() => {
                      onOpenCalm();
                      onClose();
                    }}
                  >
                    Open Calm
                  </Button>
                  <Button variant="ghost" onClick={onClose}>
                    Not now
                  </Button>
                </div>
              </>
            )}

            {step === "do" && simple && graded && (
              <>
                <h2 className="font-serif text-[28px] font-light leading-tight">{graded.title}</h2>
                <p className="mt-3 text-base text-fg-2">{graded.body}</p>
                {intervention === "breathe" && (
                  <div className="my-6">
                    <BreathingGuide active={step === "do"} size={170} rounds={graded.rounds ?? 3} />
                  </div>
                )}
                <div className="mt-8 flex flex-col gap-3">
                  <Button onClick={(e) => { bloom("medium", e.currentTarget, intervention ? DID[intervention] : undefined); setStep("ask"); }}>{graded.done}</Button>
                  <Button variant="ghost" onClick={onClose}>
                    Not today
                  </Button>
                </div>
              </>
            )}

            {step === "ask" && (
              <>
                <p className="eyebrow text-fg-2">How was it?</p>
                <h2 className="mt-2 font-serif text-[28px] font-light leading-tight">How much did it help?</h2>
                <p className="mt-3 text-base text-fg-2">Your answer helps me learn what works for you.</p>
                <Scale onPick={(v, el) => finish(v, el)} />
                <button onClick={(e) => finish(null, e.currentTarget)} className="mt-6 w-full py-2 text-sm font-medium text-fg-2">
                  Not sure
                </button>
              </>
            )}

            {step === "thanks" && (
              <>
                {better ? (
                  <>
                    <h2 className="font-serif text-[28px] font-light leading-tight">
                      That felt <span className="italic">better</span> than you expected.
                    </h2>
                    <p className="mt-3 text-base text-fg-2">Worth remembering, next time it feels hard to start. {thanks}</p>
                  </>
                ) : (
                  <h2 className="font-serif text-[28px] font-light leading-tight">{thanks}</h2>
                )}
                <div className="mt-8 flex flex-col gap-3">
                  {answer === true && intervention && WIN[intervention] && consent.circle.includes("maya") && (
                    shared ? (
                      <p className="text-center text-[14px] text-fg-2" role="status">
                        Shared with {friend} ✨
                      </p>
                    ) : (
                      <Button
                        variant="ghost"
                        onClick={(e) => {
                          chat.send("maya", WIN[intervention]!, "win");
                          setShared(true);
                          bloom("small", e.currentTarget, `shared a win with ${friend}`);
                        }}
                      >
                        Tell {friend}?
                      </Button>
                    )
                  )}
                  <Button onClick={onClose}>Back to today</Button>
                </div>
              </>
            )}
            <div className="h-4" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
