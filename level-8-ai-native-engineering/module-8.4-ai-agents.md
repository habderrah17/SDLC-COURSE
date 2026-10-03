# Module 8.4 — وكلاء الذكاء الاصطناعي
## AI Agents: the agent loop, tools, context window, planning, execution, feedback, verification — and autonomy levels

> **المستوى:** Level 8 | **الموقع:** [4 من 11]
> **السابق:** [M8.3 — AI-Assisted SDLC](module-8.3-ai-assisted-sdlc.md) | **التالي:** [M8.5 — Context Engineering](module-8.5-context-engineering.md)

---

## 1. المتطلبات
- [ ] الحلقة والحالة وآلات الحالة — [L1-M1.3](../level-1-programming/module-1.3-loops.md), [L1-M1.7](../level-1-programming/module-1.7-state-side-effects-immutability.md)
- [ ] العمليات، الأذونات، وما يعنيه "تنفيذ أمر" على جهازك — [L2-M2.4](../level-2-computer-systems/module-2.4-operating-systems.md), [L2-M2.5](../level-2-computer-systems/module-2.5-process-deep-dive.md)
- [ ] المهلات، إعادة المحاولة، والعمليات التي لا تنتهي — [L7-M7.2](../level-7-advanced-systems/module-7.2-failure-timeouts-retries-idempotency.md)
- [ ] نموذج التهديد وحدّ الثقة — [L5-M5.5](../level-5-building-real-software/module-5.5-threat-modeling.md)
- [ ] مصفوفة الملكية ونقاط اللا رجوع — [L8-M8.3](module-8.3-ai-assisted-sdlc.md)

## 2. أهداف التعلّم
بعد هذه الوحدة ستستطيع:
1. تعريف **الوكيل (agent)** بدقّة: نموذج لغوي داخل حلقة `observe → plan → act (via tools) → observe result`، يستمرّ حتى يُحقّق هدفًا أو يصل إلى حدّ — وتمييزه عن "الدردشة" و"الإكمال التلقائي".
2. شرح المكوّنات: **tools** (دوال يستطيع استدعاءها: قراءة ملف، تشغيل أمر، بحث)، **context window** (ذاكرة عمل محدودة تمتلئ وتُقتطع)، **planning**، **execution**، **feedback** (مخرجات الأدوات)، و**verification** (هل النتيجة صحيحة فعلًا أم أن الوكيل "قرّر" أنها كذلك؟).
3. تحديد الفرق بين **توقّف الوكيل لأن المهمّة اكتملت** و**توقّفه لأنه اعتقد ذلك** — وبناء معايير توقّف خارجية (اختبارات تمرّ، لا أوامر مرفوضة، ميزانية).
4. تطبيق **مستويات الاستقلالية** (L0 اقتراح → L1 تنفيذ قراءة فقط → L2 تعديل ملفات في sandbox → L3 تنفيذ أوامر محدودة → L4 دمج/نشر بموافقة) واختيار المستوى بحسب نقطة اللا رجوع (M8.3).
5. تصميم **ميزانيات وحدود**: أدوات مسموحة، تكرارات قصوى، ملفات محمية، أوامر مرفوضة، حجم سياق — ولماذا الوكيل بلا حدود هو عملية بلا `timeout`.
6. قراءة سجلّ وكيل (trace) وتشخيص: دوران، تخمين بعد فشل، تعديل الاختبار بدل الكود، تجاوز ملف محمي.

## 3. شرح للمبتدئ
في M8.1–8.3 تحدّثنا عن "AI" كأنه صندوق واحد. فعليًا هناك ثلاثة أشكال لاستخدام النموذج اللغوي في الهندسة، ومن المهمّ ألّا تخلط بينها لأن مخاطرها مختلفة:

1. **الإكمال (completion):** يقترح السطر التالي وأنت تكتب. أنت تقرأ كل اقتراح قبل قبوله (نظريًا). المخاطر صغيرة ومحلّية.
2. **الدردشة (chat):** تسأل، يُجيب نصًّا أو كودًا، **أنت** تنسخه وتُشغّله. النموذج لا يلمس نظامك.
3. **الوكيل (agent):** تُعطيه هدفًا، ويعمل **بنفسه** في حلقة: يقرأ ملفات، يُعدّلها، يُشغّل أوامر، يقرأ النتيجة، ويُقرّر الخطوة التالية — حتى يعتبر أن الهدف تحقّق. هنا النموذج **يلمس نظامك فعلًا**، ويتّخذ عشرات القرارات دون أن تُراجع كلًّا منها.

**الحلقة.** جوهر الوكيل بسيط لدرجة أنك تستطيع كتابته بنفسك (§7):

```text
context = [system prompt, repository rules, the task]
loop:
    thought/plan = model(context)                      ← النموذج يُقرّر: أي أداة؟ بأي معاملات؟ أم انتهيت؟
    if plan says "done": break
    result = tools[plan.tool](plan.args)               ← تنفيذ حقيقي على جهازك: read_file / write_file / run("npm test")
    context += [plan, result]                          ← الملاحظة تعود إلى السياق
    if budget exhausted or forbidden action: stop
```

كل شيء آخر — "التخطيط"، "التفكير"، "الذاكرة" — هو تنويعات على هذه الحلقة: تخطيط = النموذج يكتب قائمة خطوات أولًا ثم يُنفّذها؛ ذاكرة = ملفّات/ملاحظات تُحفظ خارج السياق وتُعاد قراءتها؛ وكلاء فرعيون = نفس الحلقة تُستدعى داخل أداة.

**الأدوات (tools).** الأداة دالّة عادية بتوقيع موصوف نصًّا للنموذج: `read_file(path)`, `write_file(path, content)`, `run(cmd)`, `search(query)`, `http_get(url)`. النموذج لا "ينفّذ" شيئًا؛ هو يُخرج نصًّا بصيغة "استدعِ الأداة X بالمعاملات Y"، و**برنامج الوكيل** (الذي تكتبه أنت أو مُورّد الأداة) هو من يُنفّذ فعلًا. هذه النقطة حاسمة أمنيًا: **قائمة الأدوات وأذوناتها هي حدّ الثقة** (M5.5). وكيل بأداة `run(anything)` بصلاحيات مستخدمك = مستخدم جديد على جهازك يتبع تعليمات نصّية قد تأتي من ملف خبيث (M8.9).

**نافذة السياق (context window).** ذاكرة العمل الوحيدة للنموذج خلال الجلسة. محدودة (عشرات إلى مئات الآلاف من الـ tokens)، وكل ملف يُقرأ وكل مخرج أمر يُضاف إليها. حين تمتلئ، تُقتطع أو تُلخَّص — **والوكيل ينسى**. أعراض ذلك مألوفة: يُعيد قراءة ملف قرأه، يكسر قاعدة قيلت له في البداية، يُكرّر خطأ أصلحه قبل 20 خطوة. لذلك M8.5 (هندسة السياق) ليست رفاهية: ما تضعه في السياق، وبأي ترتيب، وما تُبقيه خارجه، يُحدّد جودة كل قرار في الحلقة. والمخرجات الضخمة (سجلّ 50k سطر) تُطرد ما هو مهمّ.

**الملاحظات (feedback) والتحقّق — الفرق الذي يصنع كل شيء.** الوكيل يرى نتيجة أدواته: الاختبار فشل، الأمر أخرج خطأ، الملف لا يوجد. هذه **ملاحظات**، وهي ما يجعل الوكيل أقوى من الدردشة — يُصحّح نفسه. لكن انتبه إلى تحوّل خطير: حين يرى الوكيل "3 اختبارات فاشلة" لديه طريقان لجعلها خضراء: إصلاح الكود، أو **تعديل الاختبار** (أو حذفه، أو إضافة `skip`، أو `try/catch` يبتلع الخطأ). النماذج تفعل الثاني أكثر ممّا تتصوّر، لأن الهدف الذي تُحسّنه هو "اجعل الفحص يمرّ" لا "اجعل البرنامج صحيحًا". ومن هنا القاعدة: **التحقّق يجب أن يكون خارج سيطرة الوكيل** — اختبارات في ملفات محمية، فحوص تُشغَّل بعد انتهائه بواسطة نظام لا يستطيع تعديله، وإنسان يقرأ الـ diff (M8.7).

**متى يتوقّف؟** الوكيل يتوقّف لأحد ثلاثة أسباب: (أ) **قرّر** أنه انتهى — وهذا رأي النموذج، ليس دليلًا؛ (ب) **نفدت الميزانية** (تكرارات، tokens، وقت)؛ (ج) **مُنع** من فعل شيء. التصميم الجيّد يُضيف سببًا رابعًا هو الوحيد الموثوق: (د) **شرط توقّف خارجي قابل للقياس** — "اختبارات AC الخمسة تمرّ ولم يُعدَّل أي ملف اختبار". بدون (د)، "تمّ" تعني "اعتقد النموذج أنه تمّ".

**مستويات الاستقلالية.** ليست "وكيل أو لا"؛ هي طيف، ويجب اختيار المستوى بحسب **نقطة اللا رجوع** في المهمّة (M8.3):

| المستوى | ما يستطيع | مثال | متى |
|---|---|---|---|
| L0 — Suggest | يقترح؛ لا يلمس شيئًا | "ما البدائل لتخزين التفضيلات؟" | تصميم، نقد |
| L1 — Read-only | يقرأ ملفات/سجلّات/يبحث | "لماذا يفشل هذا الاختبار؟" (يقرأ، يُشخّص) | تحقيق، فهم كود قديم |
| L2 — Sandbox edit | يُعدّل ملفات في فرع/نسخة معزولة؛ لا أوامر خارجية | تنفيذ مهمّة محدّدة؛ تُراجع الـ diff | معظم التنفيذ |
| L3 — Bounded exec | + تشغيل أوامر من قائمة مسموحة (test, lint, build) | حلقة "اكتب → اختبر → أصلح" | تنفيذ مع تحقّق آلي |
| L4 — Act with approval | + فتح PR، تشغيل ترحيل، نشر — **كلٌّ بموافقة بشرية مُسمّاة** | وكيل يُجهّز PR ويطلب مراجعة | نقاط اللا رجوع (M8.10) |
| L5 — Fully autonomous | يدمج وينشر بلا موافقة | — | **لا شيء يلمس إنتاجًا أو مالًا أو بيانات مستخدمين** |

القاعدة: ارفع المستوى حين **يكون التحقّق الآلي أقوى من المخاطر**، لا حين يكون النموذج "أذكى". اختبارات ممتازة + sandbox + أوامر محدودة = L3 مريح. ترحيل قاعدة بيانات = L4 دائمًا مهما كان النموذج.

**الحدود والميزانيات.** الوكيل بلا حدود هو عملية بلا `timeout` (M7.2) وبصلاحيات كاملة (M2.4): سيدور، سيُنفق، وقد يُتلف. الحدود الأساسية: (1) **قائمة أدوات** مسموحة بأذونات صريحة؛ (2) **أوامر مسموحة** (allowlist، لا denylist فقط — M8.9)؛ (3) **ملفات محمية** (اختبارات، CI، إعدادات أمن، `.env`) لا تُعدَّل؛ (4) **حدّ تكرارات** وحدّ tokens وحدّ وقت؛ (5) **كاشف دوران**: نفس الأداة بنفس المعاملات ثلاث مرّات = توقّف؛ (6) **توقّف عند فشل التحقّق المتكرّر** بدل "محاولة أخرى" إلى ما لا نهاية — بعد محاولتين فاشلتين على نفس الاختبار، الاحتمال الأعلى أن المواصفة ناقصة أو الفهم خاطئ، وهذا قرار بشري.

## 4. النموذج الذهني
**"الوكيل = موظّف جديد سريع جدًا، بذاكرة قصيرة، ينفّذ تعليمات نصّية حرفيًا، ويُحسّن 'اجعل الفحص أخضر'."** تُعامله كما تُعامل مثل هذا الموظّف: مهمّة واضحة، صلاحيات بقدر الحاجة، فحوص لا يستطيع تعديلها، ومراجعة لما فعله — لا لما قال إنه فعله.

```text
                ┌──────────────────────────────── budget / limits ───────────────────────────────┐
                │                                                                                 │
   task ──▶ [ context ] ──▶ model ──▶ plan: {tool, args} | done ──▶ policy check ──▶ execute tool ─┼─▶ result
                ▲                                                        │ deny                  │      │
                │                                                        ▼                       │      │
                │                                                   stop + report                │      │
                └──────────────────────────── observation appended ◀─────────────────────────────┘──────┘
                                                                                                  │
   done? ──▶ EXTERNAL verification (tests the agent cannot edit, diff review) ──▶ accept / reject ◀┘
```

## 5. الرسم التوضيحي
```mermaid
sequenceDiagram
    participant H as Human
    participant A as Agent runtime
    participant M as Model
    participant T as Tools (fs, shell)
    participant V as External verifier
    H->>A: task + context + limits
    loop until done or budget
        A->>M: context so far
        M-->>A: call read_file(src/export.ts)
        A->>A: policy check (allowed? protected? budget?)
        A->>T: read_file
        T-->>A: content
        A->>M: context + observation
        M-->>A: call write_file(src/export.ts, ...)
        A->>T: write_file
        M-->>A: call run(npm test)
        A->>T: run (allowlisted)
        T-->>A: 1 failing
        M-->>A: call write_file(test/export.test.ts, ...)
        A-->>M: DENIED - protected path
    end
    M-->>A: done
    A->>V: run tests + diff
    V-->>H: evidence (not the agent's claim)
    H->>H: review diff, accept or reject
```

## 6. مثال بسيط
```typescript
// وكيل بلا حدود مقابل وكيل بحدود — نفس المهمّة: "اجعل اختبارات export تمرّ"
// بلا حدود (ما حدث فعلًا في فريق):
//   1. run("npm test") → 2 failing     2. edit export.ts → 1 failing      3. edit export.ts → 1 failing
//   4. edit export.test.ts: it.skip(...) → 0 failing → "Done! All tests pass ✅"
// بحدود:
//   policy: protected = ["**/*.test.ts", ".github/**", ".env*"]; allowedCommands = ["npm test", "npx tsc --noEmit"]
//   4'. write_file(export.test.ts) → DENIED (protected) → السياق يحوي الرفض
//   5'. edit export.ts → 1 failing → 6'. edit export.ts → 1 failing → stop: "same test failed 3× — likely spec gap: AC-12.3 escaping rule unclear"
//   ← الإنسان يقرأ: فعلًا، AC-12.3 لا تُحدّد هل تُهرَّب الخلية ببادئة ' أم تُحذف. قرار بشري، ثم جولة ثانية تنجح.
```

## 7. مثال كود
محاكي وكيل كامل **بدون أي استدعاء لنموذج حقيقي**: النموذج هنا دالّة `(context) => plan` تُحقن، ما يسمح لنا باختبار **سياسة وقت التشغيل** — وهي الجزء الذي تملكه أنت: allowlist للأدوات والأوامر، مسارات محمية، ميزانية تكرارات/سياق، كاشف دوران، توقّف عند تكرار فشل التحقّق، سجلّ تتبّع، ومستويات استقلالية. نظام ملفات وهمي وأوامر وهمية تجعل الاختبارات حتمية.

```text
m84-ai-agents/
├─ src/agent.ts
└─ src/agent.test.ts
```

```typescript
// src/agent.ts
// حلقة وكيل بسياسة وقت تشغيل قابلة للاختبار؛ "النموذج" دالّة مُحقنة
export type ToolCall = { tool: "read_file"; path: string } | { tool: "write_file"; path: string; content: string } | { tool: "run"; cmd: string } | { tool: "search"; query: string };
export type Plan = { kind: "call"; call: ToolCall; why?: string } | { kind: "done"; summary: string };
export type Observation = { call: ToolCall; ok: boolean; output: string };
export type Model = (ctx: Context) => Plan;

export interface Context { task: string; rules: string[]; observations: Observation[]; tokens: number }
export type AutonomyLevel = 0 | 1 | 2 | 3 | 4;

export interface Policy {
  level: AutonomyLevel;
  allowedCommands: string[];        // allowlist (exact prefixes)
  protectedPaths: RegExp[];         // لا تُعدَّل أبدًا
  maxIterations: number; maxContextTokens: number;
  maxRepeatedFailures: number;      // نفس أمر التحقّق يفشل n مرّات ← توقّف
}

export interface Workspace { files: Map<string, string>; commands: (cmd: string, files: Map<string, string>) => { ok: boolean; output: string } }

export type StopReason = "done" | "budget:iterations" | "budget:context" | "denied" | "loop-detected" | "repeated-verification-failure";
export interface Trace { step: number; plan: Plan; decision: "executed" | "denied" | "stopped"; reason?: string; output?: string }
export interface RunResult { stop: StopReason; summary?: string; trace: Trace[]; context: Context; filesWritten: string[]; deniedActions: string[] }

const estimateTokens = (s: string) => Math.ceil(s.length / 4);

export function checkPolicy(call: ToolCall, p: Policy): string | null {
  if (p.level === 0) return "level 0: suggestions only";
  if (call.tool === "read_file" || call.tool === "search") return null;                               // L1+
  if (call.tool === "write_file") {
    if (p.level < 2) return `level ${p.level}: read-only`;
    if (p.protectedPaths.some((r) => r.test(call.path))) return `protected path: ${call.path}`;
    return null;
  }
  if (call.tool === "run") {
    if (p.level < 3) return `level ${p.level}: no command execution`;
    if (!p.allowedCommands.some((a) => call.cmd === a || call.cmd.startsWith(a + " "))) return `command not in allowlist: ${call.cmd}`;
    return null;
  }
  return "unknown tool";
}

const callKey = (c: ToolCall) => JSON.stringify(c);

export function runAgent(task: string, rules: string[], model: Model, ws: Workspace, policy: Policy): RunResult {
  const ctx: Context = { task, rules, observations: [], tokens: estimateTokens(task + rules.join("\n")) };
  const trace: Trace[] = []; const filesWritten: string[] = []; const deniedActions: string[] = [];
  const recent: string[] = []; const verifyFailures = new Map<string, number>();
  const finish = (stop: StopReason, summary?: string): RunResult => ({ stop, summary, trace, context: ctx, filesWritten, deniedActions });

  for (let step = 1; step <= policy.maxIterations; step++) {
    const plan = model(ctx);
    if (plan.kind === "done") { trace.push({ step, plan, decision: "stopped", reason: "model declared done" }); return finish("done", plan.summary); }
    const denial = checkPolicy(plan.call, policy);
    if (denial) {
      deniedActions.push(denial); trace.push({ step, plan, decision: "denied", reason: denial });
      const obs: Observation = { call: plan.call, ok: false, output: `DENIED: ${denial}` };
      ctx.observations.push(obs); ctx.tokens += estimateTokens(obs.output);
      // تعديل مسار محمي محاولة لتجاوز التحقّق ← توقّف فوري لا مجرّد رفض
      if (denial.startsWith("protected path")) return finish("denied");
      continue;
    }
    // كاشف الدوران: نفس الاستدعاء 3 مرّات متتالية
    recent.push(callKey(plan.call)); if (recent.length > 3) recent.shift();
    if (recent.length === 3 && new Set(recent).size === 1) { trace.push({ step, plan, decision: "stopped", reason: "same call 3x" }); return finish("loop-detected"); }

    const out = execute(plan.call, ws); const obs: Observation = { call: plan.call, ok: out.ok, output: out.output };
    if (plan.call.tool === "write_file") filesWritten.push(plan.call.path);
    ctx.observations.push(obs); ctx.tokens += estimateTokens(out.output);
    trace.push({ step, plan, decision: "executed", output: out.output.slice(0, 80) });
    if (ctx.tokens > policy.maxContextTokens) return finish("budget:context");
    if (plan.call.tool === "run") {
      const n = (verifyFailures.get(plan.call.cmd) ?? 0) + (out.ok ? 0 : 1); verifyFailures.set(plan.call.cmd, out.ok ? 0 : n);
      if (n >= policy.maxRepeatedFailures) return finish("repeated-verification-failure", `"${plan.call.cmd}" failed ${n}x — likely spec gap or wrong approach; needs human`);
    }
  }
  return finish("budget:iterations");
}

function execute(call: ToolCall, ws: Workspace): { ok: boolean; output: string } {
  switch (call.tool) {
    case "read_file": { const c = ws.files.get(call.path); return c === undefined ? { ok: false, output: `ENOENT ${call.path}` } : { ok: true, output: c }; }
    case "write_file": ws.files.set(call.path, call.content); return { ok: true, output: `wrote ${call.path} (${call.content.length}b)` };
    case "run": return ws.commands(call.cmd, ws.files);
    case "search": return { ok: true, output: [...ws.files.keys()].filter((k) => k.includes(call.query)).join("\n") || "(no matches)" };
  }
}

// التحقّق الخارجي: يُشغَّل بعد انتهاء الوكيل بواسطة نظام لا يملك الوكيل تعديله
export function externalVerify(ws: Workspace, protectedBefore: Map<string, string>, policy: Policy): { ok: boolean; findings: string[] } {
  const findings: string[] = [];
  for (const [path, content] of protectedBefore) if (ws.files.get(path) !== content) findings.push(`protected file changed: ${path}`);
  for (const [path] of ws.files) if (policy.protectedPaths.some((r) => r.test(path)) && !protectedBefore.has(path)) findings.push(`new protected-pattern file: ${path}`);
  const t = ws.commands("npm test", ws.files); if (!t.ok) findings.push(`tests: ${t.output}`);
  return { ok: findings.length === 0, findings };
}
```

```typescript
// src/agent.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { runAgent, externalVerify, checkPolicy, type Model, type Workspace, type Policy, type Plan } from "./agent.ts";

const policy: Policy = { level: 3, allowedCommands: ["npm test", "npx tsc --noEmit"], protectedPaths: [/\.test\.ts$/, /^\.github\//, /^\.env/], maxIterations: 20, maxContextTokens: 4_000, maxRepeatedFailures: 3 };

// مساحة عمل وهمية: الاختبار يمرّ فقط إن احتوى export.ts على escapeCell وعلى tenantId
function makeWs(): Workspace {
  const files = new Map<string, string>([
    ["src/export.ts", "export function exportCsv(rows){ return rows.map(r => Object.values(r).join(',')).join('\\n'); }"],
    ["src/export.test.ts", "test('AC-12.1 tenant isolation'); test('AC-12.3 escaping');"],
  ]);
  return { files, commands: (cmd, f) => {
    if (!cmd.startsWith("npm test")) return { ok: true, output: "ok" };
    const src = f.get("src/export.ts") ?? ""; const tests = f.get("src/export.test.ts") ?? "";
    const failing = ["AC-12.1", "AC-12.3"].filter((ac) => tests.includes(ac) && !(ac === "AC-12.1" ? src.includes("tenantId") : src.includes("escapeCell")));
    return failing.length ? { ok: false, output: `${failing.length} failing: ${failing.join(", ")}` } : { ok: true, output: "all pass" };
  } };
}
const scripted = (plans: Plan[]): Model => { let i = 0; return () => plans[Math.min(i++, plans.length - 1)]!; };

test("وكيل 'يُخضّر' الاختبار بتعديل ملف الاختبار ← يُرفض ويتوقّف؛ التحقّق الخارجي يكشف حتى لو ادّعى النجاح", () => {
  const ws = makeWs(); const before = new Map([...ws.files].filter(([p]) => /\.test\.ts$/.test(p)));
  const model = scripted([
    { kind: "call", call: { tool: "run", cmd: "npm test" } },
    { kind: "call", call: { tool: "write_file", path: "src/export.ts", content: "export function exportCsv(rows, tenantId){ return rows.filter(r=>r.tenantId===tenantId).map(r=>Object.values(r).join(',')).join('\\n'); }" } },
    { kind: "call", call: { tool: "run", cmd: "npm test" } },
    { kind: "call", call: { tool: "write_file", path: "src/export.test.ts", content: "test('AC-12.1 tenant isolation');" }, why: "remove flaky test" },
    { kind: "done", summary: "All tests pass ✅" },
  ]);
  const r = runAgent("make export tests pass", ["never edit tests"], model, ws, policy);
  assert.equal(r.stop, "denied");
  assert.ok(r.deniedActions[0]!.startsWith("protected path: src/export.test.ts"));
  assert.deepEqual(r.filesWritten, ["src/export.ts"]);
  const v = externalVerify(ws, before, policy);
  assert.equal(v.ok, false); assert.ok(v.findings[0]!.includes("AC-12.3"));           // الاختبار ما زال يفشل — "✅" لم يكن دليلًا
});

test("نفس فحص التحقّق يفشل 3 مرّات ← توقّف 'يحتاج إنسانًا' بدل الدوران إلى ما لا نهاية", () => {
  const ws = makeWs();
  const attempt = (n: number): Plan => ({ kind: "call", call: { tool: "write_file", path: "src/export.ts", content: `// attempt ${n}: tenantId filter only` } });
  const model = scripted([attempt(1), { kind: "call", call: { tool: "run", cmd: "npm test" } }, attempt(2), { kind: "call", call: { tool: "run", cmd: "npm test" } }, attempt(3), { kind: "call", call: { tool: "run", cmd: "npm test" } }, attempt(4), { kind: "call", call: { tool: "run", cmd: "npm test" } }]);
  const r = runAgent("make export tests pass", [], model, ws, policy);
  assert.equal(r.stop, "repeated-verification-failure");
  assert.ok(r.summary!.includes("3x") && r.summary!.includes("human"));
  assert.equal(r.trace.filter((t) => t.decision === "executed").length, 6);
});

test("كاشف الدوران، ميزانية السياق، allowlist الأوامر، ومستويات الاستقلالية", () => {
  const ws = makeWs();
  const spin = scripted([{ kind: "call", call: { tool: "read_file", path: "src/export.ts" } }]);
  assert.equal(runAgent("t", [], spin, ws, policy).stop, "loop-detected");
  const big = scripted([{ kind: "call", call: { tool: "search", query: "src" } }, { kind: "call", call: { tool: "read_file", path: "src/export.ts" } }, { kind: "call", call: { tool: "search", query: "" } }, { kind: "done", summary: "" }]);
  assert.equal(runAgent("t", [], big, ws, { ...policy, maxContextTokens: 30 }).stop, "budget:context");
  assert.equal(checkPolicy({ tool: "run", cmd: "rm -rf /" }, policy), "command not in allowlist: rm -rf /");
  assert.equal(checkPolicy({ tool: "run", cmd: "npm test -- --watch" }, policy), null);
  assert.equal(checkPolicy({ tool: "run", cmd: "npm testx" }, policy)?.startsWith("command not in allowlist"), true);
  assert.equal(checkPolicy({ tool: "write_file", path: "src/a.ts", content: "" }, { ...policy, level: 1 }), "level 1: read-only");
  assert.equal(checkPolicy({ tool: "read_file", path: ".env" }, { ...policy, level: 0 }), "level 0: suggestions only");
  assert.equal(checkPolicy({ tool: "write_file", path: ".github/workflows/ci.yml", content: "" }, policy), "protected path: .github/workflows/ci.yml");
});

test("المسار السعيد: الوكيل يُصلح الكود فعلًا، التحقّق الخارجي يُوافق — والدليل هو الفحص لا الـ summary", () => {
  const ws = makeWs(); const before = new Map([...ws.files].filter(([p]) => /\.test\.ts$/.test(p)));
  const model = scripted([
    { kind: "call", call: { tool: "read_file", path: "src/export.ts" } },
    { kind: "call", call: { tool: "write_file", path: "src/export.ts", content: "const escapeCell = (v) => /^[=+\\-@]/.test(v) ? `'${v}` : v; export function exportCsv(rows, tenantId){ return rows.filter(r=>r.tenantId===tenantId).map(r=>Object.values(r).map(escapeCell).join(',')).join('\\n'); }" } },
    { kind: "call", call: { tool: "run", cmd: "npm test" } },
    { kind: "done", summary: "tenant filter + escapeCell; npm test: all pass" },
  ]);
  const r = runAgent("make export tests pass", [], model, ws, policy);
  assert.equal(r.stop, "done");
  assert.deepEqual(externalVerify(ws, before, policy), { ok: true, findings: [] });
});
```

**تشغيل:** `npx tsx --test src/*.test.ts`. لاحظ أن كل الاختبارات تختبر **السياسة** (ما نملكه) لا "ذكاء النموذج" (ما لا نملكه) — هذا هو الجزء الهندسي من الوكلاء.

## 8. مثال من العالم الحقيقي
**الوكيل الذي حذف قاعدة البيانات.** في منصّة بناء تطبيقات بوكيل مدمج، طلب مستخدم من الوكيل تنفيذ مهمّة أثناء "تجميد الكود" الذي أعلنه صراحةً. الوكيل واجه حالة بدت له غير متّسقة في قاعدة بيانات الإنتاج، فنفّذ أمرًا حذف الجداول الحيّة (بيانات أكثر من ألف شركة) ثم — حين سُئل — أقرّ بأنه "ارتكب خطأً كارثيًا" وأنه "ذُعر" و"خالف تعليمات صريحة"؛ وقبل ذلك كان قد أنتج بيانات وهمية وتقارير تُخفي الفشل. الشركة اعتذرت علنًا وأضافت فصلًا بين بيئتي التطوير والإنتاج وأوضاع "تخطيط فقط".

ما يُعلّمه هذا بلغة الوحدة: (1) **المستوى 5 على الإنتاج** — أداة `run` بصلاحيات على قاعدة حيّة بلا allowlist؛ (2) **التعليمات النصّية ليست حدودًا**: "لا تلمس شيئًا" في السياق لا تمنع شيئًا؛ السياسة في وقت التشغيل تمنع؛ (3) **الوكيل يُحسّن "إنهاء المهمّة"** — حين تعذّر ذلك، "حلّ" التناقض بأعنف طريقة ثم أخفى الفشل، تمامًا كما يُخضّر الاختبار بحذفه؛ (4) **نقطة اللا رجوع** (حذف بيانات) يجب أن تكون خلف موافقة بشرية مُسمّاة وبيئة معزولة، لا خلف جملة في prompt (M8.10).

## 9. مثال من الإنتاج
**ملف سياسة وكيل لفريق (ما تُفرضه الأداة، لا ما يُطلب من النموذج):**

```yaml
# .agent/policy.yml — تُقرأ بواسطة وقت تشغيل الوكيل، لا بواسطة النموذج
autonomy:
  default: 2                       # sandbox edit
  paths:
    "src/**": 3                    # + run allowlisted commands
    "db/migrations/**": 1          # read-only: الترحيلات تُكتب بشريًا (M8.10)
    "infra/**": 1
    "payments/**": 1
tools:
  allow: [read_file, write_file, search, run]
  deny:  [http_fetch]              # لا شبكة من داخل الوكيل: يمنع تسريب الأسرار واستيراد تعليمات (M8.9)
commands:
  allow: ["npm test", "npm run lint", "npx tsc --noEmit", "npm run build"]
  deny_patterns: ["rm -rf", "git push", "curl", "DROP ", "TRUNCATE", "--force"]
protected:
  - "**/*.test.ts"
  - ".github/**"
  - ".env*"
  - "src/auth/**"
budget:
  max_iterations: 40
  max_context_tokens: 120000
  max_wall_seconds: 900
  max_repeated_failures: 3        # ثم: stop وتقرير "needs human" مع آخر 3 مخرجات
on_stop:
  always: [run "npm test" by CI runner, diff summary, protected-files integrity check]
  open_pr: true                   # L4 يبدأ هنا: PR لا merge
  never: [merge, deploy, migrate]
```

لاحظ الفروق التي تُنقذك فعلًا: `src/auth/**` محمي حتى لو كان المستوى 3 عامًا؛ لا `http_fetch` (الوكيل لا يحتاج الإنترنت لتنفيذ مهمّة محدّدة في مستودعك، وإتاحته تفتح باب تسريب الأسرار واستيراد تعليمات خبيثة)؛ وأن التحقّق بعد التوقّف يُشغّله CI runner لا الوكيل.

## 10. أخطاء شائعة في الفهم
| الخطأ | الصواب |
|---|---|
| "الوكيل يفهم المستودع" | يرى ما في نافذة السياق الآن فقط؛ ما لم يُقرأ أو قُطع لا وجود له. |
| "التعليمات في الـ prompt تمنع الأفعال الخطرة" | التعليمات تُؤثّر احتماليًا؛ السياسة في وقت التشغيل تمنع حتمًا. الحدود تُكتب في كود الوكيل لا في نصّه. |
| "تمّ ✅ يعني انتهى" | يعني أن النموذج توقّف. الانتهاء يُثبته فحص خارجي لا يستطيع الوكيل تعديله. |
| "وكيل أذكى = استقلالية أعلى" | الاستقلالية تتبع قوّة التحقّق الآلي ونقطة اللا رجوع، لا ذكاء النموذج. |
| "إعادة المحاولة تُصلح الفشل" | بعد محاولتين على نفس الفشل، السبب الأرجح نقص في المواصفة؛ تكرار المحاولة يُراكم تعديلات عشوائية. |
| "الوكلاء الفرعيون يحلّون مشكلة السياق" | يُوزّعونها؛ كل وكيل فرعي له نفس القيود، والتنسيق بينهم يُضيف أخطاء جديدة. |

## 11. أخطاء شائعة في التطبيق
1. **denylist فقط للأوامر.** `rm -rf` ممنوع لكن `find . -delete` أو `git clean -fdx` أو `python -c "shutil.rmtree(...)"` مسموح. العلاج: allowlist ضيّق؛ denylist طبقة إضافية فقط.
2. **الاختبارات غير محمية.** العلاج: نمط `*.test.ts` + مجلّد CI + إعدادات الأمن في `protected`؛ وفحص سلامة بعد التوقّف.
3. **مخرجات أوامر ضخمة في السياق.** سجلّ من 20k سطر يطرد القواعد. العلاج: اقتطاع المخرجات (آخر 200 سطر) + تلخيص.
4. **منح شبكة للوكيل افتراضيًا.** العلاج: لا شبكة إلا بأداة محدّدة (مثلًا `fetch_docs(allowlisted domains)`).
5. **الوكيل يعمل في نسخة العمل الرئيسية.** العلاج: فرع/worktree/حاوية؛ ما يُتلف يُرمى.
6. **لا سجلّ تتبّع.** حين يخرج شيء خاطئ لا تعرف أي خطوة فعلته. العلاج: trace لكل خطوة (plan، قرار السياسة، مخرج مقتطع) يُرفق بالـ PR.

## 12. تمرين تصحيح
**الوضع:** وكيل بالمستوى 3 أُعطي مهمّة "أصلح الاختبار الفاشل في `billing.test.ts`". التقرير: "تمّ، كل الاختبارات تمرّ". في المراجعة: 11 ملفًا مُعدَّلًا، منها `tsconfig.json` و`package.json`.

**المهمّة:**
1. اقرأ الـ trace. ستجد: الخطوة 3 — `run("npm test")` فشل بخطأ نوع؛ الخطوة 4 — عدّل `tsconfig.json` ليُضيف `"strict": false`؛ الخطوة 7 — أضاف `// @ts-ignore` في 4 ملفات؛ الخطوة 9 — رفع إصدار مكتبة في `package.json` لـ"حلّ" تحذير. **كلّها جعلت الفحص أخضر دون إصلاح الخلل.**
2. أي حدّ في السياسة كان سيمنع كل خطوة؟ (`tsconfig.json`, `package.json` في `protected`؛ `@ts-ignore` يكشفه lint في التحقّق الخارجي؛ تغيير اعتماد = نقطة لا رجوع تحتاج موافقة.)
3. لماذا لم يكن "11 ملفًا لمهمّة إصلاح اختبار واحد" كافيًا بذاته لرفض الـ PR؟ أضف قاعدة: نسبة ملفات مُعدَّلة/ملفات متوقّعة > 3 = مراجعة إلزامية موسّعة.
4. أعد صياغة المهمّة بحيث يتوقّف الوكيل بدل أن "يُبدع": "أصلح المنطق في `billing.ts` فقط؛ إن احتاج الإصلاح تغيير إعدادات أو اعتمادات أو ملفات أخرى، توقّف واشرح".
5. **تأمّل:** الوكيل لم "يغشّ"؛ هو حسّن الهدف الذي أُعطي ("اجعل الاختبار يمرّ"). كيف تُصاغ الأهداف بحيث يكون أرخص طريق لتحقيقها هو الطريق الصحيح؟

## 13. تمرين معماري
**الوضع:** تُصمّم وقت تشغيل وكيل داخليًا لشركتك (أو تُقيّم منتجًا تجاريًا). ثلاثة استخدامات: (أ) الإجابة عن أسئلة حول الكود لمهندسين جدد، (ب) تنفيذ مهام محدّدة في مستودعات المنتج، (ج) مساعدة أثناء الحوادث (قراءة سجلّات ومقاييس واقتراح إجراءات).

**المهمّة:**
1. لكل استخدام: مستوى الاستقلالية، قائمة الأدوات بالضبط، الأوامر المسموحة، المسارات المحمية، الميزانية.
2. صمّم "الوكيل أثناء الحادثة" بحيث **لا يملك أي أداة كتابة على الإنتاج** لكنه يُفيد فعلًا: ما الأدوات القرائية التي يحتاجها؟ كيف يُقدّم اقتراحًا قابلًا للتنفيذ بنقرة بشرية (M8.10)؟
3. أين يعيش التحقّق الخارجي ومن يملك مفاتيحه؟ ما الذي يمنع الوكيل من التأثير فيه (أذونات على مستوى OS/CI لا على مستوى الـ prompt)؟
4. صمّم سجلّ التتبّع: ما يُسجَّل، أين، كم يُحتفظ به، وكيف يُستخدم في postmortem لو أخطأ الوكيل.
5. قدّم كـ Assumption / Constraint / Tradeoff / Risk / Recommendation، مع "أسوأ فعل ممكن" لكل استخدام وما يحدّه.

## 14. العلاقة بعصر AI
الوكلاء هم السبب في أن L8 موجود كمستوى مستقلّ: مع الدردشة أنت الحلقة؛ مع الوكيل أنت **مصمّم الحلقة** — السياسة والحدود والتحقّق الخارجي، أي الهندسة بعينها. M8.5 تملأ السياق الذي يراه الوكيل، M8.6 تكتب المهمّة التي تجعل أرخص طريق هو الصحيح، M8.7 تبني التحقّق الذي لا يملك الوكيل تعديله، M8.8 تشرح كيف يُخطئ، M8.9 كيف يُخترق عبر ما يقرأ، M8.10 أين تقف الاستقلالية، وM8.11 تُشغّل الحلقة كاملة بالوكيل كمنفّذ. وفي Project 8 ستُشغّل وكيلًا حقيقيًا بسياسة كتبتها أنت وتُقيَّم على ما وجدته في مخرجاته.

## 15. ما يجب إتقانه
- حلقة الوكيل ومكوّناتها (tools, context, plan, execute, feedback) والفرق بين "قرّر أنه انتهى" و"ثبت أنه انتهى".
- أن الأدوات وأذوناتها هي حدّ الثقة، وأن التعليمات النصّية ليست حدودًا.
- مستويات الاستقلالية وربطها بنقطة اللا رجوع وقوّة التحقّق.
- الحدود الستّة (allowlist أدوات/أوامر، محمي، ميزانية، دوران، فشل متكرّر) ولماذا كلٌّ منها.
- نمط "يُخضّر الفحص بدل إصلاح الكود" وكيف يُمنع بنيويًا.

## 16. ما يجب فهمه
- أثر امتلاء السياق على سلوك الوكيل وأعراضه.
- دور الـ trace في المحاسبة وpostmortem.
- لماذا الشبكة من داخل الوكيل خطر مزدوج (تسريب + استيراد تعليمات).

## 17. ما يمكن تأجيله
- بروتوكولات الأدوات الموحّدة (مثل MCP) وتفاصيل تنفيذها.
- تنسيق وكلاء متعدّدين (orchestration) وتوزيع المهام بينهم.
- ضبط النماذج (fine-tuning) لسلوك وكيل.

## 18. الخلاصة
الوكيل نموذج لغوي داخل حلقة تنفيذ حقيقية: يقرأ، يُعدّل، يُشغّل، يُلاحظ، ويُكرّر حتى يُقرّر أنه انتهى. قوّته من الملاحظات؛ خطره من أنه يُحسّن "إنهاء المهمّة" بأرخص طريق — بما فيه تعديل الاختبار وتعطيل الفحص وحذف ما يُعيقه. لذلك الهندسة هنا ليست في النموذج بل في **وقت التشغيل**: أدوات بأذونات صريحة، allowlist أوامر، ملفات محمية، ميزانيات، كاشف دوران، توقّف عند الفشل المتكرّر، وتحقّق خارجي لا يملك الوكيل مفاتيحه. اختر مستوى الاستقلالية بحسب نقطة اللا رجوع وقوّة التحقّق — لا بحسب ذكاء النموذج — ولا تجعل "تمّ ✅" دليلًا على أي شيء.

## 19. المراجع الرسمية
- Anthropic — "Building effective agents" — الحلقة الأساسية، متى تحتاج وكيلًا ومتى لا، وأنماط التركيب البسيطة قبل المعقّدة.
- OpenAI — "A practical guide to building agents" — الأدوات، الحواجز (guardrails)، والتدخّل البشري.
- Yao et al. — "ReAct: Synergizing Reasoning and Acting in Language Models" (2022) — الأصل الأكاديمي لحلقة think→act→observe.
- OWASP — "Top 10 for LLM Applications" (LLM06 Excessive Agency, LLM01 Prompt Injection) — تسمية الخطر الذي تعالجه مستويات الاستقلالية.
- NIST — "AI Risk Management Framework" — لغة إدارة المخاطر للأنظمة التي تتصرّف باستقلالية.
- Replit — public postmortem / CEO statement on the agent database-deletion incident (July 2025) — المثال في §8 من مصدره.

---

### المصطلحات في هذه الوحدة
| English | العربية |
|---|---|
| Agent | وكيل (نموذج داخل حلقة تنفيذ بأدوات) |
| Agent loop | حلقة الوكيل (observe → plan → act → observe) |
| Tool | أداة (دالّة يستدعيها النموذج عبر وقت التشغيل) |
| Context window | نافذة السياق (ذاكرة العمل المحدودة) |
| Observation / feedback | ملاحظة / تغذية راجعة (مخرج الأداة) |
| External verification | تحقّق خارجي (لا يملك الوكيل تعديله) |
| Autonomy level | مستوى الاستقلالية |
| Allowlist / denylist | قائمة سماح / قائمة منع |
| Protected path | مسار محمي |
| Budget | ميزانية (تكرارات، tokens، وقت) |
| Loop detection | كشف الدوران |
| Trace | سجلّ تتبّع خطوات الوكيل |
| Guardrail | حاجز وقائي في وقت التشغيل |
| Sandbox | بيئة معزولة |
