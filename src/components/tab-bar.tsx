"use client";

export type Tab = "today" | "checkin" | "circle" | "calm";

const ICONS: Record<Tab, React.ReactNode> = {
  today: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" />
    </svg>
  ),
  checkin: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />
    </svg>
  ),
  circle: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <circle cx="9" cy="9" r="3.2" />
      <circle cx="16.5" cy="10" r="2.6" />
      <path d="M3.5 19c.8-3 3-4.5 5.5-4.5s4.7 1.5 5.5 4.5M14.5 15.2c.6-.3 1.3-.5 2-.5 2 0 3.5 1.2 4 3.8" />
    </svg>
  ),
  calm: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M3 12c2-3 4-3 6 0s4 3 6 0 4-3 6 0M3 17c2-3 4-3 6 0s4 3 6 0 4-3 6 0M3 7c2-3 4-3 6 0s4 3 6 0 4-3 6 0" />
    </svg>
  ),
};

const LABELS: Record<Tab, string> = { today: "Today", checkin: "Check in", circle: "Circle", calm: "Calm" };

/** Bottom nav (DESIGN.md → Tab bar). Glass, safe-area aware. */
export function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-3 bottom-[max(12px,env(safe-area-inset-bottom))] z-30 border border-line bg-bg/85 shadow-[var(--shadow)] backdrop-blur-xl mx-auto flex max-w-[536px] justify-around rounded-full px-2 py-1.5"
    >
      {(Object.keys(LABELS) as Tab[]).map((t) => {
        const on = t === active;
        return (
          <button
            key={t}
            onClick={() => onChange(t)}
            aria-current={on ? "page" : undefined}
            className={`flex min-w-16 flex-col items-center gap-0.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors ${
              on ? "text-fg" : "text-fg-2"
            }`}
          >
            <span className={`size-6 ${on ? "opacity-100" : "opacity-80"}`}>{ICONS[t]}</span>
            {LABELS[t]}
          </button>
        );
      })}
    </nav>
  );
}
