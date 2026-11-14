"use client";

import { useDemo } from "@/components/demo-provider";
import { useLearning } from "@/components/learning-provider";
import { INTERVENTIONS } from "@/lib/analysis";
import { interventionName } from "@/lib/learning";

/** "What helps you": meter list of the person's own answers (dataviz: name · bar · figure). */
export function WhatHelps() {
  const { persona } = useDemo();
  const { tallies } = useLearning();
  const rows = INTERVENTIONS.map((i) => ({ i, ...tallies[i] }))
    .filter((r) => r.tried > 0)
    .sort((a, b) => b.mean - a.mean || b.tried - a.tried)
    .slice(0, 4);

  return (
    <div className="glass p-6">
      <p className="eyebrow text-fg-2">What helps you</p>
      {rows.length === 0 ? (
        <p className="mt-3 text-base leading-relaxed">
          I&rsquo;m still learning what helps you. Each time you tell me whether something helped, I get a little better at this.
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-4">
          {rows.map((r) => (
            <li key={r.i}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[15px] font-medium">{interventionName(r.i, persona.circle[0])}</span>
                <span className="text-[13px] tabular-nums text-fg-2">
                  helped {r.helped} of {r.tried}
                </span>
              </div>
              <div
                className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--spark-band)]"
                role="meter"
                aria-valuemin={0}
                aria-valuemax={r.tried}
                aria-valuenow={r.helped}
                aria-label={`${interventionName(r.i, persona.circle[0])} helped ${r.helped} of ${r.tried} times`}
              >
                <div className="h-full rounded-full bg-[var(--spark)] transition-[width] duration-700" style={{ width: `${(r.helped / r.tried) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
