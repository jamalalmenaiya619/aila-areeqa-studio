// Intel: legacy Battlefield page -> content/intel/runs/run-NN.json + content/intel/current.json
import { mkdirSync, writeFileSync } from "node:fs";
import { ROOT, toJSON } from "./lib-legacy.ts";
import { parseLegacyIntel } from "./lib-intel.ts";

const L = parseLegacyIntel();
const dir = ROOT + "content/intel/";
mkdirSync(dir + "runs", { recursive: true });
for (const kind of ["weekly", "monthly", "quarterly"]) mkdirSync(dir + "reports/" + kind, { recursive: true });
for (const r of L.runs) writeFileSync(dir + `runs/run-${String(r.run).padStart(2, "0")}.json`, toJSON(r));

const SEASON_TABS = ["autumn", "winter"];
const label = (id: string) => L.tabs.find((t) => t.id === id)!.label;
const panel = (id: string) => ({ id, label: label(id), blocks: L.sections[id] });
const current = {
  asOfRun: L.runs[L.runs.length - 1].run, // checked by verify; the page computes the run number from runs/
  masthead: { eyebrow: L.masthead.eyebrow, title: L.masthead.title, sub: L.masthead.sub },
  verdict: L.verdict,
  correction: L.correction,
  // Tab order: overview, then the current season's tabs, then the rest. Trend log is built from runs/.
  tabOrder: L.tabs.map((t) => (SEASON_TABS.includes(t.id) ? "@season" : t.id)).filter((id, i, a) => id !== "@season" || a.indexOf("@season") === i),
  panels: ["overview", "social", "saudi", "comp", "sat"].map(panel),
  log: { id: "log", label: label("log"), blocks: L.sections.log.filter((b) => b.t !== "table") },
  seasons: [{ id: "AW26", label: "Autumn/Winter 2026", tabs: SEASON_TABS.map(panel) }],
  currentSeason: "AW26",
  footer: L.footer,
};
writeFileSync(dir + "current.json", toJSON(current));
for (const kind of ["weekly", "monthly", "quarterly"]) writeFileSync(dir + `reports/${kind}/.gitkeep`, "");
console.log(`Intel: ${L.runs.length} runs, ${Object.keys(L.sections).length} sections.`);
