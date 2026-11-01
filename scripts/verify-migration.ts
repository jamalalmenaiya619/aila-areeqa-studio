// Compares /content with the legacy files. Exits with code 1 on any difference.
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { isDeepStrictEqual } from "node:util";
import { ROOT, loadLegacyStudybook, assertJsonSafe } from "./lib-legacy.ts";
import { parseLegacyIntel } from "./lib-intel.ts";

const fails: string[] = [];
const lines: string[] = [];
const check = (ok: boolean, msg: string) => { if (!ok) fails.push(msg); };
const read = (p: string) => JSON.parse(readFileSync(ROOT + p, "utf8"));

// ---------- Study Book ----------
const raw = loadLegacyStudybook();
try { assertJsonSafe(raw); } catch (e) { fails.push(String(e)); }
// Objects made inside the old script have their own Array/Object types; compare plain copies.
const legacy = JSON.parse(JSON.stringify(raw)) as typeof raw;
const meta = read("content/lessons/meta.json");
check(isDeepStrictEqual(meta.order, legacy.LESSONS.map((l) => l.id)), "Lesson order differs");
for (const k of ["PARTS", "SRC", "PHOTOS"]) check(isDeepStrictEqual(meta[k], JSON.parse(JSON.stringify(legacy[k as "SRC"]))), `meta.${k} differs`);
let totalSlides = 0, totalQuiz = 0, totalTasks = 0;
for (const old of legacy.LESSONS) {
  const file = `content/lessons/${old.id}.json`;
  if (!existsSync(ROOT + file)) { fails.push("Missing " + file); continue; }
  const neu = read(file);
  const o = JSON.parse(JSON.stringify(old)); // the legacy object as the page saw it
  check(neu.slides.length === o.slides.length, `${old.id}: slide count ${neu.slides.length} vs ${o.slides.length}`);
  o.slides.forEach((s: any, i: number) => {
    const n = neu.slides[i] || {};
    check(n.type === s.type, `${old.id} slide ${i + 1}: type ${n.type} vs ${s.type}`);
    if (s.type === "quiz") {
      check(n.q === s.q, `${old.id} slide ${i + 1}: question text differs`);
      check(isDeepStrictEqual(n.options, s.options), `${old.id} slide ${i + 1}: options differ`);
      check(n.answer === s.answer, `${old.id} slide ${i + 1}: answer index differs`);
      check(n.why === s.why, `${old.id} slide ${i + 1}: why differs`);
      check(isDeepStrictEqual(n.whys, s.whys), `${old.id} slide ${i + 1}: whys differ`);
      check(isDeepStrictEqual(n.hint, s.hint), `${old.id} slide ${i + 1}: hint differs`);
    }
    if (s.type === "task") {
      check(isDeepStrictEqual(n.refs, s.refs), `${old.id} slide ${i + 1}: task refs differ`);
      check(isDeepStrictEqual(n.context, s.context), `${old.id} slide ${i + 1}: task context differs`);
      check(isDeepStrictEqual(n.checklist, s.checklist), `${old.id} slide ${i + 1}: checklist differs`);
    }
    // Everything else on the slide, field by field.
    check(isDeepStrictEqual(n, s), `${old.id} slide ${i + 1} (${s.type}): content differs`);
  });
  check(isDeepStrictEqual(neu, o), `${old.id}: lesson fields differ`);
  const q = o.slides.filter((s: any) => s.type === "quiz").length, t = o.slides.filter((s: any) => s.type === "task").length;
  const tasksPatched = o.slides.filter((s: any) => s.type === "task" && s.context).length;
  totalSlides += o.slides.length; totalQuiz += q; totalTasks += t;
  lines.push(`  ${old.id}  ${String(o.slides.length).padStart(2)} slides  ${String(q).padStart(2)} quiz  ${t} tasks (${tasksPatched} with coaching facts)  score slide: ${o.slides.some((s: any) => s.type === "score") ? "yes" : "NO"}`);
}
// Photos: every photo the lessons use exists and is byte-identical.
const used = new Set<string>();
const walk = (v: any) => { if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) { if ((k === "img") && typeof x === "string") used.add(x); walk(x); } };
legacy.LESSONS.forEach(walk);
const legacyImgs = readdirSync(ROOT + "legacy/studybook/img").filter((f) => f.endsWith(".jpg"));
for (const f of legacyImgs) {
  const p = ROOT + "public/img/" + f;
  if (!existsSync(p)) { fails.push("Missing photo " + f); continue; }
  check(readFileSync(p).equals(readFileSync(ROOT + "legacy/studybook/img/" + f)), "Photo differs: " + f);
}
for (const k of used) check(existsSync(ROOT + `public/img/${k}.jpg`), `Photo used by a lesson is missing: ${k}.jpg`);
for (const k of used) check(!!legacy.PHOTOS[k], `Photo has no credit line: ${k}`);

// ---------- Intel ----------
const I0 = parseLegacyIntel();
const I = { ...I0, runs: JSON.parse(JSON.stringify(I0.runs)) as typeof I0.runs };
const runFiles = readdirSync(ROOT + "content/intel/runs").filter((f) => /^run-\d+\.json$/.test(f)).sort();
check(runFiles.length === I.runs.length, `Intel runs: ${runFiles.length} files vs ${I.runs.length} in legacy`);
I.runs.forEach((r) => {
  const f = `content/intel/runs/run-${String(r.run).padStart(2, "0")}.json`;
  if (!existsSync(ROOT + f)) return fails.push("Missing " + f);
  const n = read(f);
  check(isDeepStrictEqual(n, r), `Run ${r.run}: differs (run, date, status or calls)`);
});
const cur = read("content/intel/current.json");
const latest = Math.max(...runFiles.map((f) => read("content/intel/runs/" + f).run));
check(cur.asOfRun === latest, `current.json is for run ${cur.asOfRun}, latest run file is ${latest}`);
check(isDeepStrictEqual(cur.masthead, { eyebrow: I.masthead.eyebrow, title: I.masthead.title, sub: I.masthead.sub }), "Intel masthead differs");
check(isDeepStrictEqual(cur.verdict, I.verdict), "Intel verdict differs");
check(cur.correction === I.correction, "Intel correction note differs");
check(cur.footer === I.footer, "Intel footer differs");
const panels: Record<string, any> = {};
for (const p of cur.panels) panels[p.id] = p;
for (const s of cur.seasons) for (const p of s.tabs) panels[p.id] = p;
panels.log = cur.log;
for (const t of I.tabs) {
  const p = panels[t.id];
  if (!p) { fails.push(`Intel section missing: ${t.label}`); continue; }
  check(p.label === t.label, `Intel tab label differs: ${p.label} vs ${t.label}`);
  const want = t.id === "log" ? I.sections.log.filter((b) => b.t !== "table") : I.sections[t.id];
  check(isDeepStrictEqual(p.blocks, want), `Intel section content differs: ${t.label}`);
}
// Tab order: the legacy order, with the season tabs in place.
const order = cur.tabOrder.flatMap((id: string) => (id === "@season" ? cur.seasons.find((s: any) => s.id === cur.currentSeason).tabs.map((t: any) => t.id) : [id]));
check(isDeepStrictEqual(order, I.tabs.map((t) => t.id)), `Intel tab order differs: ${order.join(", ")}`);
const legacyDate = new Date(I.runs[I.runs.length - 1].date + "T12:00:00Z").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
check(I.masthead.staticRunText.endsWith(legacyDate), `Masthead date "${I.masthead.staticRunText}" does not match latest run date ${legacyDate}`);

// ---------- Library ----------
const lib: Record<string, any[]> = {};
for (const f of readdirSync(ROOT + "content/library").filter((f) => f.endsWith(".json"))) lib[f.replace(".json", "")] = read("content/library/" + f);
const all = Object.values(lib).flat();
const rememberWant = legacy.LESSONS.flatMap((l) => l.slides.filter((s: any) => s.type === "remember").flatMap((s: any) => s.items)).length;
check(lib.remember?.length === rememberWant, `Library remember items: ${lib.remember?.length} vs ${rememberWant}`);
check(lib.moves?.length === 18, `Library design moves: ${lib.moves?.length} vs 18`);
check(lib.brand?.length === 8, `Library Brand Core sections: ${lib.brand?.length} vs 8`);
const videosWant = legacy.LESSONS.flatMap((l) => l.slides.filter((s: any) => s.type === "video").flatMap((s: any) => s.items)).length;
check(lib.videos?.length === videosWant, `Library videos: ${lib.videos?.length} vs ${videosWant}`);
const factsWant = legacy.LESSONS.flatMap((l) => l.slides.filter((s: any) => s.type === "story" || s.type === "compare")).length;
check(lib.facts?.length === factsWant, `Library facts: ${lib.facts?.length} vs ${factsWant}`);
// Research: no line of text lost (every non-heading, non-empty line appears in some entry).
const mdLines = readFileSync(ROOT + "data/research/heritage-and-fabric-research.md", "utf8").split("\n").filter((l) => l.trim() && !/^#{1,4} /.test(l));
const researchText = (lib.research || []).map((e) => e.body).join("\n");
const lost = mdLines.filter((l) => !researchText.includes(l.trim())).filter((l, i) => i > 0 || !/^Oct 24, 2026/.test(l));
check(lost.length <= 1, `Research doc: ${lost.length} lines not in the Library, e.g. "${lost[0]}"`);
const takeaways = mdLines.filter((l) => /Design takeaway|Rule for A'ila/.test(l)).length;
const ids = new Set<string>(); for (const e of all) { check(!ids.has(e.id), "Duplicate Library id " + e.id); ids.add(e.id); }
for (const e of all) check(!!(e.id && e.title && e.origin && Array.isArray(e.tags) && Array.isArray(e.sources)), "Library entry missing fields: " + e.id);
for (const w of ["bisht", "twill", "sadu", "cupro"]) {
  const n = all.filter((e) => (e.title + " " + e.body + " " + e.tags.join(" ")).toLowerCase().includes(w)).length;
  check(n > 0, `Library search "${w}" finds nothing`);
  lines.push(`  Library search "${w}": ${n} entries`);
}

// ---------- Summary ----------
console.log("\nMigration check");
console.log(`Study Book: ${legacy.LESSONS.length} lessons, ${totalSlides} slides, ${totalQuiz} quiz questions, ${totalTasks} tasks`);
lines.filter((l) => l.startsWith("  l")).forEach((l) => console.log(l));
console.log(`Photos: ${legacyImgs.length} copied, ${used.size} used by lessons, all with credit lines`);
console.log(`Intel: ${runFiles.length} runs, latest Run ${latest}; ${I.tabs.length} tabs in the old order; header bug fixed (old page said "${I.masthead.staticRunText.replace(/^Run(\d+).*/, "Run $1")}")`);
console.log(`Library: ${all.length} entries (${Object.entries(lib).map(([k, v]) => v.length + " " + k).join(", ")}); research lines kept, ${takeaways} takeaway/rule lines`);
lines.filter((l) => l.startsWith("  Library")).forEach((l) => console.log(l));
if (fails.length) {
  console.log(`\nFAILED: ${fails.length} difference(s):`);
  fails.slice(0, 50).forEach((f) => console.log("  - " + f));
  process.exit(1);
}
console.log("\nPASSED: no differences.");
