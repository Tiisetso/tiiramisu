/**
 * Adaptive soundscape (DESIGN.md → Sound): generative pads + sparse bells (Tone.js)
 * over ElevenLabs-generated nature loops. Follows the same `mood` as the light field.
 * Fades are ≥ 2 s; nothing plays before the Begin tap; ducks to silence while recording.
 */
import type { Mood } from "@/lib/mood";

export type Scene = "forest" | "rain" | "sea" | "night";
export const SCENES: Scene[] = ["forest", "rain", "sea", "night"];

/** Measured RMS of each loop (dBFS) → gain to level them at ~-32 dB. */
const SCENE_RMS: Record<Scene, number> = { forest: -41, rain: -29.7, sea: -32.5, night: -24.6 };
const sceneGain = (s: Scene) => -32 - SCENE_RMS[s];

interface MoodSound {
  chords: string[][];
  chordSeconds: number;
  cutoff: number;
  bellChance: number;
  bells: string[];
  scene: Scene | null;
  padDb: number;
}

const MOOD_SOUND: Record<Mood, MoodSound> = {
  calm: {
    chords: [
      ["D3", "A3", "C#4", "E4", "F#4"],
      ["B2", "F#3", "A3", "C#4", "D4"],
      ["G2", "D3", "F#3", "B3"],
      ["A2", "E3", "F#3", "B3"],
    ],
    chordSeconds: 8,
    cutoff: 1400,
    bellChance: 0.35,
    bells: ["F#4", "A4", "B4", "D5", "E5"],
    scene: "forest",
    padDb: -20,
  },
  low: {
    chords: [
      ["F2", "C3", "E3", "A3"],
      ["D2", "A2", "C3", "E3", "F3"],
      ["Bb1", "F2", "A2", "D3"],
      ["C2", "G2", "C3", "E3"],
    ],
    chordSeconds: 12,
    cutoff: 800,
    bellChance: 0.15,
    bells: ["A3", "C4", "D4", "F4", "G4"],
    scene: "rain",
    padDb: -19,
  },
  bright: {
    chords: [
      ["G3", "B3", "D4", "F#4", "A4"],
      ["E3", "G3", "B3", "D4", "F#4"],
      ["C3", "G3", "B3", "E4"],
      ["D3", "A3", "B3", "F#4"],
    ],
    chordSeconds: 7,
    cutoff: 2400,
    bellChance: 0.5,
    bells: ["B4", "D5", "E5", "G5", "A5"],
    scene: "sea",
    padDb: -21,
  },
  listening: {
    chords: [
      ["D3", "A3", "E4"],
      ["B2", "F#3", "D4"],
    ],
    chordSeconds: 10,
    cutoff: 900,
    bellChance: 0,
    bells: [],
    scene: null,
    padDb: -26,
  },
  night: {
    chords: [
      ["Db2", "Ab2", "C3", "F3"],
      ["Bb1", "F2", "Ab2", "Db3"],
      ["Gb1", "Db2", "F2", "Bb2"],
      ["Ab1", "Eb2", "Gb2", "C3"],
    ],
    chordSeconds: 14,
    cutoff: 600,
    bellChance: 0.1,
    bells: ["Ab3", "Bb3", "Db4", "Eb4", "F4"],
    scene: "night",
    padDb: -19,
  },
};

type ToneNS = typeof import("tone");

export class Soundscape {
  private T: ToneNS | null = null;
  private master!: InstanceType<ToneNS["Volume"]>;
  private filter!: InstanceType<ToneNS["Filter"]>;
  private pad!: InstanceType<ToneNS["PolySynth"]>;
  private padVol!: InstanceType<ToneNS["Volume"]>;
  private bell!: InstanceType<ToneNS["PolySynth"]>;
  private players = new Map<Scene, { player: InstanceType<ToneNS["Player"]>; vol: InstanceType<ToneNS["Volume"]> }>();
  private activeScene: Scene | null = null;
  private timers: ReturnType<typeof setTimeout>[] = [];
  private mood: Mood = "calm";
  private sceneOverride: Scene | null | undefined = undefined; // undefined = follow mood
  private chordIndex = 0;
  private running = false;
  private muted = false;
  private ducked = false;
  private level = 0; // dB

  /** Must be called from a user gesture. */
  async start(mood: Mood) {
    if (this.running) return;
    const T = await import("tone");
    this.T = T;
    await T.start();
    this.mood = mood;

    this.master = new T.Volume(-60).toDestination();
    const reverb = new T.Reverb({ decay: 9, wet: 0.45 }).connect(this.master);
    await reverb.ready;
    this.filter = new T.Filter({ type: "lowpass", frequency: MOOD_SOUND[mood].cutoff, Q: 0.4 }).connect(reverb);
    const chorus = new T.Chorus({ frequency: 0.3, delayTime: 4, depth: 0.5, wet: 0.35 }).connect(this.filter).start();
    this.padVol = new T.Volume(MOOD_SOUND[mood].padDb).connect(chorus);
    this.pad = new T.PolySynth(T.Synth, {
      oscillator: { type: "fattriangle", count: 3, spread: 18 },
      envelope: { attack: 3.5, decay: 1.5, sustain: 0.8, release: 7 },
    }).connect(this.padVol);
    this.pad.maxPolyphony = 16;

    const delay = new T.FeedbackDelay({ delayTime: 0.55, feedback: 0.35, wet: 0.3 }).connect(reverb);
    this.bell = new T.PolySynth(T.Synth, {
      oscillator: { type: "sine" },
      envelope: { attack: 0.01, decay: 2.2, sustain: 0, release: 3 },
    }).connect(delay);
    this.bell.volume.value = -26;

    this.running = true;
    this.applyScene();
    this.scheduleChord();
    this.scheduleBell();
    this.rampMaster();
  }

  setMood(mood: Mood) {
    if (mood === this.mood) return;
    this.mood = mood;
    if (!this.running || !this.T) return;
    const m = MOOD_SOUND[mood];
    this.filter.frequency.rampTo(m.cutoff, 4);
    this.padVol.volume.rampTo(m.padDb, 4);
    this.chordIndex = 0;
    this.applyScene();
  }

  /** undefined = follow mood; null = no nature sound; Scene = fixed scene. */
  setScene(scene: Scene | null | undefined) {
    this.sceneOverride = scene;
    if (this.running) this.applyScene();
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (this.running) this.rampMaster();
  }

  /** Silence while the mic is recording so the soundscape doesn't leak into the check-in. */
  duck(on: boolean) {
    this.ducked = on;
    if (this.running) this.rampMaster(on ? 0.6 : 2.5);
  }

  /** Overall level offset (dB), e.g. louder on the Calm tab. */
  setLevel(db: number) {
    this.level = db;
    if (this.running) this.rampMaster();
  }

  get isRunning() {
    return this.running;
  }

  dispose() {
    this.timers.forEach(clearTimeout);
    this.timers = [];
    this.running = false;
    this.players.forEach(({ player, vol }) => {
      player.dispose();
      vol.dispose();
    });
    this.players.clear();
    this.pad?.dispose();
    this.bell?.dispose();
    this.master?.dispose();
  }

  // ── internals ──

  private rampMaster(seconds = 2.5) {
    const target = this.muted || this.ducked ? -60 : -4 + this.level;
    this.master.volume.rampTo(target, seconds);
  }

  private currentScene(): Scene | null {
    return this.sceneOverride === undefined ? MOOD_SOUND[this.mood].scene : this.sceneOverride;
  }

  private applyScene() {
    const T = this.T!;
    const next = this.currentScene();
    if (next === this.activeScene) return;

    if (this.activeScene) {
      const old = this.players.get(this.activeScene);
      old?.vol.volume.rampTo(-60, 3);
    }
    this.activeScene = next;
    if (!next) return;

    let entry = this.players.get(next);
    if (!entry) {
      const vol = new T.Volume(-60).connect(this.master);
      const player = new T.Player({
        url: `/audio/ambience-${next}.mp3`,
        loop: true,
        onload: () => {
          player.start();
          if (this.activeScene === next) vol.volume.rampTo(sceneGain(next) - 8, 3);
        },
      }).connect(vol);
      entry = { player, vol };
      this.players.set(next, entry);
    } else {
      entry.vol.volume.rampTo(sceneGain(next) - 8, 3);
    }
  }

  private scheduleChord() {
    if (!this.running) return;
    const m = MOOD_SOUND[this.mood];
    const chord = m.chords[this.chordIndex % m.chords.length];
    this.chordIndex++;
    const T = this.T!;
    this.pad.triggerAttackRelease(chord, m.chordSeconds * 0.9, T.now() + 0.05, 0.5);
    this.timers.push(setTimeout(() => this.scheduleChord(), m.chordSeconds * 1000));
  }

  private scheduleBell() {
    if (!this.running) return;
    const m = MOOD_SOUND[this.mood];
    if (m.bells.length && Math.random() < m.bellChance) {
      const note = m.bells[Math.floor(Math.random() * m.bells.length)];
      this.bell.triggerAttackRelease(note, 1.5, this.T!.now() + 0.05, 0.25 + Math.random() * 0.25);
    }
    this.timers.push(setTimeout(() => this.scheduleBell(), 1800 + Math.random() * 1600));
  }
}
