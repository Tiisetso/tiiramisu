import { expect, test } from "@playwright/test";
import { BANNED, BASE_ARGS, begin, fakeMic, voiceCheckin } from "./helpers";

/**
 * Synthetic patient, part 2: she has drifted. The app should notice (passive signals),
 * hear it in her voice (recorded tired voice as the mic), respond, and learn.
 */
test.use({ launchOptions: { args: [...BASE_ARGS, fakeMic("voice-tired.wav")] } });

test("day 58 → drift insight → tired voice is noticed → wave to Maya helps", async ({ page }) => {
  // seed the same "usual voice" the steady test produced, then check in tired
  await page.addInitScript(() => {
    localStorage.setItem(
      "tiiramisu.voiceBaseline.v1",
      JSON.stringify({ speechRate: 2.2, pauseRatio: 0.06, pitchVar: 2.9, loudness: -16.5 }),
    );
  });
  const errors = await begin(page, "day=58");

  // passive signals → insight
  await expect(page.locator("h2").first()).toContainText("blending");
  await expect(page.getByText("Wave to Maya").first()).toBeVisible();
  expect(await page.locator("main").innerText()).not.toMatch(BANNED);

  // voice check-in: on-device features vs her usual
  const ms = await voiceCheckin(page);
  test.info().annotations.push({ type: "time-to-analysis-ms", description: String(ms) });
  await expect(page.getByText(/quieter|slower|more pauses/)).toBeVisible();

  // respond → learn
  await page.getByRole("button", { name: "Back to today" }).click();
  await page.locator("main").getByRole("button", { name: "Wave to Maya" }).click();
  await page.getByRole("button", { name: "Thinking of you" }).click();
  await page.getByRole("button", { name: "Done" }).click();
  await page.getByRole("button", { name: "Yes, a bit" }).click();
  await expect(page.getByRole("dialog")).toContainText("has now helped you 4 of 4 times");
  await page.getByRole("button", { name: "Back to today" }).click();
  await expect(page.getByText(/Good (morning|afternoon|evening)/)).toBeVisible();
  expect(errors).toEqual([]);
});
