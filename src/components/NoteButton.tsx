// "Save to notes": stores a note linked to where it came from (a slide, a Library card or an Intel card).
import { useState } from "react";
import { useSession } from "../lib/session";
import type { NoteSource } from "../lib/store";
import { Button, Modal } from "./ui";

export function NoteButton({ source, quote = "", className = "" }: { source: NoteSource; quote?: string; className?: string }) {
  const { store } = useSession();
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [tags, setTags] = useState("");
  const [state, setState] = useState<"" | "saving" | "saved" | "error">("");
  const start = () => { setBody(""); setTags(""); setState(""); setOpen(true); };
  const save = async () => {
    setState("saving");
    try {
      await store.saveNote({ body: body.trim() || quote, tags: tags.split(",").map((t) => t.trim()).filter(Boolean), source });
      setState("saved"); setOpen(false);
    } catch { setState("error"); }
  };
  return (
    <>
      <button type="button" className={`note-btn ${className}`.trim()} onClick={start} aria-label={`Save to notes: ${source.label}`}>
        {state === "saved" ? "Saved to notes" : "Save to notes"}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} label="Save to notes" className="note-modal">
        <span className="mono-label">Save to notes · from {source.label}</span>
        <label className="mono-label" htmlFor="note-body">Your note</label>
        <textarea id="note-body" value={body} onChange={(e) => setBody(e.target.value)} placeholder={quote ? "Leave empty to save the text itself." : "What do you want to keep?"} />
        <label className="mono-label" htmlFor="note-tags">Tags, separated by commas</label>
        <input id="note-tags" className="ui-input" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="for example: sadu, lining" />
        <div className="row-gap">
          <Button onClick={save} disabled={state === "saving" || (!body.trim() && !quote)} data-autofocus>Save note</Button>
          <Button variant="ghost" onClick={() => setOpen(false)} data-close>Cancel</Button>
          {state === "error" && <span className="err">Couldn't save. Try again.</span>}
        </div>
      </Modal>
    </>
  );
}
