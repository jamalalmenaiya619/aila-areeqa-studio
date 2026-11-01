// The Study Book front page: resume box and the lesson cards. Ported from renderHome() in the legacy page.
import { useNavigate } from "react-router-dom";
import { LESSONS } from "../lib/content";
import { quizScore, useProgress } from "./progress";

const todayISO = () => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };

/** The lesson "Continue" should open, exactly as the old page picked it. */
export function nextLesson(state: ReturnType<typeof useProgress>["state"]) {
  const last = state.last ? LESSONS.find((l) => l.id === state.last) : undefined;
  const lastSt = last && state.lessons[last.id];
  const ready = LESSONS.filter((l) => l.ready);
  const next = last && lastSt && !lastSt.done ? last : ready.find((l) => !(state.lessons[l.id] || {}).done) || ready[ready.length - 1];
  const nst = state.lessons[next.id] || ({} as { slide?: number });
  return { next, slide: nst.slide || 0, started: (nst.slide || 0) > 0 };
}

export function StudyHome() {
  const { state } = useProgress();
  const nav = useNavigate();
  const { next, slide, started } = nextLesson(state);
  const open = (id: string) => { nav(`/study/${id}`); window.scrollTo(0, 0); };
  return (
    <main className="wrap home">
      <div className="mono">A'ila Areeqa · Study book · Oct 25–31</div>
      <h1>Heritage you can <em>wear</em>,<br />fabric you can <em>read</em>.</h1>
      <p className="lede">One lesson a day, about an hour each. Every lesson pairs a piece of Saudi heritage with a piece of fabric know-how, then turns both into a design move for the brand. Your answers, ticks and notes save as you go.</p>
      <div className="resume"><div className="txt"><span className="mono">{started ? "Pick up where you left off" : "Start here"}</span>
        <b>Lesson {next.num}: {next.title}</b>
        <span style={{ color: "var(--ink-soft)", fontSize: 14 }}>{started ? `Slide ${slide + 1} of ${next.slides.length}` : next.pair}</span></div>
        <button className="btn" data-open={next.id} onClick={() => open(next.id)}>{started ? "Continue" : "Start lesson"}</button></div>
      <div className="days">{LESSONS.map((l) => {
        const st = state.lessons[l.id] || ({} as { done?: boolean; slide?: number });
        const pct = l.ready ? Math.round(((st.done ? l.slides.length : (st.slide || 0)) / l.slides.length) * 100) : 0;
        const q = l.ready ? quizScore(l.id, state) : null;
        const label = !l.ready ? (l.date <= todayISO() ? "Arriving soon" : "Opens " + l.day.split(", ")[1]) : st.done ? `Done${q && q.total ? ` · quiz ${q.right}/${q.total}` : ""}` : pct ? pct + "% done" : "Ready";
        return (
          <button key={l.id} className="day" disabled={!l.ready} data-open={l.ready ? l.id : undefined} onClick={() => l.ready && open(l.id)}>
            <span className="mono state">{label}</span>
            <span className="n">{l.num}</span><span className="mono">{l.day}</span>
            <h3>{l.title}</h3><p>{l.pair}</p>
            {l.ready ? <div className="meter"><i style={{ width: `${pct}%` }}></i></div> : null}</button>
        );
      })}</div>
      <p className="credits">All photos are real and free to reuse, mostly from Wikimedia Commons, credited under each one. Facts link to their sources. New lessons arrive each morning.</p>
    </main>
  );
}
