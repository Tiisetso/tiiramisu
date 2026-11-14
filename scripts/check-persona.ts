// Usage: npx tsx scripts/check-persona.ts — prints drift level per day for the demo persona.
import { DEMO_DAYS } from "../src/lib/demo/persona";
import { computeDayState, relativeAmplitude } from "../src/lib/signals";

for (const d of DEMO_DAYS) {
  if (d.day < 14 && d.day % 7) continue;
  const s = computeDayState(DEMO_DAYS, d.day);
  const fmt = (x: number) => x.toFixed(1).padStart(5);
  console.log(
    `day ${String(d.day).padStart(2)} ${s.level.padEnd(8)} score ${s.driftScore.toFixed(2)}  mid ${d.sleep.midpoint.toFixed(1)} eff ${d.sleep.efficiency.toFixed(2)} RA ${relativeAmplitude(d.hourlySteps).toFixed(2)} steps ${String(d.steps).padStart(5)} hrv ${fmt(d.hrv)} mood ${d.mood ?? "-"}  top: ${s.top.map((t) => `${t.key}(${t.z.toFixed(1)})`).join(", ")}`,
  );
}
