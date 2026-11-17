// Usage: npm run shots -- <chapter-id> <width> [--reduced] [--pointer=0.6,0.4] [--touch] [--offset=0.5] [--row=1] [--url=http://localhost:3000]
// --pointer takes viewport fractions and parks the mouse there before the shot.
// --row hovers (or with --touch, taps) that Part row after the scroll has settled.
// --touch emulates a phone (coarse pointer, 3x screen), which selects the lowest quality tier.
// --offset scrolls that many viewport heights past the top of the chapter.
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
const offset = Number(flags.find((flag) => flag.startsWith("--offset="))?.slice(9) ?? 0);
const row = flags.find((flag) => flag.startsWith("--row="))?.slice(6);
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
const loaded = await page
  .waitForSelector("html[data-loaded]", { timeout: 60000 })
  .then(() => true)
  .catch(() => false);
// ScrollSmoother fixes the wrapper, so scrollIntoView does nothing; scroll the window instead.
await page.evaluate(
  ([id, shift]) => {
    const target = document.getElementById(id);
    if (target) window.scrollTo(0, target.getBoundingClientRect().top + window.scrollY + shift * window.innerHeight);
  },
  [chapter, offset],
);
if (pointer) {
  const size = page.viewportSize();
  await page.mouse.move(pointer[0] * size.width, pointer[1] * size.height, { steps: 4 });
}
// Reveals and scene eases run on GSAP time, which slows down with the frame rate.
await page.waitForTimeout(width > 1024 ? 12000 : 4000);
if (row !== undefined) {
  // Rows keep following their droplets, so they are never "stable" for a locator action.
  const box = await page.locator("#part li h3").nth(Number(row)).boundingBox();
  if (box && touch) await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
  else if (box) await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 4 });
  await page.waitForTimeout(4000);
}

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
const file = `shots/${chapter}${offset ? `+${offset}` : ""}-${width}${reduced ? "-reduced" : ""}${pointer ? "-pointer" : ""}${row !== undefined ? `-row${row}` : ""}${touch ? "-touch" : ""}.png`;
console.log(JSON.stringify({ file, sceneReady, loaded, fps, ...state, errors }));
await page.screenshot({ path: file, timeout: 90000 });
await browser.close();
