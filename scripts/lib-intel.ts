// Parses the legacy Battlefield page into plain data blocks. Used by migrate-intel and verify-migration.
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { parse, HTMLElement, Node, NodeType } from "node-html-parser";
import { ROOT } from "./lib-legacy.ts";

export const LEGACY_INTEL = ROOT + "legacy/intel/battlefield-published-run17.html";
const ALLOWED_INLINE = new Set(["strong", "b", "em", "i", "a", "br"]);

export type Tag = { kind: string; label: string };
export type Block =
  | { t: "h2"; text: string }
  | { t: "h3"; text: string; tags: Tag[] }
  | { t: "p"; html: string; note?: boolean }
  | { t: "ul"; items: string[] }
  | { t: "calls"; cards: { tags: Tag[]; title: string; html: string }[] }
  | { t: "table"; className?: string; head: string[]; rows: { html: string; kind?: string; num?: boolean }[][] }
  | { t: "price"; items: { value: string; label: string }[] }
  | { t: "cols"; cols: Block[][] };

const norm = (s: string) => s.replace(/\s+/g, " ").trim();
const kindOf = (cls: string) => (cls.match(/\bt-(\w+)/) || [])[1];

/** Inner HTML limited to simple inline tags; anything else fails loudly. */
function inline(el: HTMLElement, skipTags = false): string {
  let out = "";
  for (const n of el.childNodes) {
    if (n.nodeType === NodeType.TEXT_NODE) out += n.rawText;
    else if (n instanceof HTMLElement) {
      const tag = n.rawTagName.toLowerCase();
      if (skipTags && tag === "span" && n.classList.contains("tag")) continue;
      if (tag === "span" && n.classList.contains("tag")) { out += n.outerHTML; continue; }
      if (!ALLOWED_INLINE.has(tag)) throw new Error("Unexpected inline tag <" + tag + "> in: " + el.outerHTML.slice(0, 120));
      out += tag === "a" ? `<a href="${n.getAttribute("href")}">${inline(n)}</a>` : `<${tag}>${inline(n)}</${tag}>`;
    }
  }
  return norm(out);
}
const tagsIn = (el: HTMLElement): Tag[] =>
  el.querySelectorAll("span.tag").map((s) => ({ kind: kindOf(s.getAttribute("class") || "") || "none", label: norm(s.text) }));

function blocks(parent: HTMLElement): Block[] {
  const out: Block[] = [];
  for (const n of parent.childNodes) {
    if (!(n instanceof HTMLElement)) { if (norm(n.rawText)) throw new Error("Loose text: " + n.rawText); continue; }
    const tag = n.rawTagName.toLowerCase(), cls = n.getAttribute("class") || "";
    if (tag === "h2") out.push({ t: "h2", text: norm(n.text) });
    else if (tag === "h3") out.push({ t: "h3", text: inline(n, true), tags: tagsIn(n) });
    else if (tag === "p") out.push(cls.includes("note") ? { t: "p", html: inline(n), note: true } : { t: "p", html: inline(n) });
    else if (tag === "ul") out.push({ t: "ul", items: n.querySelectorAll("li").map((li) => inline(li)) });
    else if (tag === "div" && cls === "calls")
      out.push({ t: "calls", cards: n.querySelectorAll(".call").map((c) => ({ tags: tagsIn(c), title: norm(c.querySelector("h4")!.text), html: inline(c.querySelector("p")!) })) });
    else if (tag === "div" && cls === "tbl") {
      const table = n.querySelector("table")!;
      const trs = table.querySelectorAll("tr");
      const t: Block = { t: "table", head: trs[0].querySelectorAll("th").map((h) => norm(h.text)), rows: trs.slice(1).map((tr) => tr.querySelectorAll("td").map((td) => {
        const c = td.getAttribute("class") || ""; const cell: { html: string; kind?: string; num?: boolean } = { html: inline(td) };
        if (kindOf(c)) cell.kind = kindOf(c); if (/\bnum\b/.test(c)) cell.num = true; return cell; })) };
      if (table.getAttribute("class")) t.className = table.getAttribute("class")!;
      out.push(t);
    } else if (tag === "div" && cls === "price")
      out.push({ t: "price", items: n.childNodes.filter((d): d is HTMLElement => d instanceof HTMLElement).map((d) => ({ value: norm(d.querySelector("b")!.text), label: norm(d.querySelector("span")!.text) })) });
    else if (tag === "div" && cls === "cols")
      out.push({ t: "cols", cols: n.childNodes.filter((d): d is HTMLElement => d instanceof HTMLElement).map((d) => blocks(d)) });
    else throw new Error(`Unknown block <${tag} class="${cls}">`);
  }
  return out;
}

export function parseLegacyIntel() {
  const html = readFileSync(LEGACY_INTEL, "utf8");
  // runLog: evaluate the array literal exactly as the page did.
  const script = html.slice(html.lastIndexOf("const runLog"));
  const arr = script.slice(script.indexOf("["), script.indexOf("];") + 1);
  const runs = vm.runInNewContext("(" + arr + ")") as { run: number; date: string; status: string; calls: string[] }[];

  const root = parse(html, { comment: false });
  const mast = root.querySelector("header.mast")!;
  const verdictEl = root.querySelector(".verdict")!;
  // The correction paragraph sits right after the verdict box in the legacy page.
  let corr: Node | null = verdictEl.nextElementSibling;
  const correction = corr && (corr as HTMLElement).rawTagName === "p" ? inline(corr as HTMLElement) : null;
  const tabs = root.querySelectorAll("nav button").map((b) => ({ id: b.getAttribute("data-p")!, label: norm(b.text) }));
  const sections: Record<string, Block[]> = {};
  for (const s of root.querySelectorAll("section[role=tabpanel]")) sections[s.id] = blocks(s);
  return {
    runs,
    masthead: {
      eyebrow: norm(mast.querySelector(".eyebrow")!.text),
      title: norm(mast.querySelector("h1")!.text),
      sub: norm(mast.querySelector(".sub")!.text),
      staticRunText: norm(mast.querySelector(".runmeta")!.text), // e.g. "Run10October 29, 2026" (the stale header)
    },
    verdict: { eyebrow: norm(verdictEl.querySelector(".eyebrow")!.text), html: inline(verdictEl.querySelector("p")!) },
    correction,
    tabs,
    sections,
    footer: inline(root.querySelector("footer")!),
  };
}
