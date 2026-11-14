"use client";

import { useState } from "react";
import { useChat } from "@/components/chat-provider";
import { Avatar } from "@/components/circle/avatar";
import { Thread } from "@/components/circle/thread";
import { FadeRise } from "@/components/motion";
import { FRIEND_ROOMS, PEOPLE, type RoomId } from "@/lib/chat";
import { setConsent, useConsent } from "@/lib/consent";

/** Circle: real friends (soft status only) + anonymous TMS peers. */
export function CircleScreen({ onThreadOpen }: { onThreadOpen?: (open: boolean) => void }) {
  const { messages, send, online } = useChat();
  const [open, setOpenState] = useState<RoomId | null>(null);
  const setOpen = (room: RoomId | null) => {
    setOpenState(room);
    onThreadOpen?.(room !== null); // hide the tab bar so it doesn't cover the composer
  };
  const [waved, setWaved] = useState<Set<RoomId>>(new Set());
  const consent = useConsent();
  const sharing = consent.shareStatus;
  const friends = FRIEND_ROOMS.filter((f) => consent.circle.includes(f.person));

  if (open) {
    const friend = FRIEND_ROOMS.find((f) => f.room === open);
    return (
      <Thread
        room={open}
        title={open === "peers" ? "After TMS · Helsinki" : PEOPLE[friend!.person].name}
        subtitle={
          open === "peers"
            ? "Anonymous peer room · 3 here now"
            : online.has(friend!.person)
              ? "Online now"
              : friend!.status
        }
        onBack={() => setOpen(null)}
      />
    );
  }

  const last = (room: RoomId) => messages.filter((m) => m.room === room).at(-1);
  const wave = (room: RoomId) => {
    send(room, "👋 Just a wave", "wave");
    setWaved((w) => new Set(w).add(room));
  };
  const quiet = friends.find((f) => f.quietDays && !waved.has(f.room));

  return (
    <main className="mx-auto flex w-full max-w-[560px] flex-col px-5 pt-[max(40px,env(safe-area-inset-top))] pb-32">
      <FadeRise>
        <p className="eyebrow text-fg-2">Circle</p>
        <h1 className="mt-4 font-serif text-[36px] font-light leading-[1.1]">
          The people who&rsquo;ve <span className="italic">got you</span>.
        </h1>
      </FadeRise>

      {quiet && (
        <FadeRise index={1} className="mt-6">
          <div className="glass-raised relative flex items-center gap-4 overflow-hidden p-5">
            <span className="absolute inset-y-5 left-0 w-[3px] rounded-full bg-gold-soft" />
            <Avatar who={quiet.person} />
            <p className="min-w-0 flex-1 text-[15px] leading-snug">
              {PEOPLE[quiet.person].name}&rsquo;s been quiet for {quiet.quietDays} days. Send a wave?
            </p>
            <button onClick={() => wave(quiet.room)} aria-label={`Wave to ${PEOPLE[quiet.person].name}`} className="flex size-14 shrink-0 items-center justify-center rounded-full bg-gold-pale text-2xl">
              👋
            </button>
          </div>
        </FadeRise>
      )}

      <FadeRise index={2} className="mt-8">
        <p className="eyebrow text-fg-2">Your circle</p>
        {friends.length === 0 && (
          <p className="glass mt-3 p-5 text-[14px] text-fg-2">No one in your circle yet. Add someone in Privacy &amp; what&rsquo;s shared.</p>
        )}
        <ul className={`glass mt-3 divide-y divide-line px-5 ${friends.length === 0 ? "hidden" : ""}`}>
          {friends.map((f) => {
            const m = last(f.room);
            return (
              <li key={f.room} className="flex items-center gap-4 py-4">
                <button onClick={() => setOpen(f.room)} className="flex min-w-0 flex-1 items-center gap-4 text-left">
                  <span className="relative">
                    <Avatar who={f.person} />
                    {online.has(f.person) && <span className="absolute right-0 bottom-0 size-3 rounded-full bg-sage ring-2 ring-bg" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[15px] font-medium">{PEOPLE[f.person].name}</span>
                    <span className="block truncate text-[13px] text-fg-2">
                      {m && m.at > 1e12 ? `${m.from === "aino" ? "You: " : ""}${m.text}` : f.status}
                    </span>
                  </span>
                </button>
                <button
                  onClick={() => wave(f.room)}
                  disabled={waved.has(f.room)}
                  aria-label={`Wave to ${PEOPLE[f.person].name}`}
                  className="flex size-11 shrink-0 items-center justify-center rounded-full border border-line bg-card text-lg disabled:opacity-40"
                >
                  👋
                </button>
              </li>
            );
          })}
        </ul>
      </FadeRise>

      <FadeRise index={3} className="mt-8">
        <p className="eyebrow text-fg-2">Peers</p>
        {!consent.peers ? (
          <div className="glass mt-3 flex items-center gap-4 p-5">
            <p className="min-w-0 flex-1 text-[14px] leading-relaxed text-fg-2">
              An anonymous room for people who&rsquo;ve had TMS. Join whenever you like.
            </p>
            <button onClick={() => setConsent({ peers: true })} className="shrink-0 rounded-full border border-neutral px-4 py-2 text-sm font-semibold text-neutral">
              Join
            </button>
          </div>
        ) : (
        <button onClick={() => setOpen("peers")} className="glass mt-3 flex w-full items-center gap-4 p-5 text-left">
          <span className="flex -space-x-3">
            <Avatar who="willow" size={36} />
            <Avatar who="harbor" size={36} />
            <Avatar who="fern" size={36} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-medium">After TMS · Helsinki</span>
            <span className="block truncate text-[13px] text-fg-2">Anonymous · {last("peers")?.text}</span>
          </span>
        </button>
        )}
      </FadeRise>

      <FadeRise index={4} className="mt-8">
        <div className="glass flex items-start gap-4 p-5">
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-medium">Share that I&rsquo;ve checked in</p>
            <p className="mt-1 text-[13px] leading-relaxed text-fg-2">
              Your circle only sees whether you&rsquo;ve checked in. Never your voice, sleep or anything you say here.
            </p>
          </div>
          <button
            role="switch"
            aria-checked={sharing}
            onClick={() => setConsent({ shareStatus: !sharing })}
            className={`relative mt-1 h-7 w-12 shrink-0 rounded-full transition-colors ${sharing ? "bg-action" : "bg-line"}`}
          >
            <span className={`absolute top-1 size-5 rounded-full bg-white transition-all ${sharing ? "left-6" : "left-1"}`} />
          </button>
        </div>
      </FadeRise>
    </main>
  );
}
