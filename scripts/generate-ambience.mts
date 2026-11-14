/**
 * One-off: generate seamless ambient loops with ElevenLabs Sound Effects.
 * Usage: npx tsx scripts/generate-ambience.mts [scene...]
 * Reads ELEVENLABS_API_KEY from the environment or .env.local. Writes public/audio/ambience-<scene>.mp3.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const SCENES: Record<string, string> = {
  forest: "Close-up, clearly audible morning forest ambience: rustling leaves in a steady breeze and gentle birdsong nearby, rich and full, calm, no music, no voices",
  rain: "Close-up, clearly audible steady rain falling on a window and roof, full and rich rain texture, cozy and calm, no thunder, no music, no voices",
  sea: "Calm sea, slow gentle waves lapping on a sandy shore, soft and peaceful, no music, no voices",
  night: "Clearly audible summer night ambience: a steady chorus of crickets close by and a warm breeze, full and continuous, calm, no music, no voices",
};

function key() {
  if (process.env.ELEVENLABS_API_KEY) return process.env.ELEVENLABS_API_KEY;
  if (existsSync(".env.local")) {
    const m = readFileSync(".env.local", "utf8").match(/^ELEVENLABS_API_KEY=(.+)$/m);
    if (m) return m[1].trim().replace(/^["']|["']$/g, "");
  }
  throw new Error("ELEVENLABS_API_KEY not found");
}

const wanted = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(SCENES);
for (const scene of wanted) {
  const res = await fetch("https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_128", {
    method: "POST",
    headers: { "xi-api-key": key(), "Content-Type": "application/json" },
    body: JSON.stringify({
      text: SCENES[scene],
      model_id: "eleven_text_to_sound_v2",
      duration_seconds: 22,
      loop: true,
      prompt_influence: 0.5,
    }),
  });
  if (!res.ok) {
    console.error(`${scene}: ${res.status} ${(await res.text()).slice(0, 300)}`);
    continue;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(`public/audio/ambience-${scene}.mp3`, buf);
  console.log(`${scene}: ${(buf.length / 1024).toFixed(0)} KB`);
}
