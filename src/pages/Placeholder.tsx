// Collections, Tech Packs, Marketing: one calm page each, no fake data. Text from PLAN.md section 5.
import { Card } from "../components/ui";

const PAGES = {
  collections: {
    title: "Collections", phase: 3,
    what: "One page per collection or drop: the story, mood images, sketches, final photos, shoot photos, and the lessons and Intel calls that led to it. Upload by drag and drop. The media crew gets an upload-only role or a one-time upload link per collection. Every image keeps who made it, when, and the rights status.",
  },
  "tech-packs": {
    title: "Tech Packs", phase: 4,
    what: "A guide to what a good tech pack (technical package) contains and why, linked to the Study lessons that teach each part. A builder for one tech pack per product, versioned and exported as a PDF (portable document format) for a factory. Suggestions for palette, fabrics and one heritage detail, each showing which Intel gap or lesson it comes from. A share link for designers.",
  },
  marketing: {
    title: "Marketing", phase: 5,
    what: "One plan per drop, built from its tech packs, its story and the Intel: positioning line, the three content chapters (golf, equestrian, Ritz-Carlton), the content calendar, the creator-code program, launch timing against the Saudi calendar, and what to measure. Caption drafts are checked against the brand voice rules.",
  },
} as const;

export function Placeholder({ page }: { page: keyof typeof PAGES }) {
  const p = PAGES[page];
  return (
    <main className="page">
      <header className="page-head"><div className="ui-kicker">Arrives in Phase {p.phase}</div><h1>{p.title}</h1></header>
      <Card kicker="What it will do"><p className="lede">{p.what}</p></Card>
      <p className="muted">Nothing is stored here yet. This tab opens once Phase {p.phase} is built.</p>
    </main>
  );
}
