// Shared helpers for the course checks.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** All markdown files in the repo (excluding node_modules and generated dirs). */
export function markdownFiles(dir = ROOT) {
  const out = [];
  const skip = new Set(["node_modules", ".git", ".examples", ".github"]);
  (function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (skip.has(e.name)) continue;
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith(".md")) out.push(p);
    }
  })(dir);
  return out.sort();
}

// Module files: level-N-…/module-….md
export function moduleFiles() {
  return markdownFiles().filter((p) => /level-[0-9][^/]*\/module-[^/]+\.md$/.test(rel(p)));
}

export function rel(p) { return path.relative(ROOT, p).split(path.sep).join("/"); }

/** Remove fenced code blocks (``` … ```) so headings/links inside code are not counted. */
export function stripFences(text) { return text.replace(/```[\s\S]*?```/g, ""); }

/** Extract fenced blocks of a given language: [{lang, body, index}]. */
export function fences(text, lang) {
  const re = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g; const out = []; let m, i = 0;
  while ((m = re.exec(text))) { i++; if (!lang || m[1] === lang || (Array.isArray(lang) && lang.includes(m[1]))) out.push({ lang: m[1], body: m[2], index: i }); }
  return out;
}

export function readJson(p) { return JSON.parse(fs.readFileSync(p, "utf8")); }

export function report(title, problems) {
  if (problems.length === 0) { console.log(`✓ ${title}: ok`); return 0; }
  console.log(`✗ ${title}: ${problems.length} problem(s)`);
  for (const p of problems) console.log(`  - ${p}`);
  return 1;
}
