"use client";

import { useDemo } from "@/components/demo-provider";
import { Avatar } from "@/components/circle/avatar";
import { Thread } from "@/components/circle/thread";

/**
 * `/?as=maya`: Maya's phone. She sees only Aino's soft status (checked in / quiet),
 * never her data, and can chat live with the main window.
 */
export function FriendView() {
  const { persona, state } = useDemo();
  const quiet = state.missedCheckins >= 2;
  const status = quiet ? `${persona.name} has been a bit quiet this week` : `${persona.name} checked in today`;

  return (
    <div className="flex flex-1 flex-col">
      <div className="mx-auto w-full max-w-[560px] px-5 pt-6">
        <p className="eyebrow text-center text-fg-2">Maya&rsquo;s phone</p>
        {quiet && (
          <div className="glass-raised mt-4 flex items-center gap-3 p-4">
            <Avatar who="aino" size={36} />
            <p className="text-[14px] leading-snug">
              {persona.name} has been a bit quiet this week. A wave might mean a lot.
            </p>
          </div>
        )}
      </div>
      <Thread room="maya" title={persona.name} subtitle={status} />
    </div>
  );
}
