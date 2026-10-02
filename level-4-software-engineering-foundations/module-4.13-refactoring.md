# Module 4.13 — إعادة الهيكلة
## Refactoring: behavior-preserving change in small steps, under tests, one commit at a time

> **المستوى:** Level 4 | **الموقع:** [14 من 16]
> **السابق:** [M4.12 — Debugging Deeply](module-4.12-debugging-deeply.md) | **التالي:** [M4.14 — Legacy Code](module-4.14-legacy-code.md)

---

## 1. المتطلبات
- [ ] الكود النظيف: التسمية، guard clauses، الخيارات المسمّاة، التعقيد، `complexity.ts` — [M4.10](module-4.10-clean-code.md)
- [ ] الاختبارات كشبكة أمان: unit/AAA/حتمية — [M4.11](module-4.11-testing.md)
- [ ] التماسك/الاقتران، إخفاء القرار — [M4.6](module-4.6-abstraction-encapsulation-modularity.md), [M4.7](module-4.7-coupling-cohesion.md)
- [ ] Git: commits صغيرة، `git stash`، `git revert`، rebase تفاعلي — [L1-M1.14](../level-1-programming/module-1.14-git-2.md)

## 2. أهداف التعلّم
- تعريف إعادة الهيكلة بدقة: **تغيير البنية الداخلية دون تغيير السلوك الملحوظ** — وتمييزها عن إعادة الكتابة، وعن "تحسين أثناء إضافة ميزة".
- اتباع **الانضباط**: اختبارات خضراء → خطوة صغيرة محفوظة للسلوك → تشغيل الاختبارات → commit → التالية. والفصل الصارم بين commits "إعادة هيكلة" و"سلوك".
- تنفيذ أهم حركات **الكتالوج** يدويًا وبالـ IDE: Rename, Extract Function/Variable, Inline, Move, Introduce Parameter Object, Replace Conditional with Lookup/Polymorphism, Replace Magic Number, Decompose Conditional, Replace Error Code with Exception/Result, Split Phase.
- تشخيص **الروائح** (code smells) كمؤشر لحركة بعينها، وتقدير متى يستحق الأمر إعادة الهيكلة (قاعدة الكشّاف، التحضير قبل الميزة، rule of three) ومتى لا.
- التعامل مع الحالة التي **لا توجد فيها اختبارات**: اختبارات توصيف (characterization) أولًا — تمهيد لـ M4.14.
- قيادة إعادة هيكلة واجهة عامة بأمان: **expand → migrate → contract** على الكود (نفس نمط L3-M3.12 على المخطط).

---

## 3. شرح للمبتدئ

### ما هي إعادة الهيكلة — وما ليست
Martin Fowler: إعادة الهيكلة = **تغيير في البنية الداخلية للبرمجية يجعلها أسهل فهمًا وأرخص تعديلًا دون تغيير سلوكها الملحوظ**. ثلاث كلمات حاسمة: **الملحوظ** (المخرجات، الآثار الجانبية، الأخطاء، الأداء ضمن الحدود المقبولة)، **دون تغيير** (ليس "تقريبًا")، **البنية** (الأسماء، التقسيم، التبعيات — ما لا يراه المستخدم). إذًا:
- إصلاح bug أثناء "إعادة الهيكلة" = **تغيير سلوك**. افعله، لكن في commit منفصل باختبار أحمر أولًا.
- إعادة كتابة وحدة من الصفر = **rewrite** لا refactor: المخاطر مختلفة تمامًا (تفقد كل المعرفة المدفونة في الحالات الخاصة — M4.14).
- "سأحسّن هذا بينما أضيف الميزة" = خلط يجعل المراجعة مستحيلة والعودة مؤلمة. **افصل**: refactor أولًا (commit)، ثم الميزة (commit). Kent Beck: *"make the change easy (warning: this may be hard), then make the easy change."*

### لماذا الخطوات الصغيرة؟
لأن الخطوة الصغيرة **قابلة للتحقق** (الاختبارات تمرّ أو لا — وإن لم تمرّ فالسبب في السطور العشرة الأخيرة)، **قابلة للعودة** (`git checkout -- .` بلا ندم)، **قابلة للمراجعة** (diff صغير مفهوم)، و**قابلة للإيقاف** في أي لحظة والكود في حالة تعمل (الاجتماع الطارئ لا يترك فرعًا مكسورًا). قاعدة عملية: إن انقضت 10 دقائق والاختبارات حمراء فأنت لا تعيد الهيكلة، أنت تعيد الكتابة — تراجع وابدأ بخطوات أصغر. كل حركة في الكتالوج صُمّمت لتكون *ميكانيكية* (يمكن للـ IDE فعلها آليًا بلا خطأ): Rename و Extract Function و Inline و Move في VS Code/WebStorm عبر TypeScript language service — مضمونة البنية (لا السلوك إن كان هناك آثار جانبية مرتبة).

### الكتالوج الأساسي (حركة ← متى)
| الحركة | متى (الرائحة) |
|---|---|
| **Rename** (متغير/دالة/ملف) | اسم يكذب أو مبهم (M4.10) |
| **Extract Function** | كتلة تحتاج تعليقًا لتُفهم؛ تكرار؛ دالة طويلة |
| **Extract Variable** | تعبير معقّد بلا اسم |
| **Inline** (دالة/متغير) | تجريد لا يضيف معنى (indirection بلا فائدة) |
| **Move Function/Field** | شيء يستخدم بيانات وحدة أخرى أكثر من وحدته (Feature Envy) |
| **Introduce Parameter Object** | 3+ معاملات تسافر معًا (Data Clump) / أعلام منطقية |
| **Replace Magic Number with Constant** | `30`, `0.19`, `"paid"` بلا اسم |
| **Decompose Conditional** | شرط طويل → دوال مسمّاة `isEligibleForFreeShipping(o)` |
| **Replace Nested Conditional with Guard Clauses** | أهرام if |
| **Replace Conditional with Lookup Table / Polymorphism (Strategy)** | switch/if متكرر على نفس النوع في أماكن متعددة (M4.9) |
| **Replace Error Code with Exception / Result** | `-1/-2/null` بمعانٍ سحرية |
| **Separate Query from Modifier (CQS)** | دالة تُرجع وتُعدِّل |
| **Split Phase** | دالة تفعل "تحليل ثم حساب ثم تنسيق" → ثلاث مراحل ببيانات وسيطة |
| **Replace Loop with Pipeline** | حلقة بتراكم يدوي → `filter/map/reduce` (حين يحسّن القراءة) |
| **Encapsulate Variable/Collection** | حالة عامة متغيّرة تُعدَّل من أماكن كثيرة (M4.6) |

### الروائح: مؤشرات لا أحكام
Long Function، Long Parameter List، Duplicated Code (= معرفة مكرّرة، M4.10)، Primitive Obsession (`string` لكل شيء بدل `Email`/`Money`)، Data Clumps، Feature Envy، Shotgun Surgery (تغيير واحد يلمس 12 ملفًا — اقتران M4.7)، Divergent Change (ملف واحد يتغيّر لأسباب كثيرة — SRP M4.8)، Speculative Generality (تجريدات "قد نحتاجها")، Comments (التي تشرح *ماذا* لا *لماذا*)، Dead Code، Message Chains (`a.b().c().d()`)، Middle Man، Mutable Global State. الرائحة تقول "انظر هنا"، لا "غيّر الآن".

### متى تعيد الهيكلة؟ ومتى لا؟
**نعم:** قاعدة الكشّاف (اترك الملف أنظف قليلًا مما وجدته — فقط ما تمسّه)، **التحضير** (قبل ميزة: افتح مكانها)، **الفهم** (أسهل طريقة لفهم كود غامض: أعد تسميته واستخرج منه وأنت تقرأ، ثم قد تتراجع)، **بعد المراجعة** (الملاحظات)، **rule of three** (تكرار ثالث). **لا:** كود لن يُمسّ ولا يسبّب ضررًا (اتركه)، كود سيُحذف/يُستبدل قريبًا، قبل إصدار بـ ساعة، بلا اختبارات ولا توصيف (ابنِها أولًا)، "لأني لا أحب الأسلوب" (M4.10: الاتساق أهم من الذوق). القرار الاقتصادي: **فائدة التغييرات القادمة** × احتمالها مقابل الكلفة والمخاطر — هذا حساب فائدة الدين التقني (M4.15).

### إعادة هيكلة الواجهات العامة: expand → migrate → contract
تغيير توقيع دالة يستخدمها 40 مكانًا (أو حزمة خارجية/API): (1) **Expand**: أضف الجديد بجانب القديم؛ القديم يصير **adapter** يستدعي الجديد (`@deprecated`). (2) **Migrate**: انقل المستدعين واحدًا واحدًا — كل نقلة commit. (3) **Contract**: احذف القديم حين يصبح بلا مستدعين (`tsc` + `grep` يثبتان). نفس نمط L3-M3.12 للأعمدة، ونفس نمط API versioning في L5-M5.1 — الفكرة واحدة: **لا تكسر كل شيء دفعة واحدة**.

---

## 4. النموذج الذهني

```
   أخضر ──▶ خطوة صغيرة (حركة واحدة من الكتالوج) ──▶ شغّل الاختبارات ──▶ أخضر؟ ──▶ commit "refactor: extract isEligibleForFreeShipping"
     ▲                                                                   │ أحمر → تراجع (git checkout -- .) وقسّم الخطوة
     └───────────────────────────────────────────────────────────────────┘
   لا اختبارات؟ ← اكتب اختبارات توصيف تثبّت السلوك *الحالي* (حتى الغريب) ← ثم ابدأ
   تغيير سلوك؟  ← commit منفصل باختبار أحمر أولًا؛ لا تخلطه أبدًا بـ refactor
```

---

## 5. الرسم التوضيحي

```mermaid
flowchart LR
  S0[اختبارات توصيف تمرّ] --> S1[Rename o→order, fee→feeCents] --> S2[Replace magic numbers] --> S3[Extract computeBaseFee / applyModifiers] --> S4[Guard clauses تسطّح الهرم] --> S5[Lookup table للدول] --> S6[Replace -1/-2 بـ Result + Parameter Object: adapter قديم يبقى] --> S7[Migrate المستدعين] --> S8[Contract: حذف القديم]
  S1 -. commit .-> S2 -. commit .-> S3 -. commit .-> S4 -. commit .-> S5 -. commit .-> S6 -. commit .-> S7 -. commits .-> S8
```

```
   كل خطوة: التعقيد ينخفض أو يثبت، الاختبارات نفسها تمرّ، الـ diff < 40 سطرًا.
   Step 0: complexity 14 / depth 5  →  S2 (guards): 14 / 3  →  S3 (extract): 8 / 3  →  S4 (table): 6 / 1  →  quoteShipping 6 / 1 (+ adapter 3)
```

---

## 6. مثال بسيط

```typescript
// src/extract.ts — ثلاث حركات ميكانيكية على 8 أسطر: Extract Variable → Extract Function → Replace Conditional with Lookup
export type Line = { priceCents: number; qty: number; category: "book" | "food" | "other" };
// قبل: شرط مركّب بلا اسم + أرقام سحرية + تكرار الحساب
export function taxBefore(lines: Line[]) { let t = 0; for (const l of lines) { if (l.category === "book") t += Math.round(l.priceCents * l.qty * 0.0); else if (l.category === "food") t += Math.round(l.priceCents * l.qty * 0.09); else t += Math.round(l.priceCents * l.qty * 0.19); } return t; }
// الخطوة 1 — Extract Variable: const lineTotal = l.priceCents * l.qty   (الاختبار يمرّ)
// الخطوة 2 — Replace Conditional with Lookup: const RATE = { book: 0, food: 0.09, other: 0.19 }   (يمرّ)
// الخطوة 3 — Extract Function + Replace Loop with Pipeline:
const VAT_RATE: Record<Line["category"], number> = { book: 0, food: 0.09, other: 0.19 };            // الأرقام صار لها اسم ومكان واحد
const lineTax = (l: Line) => Math.round(l.priceCents * l.qty * VAT_RATE[l.category]);
export const taxAfter = (lines: Line[]) => lines.reduce((sum, l) => sum + lineTax(l), 0);
// نفس السلوك بالضبط (حتى التقريب لكل سطر — لو "حسّنته" إلى تقريب الإجمالي لغيّرت السلوك: commit آخر بموافقة المالية)
```

---

## 7. مثال كود

الوجهة رأيتها في M4.10 (`shippingBefore` → `quoteShipping`). هنا **الطريق**: كل خطوة تمرّ بنفس اختبارات التوصيف، وكل خطوة commit. الاختبارات تدور على **كل** الخطوات لتثبت أن السلوك لم يتغيّر بينها.

```typescript
// src/shipping-steps.ts — نفس الدالة في 6 خطوات؛ في مشروع حقيقي كل خطوة تستبدل سابقتها (commit)، وهنا نُبقيها جنبًا إلى جنب لنختبرها معًا
/* eslint-disable @typescript-eslint/no-explicit-any */
export type LegacyFn = (o: any, express: boolean, gift: boolean) => number;

// Step 0 — الأصل (M4.10). -1 ثقيل جدًا، -2 دولة غير مدعومة، -3 غير مدفوع، -4 لا طلب. آثار جانبية: console.log + o.fee = fee
export const step0: LegacyFn = (o, express, gift) => {
  let fee = 0;
  if (o) { if (o.status === "paid") {
      if (o.country === "DZ") { if (o.weightKg < 1) fee = 400; else if (o.weightKg < 5) fee = 800; else fee = 800 + Math.ceil(o.weightKg - 5) * 150; }
      else if (o.country === "FR" || o.country === "ES") { fee = 2500 + Math.ceil(o.weightKg) * 600; if (o.weightKg > 30) { console.log("too heavy"); return -1; } }
      else { return -2; }
      if (express) fee = fee * 2; if (gift) fee = fee + 300; if (o.total > 20000 && o.country === "DZ" && !express) fee = 0;
      o.fee = fee; return fee;
    } else { return -3; } } else { return -4; }
};

// Step 1 — Rename + Replace Magic Numbers (commit: "refactor(shipping): name constants and variables")
const DZ_LIGHT = 400, DZ_MEDIUM = 800, DZ_EXTRA_PER_KG = 150, EU_BASE = 2500, EU_PER_KG = 600, GIFT_WRAP = 300, EXPRESS_FACTOR = 2, FREE_OVER_TOTAL = 20000, MAX_EU_KG = 30;
const TOO_HEAVY = -1, UNSUPPORTED_COUNTRY = -2, NOT_PAID = -3, NO_ORDER = -4;
export const step1: LegacyFn = (order, express, gift) => {
  let feeCents = 0;
  if (order) { if (order.status === "paid") {
      if (order.country === "DZ") { if (order.weightKg < 1) feeCents = DZ_LIGHT; else if (order.weightKg < 5) feeCents = DZ_MEDIUM; else feeCents = DZ_MEDIUM + Math.ceil(order.weightKg - 5) * DZ_EXTRA_PER_KG; }
      else if (order.country === "FR" || order.country === "ES") { feeCents = EU_BASE + Math.ceil(order.weightKg) * EU_PER_KG; if (order.weightKg > MAX_EU_KG) { console.log("too heavy"); return TOO_HEAVY; } }
      else { return UNSUPPORTED_COUNTRY; }
      if (express) feeCents = feeCents * EXPRESS_FACTOR; if (gift) feeCents = feeCents + GIFT_WRAP; if (order.total > FREE_OVER_TOTAL && order.country === "DZ" && !express) feeCents = 0;
      order.fee = feeCents; return feeCents;
    } else { return NOT_PAID; } } else { return NO_ORDER; }
};

// Step 2 — Guard Clauses تسطّح الهرم (commit: "refactor(shipping): replace nested conditionals with guard clauses")  depth 5 → 3، التعقيد لم ينخفض بعد (نفس الفروع) — الخطوة التالية تفعل
export const step2: LegacyFn = (order, express, gift) => {
  if (!order) return NO_ORDER;
  if (order.status !== "paid") return NOT_PAID;
  let feeCents: number;
  if (order.country === "DZ") { if (order.weightKg < 1) feeCents = DZ_LIGHT; else if (order.weightKg < 5) feeCents = DZ_MEDIUM; else feeCents = DZ_MEDIUM + Math.ceil(order.weightKg - 5) * DZ_EXTRA_PER_KG; }
  else if (order.country === "FR" || order.country === "ES") { if (order.weightKg > MAX_EU_KG) { console.log("too heavy"); return TOO_HEAVY; } feeCents = EU_BASE + Math.ceil(order.weightKg) * EU_PER_KG; }   // ⚠ نقلنا فحص الوزن قبل الحساب: السلوك الملحوظ نفسه (الحساب لم يكن له أثر)؛ الاختبار يؤكد
  else return UNSUPPORTED_COUNTRY;
  if (express) feeCents *= EXPRESS_FACTOR;
  if (gift) feeCents += GIFT_WRAP;
  if (order.total > FREE_OVER_TOTAL && order.country === "DZ" && !express) feeCents = 0;
  order.fee = feeCents; return feeCents;
};

// Step 3 — Extract Function ×3 + Decompose Conditional (commit: "refactor(shipping): extract base fee, modifiers, free-shipping rule")
const dzBaseFee = (kg: number) => kg < 1 ? DZ_LIGHT : kg < 5 ? DZ_MEDIUM : DZ_MEDIUM + Math.ceil(kg - 5) * DZ_EXTRA_PER_KG;
const euBaseFee = (kg: number) => EU_BASE + Math.ceil(kg) * EU_PER_KG;
const isFreeShipping = (order: any, express: boolean) => order.total > FREE_OVER_TOTAL && order.country === "DZ" && !express;
const applyModifiers = (base: number, express: boolean, gift: boolean) => (express ? base * EXPRESS_FACTOR : base) + (gift ? GIFT_WRAP : 0);
export const step3: LegacyFn = (order, express, gift) => {
  if (!order) return NO_ORDER;
  if (order.status !== "paid") return NOT_PAID;
  let base: number;
  if (order.country === "DZ") base = dzBaseFee(order.weightKg);
  else if (order.country === "FR" || order.country === "ES") { if (order.weightKg > MAX_EU_KG) { console.log("too heavy"); return TOO_HEAVY; } base = euBaseFee(order.weightKg); }
  else return UNSUPPORTED_COUNTRY;
  const feeCents = isFreeShipping(order, express) ? 0 : applyModifiers(base, express, gift);
  order.fee = feeCents; return feeCents;
};

// Step 4 — Replace Conditional with Lookup Table (commit: "refactor(shipping): zone table")  — إضافة دولة = سطر بيانات
type Zone = { baseFee: (kg: number) => number; maxKg: number };
const ZONES: Record<string, Zone> = { DZ: { baseFee: dzBaseFee, maxKg: Infinity }, FR: { baseFee: euBaseFee, maxKg: MAX_EU_KG }, ES: { baseFee: euBaseFee, maxKg: MAX_EU_KG } };
export const step4: LegacyFn = (order, express, gift) => {
  if (!order) return NO_ORDER;
  if (order.status !== "paid") return NOT_PAID;
  const zone = ZONES[order.country]; if (!zone) return UNSUPPORTED_COUNTRY;
  if (order.weightKg > zone.maxKg) { console.log("too heavy"); return TOO_HEAVY; }
  const feeCents = isFreeShipping(order, express) ? 0 : applyModifiers(zone.baseFee(order.weightKg), express, gift);
  order.fee = feeCents; return feeCents;
};

// Step 5 — واجهة جديدة (Result + Parameter Object + بلا آثار جانبية) و**القديمة تبقى كـ adapter** (Expand). السلوك الملحوظ عبر القديمة لم يتغيّر.
export type ShippingOrder = { status: string; country: string; weightKg: number; total: number };
export type Quote = { ok: true; feeCents: number } | { ok: false; reason: "too_heavy" | "unsupported_country" | "not_paid" | "no_order" };
export function quoteShipping(order: ShippingOrder | null | undefined, opts: { express?: boolean; gift?: boolean } = {}): Quote {
  const { express = false, gift = false } = opts;
  if (!order) return { ok: false, reason: "no_order" };
  if (order.status !== "paid") return { ok: false, reason: "not_paid" };
  const zone = ZONES[order.country]; if (!zone) return { ok: false, reason: "unsupported_country" };
  if (order.weightKg > zone.maxKg) return { ok: false, reason: "too_heavy" };
  return { ok: true, feeCents: isFreeShipping(order, express) ? 0 : applyModifiers(zone.baseFee(order.weightKg), express, gift) };
}
const LEGACY_CODE: Record<Exclude<Quote, { ok: true }>["reason"], number> = { too_heavy: TOO_HEAVY, unsupported_country: UNSUPPORTED_COUNTRY, not_paid: NOT_PAID, no_order: NO_ORDER };
/** @deprecated استخدم quoteShipping. يُحذف بعد نقل كل المستدعين (Contract). */
export const step5: LegacyFn = (order, express, gift) => {
  const q = quoteShipping(order, { express, gift });
  if (!q.ok) { if (q.reason === "too_heavy") console.log("too heavy"); return LEGACY_CODE[q.reason]; }   // الـ adapter يحافظ حتى على console.log و mutation — إلى أن يؤكد التوصيف أن لا أحد يعتمد عليهما
  order.fee = q.feeCents; return q.feeCents;
};
export const steps: Record<string, LegacyFn> = { step0, step1, step2, step3, step4, step5 };
```

```typescript
// src/shipping-steps.test.ts — اختبارات توصيف: تثبّت السلوك الحالي (حتى الغريب: -1 و console.log و mutation) وتدور على كل خطوة
import { test } from "node:test"; import assert from "node:assert/strict";
import { steps, quoteShipping } from "./shipping-steps.js";

const paid = (country: string, weightKg: number, total = 5000) => ({ status: "paid", country, weightKg, total });
const cases: Array<[string, () => Parameters<(typeof steps)["step0"]>, number]> = [
  ["DZ light",                 () => [paid("DZ", 0.5), false, false], 400],
  ["DZ medium",                () => [paid("DZ", 3), false, false], 800],
  ["DZ heavy 7.2kg",           () => [paid("DZ", 7.2), false, false], 800 + 3 * 150],
  ["DZ express doubles",       () => [paid("DZ", 3), true, false], 1600],
  ["DZ gift adds 300",         () => [paid("DZ", 3), false, true], 1100],
  ["DZ free over 20000 non-express", () => [paid("DZ", 3, 25000), false, false], 0],
  ["DZ free rule ignored when express", () => [paid("DZ", 3, 25000), true, false], 1600],
  ["FR 2.1kg",                 () => [paid("FR", 2.1), false, false], 2500 + 3 * 600],
  ["ES too heavy → -1",        () => [paid("ES", 31), false, false], -1],
  ["ES exactly 30 ok",         () => [paid("ES", 30), false, false], 2500 + 30 * 600],
  ["unsupported country → -2", () => [paid("US", 1), false, false], -2],
  ["not paid → -3",            () => [{ ...paid("DZ", 1), status: "pending" }, false, false], -3],
  ["no order → -4",            () => [null, false, false], -4],
];
for (const [stepName, fn] of Object.entries(steps)) {
  for (const [name, args, expected] of cases) test(`${stepName}: ${name}`, () => assert.equal(fn(...args()), expected));
  test(`${stepName}: mutates order.fee (legacy observable behavior)`, () => { const o = paid("DZ", 3) as { fee?: number }; fn(o, false, false); assert.equal(o.fee, 800); });
}
test("quoteShipping: new API reports reasons instead of codes", () => {
  assert.deepEqual(quoteShipping(paid("ES", 31)), { ok: false, reason: "too_heavy" });
  assert.deepEqual(quoteShipping(paid("DZ", 3), { gift: true }), { ok: true, feeCents: 1100 });
});
```

```bash
node --import tsx --test src/shipping-steps.test.ts        # 6 خطوات × 14 حالة + 1 = 85 pass — السلوك ثابت عبر كل الطريق
node --import tsx src/complexity.ts src/shipping-steps.ts  # (من M4.10) step0 14/5 → step2 14/3 → step3 8/3 → step4 6/1 → quoteShipping 6/1
git log --oneline -- src/shipping.ts   # في المشروع الحقيقي: 6 commits "refactor(shipping): …" ثم "feat(shipping): add MA zone" — المراجع يرى كل خطوة وحدها
```

---

## 8. مثال من العالم الحقيقي
فريق أراد إضافة "الشحن إلى المغرب" إلى `shippingBefore`. المطوّر الأول أضاف `else if (o.country === "MA")` داخل الهرم: 20 دقيقة، ثم bug لأن قاعدة الشحن المجاني (`country === "DZ"`) لم تُحدَّث له ولأن `if (o.weightKg > 30)` كان بعد الحساب في فرع EU فقط. المطوّر الثاني: ساعة إعادة هيكلة (الخطوات 1–4، 4 commits، اختبارات التوصيف أولًا) ثم الميزة = **سطر واحد** في `ZONES` + حالة اختبار. المراجعة أخذت 10 دقائق لأن commits الـ refactor "لا سلوك" وcommit الميزة واضح. والمغرب الثالث بعده: دقيقتان.

## 9. مثال من الإنتاج
خدمة دفع بدالة 900 سطر `processPayment` يخشاها الجميع. خطة rewrite رُفضت (M4.14: 6 أشهر ومخاطر). البديل: **إعادة هيكلة متدرّجة لمدة 3 أشهر بجانب العمل العادي** — كل PR ميزة يحمل 1–2 commit تحضير (Extract, Rename, Guard)؛ اختبارات توصيف من سجلات الإنتاج الحقيقية (مدخلات/مخرجات مسجّلة = golden master، M4.14)؛ **لا** تغيير سلوك إلا بـ commit مستقل. بعد 3 أشهر: 14 دالة بمتوسط 40 سطرًا، تغطية 85%، وزمن إضافة وسيلة دفع من أسبوعين إلى يومين. مفتاح النجاح: الانضباط (الاختبارات بين كل خطوتين) لا العبقرية.

---

## 10. مفاهيم خاطئة شائعة
1. **"Refactoring = تنظيف الكود عمومًا."** هو تعريف دقيق: حفظ السلوك + خطوات صغيرة + اختبارات. "نظّفت وغيّرت وأصلحت" ليس refactoring، هو تغيير مختلط.
2. **"نحتاج sprint مخصّصًا لإعادة الهيكلة."** الفعّال هو المستمر: الكشّاف + التحضير قبل كل ميزة. الـ sprint الكبير = rewrite مقنّع يصعب تبريره ويتأجّل دائمًا.
3. **"بلا اختبارات لا يمكن إعادة الهيكلة."** بلا اختبارات لا يمكن *بأمان*. اكتب توصيفًا أولًا (M4.14)؛ وحركات الـ IDE الآلية (Rename/Extract) آمنة بنيويًا حتى قبل ذلك.
4. **"الأداء سيتدهور بالدوال الصغيرة."** V8 يُضمّن (inline) الدوال الصغيرة؛ والأداء يُقاس لا يُخمَّن (M4.12). إن ظهر تدهور قابل للقياس فهو تغيير سلوك ملحوظ وتُعالجه بالقياس.
5. **"إن مرّت الاختبارات فالسلوك محفوظ."** محفوظ *فيما تغطيه الاختبارات*. السلوك غير المختبر (ترتيب الآثار الجانبية، الاستثناءات، الأداء) قد يتغيّر — لذلك التوصيف يجب أن يشمل الغريب أيضًا.

## 11. أخطاء شائعة
1. خلط refactor + feature + fix في commit واحد ("تحسينات متنوعة").
2. خطوات كبيرة: 200 سطر تتغيّر ثم اختبارات حمراء بلا معرفة أين.
3. تغيير سلوك خفي أثناء الاستخراج: ترتيب تقييم، آثار جانبية مكرّرة/مفقودة (الخطوة 2 أعلاه نقلت فحص الوزن — تحقّقنا بالاختبار).
4. "تحسين" السلوك الغريب في المرور (-1 → استثناء) دون نقل المستدعين = كسر صامت؛ expand→migrate→contract.
5. إعادة هيكلة بلا هدف (تجميل) بينما الكود المتغيّر فعلًا يئنّ — ركّز على **النقاط الساخنة** (M4.14/M4.15).
6. حذف `@deprecated` adapter قبل التأكد من صفر مستدعين (`tsc` + grep + سجل الإنتاج إن كان API).
7. ترك الفرع مفتوحًا أسبوعًا → تعارضات هائلة؛ الخطوات الصغيرة تُدمج يوميًا.

## 12. تمرين تصحيح
بعد "إعادة هيكلة بسيطة" لدالة `summarize(orders)` (استخراج `totalOf(order)` وتحويل الحلقة إلى `map/reduce`)، تقرير المبيعات الليلي أصبح يُظهر أرقامًا مختلفة قليلًا، والاختبارات (3 فقط) خضراء.
1. **دليل:** diff يُظهر أن الحلقة الأصلية كانت `total += Math.round(o.qty * o.price * (1 - o.discount))` **ثم** `if (o.refunded) total -= o.refundAmount` داخل نفس التكرار؛ النسخة الجديدة تطرح الاستردادات **بعد** التقريب الإجمالي؟ لا — الأصل يقرّب لكل طلب، والجديد `reduce` يجمع ثم يقرّب مرة. سلوك مختلف بالسنتات.
2. **لماذا الاختبارات خضراء؟** حالاتها بأرقام صحيحة لا تُنتج كسورًا. اختبار توصيف واحد بـ `price 9.99, discount 0.15` كان سيكشفه — اكتبه من بيانات إنتاج حقيقية (golden master).
3. **الإصلاح:** استعد التقريب لكل سطر (حفظ السلوك)؛ ثم إن أرادت المالية تغيير التقريب فذاك **تغيير سلوك** له تذكرة وموافقة وcommit واختبار.
4. **الدرس:** التوصيف يجب أن يشمل مدخلات "قذرة" (كسور، سالب، فارغ)، وإعادة الهيكلة الرياضية (ترتيب التقريب/الجمع) ليست محفوظة للسلوك إلا بإثبات.

## 13. تمرين معماري
Project 4: خذ أكبر دالة في طبقة الـ handlers (غالبًا `POST /orders`). (1) اكتب 8–12 اختبار توصيف عبر HTTP (M4.11 e2e على منفذ 0) تشمل الفشل. (2) خطّط 6 خطوات من الكتالوج بترتيب (أسماء → ثوابت → guard → extract validate/price/persist → Split Phase → نقل المنطق إلى use case بـ ports من M4.5). (3) نفّذ كل خطوة بـ commit مستقل بعنوان `refactor(orders): …`، شغّل الاختبارات بينها، وسجّل التعقيد قبل/بعد بـ `complexity.ts`. (4) الخطوة الأخيرة: Expand → Migrate → Contract لتوقيع الـ repository إن غيّرته. (5) أضف الآن ميزة "كوبون" — قِس كم استغرقت مقارنة بتقديرك لو فعلتها قبل إعادة الهيكلة. هذه نقطة الدخول إلى Project 5.

## 14. الصلة بعصر AI
AI ممتاز في **اقتراح** حركات الكتالوج وتنفيذ Extract/Rename على نطاق ملف — لكنه يميل إلى **الخطوة الكبيرة** ("أعدت كتابة الملف كاملًا بأسلوب أنظف") وهي بالضبط ما يحظره الانضباط: لا يمكن مراجعتها، وتُغيّر السلوك خلسة (التقريب، الترتيب، الحالات الحدّية). الممارسة الصحيحة في L8: اكتب اختبارات التوصيف **أنت** أولًا (أو راجع ما ولّده بعناية: هل تثبّت السلوك الحالي أم السلوك "المنطقي"؟)، ثم اطلب **خطوة واحدة** مسمّاة بحركة من الكتالوج، شغّل الاختبارات، commit، كرّر. "Refactor this file" بلا شبكة أمان = rewrite مقنّع بثقة مصطنعة.

## 15–17. Master / Understand / Defer
- 🔴 التعريف الدقيق وفصل refactor/feature/fix في commits؛ الدورة أخضر→خطوة→اختبار→commit؛ Rename/Extract Function/Extract Variable/Inline/Guard Clauses/Replace Magic Number/Introduce Parameter Object/Lookup Table/Replace Error Code with Result؛ اختبارات التوصيف قبل البدء؛ expand→migrate→contract للواجهات؛ قاعدة الكشّاف والتحضير قبل الميزة.
- 🟠 الروائح كمؤشرات لحركات؛ Split Phase، Move Function، Replace Loop with Pipeline، Encapsulate Collection، Replace Conditional with Polymorphism؛ القرار الاقتصادي (فائدة الدين)؛ حركات الـ IDE الآلية وحدودها؛ المخاطر الرياضية (تقريب/ترتيب).
- ⚪ الكتالوج الكامل (Fowler ~70 حركة)، أدوات إعادة الهيكلة الآلية واسعة النطاق (codemods بـ jscodeshift/ts-morph — تظهر في M4.14 كمفهوم)، إعادة هيكلة قواعد البيانات تفصيليًا (L3-M3.12 غطّت الأساس).

## 18. الخلاصة
1. إعادة الهيكلة = تغيير البنية **دون** تغيير السلوك الملحوظ، في **خطوات صغيرة**، تحت **اختبارات**، كل خطوة **commit** — وكل ما عدا ذلك تغيير سلوك أو rewrite.
2. الكتالوج أدوات ميكانيكية؛ الروائح مؤشرات تختار الأداة؛ `complexity.ts` والاختبارات يقيسان الأثر.
3. متى: الكشّاف، التحضير قبل الميزة، rule of three، بعد المراجعة. متى لا: كود ميت/مستقر، قبل إصدار، بلا توصيف.
4. الواجهات العامة: expand → migrate → contract — لا تكسر الجميع دفعة واحدة.
5. "Make the change easy, then make the easy change" — وM4.14 يعلّمك الخطوة قبل الأولى: كيف تضع كودًا بلا اختبارات تحت الاختبار.

## 19. مراجع رسمية
- Martin Fowler — *Refactoring* (2nd ed.) catalog: https://refactoring.com/catalog/
- Martin Fowler — Refactoring definition & "Workflows of Refactoring": https://martinfowler.com/bliki/DefinitionOfRefactoring.html , https://martinfowler.com/articles/workflowsOfRefactoring/
- Kent Beck — "make the change easy, then make the easy change": https://x.com/KentBeck/status/250733358307500032
- TypeScript — Refactoring support in editors (Rename, Extract): https://code.visualstudio.com/docs/typescript/typescript-refactoring
- ESLint — `complexity`, `max-depth`, `max-lines-per-function` (ratchet): https://eslint.org/docs/latest/rules/complexity
- Conventional Commits (`refactor:` vs `feat:`/`fix:`): https://www.conventionalcommits.org/

## المصطلحات
| العربية | English |
|---|---|
| إعادة الهيكلة | Refactoring |
| سلوك ملحوظ | Observable behavior |
| إعادة كتابة | Rewrite |
| اختبار توصيف | Characterization test |
| رائحة كود | Code smell |
| استخراج دالة / متغير | Extract Function / Variable |
| تضمين | Inline |
| كائن معاملات | Parameter Object |
| جدول بحث بدل الشرط | Replace Conditional with Lookup |
| استبدال رمز الخطأ بنتيجة | Replace Error Code with Result |
| تقسيم المراحل | Split Phase |
| قاعدة الكشّاف | Boy Scout Rule |
| إعادة هيكلة تحضيرية | Preparatory refactoring |
| توسيع → ترحيل → تقليص | Expand → Migrate → Contract |
| مهمل (واجهة) | Deprecated |
