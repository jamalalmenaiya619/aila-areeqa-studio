// A small Markdown reader for the research doc and Brand Core entries: paragraphs, lists, tables, bold, italics, links.
import type { ReactNode } from "react";
import { Inline } from "./safe-html";

const inlineMd = (s: string) => s
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2">$1</a>')
  .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
  .replace(/(^|[^*\w])\*([^*\n]+)\*(?!\w)/g, "$1<em>$2</em>");
const I = ({ s }: { s: string }) => <Inline html={inlineMd(s)} />;

export function Markdown({ text }: { text: string }) {
  const lines = text.split("\n");
  const out: ReactNode[] = [];
  let i = 0, k = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    if (/^\s*\|/.test(line)) {
      const rows: string[][] = [];
      while (i < lines.length && /^\s*\|/.test(lines[i])) { rows.push(lines[i].trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim())); i++; }
      const body = rows.filter((r) => !r.every((c) => /^:?-{3,}:?$/.test(c)));
      out.push(<div className="tbl" key={k++}><table><thead><tr>{body[0].map((c, j) => <th key={j}><I s={c} /></th>)}</tr></thead>
        <tbody>{body.slice(1).map((r, n) => <tr key={n}>{r.map((c, j) => <td key={j}><I s={c} /></td>)}</tr>)}</tbody></table></div>);
      continue;
    }
    if (/^\s*([-*]|\d+\.) /.test(line)) {
      const items: string[] = [];
      const ordered = /^\s*\d+\. /.test(line);
      while (i < lines.length && /^\s*([-*]|\d+\.) /.test(lines[i])) { items.push(lines[i].replace(/^\s*([-*]|\d+\.) (\[[ x]\] )?/, "")); i++; }
      const L = ordered ? "ol" : "ul";
      out.push(<L key={k++}>{items.map((t, j) => <li key={j}><I s={t} /></li>)}</L>);
      continue;
    }
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^\s*(\||[-*] |\d+\. )/.test(lines[i])) { para.push(lines[i]); i++; }
    out.push(<p key={k++}><I s={para.join(" ")} /></p>);
  }
  return <>{out}</>;
}
