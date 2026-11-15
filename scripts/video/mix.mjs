// Mixes the recording with the voiceover and music into video/out/tiiramisu-demo.mp4 (YouTube-ready).
// Usage: node scripts/video/mix.mjs
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const OUT = "video/out";
const vo = JSON.parse(readFileSync(`${OUT}/voiceover.json`, "utf8"));
const { starts, film } = JSON.parse(readFileSync(`${OUT}/timeline.json`, "utf8"));
const { trim } = JSON.parse(readFileSync(`${OUT}/record.json`, "utf8"));

const inputs = ["-ss", trim.toFixed(3), "-t", film.toFixed(3), "-i", `${OUT}/raw.webm`, "-i", `${OUT}/music.mp3`];
vo.forEach((v) => inputs.push("-i", v.file));

const filters = [];
// voice clips at their scene start
vo.forEach((v, i) => {
  const ms = Math.round(starts[v.id] * 1000);
  filters.push(`[${i + 2}:a]aresample=48000,adelay=${ms}|${ms},volume=1.0[v${i}]`);
});
filters.push(`${vo.map((_, i) => `[v${i}]`).join("")}amix=inputs=${vo.length}:normalize=0,apad=whole_dur=${film}[voice]`);
filters.push(`[voice]asplit=2[voiceA][voiceKey]`);
// soft music bed: quieter, fades in/out, ducks further whenever she speaks
filters.push(
  `[1:a]aresample=48000,atrim=0:${film},volume=0.22,afade=t=in:st=0:d=2.5,afade=t=out:st=${(film - 4).toFixed(2)}:d=4[music]`,
);
filters.push(`[music][voiceKey]sidechaincompress=threshold=0.02:ratio=5:attack=30:release=600:makeup=1[bed]`);
filters.push(`[voiceA][bed]amix=inputs=2:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11[aout]`);
// picture: gentle fade in/out
filters.push(`[0:v]fps=30,format=yuv420p,fade=t=in:st=0:d=0.8,fade=t=out:st=${(film - 1.2).toFixed(2)}:d=1.2[vout]`);

execFileSync(
  "ffmpeg",
  [
    "-v", "error", "-y", ...inputs,
    "-filter_complex", filters.join(";"),
    "-map", "[vout]", "-map", "[aout]",
    "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-profile:v", "high",
    "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
    "-movflags", "+faststart", "-t", film.toFixed(3),
    `${OUT}/tiiramisu-demo.mp4`,
  ],
  { stdio: "inherit" },
);
console.log("wrote", `${OUT}/tiiramisu-demo.mp4`);
