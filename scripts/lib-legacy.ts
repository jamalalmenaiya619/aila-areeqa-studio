// Loads the legacy Study Book data exactly as the old page did:
// lessons.js runs top to bottom (including L7.parts/_pl and the PATCH layer
// that adds whys, hints, refs, context and the auto score slide).
import { readFileSync } from "node:fs";
import vm from "node:vm";

export const ROOT = new URL("..", import.meta.url).pathname;

export function loadLegacyStudybook() {
  const code = readFileSync(ROOT + "legacy/studybook/lessons.js", "utf8");
  const ctx: Record<string, unknown> = {};
  vm.createContext(ctx);
  vm.runInContext(code + "\n;globalThis.__out = { SRC, PARTS, PHOTOS, LESSONS };", ctx);
  return ctx.__out as { SRC: any; PARTS: any; PHOTOS: any; LESSONS: any[] };
}

/** Stable JSON: keys in insertion order (as authored), 2-space indent, trailing newline. */
export const toJSON = (v: unknown) => JSON.stringify(v, null, 2) + "\n";

/** Fails if a value cannot survive JSON (functions, undefined, NaN). */
export function assertJsonSafe(v: unknown, path = "$"): void {
  if (v === null) return;
  const t = typeof v;
  if (t === "function" || t === "undefined" || t === "symbol" || t === "bigint") throw new Error(`Not JSON-safe at ${path}: ${t}`);
  if (t === "number" && !Number.isFinite(v as number)) throw new Error(`Not JSON-safe at ${path}: ${v}`);
  if (Array.isArray(v)) return v.forEach((x, i) => assertJsonSafe(x, `${path}[${i}]`));
  if (t === "object") for (const [k, x] of Object.entries(v as object)) assertJsonSafe(x, `${path}.${k}`);
}

/** Runs the legacy drawing code from index.html and returns each drawing's SVG markup. */
export function loadLegacyDrawings() {
  const html = readFileSync(ROOT + "legacy/studybook/index.html", "utf8");
  const esc = 'const esc = s => String(s ?? "").replace(/[&<>"\']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", \'"\': "&quot;", "\'": "&#39;" }[c]));';
  const qatt = html.slice(html.indexOf("  function qattSVG("), html.indexOf("  // ---------- weave grid"));
  const weave = html.slice(html.indexOf("  const WEAVE_RULES"), html.indexOf("  // ---------- diagrams"));
  const svg = html.slice(html.indexOf("  const COAT ="), html.indexOf("  // ---------- events"));
  const ctx: Record<string, unknown> = {};
  vm.createContext(ctx);
  vm.runInContext(`${esc}\n${qatt}\n${weave}\n${svg}\nglobalThis.__out = { SVG, qattSVG, weaveSVG };`, ctx);
  return ctx.__out as { SVG: Record<string, () => string>; qattSVG: (on: boolean[], mono: boolean) => string; weaveSVG: (rule: string, label: string) => string };
}

/** Old CSS variable names -> new token names (only colors change). */
export const VAR_MAP: Record<string, string> = {
  "--ground": "--bg", "--paper": "--surface", "--indigo-wash": "--accent-wash", "--indigo": "--accent",
  "--zari": "--gold", "--madder-wash": "--bad-wash", "--madder": "--bad",
};
/** Fixed hex colors in the old drawings -> drawing tokens. */
export const HEX_MAP: Record<string, string> = {
  "#C9A77C": "--draw-mud", "#8A6A45": "--draw-mud-line", "#3A2A1A": "--draw-mud-dark", "#6B4A2A": "--draw-door",
  "#B5674A": "--draw-leather", "#C9CBD1": "--draw-silver", "#8E2A26": "--draw-red", "#9A2F2B": "--draw-coral",
  "#E9DFC9": "--draw-canvas", "#D9CBB0": "--draw-chest", "#7A6440": "--draw-cream-line", "#5A4A30": "--draw-cream-text",
  "#C0392B": "--qatt-red", "#E2B33C": "--qatt-yellow", "#2F5DA8": "--qatt-blue", "#1E1E1E": "--qatt-black",
  "#CDBB97": "--qatt-sand", "#F7F4EC": "--qatt-wall", "#EDE6D8": "--qatt-wall-mono", "#6B6B6B": "--qatt-text",
};
export function retoken(svg: string) {
  let s = svg.replace(/var\((--[a-z-]+)\)/g, (m, v) => (VAR_MAP[v] ? `var(${VAR_MAP[v]})` : m));
  s = s.replace(/#[0-9A-Fa-f]{6}\b/g, (h) => (HEX_MAP[h.toUpperCase()] ? `var(${HEX_MAP[h.toUpperCase()]})` : h));
  // Fonts: the display face changes to Playfair Display; the mono face stays IBM Plex Mono.
  s = s.replace(/font-family="Bodoni Moda, Georgia, serif"/g, 'font-family="Playfair Display, Georgia, serif"');
  return s;
}
