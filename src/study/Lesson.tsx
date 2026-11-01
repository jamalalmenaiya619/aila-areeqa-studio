// The lesson player: top bar with part chips and the gold thread, one slide, Back / Next.
// Ported from render(), open(), go() and the keyboard handler in legacy/studybook/index.html.
import { useCallback, useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { lessonById } from "../lib/content";
import { Modal } from "../components/ui";
import { Drawing } from "./drawings";
import { useProgress } from "./progress";
import { PART_ORDER, partTotals, SlideView } from "./Slide";

type Ref = { img?: string; svg?: string; cap: string };

export function LessonPage() {
  const { lessonId = "", n } = useParams();
  const lesson = lessonById(lessonId);
  const nav = useNavigate();
  const { state, L, save } = useProgress();
  const [zoomed, setZoomed] = useState<Ref | null>(null);
  const total = lesson?.slides.length || 0;
  const fromUrl = n ? Math.max(0, Math.min(total - 1, (parseInt(n, 10) || 1) - 1)) : null;
  const slide = fromUrl ?? Math.min((lesson && L(lesson.id).slide) || 0, total - 1);

  // open(): remember the lesson and the slide, like the old page.
  useEffect(() => {
    if (!lesson || !lesson.ready) return;
    const st = L(lesson.id);
    if (state.last !== lesson.id || st.slide !== slide) { state.last = lesson.id; st.slide = slide; save(); }
    if (fromUrl === null) nav(`/study/${lesson.id}/${slide + 1}`, { replace: true });
  }, [lesson, slide]); // eslint-disable-line react-hooks/exhaustive-deps

  const goTo = useCallback((k: number) => { if (lesson) { nav(`/study/${lesson.id}/${k + 1}`); window.scrollTo(0, 0); } }, [lesson, nav]);
  const go = useCallback((delta: number) => {
    if (!lesson) return;
    const next = slide + delta;
    if (next < 0) return;
    if (next >= lesson.slides.length) { const st = L(lesson.id); st.done = true; st.slide = 0; save(); nav("/study"); window.scrollTo(0, 0); return; }
    goTo(next);
  }, [lesson, slide, L, save, nav, goTo]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const a = document.activeElement as HTMLElement | null;
      if (zoomed || document.querySelector("[role=dialog]") || (a && /TEXTAREA|INPUT|SELECT/.test(a.tagName))) return;
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [go, zoomed]);

  if (!lesson || !lesson.ready) return <Navigate to="/study" replace />;
  const s = lesson.slides[slide];
  const pt = partTotals(lesson);
  const curPartIdx = PART_ORDER.indexOf(s.part);
  const pct = ((slide + 1) / lesson.slides.length) * 100;
  return (
    <div className="lesson">
      <header className="top"><div className="wrap">
        <button className="home-btn" data-home onClick={() => { nav("/study"); window.scrollTo(0, 0); }}>← All lessons</button>
        <div className="ltitle">Lesson {lesson.num}: {lesson.title}</div>
        <nav className="parts" aria-label="Lesson parts">{pt.map((p) => (
          <button key={p.p} data-jump={p.first} onClick={() => goTo(p.first)} className={p.p === s.part ? "on" : PART_ORDER.indexOf(p.p) < curPartIdx ? "done" : ""}>{p.label} · {p.min}m</button>))}</nav>
      </div><div className="thread"><i style={{ width: `${pct}%` }}></i></div></header>
      <main className="wrap stage"><section className="slide" aria-live="polite" key={lesson.id + slide}>
        <SlideView lesson={lesson} s={s} i={slide} jump={goTo} zoom={setZoomed} />
      </section></main>
      <footer className="nav"><div className="wrap">
        <button className="btn ghost" data-go="-1" disabled={slide === 0} onClick={() => go(-1)}>← Back</button>
        <span className="mono count">{slide + 1} / {lesson.slides.length} <span className="hint">· arrow keys work</span></span>
        <button className="btn" data-go="1" onClick={() => go(1)}>{slide === lesson.slides.length - 1 ? "Finish lesson" : "Next →"}</button>
      </div></footer>
      <Modal open={!!zoomed} onClose={() => setZoomed(null)} label={zoomed?.cap || ""}>
        {zoomed && <>{zoomed.svg ? <Drawing name={zoomed.svg} /> : <img src={`/img/${zoomed.img}.jpg`} alt={zoomed.cap} />}<p>{zoomed.cap}</p>
          <button className="btn" data-close onClick={() => setZoomed(null)}>Close</button></>}
      </Modal>
    </div>
  );
}
