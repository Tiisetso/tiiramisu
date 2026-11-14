/** Shared mood state: drives the light field now and the soundscape later (#7). */
export type Mood = "calm" | "low" | "bright" | "listening" | "night";

export type RGB = [number, number, number];

export interface FieldStyle {
  /** [base, a, b, c]: base is the paper the blobs float on */
  palette: [RGB, RGB, RGB, RGB];
  speed: number;
  brightness: number;
}

const hex = (h: string): RGB => {
  const n = parseInt(h.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

/** Palettes from DESIGN.md → Motion → Mood palettes. */
export const FIELD_STYLES: Record<Mood, FieldStyle> = {
  calm: {
    palette: [hex("#f7f1e8"), hex("#ced4b8"), hex("#ddbe78"), hex("#c9d4ea")],
    speed: 1,
    brightness: 1,
  },
  low: {
    // clay at ~20% over canvas → #dbcec6
    palette: [hex("#f5ede4"), hex("#e8c4b0"), hex("#dbcec6"), hex("#ddaa61")],
    speed: 0.6,
    brightness: 0.98,
  },
  bright: {
    palette: [hex("#f9f4ec"), hex("#ddbe78"), hex("#ddaa61"), hex("#ced4b8")],
    speed: 1.2,
    brightness: 1.03,
  },
  listening: {
    palette: [hex("#f7f1e8"), hex("#c9d4ea"), hex("#ced4b8"), hex("#e8c4b0")],
    speed: 1,
    brightness: 1,
  },
  night: {
    // dusk at ~20% over night → #3b393b
    palette: [hex("#17120f"), hex("#39221e"), hex("#6b443d"), hex("#3b393b")],
    speed: 0.5,
    brightness: 1,
  },
};

/** Night variants of each mood for dark mode / evenings. */
export const NIGHT_STYLES: Record<Mood, FieldStyle> = {
  calm: FIELD_STYLES.night,
  night: FIELD_STYLES.night,
  low: {
    palette: [hex("#17120f"), hex("#4a2c26"), hex("#39221e"), hex("#5a4632")],
    speed: 0.35,
    brightness: 0.95,
  },
  bright: {
    palette: [hex("#1a1411"), hex("#5a4632"), hex("#6b443d"), hex("#3e4536")],
    speed: 0.6,
    brightness: 1.05,
  },
  listening: {
    palette: [hex("#17120f"), hex("#2f3546"), hex("#39221e"), hex("#3e4536")],
    speed: 0.5,
    brightness: 1,
  },
};

export const MOODS: Mood[] = ["calm", "low", "bright", "listening", "night"];
