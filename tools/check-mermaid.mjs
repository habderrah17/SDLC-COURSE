// Parses every ```mermaid block with the real Mermaid parser (via jsdom) and reports the ones that fail.
import fs from "node:fs";
import { JSDOM } from "jsdom";
import { markdownFiles, fences, rel, report } from "./lib.mjs";

const dom = new JSDOM("<!DOCTYPE html><body></body>");
globalThis.window = dom.window; globalThis.document = dom.window.document;
globalThis.DOMPurify = { sanitize: (x) => x, addHook() {}, removeHook() {} };
const mermaid = (await import("mermaid")).default;
mermaid.initialize({ startOnLoad: false });

const problems = []; let count = 0;
for (const file of markdownFiles()) {
  for (const f of fences(fs.readFileSync(file, "utf8"), "mermaid")) {
    count++;
    try { await mermaid.parse(f.body); }
    catch (e) { problems.push(`${rel(file)} (mermaid block #${f.index}): ${String(e.message ?? e).split("\n")[0]}`); }
  }
}
console.log(`mermaid blocks: ${count}`);
process.exit(report("mermaid", problems));
