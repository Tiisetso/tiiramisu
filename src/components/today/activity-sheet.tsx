"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useChat } from "@/components/chat-provider";
import { useDemo } from "@/components/demo-provider";
import { useLearning } from "@/components/learning-provider";
import { Button, EASE_SOFT } from "@/components/motion";
import type { Intervention } from "@/lib/analysis";
import { interventionName } from "@/lib/learning";
import { BreathingGuide } from "@/components/breathing-guide";

type Step = "do" | "ask" | "thanks";

const COPY: Record<Exclude<Intervention, "soundscape" | "message_friend">, { title: string; body: string; done: string }> = {
  walk: {
    title: "A short walk outside",
    body: "Ten minutes is plenty. If you like, notice three things you can hear on the way.",
    done: "I went",
  },
  light: {
    title: "Some morning light",
    body: "Open the curtains or step outside for ten minutes. Light early in the day helps your body find its rhythm again.",
    done: "Done",
  },
  breathe: {
    title: "Breathe with me",
    body: "In for four, out for six. A few rounds is enough.",
    done: "Done",
  },
  rest: {
    title: "Permission to rest",
    body: "You don't have to do anything today. Rest is part of staying well, not a step back.",
    done: "Thank you",
  },
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
  const { persona, setActivityMood } = useDemo();
  const { record, tallies } = useLearning();
  const chat = useChat();
  const friend = persona.circle[0];
  const [step, setStep] = useState<Step>("do");
  const [sentAt, setSentAt] = useState<number | null>(null);
  const [answer, setAnswer] = useState<boolean | null>(null);

  // reset when a new step is opened
  const [openFor, setOpenFor] = useState<Intervention | null>(null);
  if (intervention !== openFor) {
    setOpenFor(intervention);
    setStep("do");
    setSentAt(null);
    setAnswer(null);
  }


  const finish = (helped: boolean | null) => {
    if (!intervention) return;
    record(intervention, helped);
    setAnswer(helped);
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
        ? `Noted. ${interventionName(intervention, friend)} has now helped you ${t?.helped} of ${t?.tried} times.`
        : "Thanks for being honest. I'll suggest something different next time.";

  return (
    <AnimatePresence>
      {intervention && (
        <motion.div className="fixed inset-0 z-40 flex items-end justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <button aria-label="Close" className="absolute inset-0 bg-ink/30" onClick={onClose} />
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
                  <Button onClick={() => setStep("ask")} disabled={sentAt === null}>
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

            {step === "do" && intervention && intervention in COPY && (
              <>
                <h2 className="font-serif text-[28px] font-light leading-tight">{COPY[intervention as keyof typeof COPY].title}</h2>
                <p className="mt-3 text-base text-fg-2">{COPY[intervention as keyof typeof COPY].body}</p>
                {intervention === "breathe" && (
                  <div className="my-6">
                    <BreathingGuide active={step === "do"} size={170} rounds={3} />
                  </div>
                )}
                <div className="mt-8 flex flex-col gap-3">
                  <Button onClick={() => setStep("ask")}>{COPY[intervention as keyof typeof COPY].done}</Button>
                  <Button variant="ghost" onClick={onClose}>
                    Not today
                  </Button>
                </div>
              </>
            )}

            {step === "ask" && (
              <>
                <h2 className="font-serif text-[28px] font-light leading-tight">Did that help, even a little?</h2>
                <p className="mt-3 text-base text-fg-2">Your answer helps me learn what works for you.</p>
                <div className="mt-8 flex flex-col gap-3">
                  <Button onClick={() => finish(true)}>Yes, a bit</Button>
                  <Button variant="secondary" onClick={() => finish(false)}>
                    Not really
                  </Button>
                  <Button variant="ghost" onClick={() => finish(null)}>
                    Not sure
                  </Button>
                </div>
              </>
            )}

            {step === "thanks" && (
              <>
                <h2 className="font-serif text-[28px] font-light leading-tight">{thanks}</h2>
                <div className="mt-8 flex flex-col gap-3">
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
