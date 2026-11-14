"use client";

import { AnimatePresence } from "motion/react";
import { BeginScreen } from "@/components/begin-screen";
import { CheckinScreen } from "@/components/checkin/checkin-screen";
import { DemoControls } from "@/components/demo-controls";
import { DemoProvider, useDemo } from "@/components/demo-provider";
import { CalmScreen } from "@/components/calm/calm-screen";
import { ChatProvider } from "@/components/chat-provider";
import { CircleScreen } from "@/components/circle/circle-screen";
import { FriendView } from "@/components/circle/friend-view";
import { LearningProvider } from "@/components/learning-provider";
import { Onboarding } from "@/components/onboarding/onboarding";
import { getConsent } from "@/lib/consent";
import { clearBadge, registerServiceWorker } from "@/lib/push";
import { useEffect, useState } from "react";
import { LightField } from "@/components/light-field";
import { FadeRise } from "@/components/motion";
import { SoundProvider, useSound } from "@/components/sound-provider";
import { TabBar, type Tab } from "@/components/tab-bar";
import { TodayScreen } from "@/components/today/today-screen";
import { useActAs } from "@/lib/use-client";

export default function Home() {
  const actAs = useActAs();
  return (
    <DemoProvider>
      <Field />
      <PushBoot />
      <ChatProvider me={actAs ?? "aino"}>
        {actAs === "maya" ? (
          <FriendView />
        ) : (
          <LearningProvider>
            <SoundProvider>
              <App />
            </SoundProvider>
            <DemoControls />
          </LearningProvider>
        )}
      </ChatProvider>
    </DemoProvider>
  );
}

/** Service worker for push + never leave a number on the app icon. */
function PushBoot() {
  useEffect(() => {
    void registerServiceWorker();
    clearBadge();
    const onVisible = () => document.visibilityState === "visible" && clearBadge();
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);
  return null;
}

function Field() {
  const { levelRef } = useDemo();
  return <LightField levelRef={levelRef} />;
}

type Screen = "begin" | "onboarding" | Tab;

function App() {
  const [screen, setScreen] = useState<Screen>("begin");
  const [immersive, setImmersive] = useState(false);
  const { persona } = useDemo();
  const sound = useSound();

  if (screen === "begin") {
    return (
      <FadeRise key="begin" className="flex flex-1 flex-col">
        <BeginScreen
          name={persona.name}
          onBegin={() => {
            void sound.start(); // the tap is the gesture that unlocks audio (iOS)
            setScreen(getConsent().onboarded ? "today" : "onboarding");
          }}
        />
      </FadeRise>
    );
  }

  if (screen === "onboarding") {
    return (
      <FadeRise key="onboarding" className="flex flex-1 flex-col">
        <Onboarding onDone={() => setScreen("today")} />
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
            <CircleScreen onThreadOpen={setImmersive} />
          </FadeRise>
        )}
      </AnimatePresence>
      {screen !== "checkin" && !(screen === "circle" && immersive) && (
        <TabBar
          active={screen}
          onChange={(t) => {
            setImmersive(false);
            setScreen(t);
          }}
        />
      )}
    </>
  );
}
