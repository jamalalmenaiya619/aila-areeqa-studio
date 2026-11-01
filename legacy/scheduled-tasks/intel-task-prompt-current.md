# Current Intel scheduled task (copied 2026-11-01)

- Name: "Aw luxury menswear market intel"
- Schedule: Monday and Thursday, 8:00 Riyadh time (`CRON_TZ=Asia/Riyadh 0 8 * * 1,4`)
- Runs on: Claude (Cowork), with Jamal's computer folder "AQA /important documents" attached
- Output today: a Word report in `weekly-reports/` plus the published "AW Menswear Battlefield" page (run log is a JS array `runLog` inside the HTML)
- Status: 17 runs done (Run 01 = 2026-08-13 ... Run 17 = 2026-10-29)

This task must keep running until Phase 2 is live and checked. Then it is switched off so the two never run at the same time.

## Prompt, verbatim

You are producing a recurring MARKET INTELLIGENCE report for a luxury menswear brand founder (Jamal). This runs every Monday and Thursday. Objective: "know the battlefield before entering it." Build week over week — each run should reference and build on prior reports, not restart from zero.

WORKING FOLDER (already connected, use these exact paths with Read/Write/Edit/Grep/Glob):
- Root: /Users/jamalalmenaiya/Desktop/AQA /important documents/AW-Luxury-Menswear-Intel
- Weekly docx reports go in: .../AW-Luxury-Menswear-Intel/weekly-reports/
- Live artifact tracker state goes in: .../AW-Luxury-Menswear-Intel/artifact/
- A preference file may exist at: .../AW-Luxury-Menswear-Intel/delivery_preference.txt (see DELIVERY FORMAT section below)

STEP 1 — ORIENT: Before researching, list files in weekly-reports/ to see how many prior reports exist (this tells you which run number you're on) and read the most recent 1-2 reports to know what was already found, so this run can note what's new, what's confirmed/trending stronger, and what's fading, rather than repeating old findings.

STEP 2 — SCOPE OF PRODUCT CATEGORIES (luxury only, day-to-day wear for men):
Quarter-zips, button-ups, long-sleeve shirts, sweaters/knitwear, T-shirts, jackets, long coats/overcoats, and PANTS of all types (trousers, chinos, joggers/technical pants, denim if positioned as luxury) — high-end luxury essentials, high fashion, and high-end luxury streetwear. Cover BOTH Autumn direction and Winter direction as two clearly labeled sub-sections each run (early season vs peak season nuances matter).

STEP 3 — RESEARCH (use WebSearch and web_fetch broadly; use Claude in Chrome tools if available to check Instagram/TikTok trend content — if browser tools aren't available, rely on web search for social/editorial trend coverage instead of skipping it):
Markets to cover: United States, Europe, and Saudi Arabia.
Reference brands at the high end: Loro Piana, Brunello Cucinelli, Ermenegildo Zegna, Ralph Lauren (Purple Label), and comparable luxury/high-fashion/luxury-streetwear houses.
Also cover smaller/independent brands across social follower scale — primarily focus on the 10k-50k follower range (Instagram/TikTok) with strong engagement relative to size, since this is where emerging signal often shows up first. After covering that primary tier, also look at 50k-1M+ follower accounts, and explicitly call out what differs between the scales (what the small 10k-50k accounts are doing that the bigger 50k-1M+ ones aren't yet, and vice versa — e.g. differences in styling risk, product focus, pricing signals, engagement quality vs pure reach). Skip low-signal or irrelevant sources; prioritize credible fashion trade press (Business of Fashion, Vogue Business, WWD, Highsnobiety, Hypebeast), runway/collection coverage, retailer buying trend reports, and visibly high-engagement social content.

STEP 4 — EXTRACT PATTERNS (not just images/descriptions — actual patterns), for both Autumn and Winter:
- Dominant color palettes
- Emerging silhouettes and cuts
- Fabric direction (heavy wool, technical blends, layering systems, blended knits, etc.)
- Materials/hardware detail (buttons vs zippers, trims, closures) — what's trending
- Price positioning across the brands studied
- Storytelling formats brands are using (campaign narrative style)
- Campaign energy/tone

STEP 5 — SAUDI CONSUMER LAYER (answer explicitly):
- What are affluent Saudi men actually buying right now?
- What are they actually wearing day to day?
- What global trends are resonating locally vs falling flat?
- What gaps exist between global runway/trend direction and local Saudi appetite?
- Note implications for silhouette relevance, pricing calibration, product positioning, and market timing.

STEP 6 — COMPETITIVE POSITIONING:
Identify brands fusing culture + luxury, heritage + streetwear, and Middle Eastern influence + Western execution. For each: what are they doing well, where are they surface-level/shallow, and where is the white space they're leaving open. End this section with an explicit saturation-vs-opportunity read: where does the market look crowded (avoid looking like everyone else — "if we look like everyone else, we failed Phase 2") vs where is there real open ground.

STEP 7 — WEEK-OVER-WEEK BUILD: Add a short section comparing this run's findings to the prior report(s): what trends strengthened, what new signals appeared, what earlier calls didn't pan out.

DELIVERY FORMAT:
(Old delivery rules: Word doc + live page + chat summary, and asking Jamal to pick one. Jamal never picked. In the new website the answer is: the website is the delivery. The Word report becomes an optional download.)

Always share created files at the end via present_files, and always end with a direct, concise synthesis — not just a document link — of what's genuinely new or actionable this run.

## Known problems in the current setup (fix in Phase 2)
1. The page header says "Run 10" while the log is at Run 17. The run number must come from the data, never typed by hand.
2. The social follower recount has been skipped for 10 runs because unattended runs can't get browser approval. The new setup must say plainly when a section was not refreshed, and when it was last refreshed (it already does this; keep it).
3. Autumn and Winter only. The new setup covers every season (see PLAN.md, Phase 2).
