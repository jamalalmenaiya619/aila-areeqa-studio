// One slide, ported 1:1 from slideHTML() in legacy/studybook/index.html.
// Same slide types, same text, same class names; only fonts and colors come from the brand tokens.
import { useEffect, useRef, useState, type ReactNode } from "react";
import { PARTS, type Lesson, type Slide } from "../lib/content";
import { useSession } from "../lib/session";
import { NoteButton } from "../components/NoteButton";
import { Drawing, QattSVG, WeaveSVG } from "./drawings";
import { Fig, Srcs } from "./Figure";
import { quizScore, useProgress } from "./progress";
import { askCoach, coachParagraphs, COACH_ERR, COACH_FALLBACK } from "./coach";

export const PART_ORDER = ["warm", "story", "see", "design", "do", "quiz"];
const LETTERS = "ABCD";
export function partTotals(lesson: Lesson) {
  return PART_ORDER.filter((p) => lesson.slides.some((s) => s.part === p)).map((p) => ({
    p, ...PARTS[p], ...((lesson.parts || {})[p] || {}), first: lesson.slides.findIndex((s) => s.part === p),
  })) as { p: string; label: string; min: number; first: number }[];
}
const Kick = ({ s, extra = "" }: { s: Slide; extra?: string }) => <div className="mono kicker">{s._pl || PARTS[s.part].label}{extra}</div>;
type Ref = { img?: string; svg?: string; cap: string; label?: string; title?: string };
const RefPic = ({ r, alt = "" }: { r: Ref; alt?: string }) => (r.svg ? <Drawing name={r.svg} /> : <img src={`/img/${r.img}.jpg`} alt={alt} />);

export type SlideProps = { lesson: Lesson; s: Slide; i: number; jump: (k: number) => void; zoom: (r: Ref) => void };

export function SlideView(props: SlideProps) {
  const { lesson, s, i } = props;
  const body = <SlideBody {...props} />;
  return (
    <>
      {body}
      <div className="slide-tools"><NoteButton source={{ kind: "slide", ref: `${lesson.id}/${i + 1}`, label: `Lesson ${lesson.num}, slide ${i + 1}`, href: `/study/${lesson.id}/${i + 1}` }} quote={slideQuote(s)} /></div>
    </>
  );
}
function slideQuote(s: Slide): string {
  const t = s.title || s.q || s.kicker || "";
  const extra = s.takeaway || (Array.isArray(s.text) ? s.text[0] : s.text) || s.why || "";
  return [t, extra].filter(Boolean).join(": ");
}

function SlideBody({ lesson, s, i, jump, zoom }: SlideProps) {
  const { state, L, save } = useProgress();
  const st = L(lesson.id);
  const set = (fn: () => void) => { fn(); save(); };
  switch (s.type) {
    case "cover": {
      const pt = partTotals(lesson);
      return (
        <div className="cover"><div><div className="mono kicker">{s.kicker}</div><h2>{s.title}</h2><p>{s.text}</p>
          <ul className="plan">{pt.map((p) => <li key={p.p}><span>{p.label}</span><span>{p.min} min</span></li>)}</ul></div>
          <Fig k={s.img} caption={s.coverCaption || "Sand dunes northeast of Riyadh."} /></div>
      );
    }
    case "quiz": {
      const picked = st.quiz[i];
      const answered = picked !== undefined;
      const guess = s.warm && !s.review;
      let fb: ReactNode = null;
      if (answered) {
        fb = picked === s.answer
          ? <div className="why ok"><b>Right: {LETTERS[picked]}.</b>{s.why}</div>
          : <div className="why miss"><b>{guess ? "Good guess, but no." : "Not quite."} You picked {LETTERS[picked]}.</b>{s.whys && s.whys[picked] ? <p className="mistake">{s.whys[picked]}</p> : null}
              <p className="fix"><span className="mono">The answer is {LETTERS[s.answer]}</span> {s.why}</p></div>;
      }
      const pick = (k: number) => set(() => {
        st.quiz[i] = k;
        const qs = lesson.slides.map((x, n) => [x, n] as const).filter(([x]) => x.type === "quiz" && !x.warm);
        if (qs.every(([, n]) => st.quiz[n] !== undefined)) st.best = Math.max(st.best ?? 0, quizScore(lesson.id, state).right);
      });
      const inner = (
        <>
          <Kick s={s} extra={s.review ? ` · from Lesson ${s.review}` : guess ? " · guess before you learn" : ""} /><h2>{s.q}</h2>
          <div className="opts">{s.options.map((o: string, k: number) => (
            <button key={k} className={`opt ${answered && k === s.answer ? "right" : answered && k === picked ? "wrong" : ""}`} data-pick={k} disabled={answered} onClick={() => pick(k)}>
              <span className="k">{LETTERS[k]}</span><span>{o}</span></button>))}</div>
          {answered ? <>{fb}<Srcs list={s.src} /></> : <p style={{ color: "var(--ink-soft)" }}>Pick one to see the answer.</p>}
        </>
      );
      if (!s.hint) return <div className="quiz">{inner}</div>;
      return (
        <div className="split quizsplit"><div className="hintbox"><span className="mono">Hint</span>{s.hint.svg ? <Drawing name={s.hint.svg} /> : <img src={`/img/${s.hint.img}.jpg`} alt="Hint picture" />}<p>{s.hint.cap || ""}</p></div>
          <div className="txt quiz">{inner}</div></div>
      );
    }
    case "story": {
      const inner = (
        <>
          <Kick s={s} /><h2>{s.title}{s.arabic ? <> <span className="ar">{s.arabic}</span></> : null}</h2>
          {s.text.map((t: string, k: number) => <p key={k}>{t}</p>)}
          {s.facts ? <div className="facts">{s.facts.map(([a, b]: string[], k: number) => <div key={k}><b>{a}</b><span>{b}</span></div>)}</div> : null}
          {s.note ? <div className="takeaway"><p>{s.note}</p></div> : null}
          <Srcs list={s.src} />
        </>
      );
      if (s.svg) return <div className="split"><figure><div className="frame svgframe"><Drawing name={s.svg} /></div><figcaption>{s.caption || ""}</figcaption></figure><div className="txt">{inner}</div></div>;
      return s.img ? <div className="split"><Fig k={s.img} caption={s.caption} /><div className="txt">{inner}</div></div> : <div className="solo">{inner}</div>;
    }
    case "weave":
    case "svgtoggle": {
      const modes = Object.keys(s.modes);
      const cur = (st.checks["t" + i] as string) || modes[0];
      const m = s.modes[cur];
      return (
        <div className="split">
          {s.type === "weave"
            ? <div className="frame weavebox"><WeaveSVG rule={m.rule} label={cur} /><p className="legend"><span className="sw warp"></span>lengthwise thread (warp) on top <span className="sw weft"></span>crosswise thread (weft) on top</p></div>
            : <div className="weavebox"><Drawing name={m.svg} /></div>}
          <div className="txt"><Kick s={s} /><h2>{s.title}</h2><p>{s.intro}</p>
            <Seg modes={modes} cur={cur} onPick={(k) => set(() => { st.checks["t" + i] = k; })} />
            <p><b>{m.how}</b></p><table className="kit"><tbody>{m.items.map((r: string[], k: number) => <tr key={k}><td>{r[0]}</td><td colSpan={2}>{r[1]}</td></tr>)}</tbody></table><Srcs list={s.src} /></div>
        </div>
      );
    }
    case "toggle": {
      const modes = Object.keys(s.modes);
      const cur = (st.checks["t" + i] as string) || modes[0];
      const m = s.modes[cur];
      return (
        <div className="split"><Fig k={m.img} caption={m.cap || (cur === "Summer" ? "Summer heat: sand dunes northeast of Riyadh." : "Winter cold: camels in snow, Tabuk.")} />
          <div className="txt"><Kick s={s} /><h2>{s.title}</h2><p>{s.intro}</p>
            <Seg modes={modes} cur={cur} onPick={(k) => set(() => { st.checks["t" + i] = k; })} />
            <table className="kit"><tbody>{m.items.map((r: string[], k: number) => <tr key={k}><td>{r[0]}</td><td>{r[1]}</td><td>{r[2]}</td></tr>)}</tbody></table><Srcs list={s.src} /></div></div>
      );
    }
    case "gallery":
      return (
        <><Kick s={s} /><h2>{s.title}</h2><p>{s.intro}</p>
          <div className="gallery">{s.refs.map((r: Ref, k: number) => (
            <button key={k} className="gcard" data-zoom={k} aria-label={`Enlarge: ${r.cap}`} onClick={() => zoom(r)}>
              <span className="gimg"><RefPic r={r} /></span>
              <span className="mono">{r.label || ""}</span><b>{r.title || ""}</b><span className="gcap">{r.cap}</span></button>))}</div></>
      );
    case "brief": {
      const rows = lesson.slides.map((x, k) => ({ x, k })).filter(({ x }) => x.type === "task" && x.flow);
      const filled = rows.filter(({ k }) => (st.notes[k] || "").trim()).length;
      return (
        <><Kick s={s} /><h2>{s.title}</h2><p>{s.intro}</p>
          <div className="brief"><div className="briefhead"><span className="mono">A'ila Areeqa · garment brief · draft</span><span className="mono">{filled} of {rows.length} steps filled</span></div>
            {rows.map(({ x, k }, n) => (
              <div className="briefrow" key={k}><span className="mono">{n + 1}. {x.flow}</span>
                <p>{(st.notes[k] || "").trim() ? st.notes[k] : <em>Not filled yet. Go back to "{x.title}".</em>}</p>
                <button className="linkbtn" data-jump={k} onClick={() => jump(k)}>Edit</button></div>))}</div>
          <p style={{ marginTop: 14, color: "var(--ink-soft)" }}>{s.note || ""}</p></>
      );
    }
    case "builder": {
      const on = (st.checks["b" + i] as boolean[]) || s.layers.map(() => true);
      const mono = !!st.checks["m" + i];
      return (
        <div className="split"><div className="weavebox"><QattSVG on={on} mono={mono} /></div>
          <div className="txt"><Kick s={s} /><h2>{s.title}</h2><p>{s.intro}</p>
            <div className="checks">{s.layers.map((l: string[], k: number) => (
              <label key={k} className={on[k] ? "ok" : ""}><input type="checkbox" id={`b-${lesson.id}-${i}-${k}`} data-layer={k} checked={!!on[k]}
                onChange={(e) => set(() => { const arr = ((st.checks["b" + i] as boolean[]) || s.layers.map(() => true)).slice(); arr[k] = e.target.checked; st.checks["b" + i] = arr; })} />
                <span><b>{l[0]}</b> {l[1]}</span></label>))}</div>
            <div className="seg" role="tablist">
              <button role="tab" className={!mono ? "on" : ""} data-mono="0" onClick={() => set(() => { st.checks["m" + i] = false; })}>Asir colors</button>
              <button role="tab" className={mono ? "on" : ""} data-mono="1" onClick={() => set(() => { st.checks["m" + i] = true; })}>A'ila Areeqa: two quiet colors</button></div>
            <p>{mono ? s.monoNote : s.colorNote}</p><Srcs list={s.src} /></div></div>
      );
    }
    case "ladder": {
      const max = Math.max(...s.rows.map((r: any[]) => r[1]));
      return (
        <><Kick s={s} /><h2>{s.title}</h2><p>{s.intro}</p>
          <div className="ladder" role="img" aria-label={s.title}>{s.rows.map(([name, v, note, hl]: [string, number, string, boolean], k: number) => (
            <div key={k} className={`lrow ${hl ? "hl" : ""}`}><span className="lname">{name}</span>
              <span className="lbar"><i style={{ width: `${(v / max) * 100}%` }}></i></span><span className="lval">{note}</span></div>))}</div>
          <p className="axis mono">Bar length = fiber width in microns (µm, one thousandth of a millimeter). Shorter bar = thinner, softer fiber.</p>
          {s.note ? <div className="takeaway"><p>{s.note}</p></div> : null}<Srcs list={s.src} /></>
      );
    }
    case "compare":
      return (
        <><Kick s={s} /><h2>{s.title}</h2>
          <div className="pair">{[s.left, s.right].map((x: any, k: number) => (
            <div key={k}><span className="mono tag">{x.label}</span>{x.svg
              ? <figure><div className="frame svgframe"><Drawing name={x.svg} /></div><figcaption>{x.caption}</figcaption></figure>
              : <Fig k={x.img} caption={x.caption} />}</div>))}</div>
          <div className="takeaway"><p>{s.takeaway}</p></div><Srcs list={s.src} /></>
      );
    case "reveal": {
      const shown = !!st.checks["r" + i];
      return (
        <div className="split"><Fig k={s.img} caption={shown ? "Revealed. See the answer." : "Mystery photo."} />
          <div className="txt"><Kick s={s} /><h2>{s.title}</h2><p>{s.prompt}</p>
            {shown ? <div className="answer">{s.answer}</div> : <button className="btn reveal-btn" data-reveal onClick={() => set(() => { st.checks["r" + i] = true; })}>Reveal the answer</button>}
            {shown ? <Srcs list={s.src} /> : null}</div></div>
      );
    }
    case "steps":
      return (
        <div className="split"><Fig k={s.img} caption={s.caption} />
          <div className="txt"><Kick s={s} /><h2>{s.title}</h2><p>{s.intro}</p>
            <div className="mono" style={{ marginTop: 14 }}>The seven stages</div><ol className="steps">{s.steps.map((x: string, k: number) => <li key={k}><span>{x}</span></li>)}</ol>
            <div className="facts">{s.facts.map(([a, b]: string[], k: number) => <div key={k}><b>{a}</b><span>{b}</span></div>)}</div><Srcs list={s.src} /></div></div>
      );
    case "layers":
      return (
        <><Kick s={s} /><h2>{s.title}</h2><p>{s.intro}</p>
          <div className="layers">{s.layers.map(([a, b, lab]: string[], k: number) => (
            <div className="layer" key={k}><div><span className="lv">{lab ? lab : `Layer ${k + 1}${k === 0 ? " · next to skin" : k === s.layers.length - 1 ? " · outside" : ""}`}</span><b>{a}</b></div><div>{b}</div></div>))}</div>
          {s.note ? <div className="takeaway"><p>{s.note}</p></div> : null}<Srcs list={s.src} /></>
      );
    case "design":
      return (
        <div className="split design"><div className="frame" style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 4, padding: 16 }}><Drawing name={s.svg} /></div>
          <div className="txt"><Kick s={s} /><h2>{s.title}</h2><p>{s.text}</p><ul className="how">{s.how.map((h: string, k: number) => <li key={k}>{h}</li>)}</ul>
            <p style={{ marginTop: 14, fontSize: 14, color: "var(--ink-soft)" }}>These are design ideas, not historical facts.</p></div></div>
      );
    case "task":
      return <Task lesson={lesson} s={s} i={i} zoom={zoom} />;
    case "score": {
      const q = quizScore(lesson.id, state);
      const best = st.best ?? null;
      const rows = lesson.slides.map((x, k) => ({ x, k })).filter(({ x }) => x.type === "quiz" && !x.warm);
      const retake = () => {
        st.best = Math.max(st.best ?? 0, q.right);
        lesson.slides.forEach((x, k) => { if (x.type === "quiz" && !x.warm) delete st.quiz[k]; });
        save();
        jump(lesson.slides.findIndex((x) => x.type === "quiz" && !x.warm));
      };
      return (
        <><Kick s={s} /><h2>Your score</h2>
          <div className="bigscore"><b>{q.right}</b><span>of {q.total} right</span>{best !== null ? <span className="mono">Best: {best} of {q.total}</span> : null}</div>
          <ol className="review">{rows.map(({ x, k }) => {
            const p = st.quiz[k]; const ok = p === x.answer; const none = p === undefined;
            return (
              <li key={k} className={none ? "" : ok ? "ok" : "no"}><b>{none ? "Skipped" : ok ? "Right" : "Missed"}</b> {x.q}
                {!none && !ok ? <p>You picked "{x.options[p]}". {x.whys && x.whys[p] ? x.whys[p] + " " : ""}The answer is "{x.options[x.answer]}": {x.why}</p> : null}</li>
            );
          })}</ol>
          <button className="btn" data-retake onClick={retake}>Retake the quiz</button></>
      );
    }
    case "remember":
      return (
        <><Kick s={s} /><h2>{s.title}</h2>
          <div className="keep">{s.items.map(([a, b]: string[], k: number) => <div key={k}><span className="n">{k + 1}</span><div><b>{a}</b>{b}</div></div>)}</div>
          <p style={{ marginTop: 16, color: "var(--ink-soft)" }}>Tomorrow's warm-up will test you on these three.</p></>
      );
    case "video":
      return (
        <><Kick s={s} /><h2>{s.title}</h2>
          <div className="vids">{s.items.map(([t, u, w]: string[], k: number) => <a key={k} href={u} target="_blank" rel="noopener"><b>{t} ↗</b><span>{w}</span></a>)}</div>
          {s.note ? <p style={{ marginTop: 16, color: "var(--ink-soft)" }}>{s.note}</p> : null}</>
      );
  }
  return null;
}

function Seg({ modes, cur, onPick }: { modes: string[]; cur: string; onPick: (k: string) => void }) {
  return <div className="seg" role="tablist">{modes.map((k) => <button key={k} role="tab" aria-selected={k === cur} className={k === cur ? "on" : ""} data-mode={k} onClick={() => onPick(k)}>{k}</button>)}</div>;
}

export function CoachText({ text }: { text: string }) {
  return <>{coachParagraphs(text).map((parts, n) => <p key={n}>{parts.map((x, k) => ("b" in x ? <b key={k}>{x.b}</b> : x.t.split("\n").flatMap((line, j) => (j ? [<br key={k + "-" + j} />, line] : [line]))))}</p>)}</>;
}

function Task({ lesson, s, i, zoom }: { lesson: Lesson; s: Slide; i: number; zoom: (r: Ref) => void }) {
  const { L, save } = useProgress();
  const { accessToken } = useSession();
  const st = L(lesson.id);
  const ticks = (st.checks[i] as boolean[]) || [];
  const [note, setNote] = useState(st.notes[i] || "");
  const [saved, setSaved] = useState("");
  const [coach, setCoach] = useState<{ kind: "text" | "msg" | "thinking"; text: string } | null>(st.feedback && st.feedback[i] ? { kind: "text", text: st.feedback[i] } : null);
  const [busy, setBusy] = useState(false);
  const t = useRef<number>();
  useEffect(() => () => window.clearTimeout(t.current), []);

  async function checkAnswer() {
    const answer = (st.notes[i] || "").trim();
    if (!answer) { setCoach({ kind: "msg", text: "Type your answer first, then press Enter." }); return; }
    setBusy(true); setCoach({ kind: "thinking", text: "Reading your answer…" });
    try {
      const text = await askCoach({ lessonId: lesson.id, slide: i, answer }, (so) => setCoach({ kind: "text", text: so }), await accessToken());
      st.feedback = st.feedback || {}; st.feedback[i] = text; save();
      setCoach({ kind: "text", text });
    } catch (e) {
      setCoach({ kind: "msg", text: COACH_ERR[(e as { code?: string }).code || ""] || COACH_FALLBACK });
    } finally { setBusy(false); }
  }
  return (
    <div className="task"><Kick s={s} /><span className="mono mins">· {s.minutes} min</span><h2>{s.title}</h2><p>{s.text}</p>
      <div className="checks">{s.checklist.map((c: string, k: number) => (
        <label key={k} className={ticks[k] ? "ok" : ""}><input type="checkbox" id={`c-${lesson.id}-${i}-${k}`} data-tick={k} checked={!!ticks[k]}
          onChange={(e) => { const arr = ((st.checks[i] as boolean[]) || []).slice(); arr[k] = e.target.checked; st.checks[i] = arr; save(); }} /><span>{c}</span></label>))}</div>
      {s.refs && s.refs.length ? (
        <div className="refs"><span className="mono">Look back</span><div className="refrow">{s.refs.map((r: Ref, k: number) => (
          <button key={k} className="ref" data-zoom={k} aria-label={`Enlarge: ${r.cap}`} onClick={() => zoom(r)}>
            {r.svg ? <span className="refsvg"><Drawing name={r.svg} /></span> : <img src={`/img/${r.img}.jpg`} alt="" />}<span className="refcap">{r.cap}</span></button>))}</div></div>
      ) : null}
      <label className="mono" htmlFor={`n-${lesson.id}-${i}`}>Your answer</label>
      <textarea id={`n-${lesson.id}-${i}`} data-note placeholder={s.notePrompt} value={note}
        onChange={(e) => {
          setNote(e.target.value); st.notes[i] = e.target.value; window.clearTimeout(t.current); setSaved("Saving…");
          t.current = window.setTimeout(() => { save(); setSaved("Saved"); }, 500);
        }}
        onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); checkAnswer(); } }} />
      <div className="enterrow"><button className="btn" data-check disabled={busy} onClick={checkAnswer}>Enter: check my answer</button><span className="saved" id="saved">{saved}</span></div>
      <div className="coach" id="coach" hidden={!coach}>
        {coach?.kind === "text" ? <CoachText text={coach.text} /> : coach?.kind === "thinking" ? <p className="thinking">{coach.text}</p> : coach ? <p>{coach.text}</p> : null}
      </div>
    </div>
  );
}
