import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

/** Chromium flag that turns a WAV file into the microphone. */
export const fakeMic = (file: string) => `--use-file-for-fake-audio-capture=${path.resolve("e2e/fixtures", file)}`;

export const BASE_ARGS = [
  "--use-angle=swiftshader",
  "--enable-unsafe-swiftshader",
  "--use-fake-ui-for-media-stream",
  "--use-fake-device-for-media-stream",
];

/** Words that must never reach patient screens (DESIGN.md → Voice & Copy). */
export const BANNED = /\b(risk|relapse|score|warning|failed|missed|streak)\b/i;

export async function begin(page: Page, query: string, { onboarded = true } = {}) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  if (onboarded) {
    await page.addInitScript(() => {
      if (!localStorage.getItem("tiiramisu.consent.v1")) localStorage.setItem("tiiramisu.consent.v1", JSON.stringify({ onboarded: true }));
    });
  }
  await page.goto(`/?${query}`);
  await page.getByRole("button", { name: "Begin" }).click();
  if (onboarded) await expect(page.getByText(/Good (morning|afternoon|evening)/)).toBeVisible();
  return errors;
}

/** Record ~seconds of the fake mic and wait for the reflection. Returns ms from "done" to result. */
export async function voiceCheckin(page: Page, seconds = 8) {
  await page.getByRole("button", { name: "Start check-in" }).click();
  await page.getByRole("button", { name: "Start talking" }).click();
  await page.waitForTimeout(seconds * 1000);
  const t0 = Date.now();
  await page.getByRole("button", { name: "I’m done" }).click();
  await expect(page.getByText("Thank you for checking in")).toBeVisible({ timeout: 30_000 });
  return Date.now() - t0;
}

/** Attach a named screenshot to the report: visible proof of each step in CI. */
export async function snap(page: Page, name: string) {
  await page.waitForTimeout(600); // let the fade-ins settle
  await test.info().attach(name, { body: await page.screenshot(), contentType: "image/png" });
}
