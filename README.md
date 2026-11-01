# A'ila Areeqa Studio

A private website for running A'ila Areeqa: Home, Intel, Study, Collections, Tech Packs, Marketing.
`PLAN.md` is the plan. `CLAUDE.md` is the rulebook. This is Phase 1.

## How it fits together (plain words)
- **The website** is built from this folder and put online by Cloudflare Pages (free).
- **The login check** runs on Cloudflare before any page, lesson, Intel file or photo is sent. Only the login page is public.
- **Your own data** (progress, answers, notes, check-ins) lives in Supabase (free), behind Row Level Security (rules that let each person see only their own rows).
- **Content** (lessons, Intel runs, Library) lives in `/content` as files, so every change is kept in history.
- **Answer checking** ("Enter: check my answer") runs on the server and asks Claude. The key never reaches the browser.

## Settings (environment variables)
`SUPABASE_URL` and `SUPABASE_ANON_KEY` are already in `wrangler.toml`. Add the secret in Cloudflare: Pages project, Settings, Variables and Secrets.

| Name | What it is | Secret? |
|---|---|---|
| `SUPABASE_URL` | Your Supabase project address | No |
| `SUPABASE_ANON_KEY` | Supabase "anon public" key. Safe to share; the database rules protect the data | No |
| `ANTHROPIC_API_KEY` | Lets the site check task answers. Set a monthly spending limit in the Anthropic Console | **Yes, encrypt it** |
| `FILES` | Not a variable: the R2 (file storage) bucket link, named `aila-files`. Used from Phase 3 | n/a |

Local only (file `.dev.vars`, never committed): `AUTH_MODE=test` turns on a test login, and `COACH_FAKE=1` gives a canned coaching reply. Both only work on `localhost`.

## Run it on a computer
```bash
npm install
```
```bash
cp .dev.vars.example .dev.vars
```
```bash
npm run build
```
```bash
npm run serve
```
Then open http://localhost:8788 and press "Log in as the test user".

## Checks
```bash
npm run verify
```
Compares `/content` with `legacy/` and fails on any difference.
```bash
npm test
```
Unit tests: every drawing and the coaching prompt match the old page exactly.
```bash
npm run test:sql
```
Runs the database file twice on a local Postgres and checks the privacy rules.
```bash
npm run e2e
```
Browser tests: login, every tab, all 7 lessons slide by slide, quiz, brief, zoom, Intel tabs, notes, Library search.

## Change content
Never retype legacy content. Re-run the scripts:
```bash
npm run migrate
```

## Deploy
Cloudflare Pages, connected to this GitHub repository.
- Build command: `npm run build`
- Build output folder: `dist`
- Production branch: `main`. Other branches get their own preview address.

Supabase one-time setup: run `supabase/migrations/0001_init.sql` in the SQL Editor. Then, under Authentication: turn off new sign-ups, and add `https://YOUR-SITE.pages.dev/login` under Redirect URLs.

Health check after deploy (logged in): `/api/health` lists which parts are connected.

## Where things live
- `content/` lessons, Intel runs and current panels, Library entries
- `scripts/` migration, check and code-generation scripts
- `src/` the website. `src/styles/tokens.css` is the only place colors and fonts are defined
- `functions/` server code: login gate, answer checking, health check
- `supabase/migrations/` the database setup
- `legacy/` the old pages, kept as the reference. Do not edit.
