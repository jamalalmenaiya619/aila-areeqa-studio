// The coaching prompt must be exactly the legacy text for every task in every lesson.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { ROOT, loadLegacyStudybook } from "../../scripts/lib-legacy.ts";
import { buildCoachPrompt } from "../../src/study/coach-prompt";

const html = readFileSync(ROOT + "legacy/studybook/index.html", "utf8");
const start = html.indexOf("const prompt = `");
const end = html.indexOf("`;", start);
const legacyTemplate = html.slice(start + "const prompt = ".length, end + 1);

describe("coach prompt", () => {
  const { LESSONS } = JSON.parse(JSON.stringify(loadLegacyStudybook()));
  for (const lesson of LESSONS) for (const s of lesson.slides.filter((x: any) => x.type === "task")) {
    it(`${lesson.id}: ${s.title}`, () => {
      const answer = "My answer, with \"quotes\" and a\nnew line.";
      const want = vm.runInNewContext(legacyTemplate, { lesson, s, answer });
      expect(buildCoachPrompt(lesson, s, answer)).toBe(want);
    });
  }
});
