"use client";

import { useState } from "react";
import { CrisisSheet } from "@/components/crisis-sheet";
import { useDemo } from "@/components/demo-provider";
import { Button, FadeRise } from "@/components/motion";
import { Orb } from "@/components/orb";
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
export function TodayScreen({ onCheckin }: { onCheckin: () => void }) {
  const { persona, days, day, today, state, checkin, levelRef } = useDemo();
  const hydrated = useHydrated();
  const [crisisOpen, setCrisisOpen] = useState(false);

  const insight = buildInsight(state, checkin?.response.analysis.suggestion);
  const labels = days.slice(Math.max(0, day - 13), day + 1).map((d) => (d.day === day ? "Today" : WEEKDAYS[d.weekday].slice(0, 3)));
  const lastWeekSteps = days.slice(Math.max(0, day - 6), day + 1).map((d) => d.steps);
  const avgSteps = Math.round(lastWeekSteps.reduce((a, b) => a + b, 0) / lastWeekSteps.length);

  return (
    <main className="mx-auto flex w-full max-w-[560px] flex-col px-5 pt-[max(40px,env(safe-area-inset-top))] pb-32">
      <FadeRise className="flex items-center justify-between">
        <p className="eyebrow text-fg-2">{WEEKDAYS[today.weekday]}</p>
        <button
          onClick={() => setCrisisOpen(true)}
          className="rounded-full border border-line bg-card px-3 py-1.5 text-[13px] font-medium text-fg-2"
        >
          Talk to someone
        </button>
      </FadeRise>

      <FadeRise index={1}>
        <h1 className="mt-4 font-serif text-[36px] font-light leading-[1.1] md:text-[48px]">
          {hydrated ? greeting() : "Hello"}, <span className="italic">{persona.name}</span>
        </h1>
      </FadeRise>

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
            {insight.suggestions.map((s) => (
              <span key={s} className="rounded-full border border-line bg-card px-4 py-2 text-sm font-medium">
                {s === "message_friend" ? `Wave to ${persona.circle[0]}` : INTERVENTION_LABEL[s]}
              </span>
            ))}
          </div>
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
      </FadeRise>

      <CrisisSheet open={crisisOpen} onClose={() => setCrisisOpen(false)} name={persona.name} contact={persona.circle[0]} />
    </main>
  );
}
