// glossary.md: 4 columns, sorted by English (case-insensitive, backticks ignored), no duplicate keys,
// and every "Lx-My" tag points at an existing module file.
import fs from "node:fs";
import path from "node:path";
import { ROOT, report } from "./lib.mjs";

const text = fs.readFileSync(path.join(ROOT, "glossary.md"), "utf8");
const rows = text.split("\n").filter((l) => l.startsWith("| ") && !l.startsWith("| English") );
const problems = [];
const keys = [];
const modules = new Set(fs.readdirSync(ROOT).filter((d) => /^level-\d/.test(d)).flatMap((d) => fs.readdirSync(path.join(ROOT, d)).filter((f) => f.startsWith("module-")).map((f) => `${d}/${f}`)));
const norm = (s) => s.trim().replace(/`/g, "").toLowerCase();

for (const [i, row] of rows.entries()) {
  const cells = row.replace(/\\\|/g, "\u0000").split("|").slice(1, -1).map((c) => c.replace(/\u0000/g, "\\|").trim());
  if (cells.length !== 4) { problems.push(`row ${i + 1}: expected 4 columns, got ${cells.length}: ${row.slice(0, 60)}`); continue; }
  const [en, , , tag] = cells;
  keys.push(norm(en));
  const m = /^L(\d)-M(\d+)$/.exec(tag);
  if (!m) { problems.push(`"${en}": tag "${tag}" must look like L5-M3`); continue; }
  const [, lvl, mod] = m;
  const found = [...modules].some((f) => f.startsWith(`level-${lvl}-`) && (new RegExp(`/module-${lvl}\\.${mod}-`).test(f) || (lvl === "0" && new RegExp(`/module-0${mod}-`).test(f))));
  if (!found) problems.push(`"${en}": tag ${tag} points at no module file`);
}
for (let i = 1; i < keys.length; i++) {
  if (keys[i] === keys[i - 1]) problems.push(`duplicate key "${keys[i]}"`);
  else if (keys[i] < keys[i - 1]) problems.push(`not sorted: "${keys[i - 1]}" > "${keys[i]}"`);
}
console.log(`glossary rows: ${rows.length}`);
process.exit(report("glossary", problems));
