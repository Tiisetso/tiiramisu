"use client";

import { useEffect, useState } from "react";
import { FadeRise } from "@/components/motion";
import { useMood } from "@/components/mood-provider";
import { useSound } from "@/components/sound-provider";
import { SCENES, type Scene } from "@/lib/sound/engine";
import { BreathingGuide } from "@/components/breathing-guide";

const SCENE_LABEL: Record<Scene, string> = { forest: "Forest", rain: "Rain", sea: "Sea", night: "Night" };

const MOOD_LINE: Record<string, string> = {
  calm: "Today it's light and open, like your week has been.",
  low: "Today it's warmer and slower, to meet you where you are.",
  bright: "Today it's brighter, things have felt a little lighter.",
  listening: "Soft and quiet, just listening.",
  night: "Deep and slow, for winding down.",
};

export function CalmScreen() {
  const { mood } = useMood();
  const sound = useSound();
  const [breathing, setBreathing] = useState(false);

  // A touch louder while you're here
  const { setLevel } = sound;
  useEffect(() => {
    setLevel(3);
    return () => setLevel(0);
  }, [setLevel]);

  const chip = (active: boolean) =>
    `rounded-full px-4 py-2 text-sm font-medium transition-colors ${active ? "bg-neutral text-on-neutral" : "border border-line bg-card"}`;

  return (
    <main className="mx-auto flex w-full max-w-[560px] flex-col px-5 pt-[max(40px,env(safe-area-inset-top))] pb-32">
      <FadeRise className="flex items-center justify-between">
        <p className="eyebrow text-fg-2">Calm</p>
        <button
          onClick={sound.toggleMute}
          className="rounded-full border border-line bg-card px-3 py-1.5 text-[13px] font-medium text-fg-2"
          aria-pressed={sound.muted}
        >
          {sound.muted ? "Sound off" : "Sound on"}
        </button>
      </FadeRise>

      <FadeRise index={1}>
        <h1 className="mt-4 font-serif text-[36px] font-light leading-[1.1]">
          Sound and light, <span className="italic">for right now</span>.
        </h1>
        <p className="mt-3 text-base text-fg-2">{MOOD_LINE[mood]}</p>
      </FadeRise>

      <FadeRise index={2} className="my-10 flex flex-col items-center">
        <BreathingGuide active={breathing} onToggle={() => setBreathing((b) => !b)} size={240} />
      </FadeRise>

      <FadeRise index={3}>
        <p className="eyebrow text-fg-2">Sounds</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button className={chip(sound.scene === undefined)} onClick={() => sound.setScene(undefined)}>
            Follow my day
          </button>
          {SCENES.map((s) => (
            <button key={s} className={chip(sound.scene === s)} onClick={() => sound.setScene(s)}>
              {SCENE_LABEL[s]}
            </button>
          ))}
          <button className={chip(sound.scene === null)} onClick={() => sound.setScene(null)}>
            Music only
          </button>
        </div>
        {!sound.started && (
          <button onClick={() => void sound.start()} className="mt-6 text-sm font-medium text-fg-2 underline underline-offset-4">
            Tap to turn on sound
          </button>
        )}
      </FadeRise>
    </main>
  );
}
