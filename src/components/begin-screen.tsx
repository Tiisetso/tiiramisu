"use client";

import { Breath, Button, FadeRise } from "@/components/motion";
import { greeting } from "@/lib/greeting";
import { useHydrated } from "@/lib/use-client";

/**
 * First screen. The Begin tap is the user gesture that unlocks audio on iOS
 * (the soundscape in #7 hooks into `onBegin`).
 */
export function BeginScreen({ name, onBegin }: { name: string; onBegin: () => void }) {
  const hello = useHydrated() ? greeting() : "Hello";

  return (
    <main className="flex min-h-dvh flex-col px-5 pt-[max(48px,env(safe-area-inset-top))] safe-bottom">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <FadeRise>
          <Breath className="mx-auto mb-10 size-28 rounded-full bg-linear-to-br from-gold-pale via-blush to-dusk-pale opacity-90 shadow-[0_0_80px_rgba(221,190,120,0.55)]" />
        </FadeRise>
        <FadeRise index={1}>
          <p className="eyebrow text-fg-2">Tiiramisu</p>
        </FadeRise>
        <FadeRise index={2}>
          <h1 className="mt-4 font-serif text-5xl font-light leading-[1.08] tracking-tight md:text-7xl">
            {hello},
            <br />
            <span className="italic">{name}</span>
          </h1>
        </FadeRise>
        <FadeRise index={3}>
          <p className="mx-auto mt-6 max-w-xs font-serif text-[22px] font-light leading-snug text-fg-2">
            Take a breath. We&rsquo;ll go gently today.
          </p>
        </FadeRise>
      </div>
      <FadeRise index={4} className="mx-auto w-full max-w-sm">
        <Button className="w-full" onClick={onBegin}>
          Begin
        </Button>
        <p className="mt-4 text-center text-[13px] text-fg-2">Sound on for the full experience</p>
      </FadeRise>
    </main>
  );
}
