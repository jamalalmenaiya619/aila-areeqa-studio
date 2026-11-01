# CLAUDE.md: rulebook for the A'ila Areeqa Studio

Read this before every task in this repository. If a request conflicts with this file, say so and ask. Do not quietly break a rule.

## Who this is for
Jamal Almenaiya, founder of A'ila Areeqa: quiet luxury rooted in Saudi heritage, tagline "Cultured Confidence · A Family of Heritage". He is not a developer and not word-savvy.
- Explain what you did in plain, simple words. Short sentences. No jargon without a one-line meaning.
- Spell out every abbreviation the first time on each page and in each reply (for example "tech pack (technical package)", "SS (spring/summer)").
- Be honest. If something is broken, risky or a bad idea, say it first. Don't praise; report.
- When a choice is his, ask one clear question with a recommended option. Don't guess his taste.
- He tends to want "both/everything". When a request would add scope to the current phase, name it, and suggest putting it in the next phase.

## The full plan
`PLAN.md` is the source of truth for tabs, phases and decisions. Build only the current phase. Log new ideas in PLAN.md section 4 or a "Later" list. Don't build them early.

## Non-negotiables
1. **Study Book parity.** The lessons, slide order, slide types, quiz questions, answers, "why" explanations, hints, tasks, checklists, reference images, drawings, videos and source links must stay exactly as they are in `legacy/studybook/`. Port behavior 1:1: keep answers, Retake, a score before the remember slide, a hint that only partly shows the answer, task coaching on Enter with the same prompt text, the gallery zoom, and the brief page filling in from task notes. Only fonts and colors change.
2. **Intel parity.** Same tabs in the same order, the same card, tag, table and price-ladder layouts, and the same honest "not refreshed" notes. All runs stay in the Trend log. The run number comes from the data, never typed by hand.
3. **Migrate with scripts, not by retyping.** Parse the legacy files into `/content`. After migrating, run a check that compares counts and text (slides per lesson, quiz count, every `why`, every run's calls) and fails on any difference.
4. **Never invent content.** Facts need a source. Judgment is labeled "Speculation" or "inference". Photos keep their credit line (by, license, source link).
5. **Jamal's data is private.** Every page needs a login. Row Level Security is on for every table. Secret keys (Anthropic, Supabase service key, R2) live only in server functions and environment variables, never in browser code or the repository.
6. **One look.** Use only the design tokens in `src/styles/tokens.css`. No one-off colors, fonts or shadows. A new section must reuse existing components first.

## Brand look (design tokens)
- Colors: brown, beige, maroon accent, black, green; earth tones only. No neon, no gradients, no glossy effects.
  - Start from: paper `#F6F1E7`, raised `#ECE3D1`, ink `#221A12`, soft ink `#6B5C48`, line `#D9CBAE`, maroon `#6B2020`, green `#3C4A34`, brown `#7A5A3A`, black `#141210`. Status colors (confirmed, new, tension, down) are muted versions of green, brown-blue, ochre and maroon.
  - Dark mode: deep brown-black background, warm cream text. Keep both modes readable (contrast ratio 4.5:1 or better for body text).
- Fonts: Playfair Display for headings, numbers and lesson titles. A plain sans-serif for body text and tables (decision 4.1 in PLAN.md). A mono font for small labels and kickers. No Bickham Script unless Jamal provides a web license.
- Feel: calm, roomy, editorial. Thin rules, small caps labels, generous white space. Never loud. Exclamation points are not allowed in interface copy.
- Brand voice in any copy you write: composed, says less than it knows, never names competitors outside Intel (Intel is internal research, so competitors are fine there).

## Where things live
- `/content/lessons/` lesson JSON (one file per lesson) and `/content/library/` Library entries
- `/content/intel/runs/` one JSON file per run, `/content/intel/current.json` (the panels as of the latest run), `/content/intel/reports/{weekly,monthly,quarterly}/`
- `/content/brand/`, `/content/research/`
- `/public/img/` lesson photos (same file names as legacy)
- `/automation/` prompts for scheduled tasks (Phase 2)
- Supabase tables hold user data: profiles, roles, study progress, notes, collections, assets, tech packs, marketing plans.

## How to work
- Before coding: restate the task in 3–5 plain lines and list the files you'll touch.
- After coding: run the type check, unit tests and the Playwright smoke tests, look at screenshots of every changed page in both light and dark mode at laptop width (1366px) and phone width (390px), then report in plain words: what changed, what you checked, what's still open.
- Small commits with clear messages. Never force-push. Never delete content files. Archive them instead.
- Scheduled tasks may only change files under `/content/` and must never touch code.
