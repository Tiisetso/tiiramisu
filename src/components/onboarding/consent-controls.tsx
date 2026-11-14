"use client";

import { useState } from "react";
import { useDemo } from "@/components/demo-provider";
import { setConsent, useConsent, type Consent } from "@/lib/consent";
import { disablePush, enablePush, PUSH_MESSAGE } from "@/lib/push";

function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-300 ${on ? "bg-action" : "bg-line"}`}
    >
      <span className={`absolute top-1 size-5 rounded-full bg-white shadow-sm transition-all duration-300 ${on ? "left-6" : "left-1"}`} />
    </button>
  );
}

export function ConsentRow({
  title,
  body,
  k,
  note,
}: {
  title: string;
  body: string;
  k: keyof Pick<Consent, "voice" | "shareWithClinic" | "shareStatus" | "peers" | "reminders" | "appleHealth">;
  note?: string;
}) {
  const c = useConsent();
  const { patient } = useDemo();
  const [msg, setMsg] = useState<string | null>(null);

  const change = async (v: boolean) => {
    if (k !== "reminders") return setConsent({ [k]: v });
    // Reminders = real push: ask the phone inside this tap (iOS requires it)
    if (!v) {
      setConsent({ reminders: false });
      setMsg(null);
      void disablePush();
      return;
    }
    setConsent({ reminders: true });
    const result = await enablePush(patient.id);
    if (result !== "on") {
      setConsent({ reminders: false });
      setMsg(PUSH_MESSAGE[result]);
    } else setMsg("On. You'll only ever see one calm notification at a time.");
  };

  return (
    <div className="flex items-start gap-4 py-4">
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-medium">{title}</p>
        <p className="mt-1 text-[13px] leading-relaxed text-fg-2">{body}</p>
        {note && c[k] && <p className="mt-1 text-[12px] text-fg-2">{note}</p>}
        {msg && (
          <p className="mt-2 text-[12px] leading-relaxed text-fg" role="status">
            {msg}
          </p>
        )}
      </div>
      <Switch on={c[k]} onChange={(v) => void change(v)} label={title} />
    </div>
  );
}

/** The consent switches: used in onboarding (step 2) and in the Privacy sheet. */
export function ConsentControls() {
  return (
    <div className="glass divide-y divide-line px-5">
      <ConsentRow
        k="voice"
        title="Listen to my voice check-ins"
        body="How you sound is measured on your phone. Your words are transcribed to understand them; the recording itself is never stored."
      />
      <ConsentRow
        k="shareWithClinic"
        title="Share a short summary with my clinic"
        body="Your clinician sees a few lines about how you're doing, so they can reach out if you need it. Never your recordings."
      />
      <ConsentRow
        k="reminders"
        title="Gentle reminders"
        body="At most one calm notification at a time, never a pile, never a count. Your phone will ask first."
      />
      <ConsentRow
        k="appleHealth"
        title="Sleep and activity from Apple Health"
        body="Helps notice changes in your rhythm. You can connect it any time."
        note="We'll show you how to connect it."
      />
    </div>
  );
}
