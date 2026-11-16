// Usage: npm run shots -- <chapter-id> <width> [--reduced] [--url=http://localhost:3000]
// One chapter and one width per run. Output: shots/<chapter>-<width>[-reduced].png
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const heights = { 375: 812, 768: 1024, 1024: 768, 1440: 900, 1920: 1080 };
const args = process.argv.slice(2);
const flags = args.filter((arg) => arg.startsWith("--"));
const [chapter = "still", widthArg = "1440"] = args.filter((arg) => !arg.startsWith("--"));
const width = Number(widthArg);
const reduced = flags.includes("--reduced");
const url = flags.find((flag) => flag.startsWith("--url="))?.slice(6) ?? "http://localhost:3000";

const browser = await chromium.launch({
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
const page = await browser.newPage({
  viewport: { width, height: heights[width] ?? Math.round(width * 0.625) },
  reducedMotion: reduced ? "reduce" : "no-preference",
});
const errors = [];
page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
page.on("pageerror", (error) => errors.push(String(error)));

await page.goto(url, { waitUntil: "networkidle" });
const sceneReady = await page
  .waitForSelector("html[data-scene=ready]", { timeout: 20000 })
  .then(() => true)
  .catch(() => false);
await page.evaluate(() => document.fonts.ready);
// ScrollSmoother fixes the wrapper, so scrollIntoView does nothing; scroll the window instead.
await page.evaluate((id) => {
  const target = document.getElementById(id);
  if (target) window.scrollTo(0, target.getBoundingClientRect().top + window.scrollY);
}, chapter);
await page.waitForTimeout(2500);

const state = await page.evaluate(() => ({
  motion: document.documentElement.dataset.motion,
  webgl2: Boolean(document.createElement("canvas").getContext("webgl2")),
  scrollY: Math.round(window.scrollY),
}));
await mkdir("shots", { recursive: true });
const file = `shots/${chapter}-${width}${reduced ? "-reduced" : ""}.png`;
await page.screenshot({ path: file });
console.log(JSON.stringify({ file, sceneReady, ...state, errors }));
await browser.close();
