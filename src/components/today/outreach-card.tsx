"use client";

import { AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";
import { useDemo } from "@/components/demo-provider";
import { FadeRise } from "@/components/motion";
import { liveGet, livePost, useLive } from "@/lib/live";
import { bloom } from "@/lib/field-events";

interface Outreach {
  request: { at: string } | null;
  response: { choice: string; at: string } | null;
}

function slots(now = new Date()) {
  const fmt = (d: Date, label: string) => `${label} ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
  const at = (days: number, h: number, m = 0) => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    d.setHours(h, m, 0, 0);
    return d;
  };
  const today = now.getHours() < 15 ? [fmt(at(0, 16), "Today")] : [];
  return [...today, fmt(at(1, 10), "Tomorrow"), fmt(at(1, 14, 30), "Tomorrow")];
}

/** "Your clinic would like to check in": calm, no pressure, one tap to answer. */
export function OutreachCard() {
  const { patient } = useDemo();
  const live = useLive();
  const [data, setData] = useState<Outreach | null>(null);
  const [answered, setAnswered] = useState<string | null>(null);

  useEffect(() => {
    if (live !== true) return;
    let stopped = false;
    const poll = async () => {
      const d = await liveGet<Outreach>(`/api/outreach?patient=${patient.id}`);
      if (!stopped && d) setData(d);
    };
    void poll();
    const iv = setInterval(poll, 4000);
    return () => {
      stopped = true;
      clearInterval(iv);
    };
  }, [live, patient.id]);

  const respond = (choice: string) => {
    if (choice !== "Not now") bloom("medium");
    setAnswered(choice);
    void livePost("/api/outreach", { patientId: patient.id, response: choice });
  };

  const pending = data?.request && !data.response && !answered;
  const done = answered ?? data?.response?.choice;
  const show = pending || (data?.request && done && done !== "Not now");

  return (
    <AnimatePresence>
      {show && (
        <FadeRise key="outreach" className="mt-6">
          <div className="glass-raised relative overflow-hidden p-6">
            <span className="absolute inset-y-6 left-0 w-[3px] rounded-full bg-dusk" />
            <p className="eyebrow text-fg-2">From your clinic</p>
            {pending ? (
              <>
                <h2 className="mt-2 font-serif text-[24px] font-light leading-snug">
                  Your clinic would like to <span className="italic">check in</span>.
                </h2>
                <p className="mt-2 text-[15px] leading-relaxed text-fg-2">
                  Nothing is wrong. They just want to hear how you&rsquo;re doing. Choose whatever suits you.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {slots().map((s) => (
                    <button key={s} onClick={() => respond(s)} className="rounded-full bg-neutral px-4 py-2 text-sm font-medium text-on-neutral">
                      {s}
                    </button>
                  ))}
                  <button onClick={() => respond("Message instead")} className="rounded-full border border-line bg-card px-4 py-2 text-sm font-medium">
                    Message instead
                  </button>
                </div>
                <button onClick={() => respond("Not now")} className="mt-4 text-[13px] font-medium text-fg-2">
                  Not now
                </button>
              </>
            ) : (
              <p className="mt-2 font-serif text-[20px] font-light leading-snug">
                {done === "Message instead" ? "Your clinic will send you a message." : `See you ${done?.replace(/^Today/, "today").replace(/^Tomorrow/, "tomorrow")}.`}{" "}
                <span className="text-fg-2">Thank you.</span>
              </p>
            )}
          </div>
        </FadeRise>
      )}
    </AnimatePresence>
  );
}
