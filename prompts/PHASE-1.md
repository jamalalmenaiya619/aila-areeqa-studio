# Phase 1 prompt: paste everything below the line into Claude Code

---

You are building Phase 1 of the **A'ila Areeqa Studio**, a private website (a dashboard plus help center) for my brand. Read `CLAUDE.md` and `PLAN.md` first. They are the rules and the full plan. Build **only Phase 1**.

## Goal of Phase 1
I can log in and use one website with these tabs: **Home, Intel, Study, Collections, Tech Packs, Marketing**. In Phase 1, Home, Intel and Study are fully working. Collections, Tech Packs and Marketing each show one calm page with what's coming and in which phase, with no fake data. The Study Book and Intel must work and be laid out **exactly** as they do now, in one shared brand look.

## Stack (keep it simple, all free to start)
- React + TypeScript + Vite + React Router. CSS with design tokens in `src/styles/tokens.css` (see CLAUDE.md). No heavy UI kit. Small shared components: `Tabs`, `Card`, `Tag`, `Table`, `PriceLadder`, `Button`, `NoteButton`, `Modal`.
- Hosting: Cloudflare Pages. Server code in Cloudflare Pages Functions (`/functions`).
- Login and database: Supabase. Email magic link. Roles: `owner`, `partner`, `designer`, `media`. Only I (owner) exist for now. Row Level Security on every table.
- Files: Cloudflare R2 bucket is set up but only used from Phase 3. Add the binding and a health check, nothing else.
- Coaching: a Pages Function `/api/coach` calls the Anthropic Messages API with the key from an environment variable. Use the current Claude Sonnet model and keep the model name in one config file. It streams the reply back. Add a simple per-user rate limit (for example 30 checks an hour) and a clear message when the key is missing.
- Write a `README.md` in plain words: how to run it locally, which environment variables exist, and how to deploy.

## Step 1: Move the content in with scripts (no retyping)
Write `scripts/migrate-*.ts` scripts that read the legacy files and write `/content`. Re-runnable, deterministic output.
1. **Study Book** from `legacy/studybook/lessons.js` (+ the `PATCH` layer at the end of that file, which adds whys, hints, refs, context and auto-inserted score slides; apply it exactly as the old page did) → `/content/lessons/l1.json` … `l7.json`, plus `PARTS`, `SRC`, `PHOTOS` → `/content/lessons/meta.json`. The SVG drawings in `legacy/studybook/index.html` (the `SVG` object and `qattSVG`) become React components with identical shapes and labels. Copy the 66 photos to `/public/img/` with the same names.
2. **Intel** from `legacy/intel/battlefield-published-run17.html` → `/content/intel/runs/run-01.json` … `run-17.json` (from the `runLog` array: run, date, status, calls) and `/content/intel/current.json` (the masthead, verdict, correction note, every Overview card with its tag, the "Dates that matter" table, Autumn, Winter, the price ladder, Social tiers, Saudi consumer and its table, Competitors table, Saturation vs opportunity, the footer). Keep every word, tag and source line. Fix one known bug: the header says "Run 10", but the run number must be computed from the runs (17).
   - Treat the season sections as data: `seasons: [{id: "AW26", label: "Autumn/Winter 2026", tabs: [{id:"autumn",...},{id:"winter",...}]}]`, so Phase 2 can add SS27 without code changes.
3. **Library** → `/content/library/*.json`. Build entries from: every lesson's "remember" items, the 18 design moves (from the Lesson 7 gallery, with their drawings), every story and compare slide's key fact with its photo and source, every video link, `data/research/heritage-and-fabric-research.md` (split by its headings; keep the text, links and "Design takeaway" and "Rule for A'ila Areeqa" lines), and `data/brand/brand-core.html` (8 sections). Each entry: id, title, body, topic tags, source links, origin (lesson and slide, research day, or brand section).
4. **My progress**: `data/studybook/progress-export-2026-11-01.json` holds my saved state (`last`, and per lesson `slide`, `quiz`, `checks`, `notes`, `feedback`, `best`, `done`). Write a one-time import that loads it into Supabase for my account, keeping the same shape. After import, opening Study must put me on **Lesson 5, slide 5**, with Lessons 1–4 marked done and all my typed answers and coaching feedback in place.
5. **Check script** `scripts/verify-migration.ts` must fail on any difference: slide count per lesson, quiz count, every question, option, answer index, `why` and `whys`, task count with refs and context, photo files present, 17 runs with the same calls text, every Intel section present. Print a plain summary.

## Step 2: Build the tabs

### Shell
- Top bar with the A'ila Areeqa wordmark (text in Playfair Display; logo file comes later), tab links, a light/dark switch, and the user menu. It works at 1366px laptop width first and stays usable at 390px phone width.
- Keyboard: arrow keys keep working inside the Study Book, as they do now.

### Study (tab)
- **Study Book**: port `legacy/studybook/index.html` renderer to React with the **same** behavior for every slide type: cover, quiz (warm, review, whys, hint shown partially), story, compare, reveal, steps, layers, toggle, svgtoggle, weave, ladder, builder, design, task (refs and zoom, context, notePrompt, checklist, **Enter → coach** with the exact prompt text from `checkAnswer` in the legacy file), gallery (zoom), brief (fills from tasks with `flow`; Edit jumps back), score (auto before remember), remember, video. Part chips with minutes, including the Lesson 7 overrides (`L7.parts`, `_pl`). Lesson list page with dates, done state and resume.
  - Save progress to Supabase as I go (debounced) and keep a local copy for offline. Keep answers and Retake exactly as now.
- **Library**: search box (searches title, body and tags) and filters for lesson, topic and design move. Cards with photo or drawing, source links, and "Open in lesson" when it came from a slide.
- **Notes**: create, edit, tag and search notes. A `NoteButton` ("Save to notes") on every slide, Library card and Intel card stores a note linked to where it came from. A "My answers" view lists every task answer and coaching reply by lesson.
- **Weekly check-in** placeholder card: "Go deeper or keep going?" with a text box. It saves to Supabase; Phase 2 reads it.

### Intel (tab)
- Rebuild the Battlefield page from `/content/intel/current.json` + runs: masthead (title, "Run N · date" computed), the verdict box, the correction note, sticky section tabs in the same order (Overview, the season tabs, Social tiers, Saudi consumer, Competitors, Saturation vs opportunity, Trend log), cards in the same grid, the tags with the same meanings, the tables, the price ladder, the Trend log newest first, and the footer note.
- A season switcher above the tabs. Only AW26 exists now.
- An empty "Reports" sub-tab that says the Weekly, Monthly and 3-Month reports start in Phase 2.

### Home (tab)
Simple, real data only:
- The latest Intel verdict (first 2 sentences) plus the 3 newest calls, linking to Intel.
- Study: the next lesson, a "Continue where you left off" button (Lesson 5, slide 5), and lessons done out of the total.
- Latest 5 notes, with a quick-add note box.
- Three calm cards for Collections, Tech Packs and Marketing: "Coming in Phase 3/4/5".

### Collections, Tech Packs, Marketing (tabs)
One page each: what it will do (one short paragraph taken from PLAN.md section 5) and the phase it arrives in. No fake data.

## Step 3: Check your work (required, report the results)
1. `verify-migration` passes.
2. Playwright tests: log in with a test user; open every tab; walk all 7 lessons slide by slide with no console errors; answer a quiz and check the right/wrong explanation shows; type a task answer and check it appears on the Lesson 7 brief page; open the gallery zoom; open every Intel tab; save a note from a slide and from an Intel card; search the Library for "bisht", "twill", "sadu" and "cupro" and get results.
3. **Side-by-side screenshots**: for Lesson 1 cover, a Lesson 2 quiz, the Lesson 3 Al-Qatt builder, the Lesson 7 gallery and brief, and each Intel tab, save the old page (from `legacy/`) and the new page next to each other. Layout and order must match; only fonts and colors may differ. List any differences and fix them.
4. Light and dark mode, 1366px and 390px.
5. Deploy to Cloudflare Pages. Tell me the link and the exact steps I still need to do myself (create accounts, paste keys), in plain words, one step per line.

## When you're done
Report in plain words: what works, what you checked, anything that doesn't match the old pages and why, and what I need to do next. Do not start Phase 2.
