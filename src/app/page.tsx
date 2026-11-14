"use client";

import { AnimatePresence } from "motion/react";
import { useState } from "react";
import { BeginScreen } from "@/components/begin-screen";
import { CheckinScreen } from "@/components/checkin/checkin-screen";
import { DemoControls } from "@/components/demo-controls";
import { DemoProvider, useDemo } from "@/components/demo-provider";
import { CalmScreen } from "@/components/calm/calm-screen";
import { LearningProvider } from "@/components/learning-provider";
import { LightField } from "@/components/light-field";
import { FadeRise } from "@/components/motion";
import { SoundProvider, useSound } from "@/components/sound-provider";
import { TabBar, type Tab } from "@/components/tab-bar";
import { TodayScreen } from "@/components/today/today-screen";

export default function Home() {
  return (
    <DemoProvider>
      <Field />
      <LearningProvider>
        <SoundProvider>
          <App />
        </SoundProvider>
        <DemoControls />
      </LearningProvider>
    </DemoProvider>
  );
}

function Field() {
  const { levelRef } = useDemo();
  return <LightField levelRef={levelRef} />;
}

type Screen = "begin" | Tab;

function App() {
  const [screen, setScreen] = useState<Screen>("begin");
  const { persona } = useDemo();
  const sound = useSound();

  if (screen === "begin") {
    return (
      <FadeRise key="begin" className="flex flex-1 flex-col">
        <BeginScreen
          name={persona.name}
          onBegin={() => {
            void sound.start(); // the tap is the gesture that unlocks audio (iOS)
            setScreen("today");
          }}
        />
      </FadeRise>
    );
  }

  return (
    <>
      <AnimatePresence mode="wait">
        {screen === "checkin" && (
          <FadeRise key="checkin" className="flex flex-1">
            <CheckinScreen onDone={() => setScreen("today")} />
          </FadeRise>
        )}
        {screen === "today" && (
          <FadeRise key="today" className="flex flex-1">
            <TodayScreen onCheckin={() => setScreen("checkin")} onOpenCalm={() => setScreen("calm")} />
          </FadeRise>
        )}
        {screen === "calm" && (
          <FadeRise key="calm" className="flex flex-1">
            <CalmScreen />
          </FadeRise>
        )}
        {screen === "circle" && (
          <FadeRise key="circle" className="flex flex-1">
            <Placeholder />
          </FadeRise>
        )}
      </AnimatePresence>
      {screen !== "checkin" && <TabBar active={screen} onChange={setScreen} />}
    </>
  );
}

/** Until Circle (#9) lands. */
function Placeholder() {
  const copy = { eyebrow: "Circle", title: "The people who've got you.", body: "Friends and peers who've been through TMS, a wave away." };
  return (
    <main className="mx-auto flex w-full max-w-[560px] flex-col justify-center px-5 pb-32 text-center">
      <p className="eyebrow text-fg-2">{copy.eyebrow}</p>
      <h1 className="mt-4 font-serif text-[36px] font-light leading-tight">{copy.title}</h1>
      <p className="mt-4 text-base text-fg-2">{copy.body}</p>
    </main>
  );
}
