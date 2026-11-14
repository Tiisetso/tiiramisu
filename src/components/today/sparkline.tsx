"use client";

import { useId, useState } from "react";

const W = 120;
const H = 36;
const PAD = 4;

/**
 * Soft sparkline vs "your usual" band (DESIGN.md → Signal row; dataviz: stat-tile trend).
 * Earlier days in the muted step, the most recent `accentLast` days in the accent.
 * Pointer/focus shows a crosshair + tooltip snapped to the nearest day.
 */
export function Sparkline({
  values,
  band,
  labels,
  format,
  accentLast = 7,
  ariaLabel,
}: {
  values: (number | null)[];
  band: [number, number];
  labels: string[];
  format: (v: number) => string;
  accentLast?: number;
  ariaLabel: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const clip = useId();

  const finite = values.filter((v): v is number => v !== null);
  const lo = Math.min(band[0], ...finite);
  const hi = Math.max(band[1], ...finite);
  const span = hi - lo || 1;
  const x = (i: number) => PAD + (i / Math.max(1, values.length - 1)) * (W - PAD * 2);
  const y = (v: number) => H - PAD - ((v - lo) / span) * (H - PAD * 2);

  // path with gaps for missing days
  const path = (from: number, to: number) => {
    let d = "";
    let pen = false;
    for (let i = from; i <= to; i++) {
      const v = values[i];
      if (v === null) {
        pen = false;
        continue;
      }
      d += `${pen ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`;
      pen = true;
    }
    return d;
  };

  const n = values.length;
  const split = Math.max(0, n - accentLast);
  const lastIdx = values.map((v, i) => (v === null ? -1 : i)).filter((i) => i >= 0).pop() ?? -1;

  const pick = (clientX: number, rect: DOMRect) => {
    const rel = ((clientX - rect.left) / rect.width) * W;
    const i = Math.round(((rel - PAD) / (W - PAD * 2)) * (n - 1));
    setHover(Math.min(n - 1, Math.max(0, i)));
  };

  const hv = hover !== null ? values[hover] : null;

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="block h-9 w-full touch-none overflow-visible"
        role="img"
        aria-label={ariaLabel}
        tabIndex={0}
        onPointerMove={(e) => pick(e.clientX, e.currentTarget.getBoundingClientRect())}
        onPointerDown={(e) => pick(e.clientX, e.currentTarget.getBoundingClientRect())}
        onPointerLeave={() => setHover(null)}
        onFocus={() => setHover(lastIdx >= 0 ? lastIdx : null)}
        onBlur={() => setHover(null)}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") setHover((h) => Math.max(0, (h ?? n - 1) - 1));
          if (e.key === "ArrowRight") setHover((h) => Math.min(n - 1, (h ?? 0) + 1));
        }}
      >
        <defs>
          <clipPath id={clip}>
            <rect x="0" y="0" width={W} height={H} />
          </clipPath>
        </defs>
        {/* your usual */}
        <rect
          x={PAD}
          width={W - PAD * 2}
          y={y(band[1])}
          height={Math.max(2, y(band[0]) - y(band[1]))}
          rx="3"
          fill="var(--spark-band)"
        />
        <g clipPath={`url(#${clip})`} fill="none" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke">
          <path d={path(0, Math.min(n - 1, split))} stroke="var(--spark-muted)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          <path d={path(split, n - 1)} stroke="var(--spark)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        </g>
        {hover !== null && (
          <line x1={x(hover)} x2={x(hover)} y1={0} y2={H} stroke="var(--line)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        )}
      </svg>
      {/* end + hover markers as HTML so they stay round under the stretched viewBox */}
      {lastIdx >= 0 && hover === null && (
        <span
          className="pointer-events-none absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--spark)] ring-2 ring-[var(--bg)]"
          style={{ left: `${(x(lastIdx) / W) * 100}%`, top: `${(y(values[lastIdx] as number) / H) * 100}%` }}
        />
      )}
      {hover !== null && hv !== null && (
        <span
          className="pointer-events-none absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--spark)] ring-2 ring-[var(--bg)]"
          style={{ left: `${(x(hover) / W) * 100}%`, top: `${(y(hv) / H) * 100}%` }}
        />
      )}
      {hover !== null && (
        <div
          className="pointer-events-none absolute right-0 bottom-full z-10 mb-2 whitespace-nowrap rounded-full border border-line bg-bg px-3 py-1 text-[12px] text-fg shadow-[var(--shadow)]"
        >
          <span className="text-fg-2">{labels[hover]} · </span>
          {hv === null ? "no data" : format(hv)}
        </div>
      )}
    </div>
  );
}
