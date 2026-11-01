// Notes: free notes with tags, plus "My answers" (every task answer and coaching reply, by lesson).
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { LESSONS } from "../lib/content";
import { useSession } from "../lib/session";
import type { Note } from "../lib/store";
import { Button, Tabs } from "../components/ui";
import { useProgress } from "./progress";
import { CoachText } from "./Slide";

export function useNotes() {
  const { store } = useSession();
  const [notes, setNotes] = useState<Note[] | null>(null);
  const [err, setErr] = useState("");
  const reload = () => store.listNotes().then(setNotes, () => setErr("Couldn't load your notes. Reload to try again."));
  useEffect(() => { reload(); }, [store]); // eslint-disable-line react-hooks/exhaustive-deps
  return { notes, err, reload };
}

export function NoteEditor({ note, onSaved, onCancel }: { note?: Note; onSaved: () => void; onCancel?: () => void }) {
  const { store } = useSession();
  const [body, setBody] = useState(note?.body || "");
  const [tags, setTags] = useState((note?.tags || []).join(", "));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const save = async () => {
    setBusy(true); setErr("");
    try {
      await store.saveNote({ id: note?.id, body: body.trim(), tags: tags.split(",").map((t) => t.trim()).filter(Boolean), source: note?.source ?? null });
      if (!note) { setBody(""); setTags(""); }
      onSaved();
    } catch { setErr("Couldn't save. Try again."); } finally { setBusy(false); }
  };
  return (
    <div className="note-editor">
      <textarea aria-label="Note" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write a note…" />
      <input className="ui-input" aria-label="Tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Tags, separated by commas" />
      <div className="row-gap"><Button onClick={save} disabled={busy || !body.trim()}>{note ? "Save changes" : "Add note"}</Button>
        {onCancel && <Button variant="ghost" onClick={onCancel}>Cancel</Button>}{err && <span className="err">{err}</span>}</div>
    </div>
  );
}

export function NoteItem({ n, onChange }: { n: Note; onChange: () => void }) {
  const { store } = useSession();
  const [editing, setEditing] = useState(false);
  if (editing) return <li className="note"><NoteEditor note={n} onSaved={() => { setEditing(false); onChange(); }} onCancel={() => setEditing(false)} /></li>;
  return (
    <li className="note" data-note-id={n.id}>
      <p className="note-body">{n.body}</p>
      <div className="note-meta">
        <span className="mono-label">{new Date(n.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
        {n.source && <Link to={n.source.href}>From {n.source.label}</Link>}
        {n.tags.map((t) => <span key={t} className="note-tag">{t}</span>)}
        <button className="ui-btn ui-btn-link" onClick={() => setEditing(true)}>Edit</button>
        <button className="ui-btn ui-btn-link" onClick={async () => { if (confirm("Delete this note?")) { await store.deleteNote(n.id); onChange(); } }}>Delete</button>
      </div>
    </li>
  );
}

export function Notes() {
  const [tab, setTab] = useState<"notes" | "answers">("notes");
  const { notes, err, reload } = useNotes();
  const [q, setQ] = useState("");
  const shown = useMemo(() => (notes || []).filter((n) => !q || (n.body + " " + n.tags.join(" ") + " " + (n.source?.label || "")).toLowerCase().includes(q.toLowerCase())), [notes, q]);
  return (
    <main className="page">
      <header className="page-head"><div className="ui-kicker">Study · Notes</div><h1>Notes</h1></header>
      <Tabs className="sub-tabs" label="Notes views" current={tab} onChange={setTab} tabs={[{ id: "notes", label: "My notes" }, { id: "answers", label: "My answers" }]} />
      {tab === "notes" ? (
        <>
          <NoteEditor onSaved={reload} />
          <input className="ui-input lib-search" type="search" aria-label="Search notes" placeholder="Search notes and tags" value={q} onChange={(e) => setQ(e.target.value)} />
          {err && <p className="err">{err}</p>}
          {notes === null ? <p className="mono-label">Loading…</p> : shown.length ? <ul className="notes">{shown.map((n) => <NoteItem key={n.id} n={n} onChange={reload} />)}</ul>
            : <p className="muted">{notes.length ? "No notes match." : "No notes yet. Use \"Save to notes\" on any slide, Library card or Intel card."}</p>}
        </>
      ) : <MyAnswers />}
    </main>
  );
}

function MyAnswers() {
  const { state } = useProgress();
  const groups = LESSONS.map((l) => {
    const st = state.lessons[l.id];
    const rows = l.slides.map((s, i) => ({ s, i })).filter(({ s, i }) => s.type === "task" && st && ((st.notes[i] || "").trim() || (st.feedback && st.feedback[i])));
    return { l, st, rows };
  }).filter((g) => g.rows.length);
  if (!groups.length) return <p className="muted">No task answers yet.</p>;
  return (
    <div className="answers">{groups.map(({ l, st, rows }) => (
      <section key={l.id}><h2 className="section-title">Lesson {l.num}: {l.title}</h2>
        {rows.map(({ s, i }) => (
          <article key={i} className="ui-card answer-card">
            <div className="ui-kicker">Slide {i + 1} · <Link to={`/study/${l.id}/${i + 1}`}>Open the task</Link></div>
            <h3 className="ui-card-title">{s.title}</h3>
            <span className="mono-label">Your answer</span><p className="pre">{(st!.notes[i] || "").trim() || "No answer typed."}</p>
            {st!.feedback && st!.feedback[i] && <><span className="mono-label">Coaching</span><div className="coach-reply"><CoachText text={st!.feedback[i]} /></div></>}
          </article>))}
      </section>))}
    </div>
  );
}
