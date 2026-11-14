"use client";

import { AnimatePresence, motion } from "motion/react";
import { EASE_SOFT } from "@/components/motion";

/**
 * Support options, always reachable (DESIGN.md → Crisis sheet).
 * Numbers: Finland. 112 emergency; MIELI Crisis Helpline (Finnish, 24/7).
 * MIELI's English phone line closed in 2026; English support is via their chat.
 */
const LINES = [
  { label: "Emergency", detail: "If you are in danger right now", action: "Call 112", href: "tel:112" },
  { label: "MIELI Crisis Helpline", detail: "Finnish · open 24/7", action: "Call 09 2525 0111", href: "tel:+358925250111" },
  { label: "MIELI Crisis Chat", detail: "English · online", action: "Open mieli.fi", href: "https://mieli.fi/en/" },
];

export function CrisisSheet({
  open,
  onClose,
  name,
  contact = "Maya",
}: {
  open: boolean;
  onClose: () => void;
  name?: string;
  contact?: string;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-40 flex items-end justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <button aria-label="Close" className="absolute inset-0 bg-ink/35" onClick={onClose} />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="crisis-title"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.5, ease: EASE_SOFT }}
            className="relative w-full max-w-[560px] rounded-t-[40px] bg-bg px-6 pt-8 text-fg shadow-[var(--shadow)] safe-bottom"
          >
            <div className="mx-auto mb-6 h-1 w-10 rounded-full bg-line" />
            <h2 id="crisis-title" className="font-serif text-[28px] font-light leading-tight">
              You don&rsquo;t have to hold this alone{name ? `, ${name}` : ""}.
            </h2>
            <p className="mt-3 text-base text-fg-2">Someone is there to talk, right now.</p>

            <div className="mt-6 flex flex-col gap-3">
              {LINES.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  target={l.href.startsWith("http") ? "_blank" : undefined}
                  rel="noreferrer"
                  className="flex items-center justify-between gap-4 rounded-[24px] border border-line bg-card px-5 py-4"
                >
                  <span>
                    <span className="block text-base font-medium">{l.label}</span>
                    <span className="block text-[13px] text-fg-2">{l.detail}</span>
                  </span>
                  <span className="shrink-0 rounded-full bg-care px-4 py-2 text-sm font-semibold text-white">{l.action}</span>
                </a>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <button className="rounded-full border border-neutral px-4 py-3 text-sm font-semibold text-neutral">Message {contact}</button>
                <button className="rounded-full border border-neutral px-4 py-3 text-sm font-semibold text-neutral">Message my clinic</button>
              </div>
            </div>

            <button onClick={onClose} className="mt-6 w-full py-3 text-sm font-medium text-fg-2">
              Close
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
