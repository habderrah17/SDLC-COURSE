// Checks every relative markdown link (outside code fences) resolves to an existing file.
// Fragments (#…) are ignored; http(s)/mailto are skipped.
import fs from "node:fs";
import path from "node:path";
import { markdownFiles, stripFences, rel, report } from "./lib.mjs";

const problems = [];
for (const file of markdownFiles()) {
  const text = stripFences(fs.readFileSync(file, "utf8"));
  const re = /\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g; let m;
  while ((m = re.exec(text))) {
    let target = m[1].trim();
    if (/^(https?:|mailto:|#)/.test(target)) continue;
    target = target.split("#")[0];
    if (!target) continue;
    try { target = decodeURIComponent(target); } catch {}
    const abs = path.resolve(path.dirname(file), target);
    if (!fs.existsSync(abs)) problems.push(`${rel(file)} → ${m[1]}`);
  }
}
process.exit(report("links", problems));
