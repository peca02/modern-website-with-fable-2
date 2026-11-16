// Usage: npm run shots -- <chapter-id> <width> [--reduced] [--pointer=0.6,0.4] [--touch] [--url=http://localhost:3000]
// --pointer takes viewport fractions and parks the mouse there before the shot.
// --touch emulates a phone (coarse pointer, 3x screen), which selects the lowest quality tier.
// One chapter and one width per run. Output: shots/<chapter>-<width>[-reduced].png
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const heights = { 375: 812, 768: 1024, 1024: 768, 1440: 900, 1920: 1080 };
const args = process.argv.slice(2);
const flags = args.filter((arg) => arg.startsWith("--"));
const [chapter = "still", widthArg = "1440"] = args.filter((arg) => !arg.startsWith("--"));
const width = Number(widthArg);
const reduced = flags.includes("--reduced");
const touch = flags.includes("--touch");
const pointer = flags.find((flag) => flag.startsWith("--pointer="))?.slice(10).split(",").map(Number);
const url = flags.find((flag) => flag.startsWith("--url="))?.slice(6) ?? "http://localhost:3000";

const browser = await chromium.launch({
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
const page = await browser.newPage({
  viewport: { width, height: heights[width] ?? Math.round(width * 0.625) },
  reducedMotion: reduced ? "reduce" : "no-preference",
  ...(touch ? { hasTouch: true, isMobile: true, deviceScaleFactor: 3 } : {}),
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
if (pointer) {
  const size = page.viewportSize();
  await page.mouse.move(pointer[0] * size.width, pointer[1] * size.height, { steps: 4 });
}
await page.waitForTimeout(2500);

// Relative only: headless Chromium renders on the CPU (SwiftShader).
const fps = await page.evaluate(
  () =>
    new Promise((resolve) => {
      let frames = 0;
      const start = performance.now();
      const count = (now) => {
        frames += 1;
        if (now - start < 2000) requestAnimationFrame(count);
        else resolve(Math.round((frames * 1000) / (now - start)));
      };
      requestAnimationFrame(count);
    }),
);
const state = await page.evaluate(() => ({
  canvas: [document.querySelector("canvas")?.width, document.querySelector("canvas")?.height],
  motion: document.documentElement.dataset.motion,
  webgl2: Boolean(document.createElement("canvas").getContext("webgl2")),
  scrollY: Math.round(window.scrollY),
}));
await mkdir("shots", { recursive: true });
const file = `shots/${chapter}-${width}${reduced ? "-reduced" : ""}${pointer ? "-pointer" : ""}${touch ? "-touch" : ""}.png`;
await page.screenshot({ path: file });
console.log(JSON.stringify({ file, sceneReady, fps, ...state, errors }));
await browser.close();
