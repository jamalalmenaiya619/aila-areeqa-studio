// Library: lessons + research doc + Brand Core -> content/library/*.json
// Every entry: id, title, body, format, tags (topics), sources, origin, plus optional img/svg/move/flag.
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { parse, HTMLElement, NodeType } from "node-html-parser";
import { ROOT, loadLegacyStudybook, toJSON } from "./lib-legacy.ts";

type Src = [string, string];
type Entry = {
  id: string; kind: string; title: string; body: string; format: "text" | "md" | "html";
  tags: string[]; sources: Src[];
  origin: { type: "lesson"; lesson: string; slide: number } | { type: "research"; track: string; section: string } | { type: "brand"; section: string };
  img?: string; svg?: string; move?: number; flag?: string;
};

// Topic tags are sorted by keyword, so they are a finding aid, not a judgment.
const TOPICS: Record<string, RegExp> = {
  heritage: /\b(bisht|sadu|qatt|najd|najdi|hijaz|hijazi|bedouin|thobe|heritage|saudi|asir|al-ahsa|hasawi|farwa|sidairi|sidari|agal|shemagh|ghutra|majlis|dallah|labda|haskal|ardah|rawasheen|janbiya|najran|jazan|alula|hail|madinah|makkah|riyadh|abaya|tribe|souq)\b/i,
  fabric: /\b(fib(er|re)s?|wool|linen|cotton|silk|weaves?|woven|cashmere|twill|satin|sateen|camel hair|flax|polyester|nylon|viscose|cupro|modal|blend|yarn|knit|jersey|micron|momme|vicu[nñ]a|elastane|spandex|fabric|cloth|herringbone|tweed|velvet|corduroy)\b/i,
  construction: /\b(seams?|stitch(ing|ed)?|linings?|lined|canvas|pockets?|vents?|cut|pattern|collar|cuff|hem|yoke|shoulder|button|pleat|tailor(ing|ed)?|construction|sewn|sewing|braid|trim|interlining|dart)\b/i,
  color: /\b(colou?rs?|dyes?|dyed|dyeing|indigo|madder|palette|turmeric|pigment|red|navy|black|white|tone-on-tone|shade)\b/i,
  leather: /\b(leather|tann(ing|ed)?|sandal|madas|hide|suede)\b/i,
  scent: /\b(oud|incense|scent|bukhur|rose|perfume|fragrance|mudakhkhana|musk)\b/i,
};
const tagsFor = (text: string) => Object.entries(TOPICS).filter(([, re]) => re.test(text)).map(([k]) => k);
const textOf = (v: unknown): string => (typeof v === "string" ? v : Array.isArray(v) ? v.map(textOf).join(" ") : v && typeof v === "object" ? Object.values(v).map(textOf).join(" ") : "");

const { LESSONS } = loadLegacyStudybook();
const out: Record<string, Entry[]> = { remember: [], moves: [], facts: [], videos: [], research: [], brand: [] };

// ---- From the lessons ----
for (const les of LESSONS) {
  les.slides.forEach((s: any, i: number) => {
    const origin = { type: "lesson" as const, lesson: les.id, slide: i };
    if (s.type === "remember")
      s.items.forEach(([title, body]: [string, string], k: number) =>
        out.remember.push({ id: `${les.id}-s${i}-remember-${k}`, kind: "remember", title, body, format: "text", tags: tagsFor(title + " " + body), sources: [], origin }));
    if (s.type === "story")
      out.facts.push({ id: `${les.id}-s${i}-story`, kind: "fact", title: s.title, body: [].concat(s.text).join("\n\n"), format: "text",
        tags: tagsFor(textOf([s.title, s.text, s.caption])), sources: s.src || [], origin, ...(s.img ? { img: s.img } : {}) });
    if (s.type === "compare")
      out.facts.push({ id: `${les.id}-s${i}-compare`, kind: "fact", title: s.title, body: s.takeaway, format: "text",
        tags: tagsFor(textOf([s.title, s.takeaway, s.left, s.right])), sources: s.src || [], origin, ...(s.left?.img ? { img: s.left.img } : {}) });
    if (s.type === "video")
      s.items.forEach(([title, url, note]: string[], k: number) =>
        out.videos.push({ id: `${les.id}-s${i}-video-${k}`, kind: "video", title, body: note || "", format: "text", tags: tagsFor(title + " " + (note || "")), sources: [[title, url]], origin }));
  });
}
// The 18 design moves: the Lesson 7 gallery card + the lesson's own design slide.
const l7 = LESSONS.find((l) => l.id === "l7");
const gi = l7.slides.findIndex((s: any) => s.type === "gallery");
for (const r of l7.slides[gi].refs) {
  const n = Number(r.label.match(/Move (\d+)/)[1]);
  const lesNum = Number(r.label.match(/Lesson (\d+)/)[1]);
  const les = LESSONS.find((l) => l.num === lesNum);
  const di = les.slides.findIndex((s: any) => s.type === "design" && new RegExp(`^Move ${n}:`).test(s.title));
  const d = di > -1 ? les.slides[di] : null;
  const body = d ? [d.text, ...(d.how || []).map((h: string) => "- " + h)].join("\n\n") : r.cap;
  out.moves.push({
    id: `move-${String(n).padStart(2, "0")}`, kind: "move", title: `Move ${n}: ${r.title}`, body: r.cap + (d ? "\n\n" + body : ""), format: "text",
    tags: tagsFor(textOf([r, d])), sources: [], move: n,
    origin: d ? { type: "lesson", lesson: les.id, slide: di } : { type: "lesson", lesson: "l7", slide: gi },
    ...(r.svg ? { svg: r.svg } : {}), ...(r.img ? { img: r.img } : {}),
  });
}

// ---- Research doc: one entry per heading that has text under it (text kept as written) ----
const md = readFileSync(ROOT + "data/research/heritage-and-fabric-research.md", "utf8").split("\n");
let track = "", day = "", cur: { title: string; lines: string[]; level: number } | null = null;
const slug = (s: string) => s.toLowerCase().replace(/[*_]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const seen = new Map<string, number>();
function flush() {
  if (!cur) return;
  const body = cur.lines.join("\n").trim();
  if (body) {
    let id = "research-" + slug((track ? "t" + track.split(" ")[1] + "-" : "") + (day && cur.level === 4 ? day + "-" : "") + cur.title);
    const k = (seen.get(id) || 0) + 1; seen.set(id, k); if (k > 1) id += "-" + k;
    const sources = [...body.matchAll(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g)].map((m) => [m[1], m[2]] as Src);
    out.research.push({ id, kind: "research", title: cur.title.replace(/\*/g, ""), body, format: "md", tags: tagsFor(cur.title + " " + body), sources,
      origin: { type: "research", track: track || "Introduction", section: [day, cur.title].filter(Boolean).join(" · ") } });
  }
  cur = null;
}
for (const line of md) {
  const h = line.match(/^(#{1,4}) (.+)$/);
  if (h) {
    flush();
    const level = h[1].length, title = h[2].trim();
    if (level === 2) { track = /^Track/.test(title) ? title : ""; day = ""; }
    if (level === 3) day = /^Day \d/.test(title) ? title : "";
    if (level >= 2) cur = { title, lines: [], level };
    continue;
  }
  if (cur) cur.lines.push(line);
}
flush();

// ---- Brand Core: 8 sections ----
const brand = parse(readFileSync(ROOT + "data/brand/brand-core.html", "utf8"));
const KEEP = new Set(["p", "ul", "ol", "li", "strong", "em", "b", "i", "h4", "br", "a"]);
function clean(el: HTMLElement): string {
  let s = "";
  for (const n of el.childNodes) {
    if (n.nodeType === NodeType.TEXT_NODE) s += n.rawText;
    else if (n instanceof HTMLElement) {
      const tag = n.rawTagName.toLowerCase();
      if (tag === "button" || tag === "span" && n.classList.contains("eyebrow") || tag === "h2") continue;
      const inner = clean(n);
      if (KEEP.has(tag)) {
        const cls = n.getAttribute("class");
        s += tag === "a" ? `<a href="${n.getAttribute("href")}">${inner}</a>` : `<${tag}${cls && /lede|quote/.test(cls) ? ` class="${cls}"` : ""}>${inner}</${tag}>`;
      } else s += inner; // unwrap layout divs
    }
  }
  return s.replace(/\n\s*\n/g, "\n").trim();
}
for (const sec of brand.querySelectorAll("div.section").filter((s) => s.querySelector("h2") && s.querySelector(".eyebrow"))) {
  const eyebrow = sec.querySelector(".eyebrow")!.text.trim(); // "01 — Mission"
  const html = clean(sec);
  const e: Entry = { id: "brand-" + sec.id, kind: "brand", title: sec.querySelector("h2")!.text.trim(), body: html, format: "html",
    tags: tagsFor(sec.text), sources: [], origin: { type: "brand", section: eyebrow } };
  if (/honeycomb/i.test(sec.text))
    e.flag = "Open question (PLAN.md 4.2): this example uses a honeycomb-stitched polo, but THE HERITAGE POLO has no honeycomb stitch. Wording to be fixed by Jamal.";
  out.brand.push(e);
}

const dir = ROOT + "content/library/";
mkdirSync(dir, { recursive: true });
for (const [k, v] of Object.entries(out)) writeFileSync(dir + k + ".json", toJSON(v));
console.log("Library: " + Object.entries(out).map(([k, v]) => `${v.length} ${k}`).join(", ") + ".");
