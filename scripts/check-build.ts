// After "vite build": the login page may only use files in /assets/public/, and those files must hold
// no lesson, Intel or Library text (they are served without a login).
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { ROOT } from "./lib-legacy.ts";

const fails: string[] = [];
const login = readFileSync(ROOT + "dist/login.html", "utf8");
for (const m of login.matchAll(/(?:src|href)="(\/[^"]+)"/g)) if (!/^\/(assets\/public\/|favicon\.svg)/.test(m[1])) fails.push("login.html loads a private file: " + m[1]);
const pubDir = ROOT + "dist/assets/public/";
const files = existsSync(pubDir) ? readdirSync(pubDir) : [];
const canaries = ["Built for the weather", "AW Menswear Battlefield", "Noura Sulaiman", "Heritage you can", "progress-export", "Design takeaway", "Gold's not it"];
for (const f of files) {
  const text = readFileSync(pubDir + f, "utf8");
  for (const c of canaries) if (text.includes(c)) fails.push(`Public file ${f} contains private text: "${c}"`);
  // A public JS file may only import other public files.
  for (const m of text.matchAll(/from\s*"\.\/([^"]+)"|import\("\.\/([^"]+)"\)/g)) { const dep = m[1] || m[2]; if (!files.includes(dep)) fails.push(`Public file ${f} imports a non-public file ${dep}`); }
  for (const m of text.matchAll(/"\/assets\/(?!public\/)[^"]+"/g)) fails.push(`Public file ${f} points at ${m[0]}`);
}
if (fails.length) { console.log("Build check FAILED:\n" + fails.map((f) => "  - " + f).join("\n")); process.exit(1); }
console.log(`Build check passed: login page uses ${files.length} public files, none with private text.`);
