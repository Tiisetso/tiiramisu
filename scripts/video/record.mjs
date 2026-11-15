// Records the demo film: drives the real app inside public/stage.html, timed to the voiceover.
// Usage: BASE_URL=http://localhost:3200 node scripts/video/record.mjs
// Needs: video/out/voiceover.json (scripts/video/voiceover.mjs) and a running app in live mode.
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const BASE = process.env.BASE_URL ?? "http://localhost:3200";
const OUT = "video/out";
const vo = JSON.parse(readFileSync(`${OUT}/voiceover.json`, "utf8"));
const GAP = { "1-why": 1.6, default: 1.1 };
const LEAD = 1.2; // seconds of picture before the first word

// Scene start times (seconds from the film's start)
let t = LEAD;
const starts = {};
for (const s of vo) {
  starts[s.id] = t;
  t += s.duration + (GAP[s.id] ?? GAP.default);
}
const FILM = t + 2.5;
writeFileSync(`${OUT}/timeline.json`, JSON.stringify({ starts, film: FILM }, null, 2));
console.log("film length", FILM.toFixed(1), "s", starts);

mkdirSync(`${OUT}/raw`, { recursive: true });
const browser = await chromium.launch({
  args: [
    "--use-fake-ui-for-media-stream",
    "--use-fake-device-for-media-stream",
    `--use-file-for-fake-audio-capture=${path.resolve("e2e/fixtures/voice-steady.wav")}`,
    "--autoplay-policy=no-user-gesture-required",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
  ],
});
const ctx = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: 1,
  recordVideo: { dir: `${OUT}/raw`, size: { width: 1920, height: 1080 } },
});
ctx.setDefaultTimeout(30_000);
const page = await ctx.newPage();
const recStart = Date.now();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));

// Clean slate: onboarded, no voice baseline, no afterglow; then open the stage
await page.goto(`${BASE}/stage.html`);
await page.evaluate(() => {
  localStorage.clear();
  localStorage.setItem("tiiramisu.consent.v1", JSON.stringify({ onboarded: true }));
});
const stage = (fn, ...args) => page.evaluate(([f, a]) => window.stage[f](...a), [fn, args]);
const phone = page.frameLocator("#phone-frame");
const maya = page.frameLocator("#maya-frame");
const clinic = page.frameLocator("#clinic-frame");

await stage("load", "phone", `${BASE}/?day=44`);
await phone.getByRole("button", { name: "Begin" }).waitFor();
await page.waitForTimeout(1500);

const filmStart = Date.now();
const trim = (filmStart - recStart) / 1000;
const at = async (scene, offset = 0) => {
  const due = filmStart + (starts[scene] + offset) * 1000;
  const wait = due - Date.now();
  if (wait > 0) await page.waitForTimeout(wait);
  else if (wait < -600) console.log(`  late by ${(-wait / 1000).toFixed(1)}s at ${scene}+${offset}`);
};

// ── 1 · Why ─────────────────────────────────────────────
await stage("title", "Beyond the clinic", "After TMS, the daily visits end.");
await at("1-why", 7.5);
await stage("hideTitle");
await stage("layout", "solo");
await stage("caption", "The quiet weeks", "Relapse rarely announces itself.", "It returns slowly, in ordinary weeks, when nobody is there to notice.");

// ── 2 · Belief ──────────────────────────────────────────
await at("2-belief");
await stage("caption", "Tiiramisu", "Gently noticed.", "Not monitored, scored or nagged.");
await at("2-belief", 4.5);
await phone.getByRole("button", { name: "Begin" }).click();

// ── 3 · Sense ───────────────────────────────────────────
await at("3-sense");
await stage("caption", "Sense", "A 30-second voice check-in.", "Pace, pauses and energy, measured on her phone and compared only with her own usual.");
await phone.getByRole("button", { name: "Start check-in" }).click();
await at("3-sense", 1.4);
await phone.getByRole("button", { name: "Start talking" }).click();
await at("3-sense", 8.5);
await phone.getByRole("button", { name: "I’m done" }).click();
await phone.getByText("Thank you for checking in").waitFor({ timeout: 20_000 });
await at("3-sense", 16.5);
await stage("caption", "Weeks later", "It notices first.", "Her days and nights are blending. Her voice is quieter. Before she has said a word.");
await stage("load", "phone", `${BASE}/?day=58`);
await phone.getByRole("button", { name: "Begin" }).click();

// ── 4 · Respond & reinforce ─────────────────────────────
await stage("load", "maya", `${BASE}/?as=maya&day=58`); // off-screen; online before the win is shared
await at("4-reinforce");
await stage("caption", "Respond", "A step sized for today.", "Smaller on harder days.");
await phone.locator("main").getByRole("button", { name: /Step outside/ }).click();
await at("4-reinforce", 3.0);
await phone.getByRole("radio", { name: "A little" }).click();
await at("4-reinforce", 5.0);
await phone.getByRole("button", { name: "I did it" }).click();
await at("4-reinforce", 7.0);
await phone.getByRole("radio", { name: "Quite a bit" }).click();
await stage("caption", "Notice", "Better than she expected.", "Depression mutes what we expect to enjoy. Tiiramisu shows the gap.");
await at("4-reinforce", 10.0);
await phone.getByRole("button", { name: "Tell Maya?" }).click(); // shared quietly; seen in scene 5
await at("4-reinforce", 12.0);
await phone.getByRole("button", { name: "Back to today" }).click();
await stage("caption", "Reinforce", "The room is never cold.", "Every small step makes it warmer. Every day, or after a while away.");
await at("4-reinforce", 16.5);
await phone.getByText("Your light today").scrollIntoViewIfNeeded();
await at("4-reinforce", 21.0);
await stage("caption", "We reward. We encourage. We nurture.", "No streaks. No scores.", "Nothing to lose.");

// ── 5 · Learn & connect ─────────────────────────────────
await at("5-connect");
await stage("layout", "maya");
await stage("caption", "Learn & connect", "What helps her, and who has her back.", "She chose to share a small win. Maya sees only what she shares.");
await phone.getByText("What helps you").scrollIntoViewIfNeeded();
await maya.getByText("Small win: I went outside today").waitFor({ timeout: 10_000 }).catch(() => console.log("  maya didn't receive the win"));
await at("5-connect", 3.2);
await maya.getByLabel("Message").fill("So proud of you 💛");
await maya.getByRole("button", { name: "Send", exact: true }).click();
await stage("load", "clinic", `${BASE}/clinic?day=58`); // warms up off-screen for scene 6

// ── 6 · Clinician (secondary path) ──────────────────────
await at("6-clinic");
await phone.locator("main").evaluate((m) => m.scrollIntoView({ block: "start" }));
await stage("layout", "clinic");
await stage("caption", "For clinicians", "Who has drifted, and a one-tap reach out.", "");
await at("6-clinic", 0.6);
// click without scrolling the clinic, so the patient list stays in view
await clinic.getByRole("button", { name: "Reach out gently" }).evaluate((b) => b.click()).catch(() => console.log("  reach out not available"));
await phone.getByText("From your clinic").waitFor({ timeout: 8_000 }).catch(() => console.log("  outreach card late"));

// ── 7 · Trust ───────────────────────────────────────────
await at("7-trust");
await stage("caption", "Trust", "Voice never stored · data in the EU · every build verified.", "");
await clinic.getByText(/Privacy-verified build|Live ·/).first().scrollIntoViewIfNeeded().catch(() => {});

// ── 8 · Close ───────────────────────────────────────────
await at("8-close", -0.6);
await stage("hideCaption");
await stage("layout", "none");
await stage("title", "Tiiramisu", "Staying well, beyond the clinic.");
await page.waitForTimeout(Math.max(0, filmStart + FILM * 1000 - Date.now()));

const video = page.video();
await ctx.close();
await browser.close();
const raw = await video.path();
renameSync(raw, `${OUT}/raw.webm`);
writeFileSync(`${OUT}/record.json`, JSON.stringify({ trim, film: FILM, errors }, null, 2));
console.log("recorded", `${OUT}/raw.webm`, "trim", trim.toFixed(2), "errors", errors.length ? errors : "none");
