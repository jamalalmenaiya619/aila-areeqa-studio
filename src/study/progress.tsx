// Study progress: same shape and saving rules as the old Study Book.
// Saves to this browser at once (works offline) and to the account 900 ms after the last change.
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useSession } from "../lib/session";
import type { LessonState, StudyState } from "../lib/store";
import { LESSONS } from "../lib/content";

const LS_KEY = "aila-study-v1"; // same key as the old page
export const IMPORT_FILE = "progress-export-2026-11-01.json";
type Ctx = { state: StudyState; L: (id: string) => LessonState; save: () => void; ready: boolean; status: string };
const C = createContext<Ctx | null>(null);
export const useProgress = () => { const c = useContext(C); if (!c) throw new Error("No progress"); return c; };

const empty = (): StudyState => ({ lessons: {}, last: null, updatedAt: 0 });
const readLocal = (): StudyState => { try { const s = JSON.parse(localStorage.getItem(LS_KEY) || "null"); if (s && s.lessons) return s; } catch { /* ignore */ } return empty(); };

/** Loads the one-time export (Lessons 1-4 done, Lesson 5 at slide 5) into the owner's account if it has no progress yet. */
async function loadExport(): Promise<StudyState> {
  const mod = await import("../../data/studybook/progress-export-2026-11-01.json");
  const raw = JSON.parse(JSON.stringify(mod.default)) as Omit<StudyState, "updatedAt"> & { updatedAt?: number };
  return { ...raw, updatedAt: raw.updatedAt || Date.parse("2026-11-01T00:00:00Z") } as StudyState;
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  const { store, user } = useSession();
  const stateRef = useRef<StudyState>(readLocal());
  const [, force] = useState(0);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState("");
  const timer = useRef<number>();
  const remoteOk = useRef(false);

  const save = useCallback(() => {
    const st = stateRef.current;
    st.updatedAt = Date.now();
    try { localStorage.setItem(LS_KEY, JSON.stringify(st)); } catch { /* private window */ }
    force((n) => n + 1);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      if (!remoteOk.current) return;
      store.saveProgress(JSON.parse(JSON.stringify(stateRef.current))).then(() => setStatus(""), () => setStatus("Saved on this device. Will sync when you're back online."));
    }, 900);
  }, [store]);

  useEffect(() => {
    (async () => {
      let remote = await store.getProgress();
      if (!remote && user.roles.includes("owner")) {
        const imported = await loadExport();
        await store.saveProgress(imported, IMPORT_FILE);
        remote = { state: imported, imported_from: IMPORT_FILE };
      }
      remoteOk.current = true;
      const local = stateRef.current;
      if (remote?.state?.lessons && (remote.state.updatedAt || 0) >= (local.updatedAt || 0)) {
        stateRef.current = JSON.parse(JSON.stringify(remote.state));
        try { localStorage.setItem(LS_KEY, JSON.stringify(stateRef.current)); } catch { /* ignore */ }
      } else if (local.updatedAt) {
        await store.saveProgress(JSON.parse(JSON.stringify(local)));
      }
    })().catch(() => setStatus("Couldn't reach your account. Progress is saved on this device for now."))
      .finally(() => { setReady(true); force((n) => n + 1); });
    const flush = () => { if (remoteOk.current) store.saveProgress(JSON.parse(JSON.stringify(stateRef.current))).catch(() => {}); };
    const onHide = () => { if (document.visibilityState === "hidden") flush(); };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, [store, user]);

  const L = useCallback((id: string) => (stateRef.current.lessons[id] ||= { slide: 0, quiz: {}, checks: {}, notes: {}, done: false }), []);
  return <C.Provider value={{ state: stateRef.current, L, save, ready, status }}>{children}</C.Provider>;
}

export function quizScore(lessonId: string, st: StudyState) {
  const lesson = LESSONS.find((l) => l.id === lessonId)!;
  const ls = st.lessons[lessonId] || { quiz: {} };
  let right = 0, total = 0;
  lesson.slides.forEach((s, i) => { if (s.type === "quiz" && !s.warm) { total++; if (ls.quiz && ls.quiz[i] === s.answer) right++; } });
  return { right, total };
}
