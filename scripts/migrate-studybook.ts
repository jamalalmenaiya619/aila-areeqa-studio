// Study Book: legacy/studybook/lessons.js -> content/lessons/l1..l7.json + meta.json, photos -> public/img
import { mkdirSync, writeFileSync, readdirSync, copyFileSync } from "node:fs";
import { ROOT, loadLegacyStudybook, toJSON, assertJsonSafe } from "./lib-legacy.ts";

const { SRC, PARTS, PHOTOS, LESSONS } = loadLegacyStudybook();
const out = ROOT + "content/lessons/";
mkdirSync(out, { recursive: true });
for (const les of LESSONS) {
  assertJsonSafe(les, les.id);
  writeFileSync(out + les.id + ".json", toJSON(les));
}
const meta = { order: LESSONS.map((l) => l.id), PARTS, SRC, PHOTOS };
assertJsonSafe(meta, "meta");
writeFileSync(out + "meta.json", toJSON(meta));

const imgOut = ROOT + "public/img/";
mkdirSync(imgOut, { recursive: true });
const imgs = readdirSync(ROOT + "legacy/studybook/img").filter((f) => f.endsWith(".jpg"));
for (const f of imgs) copyFileSync(ROOT + "legacy/studybook/img/" + f, imgOut + f);
console.log(`Study Book: ${LESSONS.length} lessons, ${imgs.length} photos.`);
