"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useChat } from "@/components/chat-provider";
import { Avatar } from "@/components/circle/avatar";
import { CrisisSheet } from "@/components/crisis-sheet";
import { EASE_SOFT } from "@/components/motion";
import { AINO_PSEUDONYM, CRISIS_PATTERN, PEOPLE, timeLabel, type RoomId } from "@/lib/chat";
import { useHydrated } from "@/lib/use-client";
import { bloom } from "@/lib/field-events";

const PRESETS: Record<"friend" | "peers", string[]> = {
  friend: ["👋 Just a wave", "Thinking of you", "Fancy a short walk?", "Rough day, can't talk, just wanted you to know"],
  peers: ["Same here", "Small win today", "Evenings are hard for me too", "Sending a wave to everyone"],
};

export function Thread({
  room,
  title,
  subtitle,
  onBack,
  backLabel = "← Circle",
}: {
  room: RoomId;
  title: string;
  subtitle?: string;
  onBack?: () => void;
  backLabel?: string;
}) {
  const { me, messages, send, report, wakePeers } = useChat();
  const hydrated = useHydrated();
  const [text, setText] = useState("");
  const [crisisOpen, setCrisisOpen] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const isPeers = room === "peers";
  const list = messages.filter((m) => m.room === room).sort((a, b) => toMs(a.at) - toMs(b.at));

  useEffect(() => {
    if (isPeers) wakePeers();
  }, [isPeers, wakePeers]);

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [list.length]);

  const submit = (t: string, kind: "text" | "wave" = "text") => {
    const clean = t.trim();
    if (!clean) return;
    send(room, clean, kind);
    if (!CRISIS_PATTERN.test(clean)) bloom("small", undefined, isPeers ? "talked with your peers" : "reached out"); // reaching out counts
    setText("");
    // not safe? offer support first, gently
    if (CRISIS_PATTERN.test(clean)) setCrisisOpen(true);
  };

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[560px] flex-col px-5 pt-[max(32px,env(safe-area-inset-top))]">
      <header className="flex items-center gap-3">
        {onBack && (
          <button onClick={onBack} className="py-2 pr-2 text-sm font-medium text-fg-2">
            {backLabel}
          </button>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-serif text-[24px] font-light leading-tight">{title}</p>
          {subtitle && <p className="truncate text-[13px] text-fg-2">{subtitle}</p>}
        </div>
        <button onClick={() => setCrisisOpen(true)} className="rounded-full border border-line bg-card px-3 py-1.5 text-[13px] font-medium text-fg-2">
          Talk to someone
        </button>
      </header>

      {isPeers && (
        <p className="glass mt-4 px-4 py-3 text-[13px] leading-relaxed text-fg-2">
          People here have all been through TMS. You&rsquo;re <span className="font-semibold text-fg">{AINO_PSEUDONYM}</span>. Be kind, and remember
          peers aren&rsquo;t professionals. If you&rsquo;re not safe, tap <span className="font-medium text-fg">Talk to someone</span>.
        </p>
      )}

      <div className="flex flex-1 flex-col gap-3 py-6">
        <AnimatePresence initial={false}>
          {list.map((m) => {
            const mine = m.from === me;
            const name = isPeers && m.from === "aino" ? AINO_PSEUDONYM : PEOPLE[m.from].name;
            if (m.reported && !mine) {
              return (
                <p key={m.id} className="mx-auto text-[12px] text-fg-2">
                  Message hidden. Thanks for keeping this space kind.
                </p>
              );
            }
            return (
              <motion.div
                key={m.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: EASE_SOFT }}
                className={`flex items-end gap-2 ${mine ? "justify-end" : "justify-start"}`}
              >
                {!mine && <Avatar who={m.from} size={32} />}
                <div className={`max-w-[78%] ${mine ? "items-end" : "items-start"} flex flex-col`}>
                  {!mine && isPeers && <span className="mb-1 ml-1 text-[12px] font-medium text-fg-2">{name}</span>}
                  <p
                    className={`px-4 py-2.5 text-[15px] leading-snug ${
                      mine ? "rounded-[20px_20px_6px_20px] bg-action text-on-action" : "rounded-[20px_20px_20px_6px] bg-surface text-ink"
                    }`}
                  >
                    {m.text}
                  </p>
                  <span className="mt-1 px-1 text-[11px] text-fg-2">
                    {hydrated ? timeLabel(m.at) : ""}
                    {!mine && isPeers && (
                      <button onClick={() => report(m.id)} className="ml-2 underline-offset-2 hover:underline">
                        Report
                      </button>
                    )}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={end} />
      </div>

      <div className="sticky bottom-0 -mx-5 border-t border-line bg-bg/90 px-5 pt-3 backdrop-blur-xl safe-bottom">
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-3">
          {PRESETS[isPeers ? "peers" : "friend"].map((p) => (
            <button key={p} onClick={() => submit(p, p.startsWith("👋") ? "wave" : "text")} className="shrink-0 rounded-full border border-line bg-card px-4 py-2 text-sm">
              {p}
            </button>
          ))}
        </div>
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            submit(text);
          }}
        >
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={isPeers ? `Write as ${AINO_PSEUDONYM}…` : "Write a message…"}
            aria-label="Message"
            className="h-12 min-w-0 flex-1 rounded-full border border-line bg-surface/80 px-5 text-base text-ink outline-none focus:ring-2 focus:ring-action"
          />
          <button type="submit" disabled={!text.trim()} className="h-12 rounded-full bg-action px-5 text-sm font-semibold text-on-action disabled:opacity-40">
            Send
          </button>
        </form>
      </div>

      <CrisisSheet open={crisisOpen} onClose={() => setCrisisOpen(false)} />
    </main>
  );
}

const toMs = (at: number) => (at < 1e12 ? Date.now() + at * 60_000 : at);
