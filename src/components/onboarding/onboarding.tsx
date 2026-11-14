"use client";

import { AnimatePresence } from "motion/react";
import { useState } from "react";
import { Avatar } from "@/components/circle/avatar";
import { useDemo } from "@/components/demo-provider";
import { Button, FadeRise } from "@/components/motion";
import { ConsentControls, ConsentRow } from "@/components/onboarding/consent-controls";
import { PEOPLE, type PersonId } from "@/lib/chat";
import { setConsent, useConsent } from "@/lib/consent";
import { useDemoMode } from "@/lib/use-client";

const STEPS = 3;

function Dots({ step }: { step: number }) {
  return (
    <div className="flex justify-center gap-2" aria-label={`Step ${step + 1} of ${STEPS}`}>
      {Array.from({ length: STEPS }, (_, i) => (
        <span key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i === step ? "w-6 bg-fg" : "w-1.5 bg-line"}`} />
      ))}
    </div>
  );
}

const NOTICES = [
  { icon: "◐", title: "How you sound", body: "A 30-second check-in, whenever you like. Slower, quieter, flatter: small shifts can mean a lot." },
  { icon: "☾", title: "Your rhythm", body: "Sleep timing and the shape of your days, if you connect Apple Health." },
  { icon: "♡", title: "How you feel", body: "One tap. That's all." },
];

/**
 * First run (DESIGN.md: one idea per screen, invite don't instruct).
 * 1 what Tiiramisu notices · 2 what stays yours (consent) · 3 your circle.
 */
export function Onboarding({ onDone }: { onDone: () => void }) {
  const { persona } = useDemo();
  const demo = useDemoMode();
  const consent = useConsent();
  const [step, setStep] = useState(0);

  const finish = () => {
    setConsent({ onboarded: true });
    onDone();
  };
  const toggleFriend = (id: string) =>
    setConsent({ circle: consent.circle.includes(id) ? consent.circle.filter((c) => c !== id) : [...consent.circle, id] });

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[560px] flex-col px-5 pt-[max(40px,env(safe-area-inset-top))] safe-bottom">
      <div className="flex items-center justify-between">
        <Dots step={step} />
        {demo && (
          <button onClick={finish} className="text-sm font-medium text-fg-2">
            Skip
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {step === 0 && (
          <FadeRise key="s0" className="flex flex-1 flex-col pt-10">
            <p className="eyebrow text-fg-2">Hello, {persona.name}</p>
            <h1 className="mt-3 font-serif text-[34px] font-light leading-[1.12]">
              Tiiramisu <span className="italic">notices</span>, gently.
            </h1>
            <p className="mt-3 text-base leading-relaxed text-fg-2">
              Everything is compared only with <em>your own</em> usual, never with anyone else.
            </p>
            <ul className="mt-8 flex flex-col gap-3">
              {NOTICES.map((n, i) => (
                <FadeRise key={n.title} index={i + 1}>
                  <li className="glass flex items-start gap-4 p-5">
                    <span aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-gold-pale to-dusk-pale text-lg text-ink">
                      {n.icon}
                    </span>
                    <span>
                      <span className="block text-[15px] font-medium">{n.title}</span>
                      <span className="mt-1 block text-[13px] leading-relaxed text-fg-2">{n.body}</span>
                    </span>
                  </li>
                </FadeRise>
              ))}
            </ul>
            <p className="mt-6 text-[13px] leading-relaxed text-fg-2">
              When something shifts, it suggests a small, kind step, and learns what helps you.
            </p>
            <div className="mt-auto pt-8">
              <Button className="w-full" onClick={() => setStep(1)}>
                Continue
              </Button>
            </div>
          </FadeRise>
        )}

        {step === 1 && (
          <FadeRise key="s1" className="flex flex-1 flex-col pt-10">
            <p className="eyebrow text-fg-2">Your choice</p>
            <h1 className="mt-3 font-serif text-[34px] font-light leading-[1.12]">
              What stays <span className="italic">yours</span>.
            </h1>
            <p className="mt-3 text-base leading-relaxed text-fg-2">You can change any of this, any time.</p>
            <div className="mt-6">
              <ConsentControls />
            </div>
            <p className="mt-4 px-1 text-[12px] leading-relaxed text-fg-2">
              Stored in the EU (Frankfurt). Never sold, never used for ads. Every version of the app is checked so your voice only goes where we say.
            </p>
            <div className="mt-auto flex flex-col gap-3 pt-8">
              <Button onClick={() => setStep(2)}>Continue</Button>
              <Button variant="ghost" onClick={() => setStep(0)}>
                Back
              </Button>
            </div>
          </FadeRise>
        )}

        {step === 2 && (
          <FadeRise key="s2" className="flex flex-1 flex-col pt-10">
            <p className="eyebrow text-fg-2">Your circle</p>
            <h1 className="mt-3 font-serif text-[34px] font-light leading-[1.12]">
              Who&rsquo;s <span className="italic">got you</span>?
            </h1>
            <p className="mt-3 text-base leading-relaxed text-fg-2">
              They&rsquo;ll only ever see whether you&rsquo;ve checked in. Never how you sound, sleep or feel.
            </p>
            <div className="glass mt-6 divide-y divide-line px-5">
              {(["maya", "juho", "mum"] as PersonId[]).map((id) => {
                const on = consent.circle.includes(id);
                return (
                  <button key={id} onClick={() => toggleFriend(id)} aria-pressed={on} className="flex w-full items-center gap-4 py-4 text-left">
                    <Avatar who={id} />
                    <span className="flex-1 text-[15px] font-medium">{PEOPLE[id].name}</span>
                    <span
                      className={`flex size-7 items-center justify-center rounded-full border text-sm transition-colors ${
                        on ? "border-action bg-action text-on-action" : "border-line"
                      }`}
                    >
                      {on ? "✓" : ""}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="glass mt-3 divide-y divide-line px-5">
              <ConsentRow k="shareStatus" title="Let them see when I've checked in" body="A quiet 'checked in today', so they know when to reach out." />
              <ConsentRow k="peers" title="Join others who've had TMS" body="An anonymous room. You'll be 'Cloudberry'; nobody sees your name." />
            </div>
            <div className="mt-auto flex flex-col gap-3 pt-8">
              <Button onClick={finish}>Begin</Button>
              <Button variant="ghost" onClick={() => setStep(1)}>
                Back
              </Button>
            </div>
          </FadeRise>
        )}
      </AnimatePresence>
    </main>
  );
}
