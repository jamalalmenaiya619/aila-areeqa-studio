// The shell: top bar with the wordmark, tabs, light/dark switch and the user menu.
import { useEffect, useState } from "react";
import { BrowserRouter, NavLink, Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { SessionProvider, useSession } from "./lib/session";
import { applyTheme, isDark, readTheme, type Theme } from "./lib/theme";
import { ProgressProvider, useProgress } from "./study/progress";
import { StudyHome } from "./study/StudyHome";
import { LessonPage } from "./study/Lesson";
import { Library } from "./study/Library";
import { Notes } from "./study/Notes";
import { CheckinCard } from "./study/Checkin";
import { IntelPage } from "./intel/Intel";
import { Home } from "./pages/Home";
import { Placeholder } from "./pages/Placeholder";

const TABS = [
  { to: "/", label: "Home", end: true }, { to: "/intel", label: "Intel" }, { to: "/study", label: "Study" },
  { to: "/collections", label: "Collections" }, { to: "/tech-packs", label: "Tech Packs" }, { to: "/marketing", label: "Marketing" },
];

function ThemeSwitch() {
  const [t, setT] = useState<Theme>(readTheme());
  useEffect(() => applyTheme(t), [t]);
  const dark = t === "dark" || (t === "system" && isDark());
  return <button className="shell-icon-btn" onClick={() => setT(dark ? "light" : "dark")} aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}>{dark ? "Light" : "Dark"}</button>;
}

function UserMenu() {
  const { user, store, testMode } = useSession();
  const [open, setOpen] = useState(false);
  return (
    <div className="user-menu">
      <button className="shell-icon-btn" aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen(!open)}>{user.email.split("@")[0] || "Account"}</button>
      {open && (
        <div className="user-pop" role="menu">
          <div className="mono-label">{user.email}</div>
          <div className="muted">Role: {user.roles.join(", ") || "none yet"}{testMode ? " · test mode" : ""}</div>
          <button role="menuitem" className="ui-btn ui-btn-ghost" onClick={async () => { await store.signOut(); location.href = "/login"; }}>Log out</button>
        </div>
      )}
    </div>
  );
}

function Shell() {
  const loc = useLocation();
  const inLesson = /^\/study\/l\d+/.test(loc.pathname);
  const { status } = useProgress();
  return (
    <div className="shell">
      <header className="topbar">
        <div className="topbar-in">
          <NavLink to="/" className="wordmark" aria-label="A'ila Areeqa Studio, home">A'ila Areeqa<span className="wordmark-sub">Studio</span></NavLink>
          <nav className="tabs" aria-label="Main">{TABS.map((t) => <NavLink key={t.to} to={t.to} end={t.end}>{t.label}</NavLink>)}</nav>
          <div className="topbar-tools"><ThemeSwitch /><UserMenu /></div>
        </div>
      </header>
      {status && <div className="sync-note" role="status">{status}</div>}
      {loc.pathname.startsWith("/study") && !inLesson && (
        <nav className="study-nav" aria-label="Study">
          <NavLink to="/study" end>Study Book</NavLink><NavLink to="/study/library">Library</NavLink><NavLink to="/study/notes">Notes</NavLink><NavLink to="/study/check-in">Check-in</NavLink>
        </nav>
      )}
      <Outlet />
    </div>
  );
}

function StudyBook({ children }: { children: React.ReactNode }) { return <div className="sb">{children}</div>; }
function Ready({ children }: { children: React.ReactNode }) {
  const { ready } = useProgress();
  return ready ? <>{children}</> : <div className="shell-msg"><p className="mono">Loading your progress…</p></div>;
}

export default function App() {
  return (
    <SessionProvider>
      <ProgressProvider>
        <BrowserRouter>
          <Ready>
            <Routes>
              <Route element={<Shell />}>
                <Route index element={<Home />} />
                <Route path="intel" element={<IntelPage />} />
                <Route path="intel/:tab" element={<IntelPage />} />
                <Route path="intel/s/:season/:tab" element={<IntelPage />} />
                <Route path="study" element={<StudyBook><StudyHome /></StudyBook>} />
                <Route path="study/library" element={<Library />} />
                <Route path="study/notes" element={<Notes />} />
                <Route path="study/check-in" element={<main className="page"><header className="page-head"><div className="ui-kicker">Study · Check-in</div><h1>Weekly check-in</h1></header><CheckinCard /></main>} />
                <Route path="study/:lessonId" element={<StudyBook><LessonPage /></StudyBook>} />
                <Route path="study/:lessonId/:n" element={<StudyBook><LessonPage /></StudyBook>} />
                <Route path="collections" element={<Placeholder page="collections" />} />
                <Route path="tech-packs" element={<Placeholder page="tech-packs" />} />
                <Route path="marketing" element={<Placeholder page="marketing" />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </Ready>
        </BrowserRouter>
      </ProgressProvider>
    </SessionProvider>
  );
}
