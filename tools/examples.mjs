// Extracts the embedded TypeScript examples of a module (```typescript blocks whose first line is
// "// src/<path>") into .examples/<module>/src, typechecks them with tsc (strict + noUncheckedIndexedAccess)
// and runs every *.test.ts with node:test.
//
//   node tools/examples.mjs 8.7             # one module (by number) — also "module-8.7-ai-verification"
//   node tools/examples.mjs --all           # every module/project that has examples (skips DB-backed ones)
//   node tools/examples.mjs --all --db      # include modules that need PostgreSQL (DATABASE_URL must be set)
//   node tools/examples.mjs --all --typecheck-only
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { ROOT, markdownFiles, fences, rel, readJson } from "./lib.mjs";

const args = process.argv.slice(2);
const all = args.includes("--all"), withDb = args.includes("--db"), typecheckOnly = args.includes("--typecheck-only");
const selector = args.find((a) => !a.startsWith("--"));
const cfg = readJson(path.join(ROOT, "tools/examples.config.json"));
const OUT = path.join(ROOT, ".examples");
const bin = (n) => path.join(ROOT, "node_modules", ".bin", n);

const candidates = markdownFiles().filter((p) => /level-\d[^/]*\/module-[^/]+\.md$|projects\/[^/]+\/README\.md$/.test(rel(p)));
let targets = candidates;
if (!all) {
  if (!selector) { console.error("usage: node tools/examples.mjs <module-number|name> | --all [--db] [--typecheck-only]"); process.exit(2); }
  targets = candidates.filter((p) => rel(p).includes(selector.startsWith("module-") ? selector : `module-${selector}-`) || rel(p).includes(selector));
  if (targets.length === 0) { console.error(`no module matches "${selector}"`); process.exit(2); }
}

let failed = 0, ran = 0, skipped = 0;
for (const file of targets) {
  const r = rel(file);
  const blocks = fences(fs.readFileSync(file, "utf8"), ["typescript", "ts"]).filter((b) => /^\/\/\s*src\//.test(b.body.split("\n")[0]));
  if (blocks.length === 0) continue;
  const name = r.replace(/\.md$/, "").replace(/\//g, "__").replace(/__README$/, "");
  const needsDb = cfg.needsDatabase.some((s) => r.includes(s)) || blocks.some((b) => /from\s+["']pg["']/.test(b.body)) || (cfg.dependsOn[r] ?? []).some((d) => cfg.needsDatabase.some((s) => d.includes(s)));
  const skipReason = cfg.skip[r];
  if (skipReason) { console.log(`– ${r}: skipped (${skipReason})`); skipped++; continue; }
  if (needsDb && !withDb) { console.log(`– ${r}: skipped (needs PostgreSQL; run with --db)`); skipped++; continue; }

  const dir = path.join(OUT, name); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(path.join(dir, "src"), { recursive: true });
  // Dependencies: files from earlier modules this one builds on (tools/examples.config.json → dependsOn)
  const depFiles = (cfg.dependsOn[r] ?? []).map((d) => path.join(ROOT, d));
  for (const src of [...depFiles, file]) {
    const text = fs.readFileSync(src, "utf8");
    const srcBlocks = fences(text, ["typescript", "ts"]).filter((b) => /^\/\/\s*src\//.test(b.body.split("\n")[0]));
    for (const b of srcBlocks) for (const seg of segments(b.body)) {
      const p = path.join(dir, seg.path); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, seg.body);
    }
    // ```sql blocks whose first line is "-- src/<path>" or "-- migrations/<path>" are files too (schemas read at runtime)
    for (const b of fences(text, "sql")) {
      const m = /^--\s*((?:src|migrations)\/\S+)/.exec(b.body.split("\n")[0]); if (!m) continue;
      const p = path.join(dir, m[1]); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, b.body);
    }
  }
  fs.writeFileSync(path.join(dir, "tsconfig.json"), JSON.stringify({ extends: "../../tools/tsconfig.examples.json", include: ["src"] }));
  if (!fs.existsSync(path.join(dir, "node_modules"))) fs.symlinkSync(path.join(ROOT, "node_modules"), path.join(dir, "node_modules"), "dir");

  ran++;
  const tsc = spawnSync(bin("tsc"), ["-p", "tsconfig.json"], { cwd: dir, encoding: "utf8" });
  if (tsc.status !== 0) { failed++; console.log(`✗ ${r}: typecheck failed\n${indent(tsc.stdout + tsc.stderr)}`); continue; }
  const tests = walk(path.join(dir, "src")).filter((p) => /\.test\.ts$/.test(p));
  if (typecheckOnly || tests.length === 0) { console.log(`✓ ${r}: typecheck ok (${blocks.length} files${tests.length ? `, ${tests.length} test files not run` : ", no tests"})`); continue; }
  const env = { ...process.env };
  if (needsDb) await prepareDatabase(dir, cfg.setupSql[r] ?? []);
  const run = spawnSync(process.execPath, ["--import", "tsx", "--test", "--test-timeout=60000", ...tests], { cwd: dir, encoding: "utf8", env, timeout: cfg.testTimeoutMs ?? 180000 });
  const summary = (run.stdout.match(/^# (pass|fail) \d+$/gm) ?? []).join(", ");
  if (run.status !== 0) { failed++; console.log(`✗ ${r}: tests failed (${summary})\n${indent(tail(run.stdout + run.stderr, 60))}`); }
  else console.log(`✓ ${r}: ${summary}`);
}
console.log(`\nexamples: ${ran} run, ${skipped} skipped, ${failed} failed`);
process.exit(failed ? 1 : 0);

/** A block may hold several files: each "// src/<path>" line at column 0 (first line or after a blank line) starts a new file.
 *  A header containing ❌ marks an intentionally non-compiling demo — it is not extracted. */
function segments(body) {
  const lines = body.split("\n"); const out = []; let cur = null;
  for (let i = 0; i < lines.length; i++) {
    const m = /^\/\/\s*(src\/\S+)(.*)$/.exec(lines[i]);
    if (m && (i === 0 || lines[i - 1].trim() === "")) { cur = { path: m[1], skip: m[2].includes("❌"), lines: [] }; out.push(cur); }
    if (cur) cur.lines.push(lines[i]);
  }
  return out.filter((s) => !s.skip).map((s) => ({ path: s.path, body: s.lines.join("\n") }));
}
/** Fresh `public` schema for every DB-backed module, then apply the configured setup SQL files (extracted into dir). */
async function prepareDatabase(dir, setupFiles) {
  const url = process.env.DATABASE_URL;
  if (!url) { console.error("DATABASE_URL is required with --db (e.g. postgres://app:app@127.0.0.1:5432/store)"); process.exit(2); }
  const { Client } = await import("pg");
  const c = new Client({ connectionString: url }); await c.connect();
  try {
    await c.query("DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public; GRANT USAGE, CREATE ON SCHEMA public TO PUBLIC;");
    for (const f of setupFiles) {
      const [srcDoc, relPath] = f.split("#");
      const text = fs.readFileSync(path.join(ROOT, srcDoc), "utf8");
      const block = fences(text, "sql").find((b) => b.body.split("\n")[0].includes(relPath));
      if (!block) throw new Error(`setup SQL ${f} not found`);
      await c.query(block.body);
    }
  } finally { await c.end(); }
}
function walk(d) { return fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]); }
function indent(s) { return s.split("\n").map((l) => "    " + l).join("\n"); }
function tail(s, n) { const ls = s.split("\n"); return ls.slice(Math.max(0, ls.length - n)).join("\n"); }
