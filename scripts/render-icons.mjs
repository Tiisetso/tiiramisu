// Usage: node scripts/render-icons.mjs — renders src/app/icon.svg into the PNG icon sizes.
import { readFileSync } from "node:fs";
import { chromium } from "playwright";

const svg = readFileSync("src/app/icon.svg", "utf8");
const full = svg.replace(/rx="116"/g, 'rx="0"'); // iOS / maskable: full-bleed square, the OS rounds it
const maskable = full.replace('r="150"', 'r="118"').replace('r="150"', 'r="118"').replace('r="200"', 'r="160"'); // keep inside the 80% safe zone

const jobs = [
  { out: "src/app/apple-icon.png", size: 180, src: full },
  { out: "public/icons/icon-192.png", size: 192, src: svg, transparent: true },
  { out: "public/icons/icon-512.png", size: 512, src: svg, transparent: true },
  { out: "public/icons/maskable-512.png", size: 512, src: maskable },
];

const browser = await chromium.launch();
for (const j of jobs) {
  const page = await browser.newPage({ viewport: { width: j.size, height: j.size } });
  await page.setContent(`<html><body style="margin:0;background:transparent">${j.src.replace("<svg ", `<svg width="${j.size}" height="${j.size}" `)}</body></html>`);
  await page.screenshot({ path: j.out, omitBackground: !!j.transparent });
  console.log("wrote", j.out);
  await page.close();
}
await browser.close();
