// Verifies the 19-section module contract + prerequisites line + terms table + level README/checkpoint presence.
// Exemptions (assessment-style modules) live in tools/structure.config.json.
import fs from "node:fs";
import path from "node:path";
import { ROOT, moduleFiles, stripFences, rel, readJson, report } from "./lib.mjs";

const cfg = readJson(path.join(ROOT, "tools/structure.config.json"));
const problems = [];

for (const file of moduleFiles()) {
  const r = rel(file);
  const text = fs.readFileSync(file, "utf8");
  const body = stripFences(text);
  const exempt = cfg.exemptFrom19Sections.includes(r);

  // Title: "# Module X.Y — …" then an English "## …" subtitle on line 2
  const lines = text.split("\n");
  if (!/^# Module \d+(\.\d+)? — /.test(lines[0] ?? "")) problems.push(`${r}: first line must be "# Module N.N — <Arabic title>"`);
  if (!/^## /.test(lines[1] ?? "")) problems.push(`${r}: second line must be the English "## subtitle"`);

  if (!exempt) {
    const nums = [...body.matchAll(/^## (\d+)\. /gm)].map((m) => Number(m[1]));
    const expected = Array.from({ length: 19 }, (_, i) => i + 1);
    if (JSON.stringify(nums) !== JSON.stringify(expected)) problems.push(`${r}: expected sections 1–19 in order, found [${nums.join(",")}]`);
    for (const [n, re] of Object.entries(cfg.sectionTitleRegex)) {
      const h = body.match(new RegExp(`^## ${n}\\. (.*)$`, "m"));
      if (h && !new RegExp(re).test(h[1])) problems.push(`${r}: §${n} title "${h[1]}" does not match /${re}/`);
    }
    if (!cfg.prerequisitePhrases.some((p) => text.includes(p))) problems.push(`${r}: missing the prerequisites line ("${cfg.prerequisitePhrases[0]}")`);
  }
  if (!/^#{2,3} .*المصطلحات/m.test(body)) problems.push(`${r}: missing the المصطلحات (terms) table heading`);
  if (!/\|\s*English\s*\|\s*العربية\s*\||\|\s*العربية\s*\|\s*English\s*\|/.test(text)) problems.push(`${r}: terms table must have | English | العربية | columns`);
}

// Each level dir has README.md; levels 0–8 have a checkpoint
for (const d of fs.readdirSync(ROOT).filter((n) => /^level-\d/.test(n))) {
  if (!fs.existsSync(path.join(ROOT, d, "README.md"))) problems.push(`${d}: missing README.md`);
  const n = Number(d.match(/^level-(\d+)/)[1]);
  if (n <= 8 && !fs.existsSync(path.join(ROOT, d, `checkpoint-${n}.md`))) problems.push(`${d}: missing checkpoint-${n}.md`);
}
process.exit(report("structure", problems));
