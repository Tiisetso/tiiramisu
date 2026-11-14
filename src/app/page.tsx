"use client";

import { AnimatePresence } from "motion/react";
import { useState } from "react";
import { BeginScreen } from "@/components/begin-screen";
import { CheckinScreen } from "@/components/checkin/checkin-screen";
import { DemoControls } from "@/components/demo-controls";
import { DemoProvider, useDemo } from "@/components/demo-provider";
import { LightField } from "@/components/light-field";
import { Button, FadeRise } from "@/components/motion";

export default function Home() {
  return (
    <DemoProvider>
      <Field />
      <App />
      <DemoControls />
    </DemoProvider>
  );
}

function Field() {
  const { levelRef } = useDemo();
  return <LightField levelRef={levelRef} />;
}

type Screen = "begin" | "today" | "checkin";

function App() {
  const [screen, setScreen] = useState<Screen>("begin");
  const { persona } = useDemo();
  return (
    <AnimatePresence mode="wait">
      {screen === "checkin" ? (
        <FadeRise key="checkin" className="flex flex-1">
          <CheckinScreen onDone={() => setScreen("today")} />
        </FadeRise>
      ) : screen === "today" ? (
        <FadeRise key="today" className="flex flex-1">
          <DataPreview onCheckin={() => setScreen("checkin")} />
        </FadeRise>
      ) : (
        <FadeRise key="begin" className="flex flex-1 flex-col">
          <BeginScreen name={persona.name} onBegin={() => setScreen("today")} />
        </FadeRise>
      )}
    </AnimatePresence>
  );
}

const fmtDuration = (min: number) => `${Math.floor(min / 60)}h ${String(min % 60).padStart(2, "0")}m`;

/** Temporary: proves the demo data flows through. Replaced by the Today screen (#6). */
function DataPreview({ onCheckin }: { onCheckin: () => void }) {
  const { today, state, checkin } = useDemo();
  const lead = state.top[0];

  return (
    <main className="mx-auto flex w-full max-w-[560px] flex-col gap-4 px-5 py-12">
      <p className="eyebrow text-fg-2">{state.level === "steady" ? "This week" : "I noticed"}</p>
      <h2 className="font-serif text-[28px] font-light leading-tight md:text-[40px]">
        {lead ? (
          <>
            {lead.phrase}, <span className="italic">gently</span> worth noticing.
          </>
        ) : (
          <>
            You&rsquo;re in a <span className="italic">steady</span> rhythm.
          </>
        )}
      </h2>

      <div className="glass p-6">
        <p className="eyebrow text-fg-2">Last night</p>
        <p className="mt-2 font-serif text-[40px] font-light leading-none">{fmtDuration(today.sleep.duration)}</p>
      </div>

      <div className="glass divide-y divide-line px-6">
        {state.signals.map((s) => (
          <div key={s.key} className="flex items-baseline justify-between gap-4 py-3">
            <span className="text-sm font-medium">{s.label}</span>
            <span className={`text-right text-sm ${s.z > 1 ? "text-fg" : "text-fg-2"}`}>{s.phrase}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {checkin ? (
          <div className="glass p-6">
            <p className="eyebrow text-fg-2">Today&rsquo;s check-in</p>
            <p className="mt-2 font-serif text-[22px] font-light leading-snug">{checkin.response.analysis.gentle_reflection}</p>
            <button onClick={onCheckin} className="mt-3 text-sm font-medium text-fg-2 underline-offset-4 hover:underline">
              See check-in
            </button>
          </div>
        ) : (
          <Button onClick={onCheckin}>Start check-in</Button>
        )}
      </div>
    </main>
  );
}
