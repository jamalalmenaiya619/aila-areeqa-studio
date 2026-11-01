// Renders the small inline HTML kept in content files (bold, italics, links, status tags) and nothing else.
import { Fragment, type ReactNode } from "react";

const TAG_RE = /<(\/?)(strong|b|em|i|a|br|span)((?:\s+[a-z-]+="[^"]*")*)\s*\/?>/gi;
const decode = (s: string) => s.replace(/&(amp|lt|gt|quot|#39|rarr|larr|nbsp);/g, (_, e) => ({ amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'", rarr: "→", larr: "←", nbsp: " " })[e as string] as string);

type Node = { tag: string; attrs: Record<string, string>; kids: (Node | string)[] };
export function parseInline(html: string): (Node | string)[] {
  const root: Node = { tag: "root", attrs: {}, kids: [] };
  const stack = [root];
  let last = 0;
  for (const m of html.matchAll(TAG_RE)) {
    if (m.index! > last) stack[stack.length - 1].kids.push(decode(html.slice(last, m.index)));
    last = m.index! + m[0].length;
    const [, close, tag0, attrStr] = m; const tag = tag0.toLowerCase();
    if (close) { if (stack.length > 1 && stack[stack.length - 1].tag === tag) stack.pop(); continue; }
    const attrs: Record<string, string> = {};
    for (const a of attrStr.matchAll(/([a-z-]+)="([^"]*)"/gi)) attrs[a[1].toLowerCase()] = decode(a[2]);
    const node: Node = { tag, attrs, kids: [] };
    stack[stack.length - 1].kids.push(node);
    if (tag !== "br") stack.push(node);
  }
  if (last < html.length) stack[stack.length - 1].kids.push(decode(html.slice(last)));
  return root.kids;
}
function render(nodes: (Node | string)[]): ReactNode[] {
  return nodes.map((n, i) => {
    if (typeof n === "string") return <Fragment key={i}>{n}</Fragment>;
    const kids = render(n.kids);
    switch (n.tag) {
      case "strong": case "b": return <strong key={i}>{kids}</strong>;
      case "em": case "i": return <em key={i}>{kids}</em>;
      case "br": return <br key={i} />;
      case "a": { const href = /^https?:\/\//.test(n.attrs.href || "") ? n.attrs.href : undefined; return <a key={i} href={href} target="_blank" rel="noopener">{kids}</a>; }
      case "span": { const cls = (n.attrs.class || "").split(/\s+/).filter((c) => /^(tag|t-[a-z]+)$/.test(c)).join(" "); return <span key={i} className={cls || undefined}>{kids}</span>; }
    }
    return <Fragment key={i}>{kids}</Fragment>;
  });
}
export function Inline({ html }: { html: string }) { return <>{render(parseInline(html))}</>; }
/** Plain text of inline HTML (for search and notes). */
export const textOf = (html: string) => decode(html.replace(/<[^>]+>/g, ""));

const BLOCK_OK = new Set(["p", "ul", "ol", "li", "strong", "b", "em", "i", "h4", "br", "a"]);
function domToReact(n: ChildNode, key: number): ReactNode {
  if (n.nodeType === 3) return n.textContent;
  if (n.nodeType !== 1) return null;
  const el = n as Element, tag = el.tagName.toLowerCase();
  const kids = [...el.childNodes].map(domToReact);
  if (!BLOCK_OK.has(tag)) return <Fragment key={key}>{kids}</Fragment>;
  if (tag === "br") return <br key={key} />;
  if (tag === "a") { const h = el.getAttribute("href") || ""; return <a key={key} href={/^https?:/.test(h) ? h : undefined} target="_blank" rel="noopener">{kids}</a>; }
  const cls = el.getAttribute("class");
  const T = tag as "p";
  return <T key={key} className={cls && /^(lede|quote)$/.test(cls) ? cls : undefined}>{kids}</T>;
}
/** Block HTML from the Brand Core (paragraphs, lists, small headings), allow-listed. */
export function BlockHtml({ html }: { html: string }) {
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html");
  return <>{[...doc.body.firstChild!.childNodes].map(domToReact)}</>;
}
