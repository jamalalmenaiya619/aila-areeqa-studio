// Weekly check-in placeholder: saved now, read by Phase 2 to build the next lesson batch.
import { useEffect, useState } from "react";
import { useSession } from "../lib/session";
import { Button, Card } from "../components/ui";

/** The Sunday that starts this week (local time), as YYYY-MM-DD. */
export function weekStart(d = new Date()) {
  const s = new Date(d.getFullYear(), d.getMonth(), d.getDate() - d.getDay());
  return `${s.getFullYear()}-${String(s.getMonth() + 1).padStart(2, "0")}-${String(s.getDate()).padStart(2, "0")}`;
}

export function CheckinCard() {
  const { store } = useSession();
  const week = weekStart();
  const [choice, setChoice] = useState<"deeper" | "keep_going" | null>(null);
  const [ideas, setIdeas] = useState("");
  const [msg, setMsg] = useState("");
  useEffect(() => { store.getCheckin(week).then((c) => { if (c) { setChoice(c.choice); setIdeas(c.ideas); } }, () => {}); }, [store, week]);
  const save = async () => {
    setMsg("Saving…");
    try { await store.saveCheckin({ week_start: week, choice, ideas }); setMsg("Saved. The next lessons will be built from this."); } catch { setMsg("Couldn't save. Try again."); }
  };
  return (
    <Card kicker={`Weekly check-in · week of ${new Date(week + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}`} title="Go deeper or keep going?" className="checkin">
      <p className="muted">Each Sunday this decides the next three lessons. Lesson batches start in Phase 2.</p>
      <div className="seg-choice" role="radiogroup" aria-label="Go deeper or keep going">
        <label><input type="radio" name="choice" checked={choice === "deeper"} onChange={() => setChoice("deeper")} /> Go deeper on this week's topics</label>
        <label><input type="radio" name="choice" checked={choice === "keep_going"} onChange={() => setChoice("keep_going")} /> Keep going with new topics</label>
      </div>
      <label className="mono-label" htmlFor="checkin-ideas">Your ideas</label>
      <textarea id="checkin-ideas" value={ideas} onChange={(e) => setIdeas(e.target.value)} placeholder="Anything you want the next lessons to cover" />
      <div className="row-gap"><Button onClick={save}>Save check-in</Button><span className="muted" aria-live="polite">{msg}</span></div>
    </Card>
  );
}
