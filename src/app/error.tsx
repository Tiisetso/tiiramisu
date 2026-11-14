"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";

/** Gentle fallback so a bug never leaves a blank screen mid-demo. */
export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[560px] flex-col items-center justify-center px-5 text-center">
      <p className="eyebrow text-fg-2">Tiiramisu</p>
      <h1 className="mt-4 font-serif text-[32px] font-light leading-tight">Something went a little sideways.</h1>
      <p className="mt-3 text-base text-fg-2">Take a breath. Let&rsquo;s try that again.</p>
      <div className="mt-8 flex w-full max-w-sm flex-col gap-3">
        <button onClick={() => retry()} className="h-14 rounded-full bg-action px-8 font-semibold text-on-action">
          Try again
        </button>
        <button onClick={() => window.location.reload()} className="h-13 rounded-full border border-neutral px-8 font-semibold text-neutral">
          Start fresh
        </button>
      </div>
    </main>
  );
}
