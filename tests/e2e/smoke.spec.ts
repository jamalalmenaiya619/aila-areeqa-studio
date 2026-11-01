import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";

const lesson = (id: string) => JSON.parse(readFileSync(`content/lessons/${id}.json`, "utf8"));
const LESSONS = ["l1", "l2", "l3", "l4", "l5", "l6", "l7"];

function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error" && !/fonts\.(googleapis|gstatic)/.test(m.text())) errors.push(m.text()); });
  return errors;
}
async function login(page: Page) {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login/);
  await page.getByRole("button", { name: "Log in as the test user" }).click();
  await expect(page.getByRole("heading", { name: "Today" })).toBeVisible();
}

test("private pages and files need a login", async ({ request }) => {
  for (const path of ["/", "/study", "/img/l1-2.jpg", "/intel/overview"]) {
    const r = await request.get(path, { maxRedirects: 0 });
    expect(r.status(), path).toBe(302);
  }
  expect((await request.get("/api/health")).status()).toBe(401);
  expect((await request.post("/api/coach", { data: {} })).status()).toBe(401);
});

test("log in, open every tab", async ({ page }) => {
  const errors = watchErrors(page);
  await login(page);
  for (const [tab, check] of [["Intel", "AW Menswear Battlefield"], ["Study", "Heritage you can"], ["Collections", "Collections"], ["Tech Packs", "Tech Packs"], ["Marketing", "Marketing"], ["Home", "Today"]]) {
    await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: tab, exact: true }).click();
    await expect(page.getByRole("heading", { level: 1 }).first()).toContainText(check);
  }
  expect(errors).toEqual([]);
});

test("imported progress: Continue opens Lesson 5, slide 5; Lessons 1-4 done", async ({ page }) => {
  await login(page);
  await page.goto("/study");
  for (const n of [1, 2, 3, 4]) await expect(page.locator(".day").nth(n - 1).locator(".state")).toContainText("Done");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL(/\/study\/l5\/5$/);
  await expect(page.locator(".count")).toContainText("5 / " + lesson("l5").slides.length);
  // Old typed answers and coaching are there.
  await page.goto("/study/notes");
  await page.getByRole("tab", { name: "My answers" }).click();
  await expect(page.locator(".answer-card").first()).toContainText("Your answer");
  await expect(page.locator(".coach-reply").first()).toContainText("Verdict");
});

test("walk all 7 lessons slide by slide with no errors", async ({ page }) => {
  const errors = watchErrors(page);
  await login(page);
  for (const id of LESSONS) {
    const L = lesson(id);
    await page.goto(`/study/${id}/1`);
    for (let i = 0; i < L.slides.length; i++) {
      await expect(page.locator(".count")).toContainText(`${i + 1} / ${L.slides.length}`);
      await expect(page.locator(".slide")).not.toBeEmpty();
      if (i < L.slides.length - 1) await page.keyboard.press("ArrowRight");
    }
  }
  expect(errors).toEqual([]);
});

test("quiz shows right / wrong explanation; Retake clears it", async ({ page }) => {
  await login(page);
  const L = lesson("l6"); // not answered in the imported progress
  const i = L.slides.findIndex((s: any) => s.type === "quiz" && !s.warm);
  const s = L.slides[i];
  await page.goto(`/study/l6/${i + 1}`);
  const wrong = s.answer === 0 ? 1 : 0;
  await page.locator(".opt").nth(wrong).click();
  await expect(page.locator(".why.miss")).toContainText("Not quite.");
  await expect(page.locator(".why.miss .fix")).toContainText(s.why);
  if (s.whys?.[wrong]) await expect(page.locator(".why.miss .mistake")).toHaveText(s.whys[wrong]);
  const j = L.slides.findIndex((x: any, k: number) => k > i && x.type === "quiz" && !x.warm);
  await page.goto(`/study/l6/${j + 1}`);
  await page.locator(".opt").nth(L.slides[j].answer).click();
  await expect(page.locator(".why.ok")).toContainText("Right:");
  const sc = L.slides.findIndex((x: any) => x.type === "score");
  await page.goto(`/study/l6/${sc + 1}`);
  await expect(page.locator(".bigscore b")).toHaveText("1");
  await page.getByRole("button", { name: "Retake the quiz" }).click();
  await expect(page).toHaveURL(new RegExp(`/study/l6/${L.slides.findIndex((x: any) => x.type === "quiz" && !x.warm) + 1}$`));
  await expect(page.locator(".opt:not([disabled])")).toHaveCount(s.options.length);
});

test("task answer shows on the Lesson 7 brief; coaching streams on Ctrl+Enter", async ({ page }) => {
  await login(page);
  const L = lesson("l7");
  const t = L.slides.findIndex((s: any) => s.type === "task" && s.flow);
  await page.goto(`/study/l7/${t + 1}`);
  const box = page.locator("textarea[data-note]");
  await box.fill("A test answer for the brief");
  await expect(page.locator("#saved")).toHaveText("Saved");
  await box.press("Control+Enter");
  await expect(page.locator("#coach")).toContainText("Verdict:");
  await expect(page.locator("#coach b").first()).toHaveText("Verdict:");
  const b = L.slides.findIndex((s: any) => s.type === "brief");
  await page.goto(`/study/l7/${b + 1}`);
  await expect(page.locator(".briefrow").first()).toContainText("A test answer for the brief");
  await page.locator(".briefrow .linkbtn").first().click();
  await expect(page).toHaveURL(new RegExp(`/study/l7/${t + 1}$`));
});

test("gallery zoom opens and closes", async ({ page }) => {
  await login(page);
  const g = lesson("l7").slides.findIndex((s: any) => s.type === "gallery");
  await page.goto(`/study/l7/${g + 1}`);
  await page.locator(".gcard").nth(7).click();
  const dlg = page.getByRole("dialog");
  await expect(dlg).toBeVisible();
  await expect(dlg.locator("svg")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dlg).toHaveCount(0);
});

test("every Intel tab, Run 17 from data, newest run first", async ({ page }) => {
  const errors = watchErrors(page);
  await login(page);
  await page.goto("/intel/overview");
  await expect(page.locator("#runNo")).toHaveText("17");
  await expect(page.locator(".runmeta")).toContainText("October 29, 2026");
  const tabs = ["Overview", "Autumn", "Winter", "Social tiers", "Saudi consumer", "Competitors", "Saturation vs opportunity", "Trend log"];
  await expect(page.getByRole("tab")).toHaveText(tabs);
  for (const t of tabs) {
    await page.getByRole("tab", { name: t }).click();
    await expect(page.getByRole("tabpanel").locator("h2").first()).toBeVisible();
  }
  await expect(page.locator("table.log tr").nth(1).locator("td").first()).toHaveText("R17");
  await expect(page.locator("table.log tr")).toHaveCount(18);
  await page.getByRole("button", { name: "Reports" }).click();
  await expect(page.getByRole("tabpanel")).toContainText("start in Phase 2");
  expect(errors).toEqual([]);
});

test("save a note from a slide and from an Intel card", async ({ page }) => {
  await login(page);
  await page.goto("/study/l1/2");
  await page.getByRole("button", { name: /Save to notes/ }).click();
  await page.getByLabel("Your note").fill("Note from a slide");
  await page.getByRole("button", { name: "Save note" }).click();
  await page.goto("/intel/overview");
  await page.locator(".call").first().getByRole("button", { name: /Save to notes/ }).click();
  await page.getByLabel("Your note").fill("Note from Intel");
  await page.getByLabel(/Tags/).fill("intel, shoulder");
  await page.getByRole("button", { name: "Save note" }).click();
  await page.goto("/study/notes");
  await expect(page.locator(".note")).toHaveCount(2);
  await expect(page.locator(".note").first()).toContainText("Note from Intel");
  await expect(page.locator(".note").first()).toContainText("From Intel Run 17");
  await expect(page.locator(".note").nth(1)).toContainText("From Lesson 1, slide 2");
  await page.getByLabel("Search notes").fill("shoulder");
  await expect(page.locator(".note")).toHaveCount(1);
});

test("Library search finds bisht, twill, sadu, cupro", async ({ page }) => {
  await login(page);
  await page.goto("/study/library");
  for (const w of ["bisht", "twill", "sadu", "cupro"]) {
    await page.getByLabel("Search the Library").fill(w);
    await expect(page.locator(".lib-card").first()).toBeVisible();
  }
  await page.getByLabel("Search the Library").fill("");
  await page.getByLabel("Design move").selectOption({ label: "Move 1: The bisht edge" });
  await expect(page.locator(".lib-card")).toHaveCount(1);
  await page.locator(".lib-card").getByRole("link", { name: "Open in lesson" }).click();
  await expect(page.locator(".slide h2")).toContainText("Move 1");
});

test("weekly check-in saves", async ({ page }) => {
  await login(page);
  await page.goto("/study/check-in");
  await page.getByRole("radio", { name: /Go deeper/ }).check();
  await page.getByLabel("Your ideas").fill("More on Sadu");
  await page.getByRole("button", { name: "Save check-in" }).click();
  await expect(page.getByText("Saved.")).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Your ideas")).toHaveValue("More on Sadu");
});
