import { expect, test } from "@playwright/test";
import { BANNED, BASE_ARGS, begin, fakeMic, voiceCheckin } from "./helpers";

/** Synthetic patient, part 1: a steady day. Her first check-in becomes her "usual voice". */
test.use({ launchOptions: { args: [...BASE_ARGS, fakeMic("voice-steady.wav")] } });

test("day 44 → voice check-in → warm reflection", async ({ page }) => {
  const errors = await begin(page, "day=44");
  await expect(page.locator("h2").first()).toContainText("steady");
  const ms = await voiceCheckin(page);
  test.info().annotations.push({ type: "time-to-analysis-ms", description: String(ms) });
  expect(ms, "analysis should come back fast enough for a calm experience").toBeLessThan(15_000);
  await expect(page.getByText("I'll remember how you usually sound")).toBeVisible();
  expect(await page.locator("main").innerText()).not.toMatch(BANNED);
  expect(errors).toEqual([]);
});
