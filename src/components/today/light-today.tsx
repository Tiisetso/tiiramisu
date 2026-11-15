"use client";

import { useToday } from "@/lib/field-events";
import { useHydrated } from "@/lib/use-client";

/** Stable pseudo-random per index, so motes don't jump around between renders. */
const rnd = (i: number, k: number) => {
  const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

const joinList = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);

/**
 * "Your light today" (savouring + mastery, DESIGN.md → Reinforcement): every small step leaves a
 * glowing mote; a gentle recap names what you did. No numbers, and it starts fresh each day.
 */
export function LightToday() {
  const today = useToday();
  const hydrated = useHydrated();
  if (!hydrated || today.blooms === 0) return null;

  const evening = new Date().getHours() >= 17;
  const motes = Math.min(today.blooms, 24);
  const recap = today.did.length
    ? `${evening ? "Today you" : "So far today you"} ${joinList(today.did)}.`
    : "Every small step counts.";

  return (
    <div className="glass relative mt-4 overflow-hidden p-6">
      <p className="eyebrow text-fg-2">Your light today</p>
      <div className="relative mt-3 h-16" aria-hidden>
        {Array.from({ length: motes }, (_, i) => {
          const size = 12 + rnd(i, 1) * 12;
          return (
            <span
              key={i}
              className="mote absolute rounded-full"
              style={{
                left: `${4 + rnd(i, 2) * 90}%`,
                top: `${10 + rnd(i, 3) * 70}%`,
                width: size,
                height: size,
                animationDelay: `${-rnd(i, 4) * 6}s`,
                animationDuration: `${5 + rnd(i, 5) * 4}s`,
              }}
            />
          );
        })}
      </div>
      <p className="mt-2 font-serif text-[20px] font-light leading-snug">{recap}</p>
      {today.did.length > 0 && <p className="mt-1 text-[13px] text-fg-2">That&rsquo;s worth noticing.</p>}
    </div>
  );
}
