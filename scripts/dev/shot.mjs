import { chromium } from "@playwright/test";
const exe = process.env.PW_EXE || "/opt/pw-browsers/chromium";
const b = await chromium.launch(exe ? { executablePath: exe } : {});
const ctx = await b.newContext({ viewport: { width: Number(process.env.W || 1366), height: 900 }, colorScheme: process.env.THEME || "light" });
await ctx.addCookies([{ name: "studio-test-auth", value: "1", url: "http://localhost:8788" }]);
const p = await ctx.newPage();
const errs = []; p.on("console", m => m.type() === "error" && errs.push(m.text())); p.on("pageerror", e => errs.push(String(e)));
for (const [name, path] of process.argv.slice(2).map(a => a.split("="))) {
  await p.goto("http://localhost:8788" + path); await p.waitForTimeout(900);
  await p.screenshot({ path: `${process.env.OUT || "/tmp/claude-0/shots"}/${name}-${process.env.W || 1366}-${process.env.THEME || "light"}.png`, fullPage: false });
}
console.log("errors:", errs);
await b.close();
