"use client";

import { useState } from "react";
import { CrisisSheet } from "@/components/crisis-sheet";
import { PrivacySheet } from "@/components/onboarding/privacy-sheet";
import { useDemo } from "@/components/demo-provider";
import { Button, FadeRise } from "@/components/motion";
import { Orb } from "@/components/orb";
import { useLearning } from "@/components/learning-provider";
import { useSound } from "@/components/sound-provider";
import { ActivitySheet } from "@/components/today/activity-sheet";
import { OutreachCard } from "@/components/today/outreach-card";
import { WhatHelps } from "@/components/today/what-helps";
import type { Intervention } from "@/lib/analysis";
import { explain } from "@/lib/learning";
import { Sparkline } from "@/components/today/sparkline";
import { greeting } from "@/lib/greeting";
import { buildInsight, formatSignalValue, INTERVENTION_LABEL, splitItalic } from "@/lib/insight";
import { useHydrated } from "@/lib/use-client";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const fmtDuration = (min: number) => `${Math.floor(min / 60)}h ${String(min % 60).padStart(2, "0")}m`;

function Italic({ text }: { text: string }) {
  const [a, b, c] = splitItalic(text);
  return (
    <>
      {a}
      {b && <span className="italic">{b}</span>}
      {c}
    </>
  );
}

/** Home (DESIGN.md: one idea per section, everything relative to your usual). */
export function TodayScreen({ onCheckin, onOpenCalm }: { onCheckin: () => void; onOpenCalm: () => void }) {
  const { persona, days, day, today, state, checkin, levelRef } = useDemo();
  const hydrated = useHydrated();
  const [crisisOpen, setCrisisOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const sound = useSound();
  const { ranked } = useLearning();
  const [activity, setActivity] = useState<Intervention | null>(null);
  const picks = ranked.slice(0, 3);

  const insight = buildInsight(state, checkin?.response.analysis.suggestion);
  const labels = days.slice(Math.max(0, day - 13), day + 1).map((d) => (d.day === day ? "Today" : WEEKDAYS[d.weekday].slice(0, 3)));
  const lastWeekSteps = days.slice(Math.max(0, day - 6), day + 1).map((d) => d.steps);
  const avgSteps = Math.round(lastWeekSteps.reduce((a, b) => a + b, 0) / lastWeekSteps.length);

  return (
    <main className="mx-auto flex w-full max-w-[560px] flex-col px-5 pt-[max(40px,env(safe-area-inset-top))] pb-32">
      <FadeRise className="flex items-center justify-between">
        <p className="eyebrow text-fg-2">{WEEKDAYS[today.weekday]}</p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => (sound.started ? sound.toggleMute() : void sound.start())}
            aria-label={!sound.started || sound.muted ? "Turn sound on" : "Turn sound off"}
            className="flex size-8 items-center justify-center rounded-full border border-line bg-card text-fg-2"
          >
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M4 9.5v5h3.5L12 18V6L7.5 9.5z" />
              {!sound.started || sound.muted ? <path d="m16 9.5 5 5m0-5-5 5" /> : <path d="M16 9a4.5 4.5 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11" />}
            </svg>
          </button>
          <button
            onClick={() => setCrisisOpen(true)}
            className="rounded-full border border-line bg-card px-3 py-1.5 text-[13px] font-medium text-fg-2"
          >
            Talk to someone
          </button>
        </div>
      </FadeRise>

      <FadeRise index={1}>
        <h1 className="mt-4 font-serif text-[36px] font-light leading-[1.1] md:text-[48px]">
          {hydrated ? greeting() : "Hello"}, <span className="italic">{persona.name}</span>
        </h1>
      </FadeRise>

      <OutreachCard />

      {/* Check-in */}
      <FadeRise index={2} className="mt-6">
        {checkin ? (
          <button onClick={onCheckin} className="glass block w-full p-6 text-left">
            <p className="eyebrow text-fg-2">Today&rsquo;s check-in</p>
            <p className="mt-2 font-serif text-[20px] font-light leading-snug">{checkin.response.analysis.gentle_reflection}</p>
            {checkin.voice && <p className="mt-3 text-sm text-fg-2">Your voice: {checkin.voice.phrase.toLowerCase()}</p>}
          </button>
        ) : (
          <div className="glass flex items-center gap-5 p-5">
            <div className="shrink-0">
              <Orb levelRef={levelRef} state="idle" size={64} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-serif text-[22px] font-light leading-tight">How are you today?</p>
              <p className="mt-1 text-sm text-fg-2">A 30-second check-in, whenever you&rsquo;re ready.</p>
            </div>
          </div>
        )}
        {!checkin && (
          <Button className="mt-3 w-full" onClick={onCheckin}>
            Start check-in
          </Button>
        )}
      </FadeRise>

      {/* Insight */}
      <FadeRise index={3} className="mt-8">
        <div className="glass-raised relative overflow-hidden p-6">
          <span className={`absolute inset-y-6 left-0 w-[3px] rounded-full ${state.level === "steady" ? "bg-sage" : "bg-gold-soft"}`} />
          <p className="eyebrow text-fg-2">{insight.eyebrow}</p>
          <h2 className="mt-3 font-serif text-[26px] font-light leading-tight md:text-[32px]">
            <Italic text={insight.headline} />.
          </h2>
          <p className="mt-3 text-base leading-relaxed">{insight.body}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {picks.map((r, i) => (
              <button
                key={r.intervention}
                onClick={() => setActivity(r.intervention)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-transform active:scale-[0.97] ${
                  i === 0 ? "bg-neutral text-on-neutral" : "border border-line bg-card"
                }`}
              >
                {r.intervention === "message_friend" ? `Wave to ${persona.circle[0]}` : INTERVENTION_LABEL[r.intervention]}
              </button>
            ))}
          </div>
          <p className="mt-3 text-[13px] leading-snug text-fg-2">{explain(picks[0], persona.circle[0])}</p>
        </div>
      </FadeRise>

      {/* Last night / movement */}
      <FadeRise index={4} className="mt-4 grid grid-cols-2 gap-3">
        <div className="glass p-5">
          <p className="eyebrow text-fg-2">Last night</p>
          <p className="mt-2 font-serif text-[32px] font-light leading-none">{fmtDuration(today.sleep.duration)}</p>
          <p className="mt-2 text-[13px] text-fg-2">{state.signals.find((s) => s.key === "sleepTiming")?.phrase}</p>
        </div>
        <div className="glass p-5">
          <p className="eyebrow text-fg-2">This week</p>
          <p className="mt-2 font-serif text-[32px] font-light leading-none">{(avgSteps / 1000).toFixed(1)}k</p>
          <p className="mt-2 text-[13px] text-fg-2">steps a day on average</p>
        </div>
      </FadeRise>

      <FadeRise index={5} className="mt-4">
        <WhatHelps />
      </FadeRise>

      {/* Signals */}
      <FadeRise index={5} className="mt-8">
        <div className="flex items-baseline justify-between">
          <p className="eyebrow text-fg-2">Your rhythm</p>
          <p className="text-[12px] text-fg-2">
            <span className="mr-1.5 inline-block h-2 w-4 rounded-sm bg-[var(--spark-band)] align-middle" />
            your usual
          </p>
        </div>
        <div className="glass mt-3 divide-y divide-line px-5">
          {state.signals.map((s) => (
            <div key={s.key} className="grid grid-cols-[1fr_96px] items-center gap-4 py-4">
              <div className="min-w-0">
                <p className="text-[15px] font-medium">{s.label}</p>
                <p className={`mt-0.5 text-[13px] ${s.z > 1 ? "text-fg" : "text-fg-2"}`}>{s.phrase}</p>
              </div>
              <Sparkline
                values={s.series}
                band={[s.baselineMean - s.baselineSd, s.baselineMean + s.baselineSd]}
                labels={labels}
                format={(v) => formatSignalValue(s.key, v)}
                ariaLabel={`${s.label}, last 14 days: ${s.phrase}`}
              />
            </div>
          ))}
        </div>
        <p className="mt-3 px-1 text-[12px] leading-relaxed text-fg-2">
          Compared with your own last four weeks. Tap a line to see a day.
        </p>
        <button onClick={() => setPrivacyOpen(true)} className="mt-6 w-full py-2 text-center text-[13px] font-medium text-fg-2 underline-offset-4 hover:underline">
          Privacy &amp; what&rsquo;s shared
        </button>
      </FadeRise>

      <ActivitySheet intervention={activity} onClose={() => setActivity(null)} onOpenCalm={onOpenCalm} />
      <PrivacySheet open={privacyOpen} onClose={() => setPrivacyOpen(false)} />
      <CrisisSheet open={crisisOpen} onClose={() => setCrisisOpen(false)} name={persona.name} contact={persona.circle[0]} />
    </main>
  );
}
