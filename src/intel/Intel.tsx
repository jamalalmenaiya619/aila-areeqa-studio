// Intel: the Battlefield page rebuilt from /content/intel. Same tabs, order, cards, tags, tables and price ladder.
import { useEffect } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { fmtDate, INTEL, LATEST_RUN, REPORT_COUNT, RUNS, type IntelBlock, type IntelPanel } from "../lib/content";
import { Inline, textOf } from "../lib/safe-html";
import { NoteButton } from "../components/NoteButton";
import { PriceLadder, Table, Tabs, Tag } from "../components/ui";

const TAB_KEY = "awtab"; // same key the old page used

export function seasonTabs(seasonId: string) {
  return (INTEL.seasons.find((s) => s.id === seasonId) || INTEL.seasons[0]).tabs;
}
/** Tabs in the legacy order, with the chosen season's tabs where "@season" sits. */
export function intelTabs(seasonId: string): IntelPanel[] {
  return INTEL.tabOrder.flatMap((id) => (id === "@season" ? seasonTabs(seasonId) : id === "log" ? [INTEL.log] : INTEL.panels.filter((p) => p.id === id)));
}

function Blocks({ blocks, panel }: { blocks: IntelBlock[]; panel: IntelPanel }) {
  return <>{blocks.map((b: IntelBlock, i: number) => <Block key={i} b={b} panel={panel} />)}</>;
}
function Block({ b, panel }: { b: IntelBlock; panel: IntelPanel }) {
  switch (b.t) {
    case "h2": return <h2>{b.text}</h2>;
    case "h3": return <h3>{b.text ? <Inline html={b.text} /> : null}{b.tags.map((t: { kind: string; label: string }, k: number) => <Tag key={k} kind={t.kind}>{t.label}</Tag>)}</h3>;
    case "p": return <p className={b.note ? "note" : undefined}><Inline html={b.html} /></p>;
    case "ul": return <ul>{b.items.map((h: string, k: number) => <li key={k}><Inline html={h} /></li>)}</ul>;
    case "calls": return (
      <div className="calls">{b.cards.map((c: { tags: { kind: string; label: string }[]; title: string; html: string }, k: number) => (
        <div className="call" key={k}>{c.tags.map((t, j) => <Tag key={j} kind={t.kind}>{t.label}</Tag>)}<h4>{c.title}</h4><p><Inline html={c.html} /></p>
          <div className="call-tools"><NoteButton source={{ kind: "intel", ref: `run-${LATEST_RUN.run}/${panel.id}/${c.title}`, label: `Intel Run ${LATEST_RUN.run}: ${c.title}`, href: `/intel/${panel.id}` }} quote={`${c.title}: ${textOf(c.html)}`} /></div>
        </div>))}</div>
    );
    case "table": return (
      <Table className={b.className} head={b.head} rows={b.rows.map((r: { html: string; kind?: string; num?: boolean }[]) => ({
        cells: r.map((c) => ({ content: <Inline html={c.html} />, className: [c.kind ? "t-" + c.kind : "", c.num ? "num" : ""].filter(Boolean).join(" ") || undefined })),
      }))} />
    );
    case "price": return <PriceLadder items={b.items} />;
    case "cols": return <div className="cols">{b.cols.map((col: IntelBlock[], k: number) => <div key={k}><Blocks blocks={col} panel={panel} /></div>)}</div>;
  }
  return null;
}

function TrendLog() {
  return (
    <Table className="log" head={["Run", "Date", "Status", "Key calls"]} rows={RUNS.slice().reverse().map((r) => ({
      key: r.run,
      cells: [
        { content: "R" + String(r.run).padStart(2, "0") },
        { content: r.date, className: "num" },
        { content: r.status },
        { content: <ul>{r.calls.map((c, k) => <li key={k}><Inline html={c} /></li>)}</ul> },
      ],
    }))} />
  );
}

export function IntelPage() {
  const { tab, season: seasonParam } = useParams();
  const nav = useNavigate();
  const season = seasonParam || INTEL.currentSeason;
  const tabs = intelTabs(season);
  const reports = tab === "reports";
  let saved = "overview";
  try { saved = localStorage.getItem(TAB_KEY) || "overview"; } catch { /* ignore */ }
  const current = reports ? "reports" : tab && tabs.some((t) => t.id === tab) ? tab : null;
  useEffect(() => { if (current && current !== "reports") try { localStorage.setItem(TAB_KEY, current); } catch { /* ignore */ } }, [current]);
  if (!current) return <Navigate to={`${season === INTEL.currentSeason ? "/intel" : `/intel/s/${season}`}/${tabs.some((t) => t.id === saved) ? saved : "overview"}`} replace />;
  const panel = tabs.find((t) => t.id === current);
  const base = season === INTEL.currentSeason ? "/intel" : `/intel/s/${season}`;
  const show = (id: string) => nav(`${base}/${id}`);
  return (
    <div className="intel">
      <div className="wrap">
        <header className="mast">
          <div>
            <div className="eyebrow">{INTEL.masthead.eyebrow}</div>
            <h1>{INTEL.masthead.title}</h1>
            <div className="sub">{INTEL.masthead.sub}</div>
          </div>
          <div className="runmeta">Run<b id="runNo">{String(LATEST_RUN.run).padStart(2, "0")}</b>{fmtDate(LATEST_RUN.date)}</div>
        </header>

        <div className="verdict">
          <div className="eyebrow">{INTEL.verdict.eyebrow}</div>
          <p><Inline html={INTEL.verdict.html} /></p>
        </div>
        {INTEL.correction && <p className="correction"><Inline html={INTEL.correction} /></p>}

        <div className="intel-switch">
          <label className="mono-label" htmlFor="season">Season</label>
          <select id="season" className="ui-input" value={season} onChange={(e) => nav(e.target.value === INTEL.currentSeason ? "/intel/overview" : `/intel/s/${e.target.value}/overview`)}>
            {INTEL.seasons.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          <div className="view-switch" role="group" aria-label="View">
            <button aria-pressed={!reports} onClick={() => show(saved && tabs.some((t) => t.id === saved) ? saved : "overview")}>Battlefield</button>
            <button aria-pressed={reports} onClick={() => show("reports")}>Reports</button>
          </div>
        </div>

        {reports ? (
          <section role="tabpanel" aria-label="Reports">
            <h2>Reports</h2>
            {REPORT_COUNT === 0 && <p className="note">The Weekly, Monthly and 3-Month reports start in Phase 2. They will appear here, newest first.</p>}
          </section>
        ) : (
          <>
            <Tabs label="Sections" current={current} onChange={show} tabs={tabs.map((t) => ({ id: t.id, label: t.label }))} />
            {panel && (
              <section id={panel.id} role="tabpanel" aria-labelledby={"tab-" + panel.id} key={panel.id}>
                <Blocks blocks={panel.blocks} panel={panel} />
                {panel.id === "log" && <TrendLog />}
              </section>
            )}
          </>
        )}

        <footer><Inline html={INTEL.footer} /></footer>
      </div>
    </div>
  );
}
