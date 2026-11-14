"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AUTO_REPLIES, PEER_SCRIPT, SEED_MESSAGES, type Message, type PersonId, type RoomId } from "@/lib/chat";

/**
 * Chat for the demo. Two windows (e.g. `/` and `/?as=maya`) talk live through
 * BroadcastChannel. If the other person isn't open anywhere, a scripted reply comes back.
 */

type Wire =
  | { type: "msg"; message: Message }
  | { type: "report"; id: string }
  | { type: "presence"; who: PersonId }
  | { type: "sync-req" }
  | { type: "sync"; messages: Message[] };

interface ChatContextValue {
  me: PersonId;
  messages: Message[];
  send: (room: RoomId, text: string, kind?: Message["kind"]) => void;
  report: (id: string) => void;
  /** people currently open in another window */
  online: Set<PersonId>;
  /** start the gentle scripted activity in the peer room */
  wakePeers: () => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);
const CHANNEL = "tiiramisu-chat-v1";
const uid = () => Math.random().toString(36).slice(2, 10);

export function ChatProvider({ me, children }: { me: PersonId; children: React.ReactNode }) {
  const [messages, setMessages] = useState<Message[]>(SEED_MESSAGES);
  const [online, setOnline] = useState<Set<PersonId>>(new Set());
  const channel = useRef<BroadcastChannel | null>(null);
  const lastSeen = useRef(new Map<PersonId, number>());
  const replyIndex = useRef(new Map<RoomId, number>());
  const peersWoken = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const messagesRef = useRef(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const add = useCallback((ms: Message[]) => {
    setMessages((cur) => {
      const ids = new Set(cur.map((m) => m.id));
      const fresh = ms.filter((m) => !ids.has(m.id));
      return fresh.length ? [...cur, ...fresh] : cur;
    });
  }, []);

  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    const ch = new BroadcastChannel(CHANNEL);
    channel.current = ch;
    ch.onmessage = (e: MessageEvent<Wire>) => {
      const w = e.data;
      if (w.type === "msg") add([w.message]);
      if (w.type === "report") setMessages((cur) => cur.map((m) => (m.id === w.id ? { ...m, reported: true } : m)));
      if (w.type === "presence") lastSeen.current.set(w.who, Date.now());
      if (w.type === "sync-req") ch.postMessage({ type: "sync", messages: messagesRef.current.filter((m) => m.at > 1e12) } satisfies Wire);
      if (w.type === "sync") add(w.messages);
    };
    ch.postMessage({ type: "sync-req" } satisfies Wire);
    const beat = () => {
      ch.postMessage({ type: "presence", who: me } satisfies Wire);
      const now = Date.now();
      const on = new Set<PersonId>();
      lastSeen.current.forEach((t, who) => now - t < 6000 && on.add(who));
      setOnline((prev) => (prev.size === on.size && [...on].every((p) => prev.has(p)) ? prev : on));
    };
    const first = setTimeout(beat, 0);
    const iv = setInterval(beat, 2500);
    const pending = timers.current;
    return () => {
      clearTimeout(first);
      clearInterval(iv);
      pending.forEach(clearTimeout);
      ch.close();
      channel.current = null;
    };
  }, [me, add]);

  const post = useCallback(
    (m: Message) => {
      add([m]);
      channel.current?.postMessage({ type: "msg", message: m } satisfies Wire);
    },
    [add],
  );

  const send = useCallback(
    (room: RoomId, text: string, kind: Message["kind"] = "text") => {
      post({ id: uid(), room, from: me, text, at: Date.now(), kind });

      // scripted reply if the other side isn't actually open
      const auto = AUTO_REPLIES[room];
      if (!auto || me !== "aino") return;
      const realOnline = Date.now() - (lastSeen.current.get(auto.from) ?? 0) < 6000;
      if (realOnline) return;
      const i = replyIndex.current.get(room) ?? 0;
      replyIndex.current.set(room, i + 1);
      if (i >= auto.texts.length) return;
      timers.current.push(
        setTimeout(() => post({ id: uid(), room, from: auto.from, text: auto.texts[i], at: Date.now() }), auto.delay),
      );
    },
    [me, post],
  );

  const report = useCallback((id: string) => {
    setMessages((cur) => cur.map((m) => (m.id === id ? { ...m, reported: true } : m)));
    channel.current?.postMessage({ type: "report", id } satisfies Wire);
  }, []);

  const wakePeers = useCallback(() => {
    if (peersWoken.current) return;
    peersWoken.current = true;
    PEER_SCRIPT.forEach((m, i) => {
      timers.current.push(setTimeout(() => add([{ ...m, id: `script-${i}`, at: Date.now() }]), 5000 + i * 7000));
    });
  }, [add]);

  const value = useMemo(() => ({ me, messages, send, report, online, wakePeers }), [me, messages, send, report, online, wakePeers]);
  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used inside <ChatProvider>");
  return ctx;
}
