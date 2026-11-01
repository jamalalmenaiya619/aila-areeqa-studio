// Side-by-side screenshots: old page (legacy/) on the left, new page on the right.
// Usage: node scripts/dev/compare.mjs [outDir] [width] [theme]   (needs the site running on :8788 in test mode)
import { chromium } from "@playwright/test";
import { mkdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
const ROOT = resolve(new URL("../..", import.meta.url).pathname);
const out = process.argv[2] || ROOT + "/screenshots/compare";
const width = Number(process.argv[3] || 1366);
const theme = process.argv[4] || "light";
mkdirSync(out, { recursive: true });
const SB = "file://" + ROOT + "/legacy/studybook/index.html";
const INTEL = "file://" + ROOT + "/legacy/intel/battlefield-published-run17.html";
const L = (id) => JSON.parse(readFileSync(`${ROOT}/content/lessons/${id}.json`, "utf8"));
const idx = (id, pred) => L(id).slides.findIndex(pred);

const cases = [
  { name: "l1-cover", lesson: "l1", slide: 0 },
  { name: "l2-quiz", lesson: "l2", slide: idx("l2", (s) => s.type === "quiz" && s.hint), pick: 0 },
  { name: "l3-builder", lesson: "l3", slide: idx("l3", (s) => s.type === "builder") },
  { name: "l7-gallery", lesson: "l7", slide: idx("l7", (s) => s.type === "gallery") },
  { name: "l7-gallery-zoom", lesson: "l7", slide: idx("l7", (s) => s.type === "gallery"), zoom: true },
  { name: "l7-brief", lesson: "l7", slide: idx("l7", (s) => s.type === "brief") },
  ...["overview", "autumn", "winter", "social", "saudi", "comp", "sat", "log"].map((t) => ({ name: "intel-" + t, intel: t })),
];

const b = await chromium.launch({ executablePath: process.env.PW_EXE || "/opt/pw-browsers/chromium" });
const ctx = await b.newContext({ viewport: { width, height: 900 }, colorScheme: theme });
await ctx.addCookies([{ name: "studio-test-auth", value: "1", url: "http://localhost:8788" }]);
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));

async function shoot(c, legacy) {
  const p = page;
  if (c.intel) {
    await p.goto(legacy ? INTEL + "#" + c.intel : "http://localhost:8788/intel/" + c.intel);
  } else if (legacy) {
    await p.goto(SB);
    await p.evaluate(([id, n]) => { localStorage.setItem("aila-study-v1", JSON.stringify({ lessons: { [id]: { slide: n, quiz: {}, checks: {}, notes: {}, done: false } }, last: id, updatedAt: 1 })); }, [c.lesson, c.slide]);
    await p.goto(SB); await p.click(`[data-open="${c.lesson}"]`);
  } else {
    await p.goto(`http://localhost:8788/study/${c.lesson}/${c.slide + 1}`);
  }
  await p.evaluate((t) => { if (t === "dark") document.documentElement.setAttribute("data-theme", "dark"); }, theme);
  await p.waitForTimeout(700);
  if (c.pick !== undefined) { const o = p.locator(".opt:not([disabled])").nth(c.pick); if (await o.count()) await o.click(); await p.waitForTimeout(200); }
  if (c.zoom) { await p.locator(".gcard").first().click(); await p.waitForTimeout(300); }
  return await p.screenshot({ fullPage: !c.zoom });
}
for (const c of cases) {
  const a = await shoot(c, true), n = await shoot(c, false);
  const html = `<body style="margin:0;display:flex;gap:12px;background:#888;align-items:flex-start"><div><p style="font:14px sans-serif;margin:4px">OLD</p><img src="data:image/png;base64,${a.toString("base64")}" width="${width}"></div><div><p style="font:14px sans-serif;margin:4px">NEW</p><img src="data:image/png;base64,${n.toString("base64")}" width="${width}"></div></body>`;
  const v = await b.newPage({ viewport: { width: width * 2 + 12, height: 900 } });
  await v.setContent(html); await v.waitForTimeout(150);
  await v.screenshot({ path: `${out}/${c.name}-${width}-${theme}.png`, fullPage: true }); await v.close();
}
console.log("Saved", cases.length, "comparisons to", out, "errors:", errors);
await b.close();
