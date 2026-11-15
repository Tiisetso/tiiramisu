/**
 * Turns the day's signals into gentle copy (DESIGN.md → Voice & Copy):
 * notice, don't diagnose; relative to you; invite, don't instruct.
 */
import type { Intervention } from "@/lib/analysis";
import type { DayState, Signal, SignalKey } from "@/lib/signals";

const HEADLINE: Record<SignalKey, [string, string]> = {
  // [headline with an *italic* word, short clause for the body]
  sleepTiming: ["Your sleep has been drifting a little *later*", "your sleep has shifted later"],
  sleepEfficiency: ["Your nights have been a bit more *restless*", "your nights have been more restless"],
  rhythm: ["Your days and nights have been *blending* together", "your days and nights are blending"],
  activity: ["You've been moving a little *less* than usual", "you've been moving less"],
  hrv: ["Your body seems a little more *strained*", "your body seems more strained"],
  voice: ["You've sounded a little *quieter* lately", "you've sounded quieter"],
  mood: ["Your mood has been a bit *lower*", "your mood has been lower"],
};

const SUGGEST_FOR: Record<SignalKey, Intervention> = {
  sleepTiming: "light",
  rhythm: "light",
  sleepEfficiency: "breathe",
  activity: "walk",
  hrv: "breathe",
  voice: "message_friend",
  mood: "message_friend",
};

export interface Insight {
  eyebrow: string;
  /** may contain one *italic* span */
  headline: string;
  body: string;
  suggestions: Intervention[];
}

const join = (xs: string[]) =>
  xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`;

export function buildInsight(state: DayState, analysisSuggestion?: Intervention): Insight {
  const top: Signal[] = state.top.slice(0, 3);

  if (state.level === "steady" || top.length === 0) {
    return {
      eyebrow: "This week",
      headline: "You're in a *steady* rhythm",
      body: "Your sleep, movement and voice are all close to your usual. Keep doing what's working.",
      suggestions: dedupe([analysisSuggestion, "walk", "soundscape"]),
    };
  }

  const [first, ...rest] = top;
  const restClauses = rest.map((s) => HEADLINE[s.key][1]);
  const body =
    state.level === "drifting"
      ? `${restClauses.length ? `Alongside that, ${join(restClauses)}. ` : ""}That's a lot to carry. Be extra gentle with yourself today. Small things count.`
      : `${restClauses.length ? `And ${join(restClauses)}. ` : ""}Nothing to worry about, just worth a little care.`;

  return {
    eyebrow: "I noticed",
    headline: HEADLINE[first.key][0],
    body,
    suggestions: dedupe([analysisSuggestion, ...top.map((s) => SUGGEST_FOR[s.key]), "breathe"]).slice(0, 3),
  };
}

function dedupe(xs: (Intervention | undefined)[]): Intervention[] {
  return [...new Set(xs.filter((x): x is Intervention => !!x))];
}

/** Render "*word*" as italic: returns [before, italic, after]. */
export function splitItalic(s: string): [string, string, string] {
  const m = s.match(/^(.*?)\*(.+?)\*(.*)$/);
  return m ? [m[1], m[2], m[3]] : [s, "", ""];
}

/** Human formatting of a signal's daily value for tooltips. */
export function formatSignalValue(key: SignalKey, v: number): string {
  switch (key) {
    case "sleepTiming": {
      const h = ((v % 24) + 24) % 24;
      return `mid-sleep ${String(Math.floor(h)).padStart(2, "0")}:${String(Math.round((h % 1) * 60)).padStart(2, "0")}`;
    }
    case "sleepEfficiency":
      return `${Math.round(v * 100)}% restful`;
    case "rhythm":
      return `${Math.round(v * 100)}% day/night contrast`;
    case "activity":
      return `${Math.round(v).toLocaleString("en-US")} steps`;
    case "hrv":
      return `HRV ${Math.round(v)} ms`;
    case "voice":
      return v >= 0 ? `livelier than usual (+${v.toFixed(1)})` : `quieter than usual (${v.toFixed(1)})`;
    case "mood":
      return `mood ${Math.round(v)} of 5`;
  }
}
