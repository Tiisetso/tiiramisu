"use client";

import { AnimatePresence, motion } from "motion/react";
import { EASE_SOFT } from "@/components/motion";
import { ConsentControls, ConsentRow } from "@/components/onboarding/consent-controls";

/** "Privacy & what's shared": the same switches as onboarding, any time. */
export function PrivacySheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-40 flex items-end justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <button aria-label="Close" className="absolute inset-0 bg-ink/30" onClick={onClose} />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="privacy-title"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.5, ease: EASE_SOFT }}
            className="relative max-h-[88dvh] w-full max-w-[560px] overflow-y-auto rounded-t-[40px] bg-bg px-6 pt-8 text-fg shadow-[var(--shadow)] safe-bottom"
          >
            <div className="mx-auto mb-6 h-1 w-10 rounded-full bg-line" />
            <h2 id="privacy-title" className="font-serif text-[28px] font-light leading-tight">
              What&rsquo;s <span className="italic">shared</span>
            </h2>
            <p className="mt-2 text-[14px] text-fg-2">Change anything, any time. It takes effect straight away.</p>
            <div className="mt-6">
              <ConsentControls />
            </div>
            <div className="glass mt-3 divide-y divide-line px-5">
              <ConsentRow k="shareStatus" title="Circle sees when I've checked in" body="Only 'checked in today'. Never your data." />
              <ConsentRow k="peers" title="Anonymous peer room" body="People who've also had TMS. You're 'Cloudberry'." />
            </div>
            <p className="mt-4 px-1 text-[12px] leading-relaxed text-fg-2">
              Stored in the EU (Frankfurt). Never sold, never used for ads. Recordings are never stored.
            </p>
            <button onClick={onClose} className="mt-4 w-full py-3 text-sm font-medium text-fg-2">
              Done
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
