// Usage: npm run flow -- [--shots] [--url=http://localhost:3000]
// Walks the preloader, the keyboard path, the interactions, a refresh
// mid-page, the fallbacks (no WebGL, lost context, stalled load), reduced
// motion and the page without JavaScript; prints pass or fail for each check.
// --shots also writes shots/flow-*.png (the nav with the droplet, the fallback).
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const flags = process.argv.slice(2);
const shots = flags.includes("--shots");
const url = flags.find((flag) => flag.startsWith("--url="))?.slice(6) ?? "http://localhost:3000";
// Small on purpose: headless Chromium renders the scene on the CPU.
const viewport = { width: 800, height: 600 };
const slow = { timeout: 120000, state: "attached" };

let failed = 0;
const check = (name, pass, detail = "") => {
  if (!pass) failed += 1;
  console.log(`${pass ? "pass" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`);
};

const countAudioContexts = () => {
  window.audioContexts = [];
  const Native = window.AudioContext;
  window.AudioContext = class extends Native {
    constructor(...args) {
      super(...args);
      window.audioContexts.push(this);
    }
  };
};
const removeWebGL = () => {
  const native = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function getContext(type, ...rest) {
    return type.startsWith("webgl") ? null : native.call(this, type, ...rest);
  };
};
const visibility = (selector) => (page) =>
  page.evaluate((target) => getComputedStyle(document.querySelector(target)).visibility, selector);
const contentVisibility = visibility("#smooth-wrapper");
const currentChapter = (page) =>
  page.evaluate(() => document.querySelector("[aria-current]")?.getAttribute("data-chapter-link") ?? null);

const browser = await chromium.launch({
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--autoplay-policy=no-user-gesture-required"],
});
if (shots) await mkdir("shots", { recursive: true });

// 1. Preloader
const context = await browser.newContext({ viewport });
await context.addInitScript(countAudioContexts);
await context.addInitScript(() => {
  document.addEventListener("DOMContentLoaded", () => {
    window.earlyVisibility = getComputedStyle(document.querySelector("#smooth-wrapper")).visibility;
  });
});
const page = await context.newPage();
const errors = [];
page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
page.on("pageerror", (error) => errors.push(String(error)));

await page.goto(url, { waitUntil: "domcontentloaded" });
check("preloader: content waits while loading", (await page.evaluate(() => window.earlyVisibility)) === "hidden");
const started = Date.now();
await page.waitForSelector("html[data-loaded]", slow);
const loadedAs = await page.getAttribute("html", "data-loaded");
check("preloader: releases", true, `${Date.now() - started} ms after first paint, ${loadedAs}`);
check("preloader: reads 100 at release", (await page.textContent("[role=status]")).includes("100"));
check("preloader: content shown", (await contentVisibility(page)) === "visible");
check("scene: running", (await page.getAttribute("html", "data-scene")) === "ready");
check("scene: fallback drawing hidden", !(await page.isVisible("[data-scene-fallback]")));

// 2. Keyboard
await page.keyboard.press("Tab");
check("keyboard: first Tab lands in the nav", await page.evaluate(() => document.activeElement?.getAttribute("data-chapter-link") === "still"));
await page.keyboard.press("Tab");
await page.keyboard.press("Tab");
await page.keyboard.press("Enter");
// The window scrolls at once; the smoothed content follows on GSAP time, which crawls on a CPU renderer.
await page.waitForTimeout(1000);
const landing = await page.evaluate(() => {
  const top = (selector) => document.querySelector(selector).getBoundingClientRect().top;
  return Math.round(window.scrollY - (top("#crown") - top("#smooth-content")));
});
check("keyboard: Enter scrolls to the chapter top", Math.abs(landing) < 4, `${landing}px off`);
check("keyboard: Enter moves focus to the chapter heading", await page.evaluate(() => document.activeElement?.id === "crown-heading"));
await page.waitForFunction(() => document.querySelector("[aria-current]")?.getAttribute("data-chapter-link") === "crown", null, slow).catch(() => {});
check("keyboard: nav marks the chapter", (await currentChapter(page)) === "crown", String(await currentChapter(page)));

// 3. Field instrument
await page.focus("#field-strength");
// The instrument only holds the field once the smoothed scroll has reached the chapter.
let field = 0;
for (let attempt = 0; attempt < 30 && field <= 0.2; attempt += 1) {
  for (let press = 0; press < 30; press += 1) await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(4000);
  field = await page.evaluate(() => Number(document.querySelector("#crown")?.style.getPropertyValue("--field")));
}
check("field: the range input drives the scene", field > 0.2, `--field ${field}`);

// 4. Sound
check("sound: no AudioContext before a click", (await page.evaluate(() => window.audioContexts.length)) === 0);
const toggle = page.locator("button[aria-pressed]");
await toggle.click();
await page.waitForTimeout(600);
const audio = await page.evaluate(() => ({ count: window.audioContexts.length, state: window.audioContexts[0]?.state }));
check("sound: toggle creates one running AudioContext", audio.count === 1 && audio.state === "running", JSON.stringify(audio));
check("sound: toggle is pressed", (await toggle.getAttribute("aria-pressed")) === "true");
await toggle.click();
// The context suspends after the fade-out; timers run late on a slow machine.
await page.waitForFunction(() => window.audioContexts[0]?.state === "suspended", null, { timeout: 10000 }).catch(() => {});
const stopped = await page.evaluate(() => window.audioContexts[0]?.state);
check("sound: off suspends the context", stopped === "suspended", String(stopped));

if (shots) {
  await page.mouse.move(viewport.width - 440, 100, { steps: 6 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: "shots/flow-nav.png", clip: { x: viewport.width - 600, y: 0, width: 600, height: 160 }, timeout: 90000 });
}

// 5. Refresh mid-page
const before = await page.evaluate(() => {
  window.scrollTo(0, document.documentElement.scrollHeight);
  return Math.round(window.scrollY);
});
await page.waitForTimeout(1000);
await page.reload({ waitUntil: "commit" });
await page.waitForSelector("html[data-loaded]", slow);
await page.waitForTimeout(1000);
const restored = await page.evaluate(() => Math.round(window.scrollY));
check("refresh: scroll position kept", Math.abs(restored - before) < 4, `scrollY ${before} -> ${restored}`);
check("refresh: opens in the last chapter", (await currentChapter(page)) === "settle", String(await currentChapter(page)));
if (shots) await page.screenshot({ path: "shots/flow-refresh.png", timeout: 90000 });
check("no console errors", errors.length === 0, errors.join(" | "));
await context.close();

// 6. No WebGL
const bare = await browser.newContext({ viewport });
await bare.addInitScript(removeWebGL);
const barePage = await bare.newPage();
await barePage.goto(url, { waitUntil: "commit" });
await barePage.waitForSelector("html[data-loaded]", slow);
check("fallback: marked on the document", (await barePage.getAttribute("html", "data-scene")) === "fallback");
check("fallback: drawing shown", await barePage.isVisible("[data-scene-fallback]"));
check("fallback: content shown", (await contentVisibility(barePage)) === "visible");
if (shots) {
  await barePage.waitForTimeout(1500);
  await barePage.screenshot({ path: "shots/flow-fallback.png" });
}
await bare.close();

// 7. Lost context
const lost = await browser.newContext({ viewport });
const lostPage = await lost.newPage();
await lostPage.goto(url, { waitUntil: "commit" });
await lostPage.waitForSelector("html[data-loaded]", slow);
check("lost context: scene ran first", (await lostPage.getAttribute("html", "data-scene")) === "ready");
await lostPage.evaluate(() => document.querySelector("canvas")?.getContext("webgl2")?.getExtension("WEBGL_lose_context")?.loseContext());
await lostPage.waitForSelector("html[data-scene=fallback]", { timeout: 30000, state: "attached" }).catch(() => {});
check("lost context: marked on the document", (await lostPage.getAttribute("html", "data-scene")) === "fallback");
check("lost context: drawing shown", await lostPage.isVisible("[data-scene-fallback]"));
check("lost context: content shown", (await contentVisibility(lostPage)) === "visible");
await lost.close();

// 8. Stalled load: the chunk that holds the shaders never arrives
const stalled = await browser.newContext({ viewport });
const stalledPage = await stalled.newPage();
await stalledPage.route("**/_next/static/chunks/**", async (route) => {
  const response = await route.fetch();
  if ((await response.text()).includes("gl_FragDepth")) return;
  await route.fulfill({ response });
});
await stalledPage.goto(url, { waitUntil: "commit" });
await stalledPage.waitForSelector("html[data-loaded]", slow);
const stalledAs = await stalledPage.getAttribute("html", "data-loaded");
check("stalled load: the timeout releases the preloader", stalledAs.startsWith("without"), stalledAs);
check("stalled load: content shown", (await contentVisibility(stalledPage)) === "visible");
await stalled.close();

// 9. Reduced motion
const calm = await browser.newContext({ viewport, reducedMotion: "reduce" });
const calmPage = await calm.newPage();
await calmPage.goto(url, { waitUntil: "commit" });
await calmPage.waitForSelector("html[data-loaded]", slow);
await calmPage.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
await calmPage.waitForTimeout(1500);
const calmState = await calmPage.evaluate(() => ({
  motion: document.documentElement.dataset.motion,
  spacers: document.querySelectorAll(".pin-spacer").length,
  pinned: document.querySelectorAll("[data-pinned]").length,
  wrapper: getComputedStyle(document.querySelector("#smooth-wrapper")).position,
  transform: getComputedStyle(document.querySelector("#smooth-content")).transform,
  hidden: [...document.querySelectorAll("main h1, main h2, main h3, main p, main li")].filter((element) => {
    const style = getComputedStyle(element);
    return style.visibility === "hidden" || style.opacity === "0" || element.getClientRects().length === 0;
  }).length,
}));
check("reduced motion: reported", calmState.motion === "reduced", String(calmState.motion));
check("reduced motion: no pins", calmState.spacers === 0 && calmState.pinned === 0, `${calmState.spacers} spacers`);
check("reduced motion: no smooth scroll", calmState.wrapper !== "fixed" && calmState.transform === "none", `${calmState.wrapper}, ${calmState.transform}`);
check("reduced motion: content complete", calmState.hidden === 0, `${calmState.hidden} hidden elements`);
await calm.close();

// 10. JavaScript disabled
const plain = await browser.newContext({ viewport, javaScriptEnabled: false });
const plainPage = await plain.newPage();
await plainPage.goto(url, { waitUntil: "load" });
check("no script: content shown", await plainPage.isVisible("#smooth-wrapper"));
const headings = await plainPage.locator("h1, h2, h3, h4, h5, h6").evaluateAll((elements) =>
  elements.map((element) => ({ level: Number(element.tagName[1]), shown: element.getClientRects().length > 0 })),
);
check("no script: every heading is laid out", headings.length > 6 && headings.every((heading) => heading.shown), `${headings.length} headings`);
const links = await plainPage.locator("nav a").evaluateAll((elements) =>
  elements.map((element) => element.getAttribute("href")).filter((href) => href && document.querySelector(href.slice(href.indexOf("#")))),
);
check("no script: nav links point at chapters", links.length === 6, links.join(" "));
check("no script: drawing shown", await plainPage.isVisible("[data-scene-fallback]"));
check("no script: no preloader in the way", !(await plainPage.isVisible("[role=status]")));
if (shots) await plainPage.screenshot({ path: "shots/flow-noscript.png" });

// 11. Headings
const levels = headings.map((heading) => heading.level);
check("headings: one h1", levels.filter((level) => level === 1).length === 1 && levels[0] === 1);
check("headings: no level skipped", levels.every((level, index) => index === 0 || level - levels[index - 1] <= 1), levels.join(""));
await plain.close();

await browser.close();
console.log(failed ? `${failed} failed` : "all passed");
process.exit(failed ? 1 : 0);
