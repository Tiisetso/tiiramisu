import { expect, test } from "@playwright/test";
import { BANNED, begin, snap } from "./helpers";

/** First run: three gentle screens, and the choices are actually respected. */
test("onboarding explains, asks, and its consent is honoured", async ({ page }) => {
  const errors = await begin(page, "day=44", { onboarded: false });

  await expect(page.getByText("notices")).toBeVisible();
  await snap(page, "onboarding 1 · what Tiiramisu notices");
  expect(await page.locator("main").innerText()).not.toMatch(BANNED);
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page.getByText("What stays")).toBeVisible();
  // turn voice analysis off
  const voice = page.getByRole("switch", { name: "Listen to my voice check-ins" });
  await expect(voice).toHaveAttribute("aria-checked", "true");
  await voice.click();
  await expect(voice).toHaveAttribute("aria-checked", "false");
  await snap(page, "onboarding 2 · what stays yours (voice off)");
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page.getByText("got you")).toBeVisible();
  await page.getByRole("button", { name: "Juho" }).click(); // leave Juho out of the circle
  await snap(page, "onboarding 3 · your circle");
  await page.getByRole("button", { name: "Begin", exact: true }).click();
  await expect(page.getByText(/Good (morning|afternoon|evening)/)).toBeVisible();

  // voice off → check-in opens as the typed check-in
  await page.getByRole("button", { name: "Start check-in" }).click();
  await expect(page.getByText("Voice check-ins are off")).toBeVisible();
  await expect(page.getByRole("button", { name: "Start talking" })).toHaveCount(0);
  await page.getByRole("button", { name: "← Today" }).click();

  // Juho left out → not in the circle
  await page.getByRole("button", { name: "Circle", exact: true }).click();
  await expect(page.getByText("Maya", { exact: true })).toBeVisible();
  await expect(page.getByText("Juho", { exact: true })).toHaveCount(0);

  // the choice persists and can be changed later
  await page.getByRole("button", { name: "Today", exact: true }).click();
  await page.getByRole("button", { name: /Privacy/ }).click();
  await expect(page.getByRole("switch", { name: "Listen to my voice check-ins" })).toHaveAttribute("aria-checked", "false");
  expect(errors).toEqual([]);
});
