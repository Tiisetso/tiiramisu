// Generates one ElevenLabs voiceover clip per scene (video/out/vo-<id>.mp3) and prints durations.
// Usage: node --env-file=.env.local scripts/video/voiceover.mjs [voiceId]
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const VOICE = process.argv[2] ?? "XrExE9yKIg1WjnnlVkGX"; // Matilda: warm, friendly
const scenes = JSON.parse(readFileSync("scripts/video/script.json", "utf8"));
const out = [];
for (let i = 0; i < scenes.length; i++) {
  const s = scenes[i];
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE}?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      text: s.text,
      model_id: "eleven_multilingual_v2",
      previous_text: scenes[i - 1]?.text,
      next_text: scenes[i + 1]?.text,
      voice_settings: { stability: 0.6, similarity_boost: 0.75, style: 0.15, use_speaker_boost: true, speed: 0.95 },
    }),
  });
  if (!res.ok) throw new Error(`${s.id}: ${res.status} ${await res.text()}`);
  const file = `video/out/vo-${s.id}.mp3`;
  writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  const dur = Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file]).toString());
  out.push({ id: s.id, file, duration: Math.round(dur * 100) / 100 });
  console.log(`${s.id.padEnd(12)} ${dur.toFixed(2)}s`);
}
writeFileSync("video/out/voiceover.json", JSON.stringify(out, null, 2));
console.log("total speech:", out.reduce((a, b) => a + b.duration, 0).toFixed(1), "s");
