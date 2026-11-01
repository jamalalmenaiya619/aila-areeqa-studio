// Content files from /content, bundled into the app (the app itself is only served after login).
import meta from "../../content/lessons/meta.json";
import current from "../../content/intel/current.json";

export type Src = [string, string];
export type Slide = { type: string; part: string; _pl?: string; [k: string]: any };
export type Lesson = { id: string; num: number; date: string; day: string; ready: boolean; title: string; pair: string; parts?: Record<string, { label?: string; min?: number }>; slides: Slide[] };
export type Photo = { by: string; lic: string; page: string };

const lessonFiles = import.meta.glob<Lesson>("../../content/lessons/l*.json", { eager: true, import: "default" });
const byId: Record<string, Lesson> = {};
for (const l of Object.values(lessonFiles)) byId[l.id] = l;
export const LESSONS: Lesson[] = (meta.order as string[]).map((id) => byId[id]);
export const PARTS = meta.PARTS as Record<string, { label: string; min: number }>;
export const PHOTOS = meta.PHOTOS as Record<string, Photo>;
export const lessonById = (id: string) => LESSONS.find((l) => l.id === id);

export type LibEntry = {
  id: string; kind: string; title: string; body: string; format: "text" | "md" | "html"; tags: string[]; sources: Src[];
  origin: { type: "lesson"; lesson: string; slide: number } | { type: "research"; track: string; section: string } | { type: "brand"; section: string };
  img?: string; svg?: string; move?: number; flag?: string;
};
const libFiles = import.meta.glob<LibEntry[]>("../../content/library/*.json", { eager: true, import: "default" });
const LIB_ORDER = ["remember", "moves", "facts", "videos", "research", "brand"];
export const LIBRARY: LibEntry[] = LIB_ORDER.flatMap((k) => Object.entries(libFiles).find(([p]) => p.endsWith(`/${k}.json`))?.[1] || []);

export type Run = { run: number; date: string; status: string; calls: string[] };
const runFiles = import.meta.glob<Run>("../../content/intel/runs/run-*.json", { eager: true, import: "default" });
/** All runs, oldest first. The run number shown on the page comes from here, never typed by hand. */
export const RUNS: Run[] = Object.values(runFiles).sort((a, b) => a.run - b.run);
export const LATEST_RUN = RUNS[RUNS.length - 1];
export type IntelBlock = any;
export type IntelPanel = { id: string; label: string; blocks: IntelBlock[] };
export const INTEL = current as unknown as {
  asOfRun: number; masthead: { eyebrow: string; title: string; sub: string }; verdict: { eyebrow: string; html: string }; correction: string | null;
  tabOrder: string[]; panels: IntelPanel[]; log: IntelPanel; seasons: { id: string; label: string; tabs: IntelPanel[] }[]; currentSeason: string; footer: string;
};
const reportFiles = import.meta.glob<any>("../../content/intel/reports/*/*.{json,md}", { eager: true, import: "default", query: "?raw" });
export const REPORT_COUNT = Object.keys(reportFiles).length;

export const fmtDate = (iso: string) => new Date(iso + "T12:00:00Z").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
