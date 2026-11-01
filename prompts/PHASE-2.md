# Phase 2 prompt: paste only after Phase 1 passes all its checks

---

Read `CLAUDE.md` and `PLAN.md`. Phase 1 is live. Build **Phase 2: Intel and lessons on autopilot**. Don't start Phase 3.

## Part A: Intel for every season
1. Extend `/content/intel` to hold several seasons: SS (spring/summer) and AW (autumn/winter), for example AW26, SS27, AW27. Each season has its own tabs (early-season and peak-season direction, like Autumn and Winter today). The site shows the current season by default and keeps past seasons readable.
2. Add a **Saudi and fashion calendar** file (`/content/intel/calendar.json`): fashion weeks, earnings dates of tracked houses, Ramadan, Eid al-Fitr, Eid al-Adha, Saudi Founding Day, Saudi National Day, Riyadh Season, plus any dates the runs track. Each date gets a source. Show the next 60 days on Home and in Intel.
3. Add **signals**: small dated items from the daily scan (`/content/intel/signals/YYYY-MM-DD.json`), with headline, one line, source, status tag and season. They show in a "This week" strip on Intel Overview, and roll into the next deep run.

## Part B: Reports
Add report pages under Intel → Reports, stored as Markdown with front-matter (a small header with date, period and run numbers covered):
- **Weekly** (every Sunday): what strengthened, what's new, what faded or was corrected, open questions, one paragraph on "what this means for A'ila Areeqa".
- **Monthly** (the 1st): what stayed all month, what didn't, the price and color moves, the Saudi read, and the calls to act on.
- **3-Month** (every 3 months): which calls kept showing up across at least 3 of the last 12 weeks ("keep watching"), which faded, which flipped, plus a short table: call · first seen · times confirmed · times contradicted · status now.
Counting must come from the run and signal data, not from memory.

## Part C: The scheduled task prompts
Write these files in `/automation/`. Each is a complete prompt for a Claude Code scheduled task on this repository. Each run must: read `CLAUDE.md`; read the latest runs, signals and reports; research with web search; write only under `/content/`; run `scripts/verify-content.ts`; commit with a clear message; push to `main` (the site redeploys on its own); then send me a 2–3 line plain summary.
1. `intel-daily-scan.md`, every day 07:30 Riyadh time, Tuesday, Wednesday, Friday, Saturday and Sunday (deep runs cover Monday and Thursday). Quick: earnings, collection news, Saudi retail news, store openings, price changes. Writes signals only. If nothing real happened, write one "Quiet day" signal; don't pad.
2. `intel-deep-run.md`, Monday and Thursday 08:00 Riyadh time. Port the current task's method from `legacy/scheduled-tasks/intel-task-prompt-current.md` (Steps 1–7, the same categories, markets, brands and follower tiers), but output a new `run-NN.json` and an updated `current.json` instead of a Word doc and HTML. Cover the current and next season. Keep the honesty rules: say which sections were not refreshed and when they last were; label inference and speculation.
3. `intel-weekly-report.md`, Sunday 18:00 Riyadh time.
4. `intel-monthly-report.md`, the 1st of each month, 09:00.
5. `intel-quarterly-report.md`, the 1st of January, April, July and October, 10:00.
6. `lessons-weekly-batch.md`, Sunday 20:00. Reads my weekly check-in answer ("go deeper" or "keep going", plus my ideas) from a read-only Pages Function endpoint protected by a token kept in the scheduled task's environment. Then writes **3 new lessons** in the exact lesson JSON format and with the same teaching style as Lessons 1–7: warm-up review quizzes on last week, story slides with real, credited, free-to-use photos (or labeled drawings when none exist), side-by-side comparisons, a design move, hands-on tasks with refs and context for the coach, a 9-question quiz with whys and partial hints, remember points and real video links found in search results. It may tag the batch to a drop. It must pass `verify-content` before pushing.
7. `scripts/verify-content.ts`: checks every lesson, run, signal and report against its schema, that every quiz has whys, that every task has refs and context, that every photo exists and has a credit, and that run numbers are in order with no gaps.

## Part D: Turn it on
Give me plain step-by-step instructions to create each scheduled task with `/schedule` (or at claude.ai/code/routines), including the repository, the time zone (Asia/Riyadh), and allowing pushes to `main` for these tasks only. Tell me to keep my **old** Intel task (in Cowork) running until the new deep run has worked twice. Then tell me how to switch the old one off, so the two never both run.

## Checks
- Run each task prompt once by hand. Show me the content it added and the deployed page.
- `verify-content` passes. Reports count correctly from a test fixture with known numbers.
- Report in plain words what works, what's still manual, and what each run costs in usage, roughly.
