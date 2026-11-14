/**
 * Demo chat: rooms, people and seeded/scripted messages.
 * Live sync between tabs/windows uses BroadcastChannel (no backend), see ChatProvider.
 */

export type RoomId = "maya" | "juho" | "mum" | "peers";
export type PersonId = "aino" | "maya" | "juho" | "mum" | "willow" | "harbor" | "fern";

export interface Message {
  id: string;
  room: RoomId;
  from: PersonId;
  text: string;
  /** minutes relative to "now" for seeds (negative), or epoch ms for live messages */
  at: number;
  kind?: "text" | "wave";
  reported?: boolean;
}

export const PEOPLE: Record<PersonId, { name: string; anon?: boolean; tint: string }> = {
  aino: { name: "Aino", tint: "#ddbe78" },
  maya: { name: "Maya", tint: "#ced4b8" },
  juho: { name: "Juho", tint: "#c9d4ea" },
  mum: { name: "Mum", tint: "#e8c4b0" },
  willow: { name: "Willow", anon: true, tint: "#ced4b8" },
  harbor: { name: "Harbor", anon: true, tint: "#c9d4ea" },
  fern: { name: "Fern", anon: true, tint: "#ddbe78" },
};

/** Aino's pseudonym in the peer room. */
export const AINO_PSEUDONYM = "Cloudberry";

export const FRIEND_ROOMS: { room: RoomId; person: PersonId; status: string; quietDays?: number }[] = [
  { room: "maya", person: "maya", status: "Checked in this morning" },
  { room: "juho", person: "juho", status: "Quiet for 3 days", quietDays: 3 },
  { room: "mum", person: "mum", status: "Checked in yesterday" },
];

const MIN = 60_000;

export const SEED_MESSAGES: Message[] = [
  { id: "s1", room: "maya", from: "maya", text: "That walk on Sunday was lovely. Same again soon?", at: -26 * 60 },
  { id: "s2", room: "maya", from: "aino", text: "Yes please", at: -25 * 60 },
  { id: "s3", room: "mum", from: "mum", text: "Thinking of you, sweetheart. Call when you like.", at: -20 * 60 },
  { id: "s4", room: "juho", from: "aino", text: "How's the new job going?", at: -4 * 24 * 60 },
  { id: "p1", room: "peers", from: "willow", text: "Morning all. Rough night, but I made it to the bakery. Small wins.", at: -95 },
  { id: "p2", room: "peers", from: "harbor", text: "Week 8 after TMS here. Evenings are the hardest for me. Anyone else?", at: -61 },
  { id: "p3", room: "peers", from: "fern", text: "Evenings, yes. I put the rain sounds on at nine and it helps a bit.", at: -48 },
];

/** Scripted replies when the real person isn't online in another tab. */
export const AUTO_REPLIES: Partial<Record<RoomId, { from: PersonId; texts: string[]; delay: number }>> = {
  maya: { from: "maya", texts: ["Aw, wave back! Sunday walk by the sea?", "Here if you want to talk. Or not talk. Either is fine.", "Thinking of you too"], delay: 2200 },
  juho: { from: "juho", texts: ["Thanks for the wave. Been a rough week honestly. Coffee soon?"], delay: 3500 },
  mum: { from: "mum", texts: ["Love you! Shall I call tonight?"], delay: 3000 },
  peers: { from: "harbor", texts: ["Thank you for sharing that. You're not the only one.", "Sending a wave your way, Cloudberry."], delay: 4000 },
};

/** Gentle peer-room activity while you're there. */
export const PEER_SCRIPT: Omit<Message, "id" | "at">[] = [
  { room: "peers", from: "willow", text: "Fern, I'm stealing the rain-sounds idea." },
  { room: "peers", from: "fern", text: "Steal away. Also: opening the curtains first thing. Sounds silly, works for me." },
];

/** If someone writes something that suggests they're not safe, the app offers support first. */
export const CRISIS_PATTERN =
  /(kill(ing)? myself|suicid|end (it all|my life|things)|(don'?t|do not) want to (be here|exist|live|wake up)|not be here anymore|want to die|no (reason|point) (to|in) (live|living|going on)|better off without me|hurt(ing)? myself|self[- ]?harm|can'?t go on)/i;

export function timeLabel(at: number, now = Date.now()) {
  const minutesAgo = at < 1e12 ? -at : Math.round((now - at) / MIN);
  if (minutesAgo < 1) return "now";
  if (minutesAgo < 60) return `${minutesAgo} min ago`;
  if (minutesAgo < 24 * 60) return `${Math.round(minutesAgo / 60)} h ago`;
  if (minutesAgo < 48 * 60) return "yesterday";
  return `${Math.round(minutesAgo / (24 * 60))} days ago`;
}
