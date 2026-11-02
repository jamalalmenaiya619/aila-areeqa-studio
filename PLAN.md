# A'ila Areeqa Studio: Build Plan

Owner: Jamal Almenaiya · Written: 2026-11-01 · Status: approved direction, Phase 1 ready to build

## 1. What this is, in one line

One private website for running A'ila Areeqa as a brand and as a business: what the market is doing (Intel), what Jamal is learning (Study), what we design (Collections and Tech Packs), and how we sell it (Marketing). Home sums it all up.

## 2. The loop it is built around

**Learn → spot the gap → design it → sell it → keep it.**

- **Study** teaches the craft and the heritage. Each weekly batch of lessons can point at one drop.
- **Intel** shows what the market is doing and where the open ground is.
- **Tech Packs** turn a design into something a factory can make. Suggestions come from Intel gaps and Study notes.
- **Marketing** turns the finished pieces and their story into a launch plan.
- **Collections** keeps every drop: sketches, photos, the story, and what led to it.

## 3. Decisions already made (from Jamal's answers, Oct 31 – Nov 1)

| # | Decision | What it means |
|---|---|---|
| 1 | **One brand look** | Every tab shares the same fonts, colors and spacing. Intel and Study Book keep their exact layout, sections, order and behavior. Only the paint changes. |
| 2 | **Study Book stays as it is** | All 7 lessons, every slide, quiz, task, photo, drawing and video carry over unchanged. Jamal's saved progress, answers, notes and coaching feedback carry over. He picks up where he left off. |
| 3 | **Intel stays as it is** | Same tabs (Overview, Autumn, Winter, Social tiers, Saudi consumer, Competitors, Saturation vs opportunity, Trend log), same cards and tables, all 17 runs. |
| 4 | **Every season, not only autumn/winter (AW)** | Intel covers spring/summer (SS) and autumn/winter (AW), plus the Saudi calendar (Ramadan, Eid, National Day, Riyadh Season, Founding Day). |
| 5 | **Intel rhythm** | Quick scan every day. Deep runs every Monday and Thursday (like now). A **Weekly** report every Sunday. A **Monthly** report on the 1st. A **3-Month** report ("what keeps showing up, what faded, what to keep watching"). |
| 6 | **Lessons** | 3 lessons a week after the first 7. Every Sunday the Study tab asks "Go deeper or keep going?" with a box for Jamal's ideas. The next batch is built from his answer. |
| 7 | **Users** | Just Jamal at launch. Logins and roles are built from day one for 2–6 people later: Owner, Partner, Designer, Media crew (upload only). |
| 8 | **Cost** | Start at $0 a month (see section 6). Upgrade only when the team joins or files outgrow the free space. |
| 9 | **Files** | The physical hard drive stays the master backup of full-size originals. The website stores web-sized photos plus every sketch and tech pack PDF (portable document format), in Cloudflare R2. |
| 10 | **Built with Claude Code** | The code lives in GitHub. Claude Code builds it phase by phase. Daily Intel and weekly lessons run as Claude Code scheduled tasks that update the website on their own. |

## 4. Open decisions (defaults in brackets, change any time)

1. **Body text font.** Brand rule: Playfair Display for most text. Playfair is beautiful in headings but hard to read in dense tables. [Default: Playfair Display for headings and big numbers; a plain, clean sans-serif for body text and tables; a small mono font for labels, like the Study Book uses now. Bickham Script Pro 3 is a paid Adobe font, so it is left out of the website unless Jamal has a web license.]
2. **Brand Core conflict.** The Brand Core page uses "a honeycomb-stitched polo" as its example of hidden heritage. Jamal said THE HERITAGE POLO has **no** honeycomb stitch. [Default: show the Brand Core as it is, with a visible flag on that line until Jamal fixes the wording.]
3. **Web address.** [Default: the free Cloudflare address first; later something like studio.ailaareeqa.com.]
4. **Tech pack format** (Phase 4). Do the designers already use a template? [Ask Jamal before Phase 4.]
5. **Marketing data** (Phase 5). Which numbers come in, from Shopify and Instagram, and how? [Ask before Phase 5.]
6. **Answer checking (coaching) cost.** A website can't use the Claude plan, so checks need a pay-per-use Anthropic key (estimated 2–3 US cents a check). [Decided 2026-11-02: on, with a pay-per-use key and a monthly spend limit set in the Anthropic Console. The key is the `ANTHROPIC_API_KEY` secret in Cloudflare.]

## 5. The tabs

### Home (the summary)
- This run's Intel verdict and the top 3 calls, plus what changed since last week.
- Study: the next lesson, where Jamal left off, and the streak this week.
- Collections in progress, with their stage (idea → sketch → tech pack → sample → shoot → launch).
- Marketing: the next 3 actions and dates.
- Quick add: a note, a photo, a link, or "save as inspiration", from anywhere.
- Saudi and fashion calendar strip: what's coming in the next 60 days.

### Intel
- Exactly the current Battlefield page, restyled in the brand look.
- Season switcher. The Autumn and Winter tabs become the current season's tabs. Spring and Summer appear when there is data for them. Past seasons stay readable.
- New **Reports** area: Weekly, Monthly and 3-Month reports, newest first.
- Every card shows its status tag (Confirmed, New, Sharpened, Tension, Closed, Downgraded) and its source line, like now.
- "Not refreshed" banners stay honest. Example: "Social panel last refreshed Sept 25."

### Study
- **Study Book:** the 7 lessons exactly as they are, then 3-lesson weekly batches. Each batch can be tagged to a drop.
- **Weekly check-in** (Sundays): "Go deeper or keep going?" plus Jamal's ideas.
- **Library:** one searchable place for everything learned. All "remember" points, the 18 design moves with drawings, key facts, photos with credits, the research doc (Heritage and Fabric), the Brand Core, sources and videos. Filter by lesson, topic (heritage, fabric, construction, color, leather, scent) or design move. Nothing has to be opened lesson by lesson.
- **Notes:** free notes with tags. A "Save to notes" button on every slide, Library item and Intel card. Jamal's task answers and coaching feedback show here too, grouped by lesson.

### Collections (design history)
- One page per collection or drop: the story, mood images, sketches, final photos, shoot photos, and the lessons and Intel calls that led to it.
- Upload by drag and drop. The media crew gets an upload-only role or a one-time upload link per collection.
- Every image keeps who made it, when, and the rights status (for example, the Ritz-Carlton rights are confirmed).

### Tech Packs
- **Guide:** what a good tech pack contains and why (flats, measurements and grading, bill of materials, fabric and trims with fiber percentages, construction and stitch notes, labels and care, packaging, sample comments). It links to the Study lessons that teach each part.
- **Builder:** one tech pack per product, versioned (v1, v2...), exported as a PDF to send to a factory.
- **Suggestions:** the builder suggests a palette, fabrics and one heritage detail. It shows *why*: which Intel gap or Study lesson each suggestion comes from. Suggestions are a starting point, never a decision. The quiet-luxury rule (one heritage detail per garment) is checked automatically.
- **Share:** send a designer a link. They can view the pack and drop files into it, and see nothing else.

### Marketing
- One plan per drop, built from its tech packs, its story and the Intel. It covers positioning line, the three content chapters (golf, equestrian, Ritz-Carlton), the content calendar, creator-code program, launch timing against the Saudi calendar, and what to measure.
- The brand voice rules from the Brand Core are checked on every caption draft: no exclamation points, no urgency, never name competitors.
- After a drop: the recap numbers (from the monthly drop-cycle task) land here.

## 6. How it's built (plain words first)

| Part | Plain words | Tool | Cost now |
|---|---|---|---|
| Code storage | Google Drive for code, with every past version saved | GitHub (private) | Free |
| Builder | Writes and changes the code for you | Claude Code on the web (claude.ai/code) | Included in your Claude plan |
| Website hosting | Puts the site online | Cloudflare Pages (free plan allows business use) | Free |
| Logins + database | Who can log in; saves progress, notes, tech packs | Supabase (free plan) | Free (pauses after 7 days with no use; the daily Intel scan keeps it awake) |
| Photo and file storage | Holds images and PDFs | Cloudflare R2 | First 10 GB free, then about $0.015 per GB a month |
| Coaching + suggestions | Lets the site ask Claude to check an answer | Anthropic API (application programming interface) key with a monthly spending cap | Pay per use; small. Confirm the price on Anthropic's pricing page before adding a card |
| Daily research + new lessons | Runs on a schedule and updates the site | Claude Code scheduled tasks | Uses your Claude plan's usage |

**Upgrade path:** when partners join or files pass 10 GB, move to Supabase Pro ($25 a month) and pay R2 for extra storage. Vercel is not used because its free plan is for non-commercial use only.

**Technical outline (for Claude Code):**
- React + TypeScript + Vite, React Router, deployed to Cloudflare Pages. Server bits (the coaching call, upload links) run as Cloudflare Pages Functions, so secret keys never reach the browser.
- Supabase: email magic-link login, a Postgres database with Row Level Security (rules that decide who can read or write each row), and roles (owner, partner, designer, media).
- R2: files uploaded through short-lived signed upload links. The database keeps the file list and details.
- **Content as files in the repo:** lessons, Intel runs, reports, Library entries and Brand Core live in `/content` as JSON (a simple data format) and Markdown, so every change is saved in history and scheduled tasks can add to them. **Jamal's own data** (progress, answers, notes, collections, tech packs, uploads) lives in Supabase.
- A design-token file (colors, fonts, spacing) used by every tab.

## 7. Phases

Each phase ends with something Jamal can use. Nothing starts until the phase before it passes its checks.

| Phase | What gets built | Done when |
|---|---|---|
| **1. Foundation + move in** | Shell with tabs, login, brand look, Study Book (7 lessons and his progress), Intel (17 runs), Library, Notes, a simple Home | Jamal logs in, opens Lesson 5 at the slide he stopped on, and sees every Intel tab with Run 17 data. Every check in `prompts/PHASE-1.md` passes. |
| **2. Intel and lessons on autopilot** | Daily scan, Monday and Thursday deep runs, Weekly, Monthly and 3-Month reports, every season, Saudi calendar, 3-lesson weekly batches with the Sunday check-in | One full week runs on its own. The old Cowork Intel task is switched off only after that. |
| **3. Collections** | Collection pages, uploads, media-crew role and upload links, rights tracking | The first collection (THE HERITAGE POLO / summer relaunch) is filed with its photos. |
| **4. Tech Packs** | Guide, builder, versions, PDF export, suggestions, designer share links | One real tech pack made with Jamal's designer. |
| **5. Marketing** | A plan per drop, content calendar, voice checker, drop recap numbers | The next drop's plan is written in it. |
| **6. Home, full version** | Home pulls live from every tab | Home answers "what needs me today?" in one screen. |

Later, any time: new sections in any tab. The rulebook (CLAUDE.md) explains how to add them without breaking the look.

## 8. Rules that protect the work

1. Never change lesson content, quiz answers or Intel findings while moving them. Migration is done by scripts that read the old files, never by retyping.
2. Never invent facts. Intel and lessons cite sources; speculation is labeled "Speculation" or "inference", like now.
3. Plain words, short sentences. Spell out every abbreviation the first time it appears on a page.
4. One brand look everywhere: no one-off colors or fonts.
5. Jamal's data is private. Nothing is public without a login, except one-time upload links he creates himself.
6. Every phase is checked before the next starts. Claude Code tests the site in a browser, compares it with the old pages, and fixes any differences.

## 9. What's in the starter pack

- `START-HERE.md`: Jamal's step-by-step setup, in plain words
- `PLAN.md`: this file
- `CLAUDE.md`: the rulebook Claude Code reads every session
- `prompts/PHASE-1.md`: paste into Claude Code to build Phase 1
- `prompts/PHASE-2.md`: paste after Phase 1 passes
- `legacy/studybook/`: the Study Book source (index.html, lessons.js, 66 photos, the built single-file page)
- `legacy/intel/`: the Battlefield page (Runs 1–17) and its update notes
- `legacy/scheduled-tasks/`: the current Intel task prompt and the other brand tasks
- `data/studybook/progress-export-2026-11-01.json`: Jamal's saved progress. Lessons 1–4 are done; he is on Lesson 5, slide 5; Lessons 6–7 are not started.
- `data/intel/weekly-reports/`: all 17 Word reports, with full citations
- `data/research/heritage-and-fabric-research.md`: the full research doc (both tracks, Days 1–7, videos, sources)
- `data/brand/brand-core.html`: the Brand Core page
