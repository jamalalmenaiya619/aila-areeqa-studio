// Library: everything learned in one searchable place.
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { LESSONS, LIBRARY, PHOTOS, type LibEntry } from "../lib/content";
import { Markdown } from "../lib/markdown";
import { BlockHtml } from "../lib/safe-html";
import { NoteButton } from "../components/NoteButton";
import { Drawing } from "./drawings";

const TOPICS = ["heritage", "fabric", "construction", "color", "leather", "scent"];
const KINDS: Record<string, string> = { remember: "Remember", move: "Design move", fact: "Key fact", video: "Video", research: "Research", brand: "Brand Core" };
const plain = (e: LibEntry) => (e.title + " " + e.body.replace(/<[^>]+>/g, " ") + " " + e.tags.join(" ")).toLowerCase();

export function originLabel(e: LibEntry) {
  const o = e.origin;
  if (o.type === "lesson") { const l = LESSONS.find((x) => x.id === o.lesson)!; return `Lesson ${l.num}, slide ${o.slide + 1}`; }
  if (o.type === "research") return `Research · ${o.track.replace(/ — .*/, "")} · ${o.section}`;
  return `Brand Core · ${o.section}`;
}

export function Library() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") || "", lesson = params.get("lesson") || "", topic = params.get("topic") || "", move = params.get("move") || "", kind = params.get("kind") || "";
  const setP = (k: string, v: string) => { const p = new URLSearchParams(params); if (v) p.set(k, v); else p.delete(k); setParams(p, { replace: true }); };
  const [limit, setLimit] = useState(40);
  const results = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    return LIBRARY.filter((e) =>
      (!words.length || words.every((w) => plain(e).includes(w))) &&
      (!lesson || (e.origin.type === "lesson" && e.origin.lesson === lesson)) &&
      (!topic || e.tags.includes(topic)) &&
      (!move || e.move === Number(move)) &&
      (!kind || e.kind === kind));
  }, [q, lesson, topic, move, kind]);
  const moves = LIBRARY.filter((e) => e.kind === "move");
  return (
    <main className="page">
      <header className="page-head"><div className="ui-kicker">Study · Library</div><h1>Everything learned, in one place</h1>
        <p className="lede">Remember points, the 18 design moves, key facts, videos, the research doc and the Brand Core. Topic tags are sorted by keywords, so treat them as a guide.</p></header>
      <div className="lib-filters" role="search">
        <input className="ui-input lib-search" type="search" aria-label="Search the Library" placeholder="Search: bisht, twill, sadu, cupro…" value={q} onChange={(e) => setP("q", e.target.value)} />
        <select className="ui-input" aria-label="Lesson" value={lesson} onChange={(e) => setP("lesson", e.target.value)}>
          <option value="">All lessons</option>{LESSONS.map((l) => <option key={l.id} value={l.id}>Lesson {l.num}</option>)}</select>
        <select className="ui-input" aria-label="Topic" value={topic} onChange={(e) => setP("topic", e.target.value)}>
          <option value="">All topics</option>{TOPICS.map((t) => <option key={t} value={t}>{t[0].toUpperCase() + t.slice(1)}</option>)}</select>
        <select className="ui-input" aria-label="Design move" value={move} onChange={(e) => setP("move", e.target.value)}>
          <option value="">All design moves</option>{moves.map((m) => <option key={m.id} value={m.move}>{m.title}</option>)}</select>
        <select className="ui-input" aria-label="Kind" value={kind} onChange={(e) => setP("kind", e.target.value)}>
          <option value="">All kinds</option>{Object.entries(KINDS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
      </div>
      <p className="mono-label" aria-live="polite">{results.length} {results.length === 1 ? "entry" : "entries"}</p>
      <div className="lib-grid">{results.slice(0, limit).map((e) => <LibCard key={e.id} e={e} />)}</div>
      {results.length > limit && <p><button className="ui-btn ui-btn-ghost" onClick={() => setLimit(limit + 40)}>Show more ({results.length - limit} left)</button></p>}
    </main>
  );
}

function LibCard({ e }: { e: LibEntry }) {
  const [open, setOpen] = useState(e.body.length < 420);
  const p = e.img ? PHOTOS[e.img] : null;
  return (
    <article className="ui-card lib-card" data-entry={e.id}>
      {(e.svg || e.img) && <div className="lib-pic">{e.svg ? <Drawing name={e.svg} /> : <img src={`/img/${e.img}.jpg`} alt="" loading="lazy" />}</div>}
      {p && <div className="cr">Photo: {p.by} · {p.lic} · <a href={p.page} target="_blank" rel="noopener">source</a></div>}
      <div className="ui-kicker">{KINDS[e.kind] || e.kind} · {originLabel(e)}</div>
      <h3 className="ui-card-title">{e.title}</h3>
      {e.flag && <p className="flag" role="note">{e.flag}</p>}
      <div className={`lib-body ${open ? "" : "clamped"}`}>
        {e.format === "md" ? <Markdown text={e.body} /> : e.format === "html" ? <BlockHtml html={e.body} /> : e.body.split(/\n{2,}/).map((t, k) => <p key={k}>{t}</p>)}
      </div>
      {!open && <button className="ui-btn ui-btn-link" onClick={() => setOpen(true)}>Read all</button>}
      {e.sources.length > 0 && e.format !== "md" && <div className="lib-srcs"><span className="mono-label">Sources</span>{e.sources.map(([t, u], k) => <a key={k} href={u} target="_blank" rel="noopener">{t}</a>)}</div>}
      <div className="lib-actions">
        {e.origin.type === "lesson" && <Link className="ui-btn ui-btn-ghost" to={`/study/${e.origin.lesson}/${e.origin.slide + 1}`}>Open in lesson</Link>}
        <NoteButton source={{ kind: "library", ref: e.id, label: e.title, href: `/study/library?q=${encodeURIComponent(e.title)}` }} quote={e.title} />
      </div>
    </article>
  );
}
