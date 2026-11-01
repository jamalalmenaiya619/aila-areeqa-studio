// Home, simple version: real data only.
import { Link } from "react-router-dom";
import { INTEL, LESSONS, RUNS, fmtDate } from "../lib/content";
import { textOf } from "../lib/safe-html";
import { Card } from "../components/ui";
import { useProgress } from "../study/progress";
import { nextLesson } from "../study/StudyHome";
import { NoteEditor, NoteItem, useNotes } from "../study/Notes";

/** First two sentences of a paragraph. */
export function firstSentences(text: string, n = 2) {
  const parts = text.match(/[^.!?]+(?:[.!?]+(?=\s|$)|$)/g) || [text];
  return parts.slice(0, n).join("").trim();
}

export function Home() {
  const { state } = useProgress();
  const { next, slide, started } = nextLesson(state);
  const ready = LESSONS.filter((l) => l.ready);
  const done = ready.filter((l) => state.lessons[l.id]?.done).length;
  const latest = RUNS[RUNS.length - 1];
  const { notes, reload } = useNotes();
  return (
    <main className="page home-page">
      <header className="page-head"><div className="ui-kicker">A'ila Areeqa Studio</div><h1>Today</h1></header>
      <div className="home-grid">
        <Card className="home-intel" kicker={`Intel · Run ${latest.run} · ${fmtDate(latest.date)}`} title="This run's verdict"
          footer={<Link to="/intel/overview">Open Intel</Link>}>
          <p>{firstSentences(textOf(INTEL.verdict.html))}</p>
          <span className="mono-label">The newest calls</span>
          <ol className="home-calls">{latest.calls.slice(0, 3).map((c, k) => <li key={k}>{textOf(c)}</li>)}</ol>
        </Card>
        <Card className="home-study" kicker={`Study · ${done} of ${ready.length} lessons done`} title={`Lesson ${next.num}: ${next.title}`}
          footer={<Link className="ui-btn ui-btn-solid" to={`/study/${next.id}`}>{started ? `Continue where you left off · slide ${slide + 1}` : "Start lesson"}</Link>}>
          <p className="muted">{next.pair}</p>
          <div className="meter"><i style={{ width: `${Math.round((done / ready.length) * 100)}%` }} /></div>
        </Card>
        <Card className="home-notes" kicker="Notes" title="Latest notes" footer={<Link to="/study/notes">All notes</Link>}>
          <NoteEditor onSaved={reload} />
          {notes && notes.length > 0 ? <ul className="notes">{notes.slice(0, 5).map((n) => <NoteItem key={n.id} n={n} onChange={reload} />)}</ul> : <p className="muted">{notes ? "No notes yet." : "Loading…"}</p>}
        </Card>
        <div className="home-soon">
          <Card kicker="Coming in Phase 3" title={<Link to="/collections">Collections</Link>}><p className="muted">Every drop, with its story, photos and what led to it.</p></Card>
          <Card kicker="Coming in Phase 4" title={<Link to="/tech-packs">Tech Packs</Link>}><p className="muted">Turn a design into something a factory can make.</p></Card>
          <Card kicker="Coming in Phase 5" title={<Link to="/marketing">Marketing</Link>}><p className="muted">A launch plan for each drop.</p></Card>
        </div>
      </div>
    </main>
  );
}
