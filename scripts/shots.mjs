// Usage: BASE_URL=http://localhost:3000 node scripts/shots.mjs <outDir>
// Phone-size screenshots (light + dark) of the begin and home screens.
import { chromium } from "playwright";
const out = process.argv[2];
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
for (const scheme of ["light", "dark"]) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: scheme });
  const logs = [];
  page.on("console", (m) => logs.push(m.type() + ": " + m.text()));
  page.on("pageerror", (e) => logs.push("pageerror: " + e.message));
  await page.goto(`${process.env.BASE_URL ?? "http://localhost:3000"}/?demo=1`);
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${out}/begin-${scheme}.png` });
  const hasCanvas = await page.locator("canvas").count();
  await page.getByRole("button", { name: "Begin" }).click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${out}/home-${scheme}.png`, fullPage: true });
  if (scheme === "light") {
    await page.getByRole("button", { name: "low" }).click();
    await page.waitForTimeout(5000);
    await page.screenshot({ path: `${out}/home-low.png` });
  }
  console.log(scheme, "canvas:", hasCanvas, logs.join(" | ") || "no console output");
  await page.close();
}
await browser.close();
