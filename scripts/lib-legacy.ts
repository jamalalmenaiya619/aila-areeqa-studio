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
