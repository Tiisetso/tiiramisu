"use client";

import { AnimatePresence } from "motion/react";
import { useState } from "react";
import { BeginScreen } from "@/components/begin-screen";
import { LightField } from "@/components/light-field";
import { MoodProvider, useMood } from "@/components/mood-provider";
import { Button, FadeRise } from "@/components/motion";
import { MOODS } from "@/lib/mood";
import { useDemoMode } from "@/lib/use-client";

export default function Home() {
  return (
    <MoodProvider>
      <LightField />
      <App />
    </MoodProvider>
  );
}

function App() {
  const [started, setStarted] = useState(false);
  return (
    <AnimatePresence mode="wait">
      {started ? (
        <FadeRise key="home" className="flex flex-1">
          <DesignPreview />
        </FadeRise>
      ) : (
        <FadeRise key="begin" className="flex flex-1 flex-col">
          <BeginScreen name="Aino" onBegin={() => setStarted(true)} />
        </FadeRise>
      )}
    </AnimatePresence>
  );
}

/** Temporary: shows tokens + light-field moods until the Today screen (#6) lands. */
function DesignPreview() {
  const { mood, setMood } = useMood();
  const demo = useDemoMode();

  return (
    <main className="mx-auto flex w-full max-w-[560px] flex-col gap-4 px-5 py-12">
      <p className="eyebrow text-fg-2">I noticed</p>
      <h2 className="font-serif text-[28px] font-light leading-tight md:text-[40px]">
        Your sleep has been drifting a little <span className="italic">later</span> this week.
      </h2>

      <div className="glass-raised relative overflow-hidden p-6">
        <span className="absolute inset-y-6 left-0 w-[3px] rounded-full bg-gold-soft" />
        <p className="text-base leading-relaxed">
          That&rsquo;s okay. A short walk in the morning light often helps you settle back into rhythm.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {["Walk outside · 10 min", "Breathe · 3 min", "Wave to Maya"].map((c) => (
            <span key={c} className="rounded-full border border-line bg-card px-4 py-2 text-sm font-medium">
              {c}
            </span>
          ))}
        </div>
      </div>

      <div className="glass p-6">
        <p className="eyebrow text-fg-2">Sleep</p>
        <p className="mt-2 font-serif text-[40px] font-light leading-none">7h 10m</p>
        <p className="mt-2 text-sm text-fg-2">About your usual, a bit later than normal</p>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        <Button>Start check-in</Button>
        <Button variant="ghost">Not today</Button>
      </div>

      {demo && (
        <div className="glass mt-6 p-4">
          <p className="eyebrow mb-3 text-fg-2">Demo · light field mood</p>
          <div className="flex flex-wrap gap-2">
            {MOODS.map((m) => (
              <button
                key={m}
                onClick={() => setMood(m)}
                className={`rounded-full px-4 py-2 text-sm font-medium ${m === mood ? "bg-neutral text-on-neutral" : "border border-line"}`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
