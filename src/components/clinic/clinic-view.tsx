"use client";

import { useEffect, useMemo, useState } from "react";
import { Sparkline } from "@/components/today/sparkline";
import { ACTION_LABEL, type ClinicPatientInput, type ClinicSummary } from "@/lib/clinic";
import { PATIENTS, type Patient } from "@/lib/demo/patients";
import { DAYS } from "@/lib/demo/persona";
import { computeDayState, type DayState } from "@/lib/signals";
import { useUrlNumber } from "@/lib/use-client";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface Row {
  p: Patient;
  state: DayState;
  trend: number[];
  lastCheckin: number | null; // days ago
}

function status(r: Row): { label: string; tone: "care" | "watch" | "quiet" | "steady" } {
  if (r.state.level === "drifting") return { label: "Needs a call", tone: "care" };
  if (r.state.level === "watch") return { label: "Watch", tone: "watch" };
  if ((r.lastCheckin ?? 99) >= 4) return { label: "No check-ins", tone: "quiet" };
  return { label: "Steady", tone: "steady" };
}

const DOT = { care: "bg-care", watch: "bg-gold-soft", quiet: "bg-dusk-pale", steady: "bg-sage" } as const;

function agoLabel(d: number | null) {
  if (d === null) return "—";
  if (d === 0) return "Today";
  if (d === 1) return "Yesterday";
  return `${d} days ago`;
}

/** Clinician view (DESIGN.md: plain canvas, no light field, denser, clinical language allowed). */
export function ClinicView() {
  const urlDay = useUrlNumber("day");
  const day = Math.min(DAYS - 1, Math.max(7, urlDay ?? DAYS - 1));
  const [selected, setSelected] = useState("aino");
  const [contacted, setContacted] = useState<Set<string>>(new Set());
  const [summaries, setSummaries] = useState<Record<string, { s: ClinicSummary; source: string } | "loading">>({});

  const rows = useMemo<Row[]>(
    () =>
      PATIENTS.map((p) => {
        const state = computeDayState(p.days, day);
        const trend = Array.from({ length: 21 }, (_, i) => computeDayState(p.days, day - 20 + i).driftScore);
        let lastCheckin: number | null = null;
        for (let d = day; d >= 0; d--)
          if (p.days[d].voice) {
            lastCheckin = day - d;
            break;
          }
        return { p, state, trend, lastCheckin };
      }),
    [day],
  );

  const sorted = [...rows].sort(
    (a, b) => Number(contacted.has(a.p.id)) - Number(contacted.has(b.p.id)) || b.state.driftScore - a.state.driftScore,
  );
  const current = rows.find((r) => r.p.id === selected) ?? sorted[0];
  const needCall = rows.filter((r) => r.state.level === "drifting" && !contacted.has(r.p.id)).length;
  const labels = Array.from({ length: 21 }, (_, i) => (i === 20 ? "Today" : WEEKDAYS[current.p.days[day - 20 + i].weekday]));

  // Claude summary for the selected patient (once per patient+day)
  const key = `${current.p.id}:${day}`;
  const entry = summaries[key];
  useEffect(() => {
    if (entry) return;
    const input: ClinicPatientInput = {
      name: current.p.name,
      weeksSinceTms: current.p.weeksSinceTms,
      level: current.state.level,
      driftScore: current.state.driftScore,
      missedCheckins: current.state.missedCheckins,
      signals: current.state.signals.map((s) => ({ label: s.label, phrase: s.phrase, z: s.z })),
      quotes: current.p.quotes,
    };
    let cancelled = false;
    const t = setTimeout(() => {
      if (cancelled) return;
      setSummaries((m) => ({ ...m, [key]: "loading" }));
      fetch("/api/clinic-summary", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ patient: input }) })
        .then((r) => r.json())
        .then((d: { summary: ClinicSummary; source: string }) => setSummaries((m) => ({ ...m, [key]: { s: d.summary, source: d.source } })))
        .catch(() => setSummaries((m) => {
          const next = { ...m };
          delete next[key];
          return next;
        }));
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [key, entry, current]);

  return (
    <div className="min-h-dvh bg-canvas text-ink">
      <header className="border-b border-hairline">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-4">
          <p className="eyebrow text-ash">Tiiramisu · Clinic</p>
          <a href={`/?day=${day}&demo=1`} className="text-sm font-medium text-stone underline-offset-4 hover:underline">
            Open patient app →
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-[1200px] px-6 py-8">
        <h1 className="font-serif text-[40px] font-light leading-tight">Who might need a call this week</h1>
        <p className="mt-2 text-base text-ash">
          {needCall === 0 ? "Everyone is close to their usual." : `${needCall} ${needCall === 1 ? "patient has" : "patients have"} drifted from their usual.`}{" "}
          Compared with each person&rsquo;s own last four weeks.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_440px]">
          {/* Caseload */}
          <section aria-label="Patients" className="overflow-hidden rounded-[24px] border border-hairline bg-surface">
            <div className="grid grid-cols-[minmax(0,1.4fr)_120px_minmax(0,1fr)_110px] gap-4 border-b border-hairline px-5 py-3 max-md:hidden">
              {["Patient", "3-week trend", "What changed", "Last check-in"].map((h) => (
                <span key={h} className="eyebrow text-ash">
                  {h}
                </span>
              ))}
            </div>
            <ul>
              {sorted.map((r) => {
                const st = status(r);
                const on = r.p.id === current.p.id;
                return (
                  <li key={r.p.id} className="border-b border-hairline last:border-0">
                    <button
                      onClick={() => setSelected(r.p.id)}
                      className={`grid w-full grid-cols-[minmax(0,1.4fr)_120px_minmax(0,1fr)_110px] items-center gap-4 px-5 py-4 text-left transition-colors max-md:grid-cols-1 max-md:gap-2 ${
                        on ? "bg-surface-warm" : "hover:bg-surface-warm/60"
                      } ${contacted.has(r.p.id) ? "opacity-60" : ""}`}
                    >
                      <span className="min-w-0">
                        <span className="flex items-center gap-2">
                          <span className={`size-2.5 shrink-0 rounded-full ${DOT[st.tone]}`} aria-hidden />
                          <span className="truncate text-[15px] font-medium">{r.p.name}</span>
                        </span>
                        <span className="mt-0.5 block pl-4.5 text-[13px] text-ash">
                          {contacted.has(r.p.id) ? "Contacted today" : st.label} · {r.p.weeksSinceTms} wk after TMS
                        </span>
                      </span>
                      <span className="pointer-events-none">
                        <Sparkline values={r.trend} band={[0, 0.6]} labels={labels} format={(v) => `drift ${v.toFixed(1)}`} ariaLabel={`${r.p.name} drift trend`} />
                      </span>
                      <span className="truncate text-[13px] text-ash">
                        {r.state.top.length ? r.state.top.slice(0, 2).map((s) => s.label).join(", ") : "Nothing notable"}
                      </span>
                      <span className={`text-[13px] ${(r.lastCheckin ?? 99) >= 3 ? "font-medium text-ink" : "text-ash"}`}>{agoLabel(r.lastCheckin)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Detail */}
          <section aria-label={`${current.p.name} details`} className="self-start rounded-[24px] border border-hairline bg-surface p-6 lg:sticky lg:top-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-serif text-[28px] font-light leading-tight">{current.p.name}</h2>
                <p className="mt-1 text-[13px] text-ash">
                  {current.p.weeksSinceTms} weeks after TMS · last check-in {agoLabel(current.lastCheckin).toLowerCase()}
                </p>
                <a
                  href={`/?patient=${current.p.id}&day=${day}&demo=1`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block text-[13px] font-medium text-stone underline-offset-4 hover:underline"
                >
                  See their app ↗
                </a>
              </div>
              <span className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-hairline px-3 py-1 text-[13px] font-medium">
                <span className={`size-2 rounded-full ${DOT[status(current).tone]}`} />
                {status(current).label}
              </span>
            </div>

            <div className="mt-5">
              <p className="eyebrow text-ash">Drift, last 3 weeks</p>
              <div className="mt-2">
                <Sparkline values={current.trend} band={[0, 0.6]} labels={labels} format={(v) => `drift ${v.toFixed(2)}`} ariaLabel="Drift trend" />
              </div>
            </div>

            <div className="mt-6 rounded-[16px] bg-surface-warm p-4">
              <div className="flex items-center justify-between">
                <p className="eyebrow text-ash">This week</p>
                {entry && entry !== "loading" && (
                  <span className="rounded-full bg-canvas px-2.5 py-0.5 text-[12px] font-medium text-stone">{ACTION_LABEL[entry.s.suggested_action]}</span>
                )}
              </div>
              {!entry || entry === "loading" ? (
                <div className="mt-3 space-y-2" aria-busy="true" aria-label="Writing summary">
                  <div className="h-3 w-full animate-pulse rounded bg-hairline" />
                  <div className="h-3 w-11/12 animate-pulse rounded bg-hairline" />
                  <div className="h-3 w-2/3 animate-pulse rounded bg-hairline" />
                </div>
              ) : (
                <>
                  <p className="mt-2 text-[15px] leading-relaxed">{entry.s.summary}</p>
                  {entry.s.watch_points.length > 0 && (
                    <ul className="mt-3 list-disc space-y-1 pl-5 text-[14px] text-stone">
                      {entry.s.watch_points.map((w) => (
                        <li key={w}>{w}</li>
                      ))}
                    </ul>
                  )}
                </>
              )}
              <p className="mt-3 text-[11px] text-ash">Drafted by AI from check-ins and passive signals. Not a diagnosis.</p>
            </div>

            <div className="mt-6">
              <p className="eyebrow text-ash">Signals vs their usual</p>
              <ul className="mt-3 space-y-2.5">
                {current.state.signals.map((s) => (
                  <li key={s.key} className="grid grid-cols-[130px_minmax(0,1fr)_36px] items-center gap-3 text-[13px]">
                    <span className="truncate">{s.label}</span>
                    <span className="h-2 overflow-hidden rounded-full bg-[var(--spark-band)]">
                      <span
                        className={`block h-full rounded-full ${s.z > 1 ? "bg-care" : "bg-[var(--spark)]"}`}
                        style={{ width: `${Math.max(4, (Math.max(0, s.z) / 4) * 100)}%` }}
                      />
                    </span>
                    <span className="text-right tabular-nums text-ash">{s.z > 0 ? `+${s.z.toFixed(1)}` : s.z.toFixed(1)}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[11px] text-ash">z vs own 4-week baseline · + = moving in a concerning direction</p>
            </div>

            <div className="mt-6">
              <p className="eyebrow text-ash">From recent check-ins</p>
              <ul className="mt-2 space-y-2">
                {current.p.quotes.map((q) => (
                  <li key={q} className="border-l-2 border-gold-soft pl-3 text-[14px] italic text-stone">
                    &ldquo;{q}&rdquo;
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <a href="tel:+358000000000" className="flex h-12 items-center justify-center rounded-full bg-dusk text-sm font-semibold text-white">
                Call
              </a>
              <button
                onClick={() => setContacted((c) => new Set(c).add(current.p.id))}
                disabled={contacted.has(current.p.id)}
                className="h-12 rounded-full border border-stone text-sm font-semibold text-stone disabled:opacity-50"
              >
                {contacted.has(current.p.id) ? "Contacted ✓" : "Mark contacted"}
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
