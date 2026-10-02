# Module 4.11 — الاختبار من الصفر
## Testing From Zero: why tests exist, unit / integration / e2e, pyramid vs trophy, AAA, what to test, test doubles, pragmatic TDD, `Code → Expected → Test → Confidence`

> **المستوى:** Level 4 | **الموقع:** [12 من 16]
> **السابق:** [M4.10 — Clean Code](module-4.10-clean-code.md) | **التالي:** [M4.12 — Debugging Deeply](module-4.12-debugging-deeply.md)

---

## 1. المتطلبات
- [ ] معايير القبول GWT وربطها بـ `describe/it` — [M4.3](module-4.3-user-stories-acceptance-criteria.md)
- [ ] المنافذ والـ fakes التي تحترم العقد — [M4.5](module-4.5-software-design.md), [M4.8](module-4.8-solid.md)
- [ ] `node:test` و`node:assert` بالحد الأدنى (استخدمتهما منذ M4.0)
- [ ] PostgreSQL محليًا ومعاملات `BEGIN/ROLLBACK` — [L3-M3.14](../level-3-core-computer-science/module-3.14-transactions-acid.md)
- [ ] خادم HTTP وطلب `fetch` إليه — [L2-M2.12](../level-2-computer-systems/module-2.12-http.md)

## 2. أهداف التعلّم
- شرح **لماذا توجد الاختبارات**: ليست "لإيجاد الأخطاء" أساسًا بل لبناء **ثقة قابلة للتكرار** تسمح بالتغيير (refactoring، ترقية، ميزة) بلا خوف — وكتوثيق حيّ (M4.3).
- التمييز بين **unit / integration / end-to-end** بحسب *ما يُستبدل وما يكون حقيقيًا*، وتكلفة/سرعة/ثقة كلٍّ منها؛ وفهم **الهرم** و**الكأس** (trophy) كاستراتيجيتي توزيع.
- كتابة اختبارات بنمط **AAA** (Arrange/Act/Assert) بأسماء تصف السلوك، تفشل برسائل مفهومة، **حتمية** (لا زمن حقيقي ولا عشوائية ولا ترتيب)، ومعزولة.
- معرفة **ماذا تختبر**: السلوك عبر الواجهة العامة لا التنفيذ؛ الحالات الحدّية والفشل؛ **لا** تختبر المكتبة ولا الـ getters.
- استخدام **بدائل الاختبار** بوعي: fake (مفضّل)، stub، spy، mock — ومتى يصبح الـ mock فخًّا (اختبار ينسخ التنفيذ).
- اختبار **قاعدة البيانات** بمعاملة تُلغى، و**HTTP** بخادم حقيقي على منفذ عشوائي، و**الزمن** بساعة محقونة؛ و**TDD** بشكل عملي (أحمر → أخضر → نظّف) حيث يفيد.

---

## 3. شرح للمبتدئ

### لماذا؟ الثقة لا الأخطاء
اختبار يمرّ لا يثبت غياب الأخطاء (Dijkstra). ما يمنحه: **"إن غيّرتُ هذا، سأعرف خلال ثوانٍ إن كسرتُ ذاك."** بلا هذه الثقة لا أحد يعيد الهيكلة (M4.13)، ولا يرقّي التبعيات، ولا يلمس الكود القديم (M4.14) — فيتعفّن النظام. النموذج: **Code → Expected behavior → Test → Confidence**: الاختبار يُثبّت التوقع (من معايير القبول) ويحوّله إلى فحص آلي؛ الثقة ناتج، لا "التغطية". والاختبار الجيد يفشل **لسبب واحد واضح** ويُقرأ كجملة.

### الأنواع الثلاثة: بحسب ما هو حقيقي
| النوع | ما هو حقيقي | ما يُستبدل | السرعة | الثقة لكل اختبار | متى يفشل بلا سبب |
|---|---|---|---|---|---|
| **Unit** | دالة/وحدة واحدة (منطق المجال، use case مع fakes) | DB، شبكة، ساعة، ملفات | ms | في منطقك فقط | نادرًا (إن كان نقيًا) |
| **Integration** | وحدتك + تبعية حقيقية واحدة أو أكثر (PostgreSQL، نظام ملفات، خدمة محلية) | الخدمات الخارجية البعيدة | 10–500ms | أن SQL/الربط صحيح | عند تغيّر البيئة |
| **End-to-end (e2e)** | النظام كاملًا كما يراه المستخدم (HTTP → DB → …) | لا شيء تقريبًا (المزوّدون الخارجيون بـ sandbox/fake) | ثوانٍ | أن الكل متصل | كثيرًا (شبكة، ترتيب، بيانات) |

**الهرم** (كثير من unit، أقل integration، قليل e2e) يناسب مجالًا غنيًا بالمنطق. **الكأس** (Kent C. Dodds: التركيز على integration) يناسب تطبيقات CRUD حيث المنطق قليل والمخاطر في الربط. الصواب: **اختبر كل سلوك في أرخص مستوى يمنح الثقة فيه**: قاعدة خصم → unit؛ "الاستعلام يعيد الصفوف الصحيحة بالفهرس" → integration مع PostgreSQL؛ "POST /orders ينتهي بصف وبريد" → e2e واحد للمسار السعيد. وفوقها **اختبارات العقد** (M4.8) و**الخاصية** (property-based: مولّد مدخلات + خاصية ثابتة) للخوارزميات.

### شكل الاختبار: AAA + اسم سلوكي + حتمية
```
test("Given paid order When cancelled Then full refund is created", () => {
  // Arrange: ابنِ الحالة (بيانات، fakes)      ← دوال بناء (builders) تجعل هذا سطرًا
  // Act: الفعل الواحد
  // Assert: تحقق من النتيجة المرئية (قيمة، حالة fake، صف DB) برسالة تحمل الفعلي والمتوقع
});
```
قواعد: **اختبار واحد = سلوك واحد** (قد يحوي عدة asserts على نفس النتيجة)؛ **لا منطق** في الاختبار (لا `if`/حلقات تحسب المتوقع — اكتب القيمة)؛ **حتمي**: احقن الساعة والعشوائية، لا تعتمد على ترتيب الاختبارات ولا على بيانات متبقية؛ **مستقل**: كل اختبار يبني ما يحتاج ويترك DB كما وجدها (معاملة تُلغى)؛ **سريع**: المجموعة كاملة في دقائق وإلا لن تُشغَّل.

### ماذا تختبر (وماذا لا)
- **السلوك عبر الواجهة العامة**: مدخلات → مخرجات/آثار مرئية. لا تختبر دوالًا خاصة؛ إن احتجت، فهي وحدة مستقلة تطلب الاستخراج.
- **الحالات**: السعيد، الحدود (0، 1، الأقصى، فارغ، Unicode، سالب)، الفشل (مدخل سيئ، تبعية معطلة، تزامن)، **كل خطأ أُصلح** (regression test أولًا).
- **لا تختبر**: المكتبة (`Array.sort` يعمل)، الـ getters، الأنواع (المترجم يفعل)، التنفيذ الداخلي (أي دالة استُدعيت بأي ترتيب — هذا ما يجعل الاختبارات تنكسر عند كل refactoring).
- **التغطية** مقياس لما *لم* يُختبر، لا لجودة ما اختُبر؛ 100% تغطية مع asserts فارغة = صفر ثقة. استخدمها لاكتشاف الفجوات (`node --test --experimental-test-coverage`).

### بدائل الاختبار (test doubles)
- **Fake**: تنفيذ حقيقي مبسّط (repository في Map، ساعة يدوية). **المفضّل**: يحترم العقد، لا يعرف شيئًا عن التنفيذ.
- **Stub**: يعيد قيمة ثابتة (`pricesFor → Map`). للمدخلات.
- **Spy**: يسجّل الاستدعاءات (`events.push`). للتحقق من **أثر مرئي** (أُرسل حدث واحد).
- **Mock**: توقعات مسبقة على الاستدعاءات (`expect(x).toHaveBeenCalledWith(...)`). **الفخ**: اختبار يصف *كيف* يعمل الكود بدل *ماذا* يفعل → ينكسر عند كل تغيير داخلي ولا يكتشف أخطاء التكامل. استخدمه نادرًا، للحدود الخارجية.
- قاعدة: **زيّف ما لا تملك أو ما هو بطيء/غير حتمي** (شبكة، ساعة، عشوائية)؛ **لا تزيّف ما تملك** (المجال) ولا DB إن كان الاختبار عن SQL.

### DB وHTTP والزمن
- **DB**: اختبارات التكامل على PostgreSQL حقيقي (محلي/Docker/CI). العزل: كل اختبار داخل `BEGIN … ROLLBACK` بنفس العميل، أو schema/قاعدة لكل تشغيل. لا SQLite "لأنه أسرع" — SQL مختلف، والـ `EXPLAIN` بلا معنى.
- **HTTP**: شغّل الخادم الحقيقي على المنفذ `0` (عشوائي)، نادِه بـ `fetch`، أغلقه في `after`. لا تختبر الـ handler بـ `req/res` وهميين — تختبر سلوك HTTP كاملًا (أكواد، رؤوس، JSON).
- **الزمن**: `now` معامل/منفذ (M4.0)، أو `mock.timers` في `node:test` للمؤقتات.
- **العشوائية/المعرّفات**: احقنها أو تحقق بالشكل (`/^[0-9a-f-]{36}$/`) لا بالقيمة.

### TDD عمليًا
أحمر (اكتب اختبارًا يفشل للسلوك التالي) → أخضر (أبسط كود يمرّ) → نظّف (refactor تحت الاختبار). يفيد حيث **السلوك واضح والمجال غني** (قواعد تسعير، محلّلات، آلات حالات): يفرض تصميمًا قابلًا للاختبار ويمنع الإفراط. يفيد أقل في الاستكشاف (لا تعرف الواجهة بعد — جرّب ثم اكتب الاختبارات) وفي الربط بالبنية التحتية. القاعدة الصارمة الوحيدة: **كل خطأ يُصلَح يبدأ باختبار أحمر يعيد إنتاجه.**

---

## 4. النموذج الذهني

```
   Code → Expected behavior (من AC) → Test (AAA، اسم سلوكي، حتمي، معزول) → Confidence (تغيير بلا خوف)

   اختبر كل سلوك في أرخص مستوى يمنحك الثقة فيه:
   منطق المجال → unit (ms)      SQL/الربط → integration مع PostgreSQL حقيقي      المسار الكامل → e2e قليل
   زيّف ما لا تملك أو ما هو بطيء/غير حتمي.  لا تزيّف ما تملك.  Fake > Stub/Spy > Mock.
   التغطية تكشف ما لم يُختبر فقط.  كل خطأ مُصلَح = اختبار أحمر أولًا.
```

---

## 5. الرسم التوضيحي

```mermaid
flowchart TB
  subgraph Pyramid["توزيع الاختبارات (مجال غني)"]
    E["e2e: 5–10 مسارات حرجة"] --> I["integration: repositories, SQL, HTTP routes"] --> U["unit: domain rules, use cases with fakes — المئات"]
  end
  subgraph Levels["ما هو حقيقي في كل مستوى"]
    U2["unit: الكود فقط"] ~~~ I2["integration: + PostgreSQL / FS"] ~~~ E2["e2e: + HTTP server + كل شيء"]
  end
```

```
   عزل اختبارات DB بمعاملة تُلغى:
   beforeEach: client = pool.connect(); BEGIN
   test:        INSERT… SELECT…  (كل شيء عبر نفس client)
   afterEach:   ROLLBACK; release          → DB نظيفة، الاختبارات متوازية على اتصالات مختلفة لا ترى بعضها (L3-M3.14 العزل)

   Fake vs Mock:
   fake repo:  Map في الذاكرة ينفّذ العقد → الاختبار يفحص النتيجة (الصف موجود؟)            ✓ يصمد أمام refactoring
   mock repo:  expect(repo.save).calledWith({...}) → الاختبار يفحص الاستدعاء                ✗ ينكسر إن غيّرت save إلى upsert
```

---

## 6. مثال بسيط

```typescript
// src/pricing.ts + اختباره — unit نقي: AAA، اسم سلوكي، حدود، فشل، ساعة محقونة
export type Coupon = { percentOff: number; expiresAt: Date };
export function priceWithCoupon(subtotalCents: number, coupon: Coupon | undefined, now: Date): number {
  if (!Number.isInteger(subtotalCents) || subtotalCents < 0) throw new RangeError("subtotal must be a non-negative integer (cents)");
  if (!coupon || coupon.expiresAt <= now) return subtotalCents;
  return subtotalCents - Math.floor(subtotalCents * coupon.percentOff / 100);
}
```

```typescript
// src/pricing.test.ts
import { describe, it } from "node:test"; import assert from "node:assert/strict";
import { priceWithCoupon } from "./pricing.js";

const NOW = new Date("2026-10-02T12:00:00Z");
const coupon = (over: Partial<{ percentOff: number; expiresAt: Date }> = {}) => ({ percentOff: 10, expiresAt: new Date("2026-12-31"), ...over });   // builder: Arrange بسطر

describe("priceWithCoupon", () => {
  it("applies percent discount, flooring in the customer's favour", () => {
    assert.equal(priceWithCoupon(1005, coupon({ percentOff: 10 }), NOW), 905);            // 100.5 → 100 خصم
  });
  it("ignores an expired coupon (boundary: expiring exactly now counts as expired)", () => {
    assert.equal(priceWithCoupon(1000, coupon({ expiresAt: NOW }), NOW), 1000);
  });
  it("returns subtotal unchanged without a coupon", () => assert.equal(priceWithCoupon(0, undefined, NOW), 0));
  it("rejects invalid subtotals with a clear message", () => {
    for (const bad of [-1, 10.5, NaN]) assert.throws(() => priceWithCoupon(bad, undefined, NOW), { name: "RangeError", message: /non-negative integer/ });
  });
});
```

---

## 7. مثال كود

ثلاثة مستويات على نفس الميزة (إنشاء مستخدم): integration مع PostgreSQL حقيقي بمعاملة تُلغى، e2e عبر HTTP حقيقي، واختبار خاصية.

```typescript
// src/users-repo.ts — repository حقيقي (SQL) + دالة المصنع للخادم؛ ما سنختبره على المستويين
import pg from "pg"; import { createServer } from "node:http";

export class DuplicateEmail extends Error { constructor(readonly email: string) { super(`email taken: ${email}`); } }
export const makeUsersRepo = (q: Pick<pg.PoolClient, "query">) => ({
  async create(orgId: number, email: string) {
    try { return (await q.query<{ id: number }>("INSERT INTO users (organization_id, email) VALUES ($1, $2) RETURNING id", [orgId, email])).rows[0]!.id; }
    catch (e) { if ((e as pg.DatabaseError).code === "23505") throw new DuplicateEmail(email); throw e; }          // القيد هو الحكم (L3-M3.10)
  },
  async findByEmail(email: string) { return (await q.query<{ id: number; email: string }>("SELECT id, email FROM users WHERE lower(email) = lower($1)", [email])).rows[0]; },
});

export function makeServer(repo: ReturnType<typeof makeUsersRepo>) {                     // HTTP رقيق: يترجم فقط
  return createServer(async (req, res) => {
    if (req.method === "POST" && req.url === "/users") {
      let body = ""; for await (const c of req) body += c;
      const { orgId, email } = JSON.parse(body) as { orgId?: number; email?: string };
      if (!orgId || !email) { res.writeHead(422, { "content-type": "application/json" }); return res.end(JSON.stringify({ error: "orgId and email required" })); }
      try { const id = await repo.create(orgId, email); res.writeHead(201, { "content-type": "application/json" }); return res.end(JSON.stringify({ id })); }
      catch (e) { if (e instanceof DuplicateEmail) { res.writeHead(409, { "content-type": "application/json" }); return res.end(JSON.stringify({ error: "email taken" })); } throw e; }
    }
    res.writeHead(404); res.end();
  });
}
```

```typescript
// src/users-repo.int.test.ts — integration: PostgreSQL حقيقي، كل اختبار داخل معاملة تُلغى → معزول وسريع ولا ينظّف شيئًا
import { test, before, after, beforeEach, afterEach } from "node:test"; import assert from "node:assert/strict";
import pg from "pg"; import { makeUsersRepo, DuplicateEmail } from "./users-repo.js";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL ?? "postgres://postgres:dev@localhost:5432/store" });
let client: pg.PoolClient; let orgId: number;
before(async () => { const c = await pool.connect(); try { await c.query("SELECT 1"); } finally { c.release(); } });   // فشل مبكر وواضح إن غابت DB
beforeEach(async () => { client = await pool.connect(); await client.query("BEGIN"); orgId = (await client.query<{ id: number }>("INSERT INTO organizations (name) VALUES ('t') RETURNING id")).rows[0]!.id; });
afterEach(async () => { await client.query("ROLLBACK"); client.release(); });
after(async () => { await pool.end(); });

test("create then findByEmail is case-insensitive", async () => {
  const repo = makeUsersRepo(client);
  const id = await repo.create(orgId, "Ali@Example.com");
  assert.equal((await repo.findByEmail("ALI@example.com"))?.id, id);
});
test("duplicate email (any case) surfaces as DuplicateEmail, not a raw pg error", async () => {
  const repo = makeUsersRepo(client); await repo.create(orgId, "a@x.com");
  await assert.rejects(repo.create(orgId, "A@X.COM"), DuplicateEmail);                  // يختبر الفهرس الوظيفي lower(email) فعلًا — لا يمكن بـ fake
});
```

```typescript
// src/users.e2e.test.ts — e2e: خادم حقيقي على منفذ عشوائي + fetch؛ قليل، للمسار السعيد وأهم فشل. (الـ repo هنا fake لأن SQL اختُبر أعلاه؛ في CI الكامل يكون حقيقيًا)
import { test, before, after } from "node:test"; import assert from "node:assert/strict";
import { makeServer, DuplicateEmail } from "./users-repo.js";

const fakeRepo = () => { const rows = new Map<string, number>(); let n = 0; return {
  create: async (_o: number, email: string) => { const k = email.toLowerCase(); if (rows.has(k)) throw new DuplicateEmail(email); rows.set(k, ++n); return n; },
  findByEmail: async (email: string) => { const id = rows.get(email.toLowerCase()); return id ? { id, email } : undefined; } }; };

const server = makeServer(fakeRepo()); let base = "";
before(async () => { await new Promise<void>(r => server.listen(0, "127.0.0.1", r)); const a = server.address() as { port: number }; base = `http://127.0.0.1:${a.port}`; });
after(async () => { await new Promise(r => server.close(r)); });

const post = (body: unknown) => fetch(`${base}/users`, { method: "POST", body: JSON.stringify(body), headers: { "content-type": "application/json" } });
test("POST /users → 201 with id; second time → 409", async () => {
  const r1 = await post({ orgId: 1, email: "e2e@x.com" }); assert.equal(r1.status, 201); assert.deepEqual(await r1.json(), { id: 1 });
  const r2 = await post({ orgId: 1, email: "E2E@x.com" }); assert.equal(r2.status, 409);
});
test("missing fields → 422 with a message", async () => { const r = await post({}); assert.equal(r.status, 422); assert.match((await r.json() as { error: string }).error, /required/); });
```

```typescript
// src/property.test.ts — اختبار خاصية بلا مكتبة: مولّد مدخلات + خاصية يجب أن تصمد دائمًا (fast-check للمشاريع الحقيقية)
import { test } from "node:test"; import assert from "node:assert/strict";
import { priceWithCoupon } from "./pricing.js";
const rnd = (() => { let s = 42; return () => (s = (s * 1664525 + 1013904223) % 2 ** 32) / 2 ** 32; })();   // بذرة ثابتة → حتمي وقابل لإعادة الإنتاج
test("property: discounted price is within [0, subtotal] and monotonic in percent", () => {
  for (let i = 0; i < 2000; i++) {
    const sub = Math.floor(rnd() * 1_000_000), p1 = Math.floor(rnd() * 100), p2 = Math.min(100, p1 + Math.floor(rnd() * 20)), far = new Date("2099-01-01"), now = new Date();
    const a = priceWithCoupon(sub, { percentOff: p1, expiresAt: far }, now), b = priceWithCoupon(sub, { percentOff: p2, expiresAt: far }, now);
    assert.ok(a >= 0 && a <= sub && b <= a, `sub=${sub} p1=${p1} p2=${p2} a=${a} b=${b}`);     // الرسالة تحمل المثال المضاد
  }
});
```

```bash
# تشغيل بحسب المستوى (أسماء الملفات تحمل المستوى — اتفاقية بسيطة)
node --import tsx --test 'src/**/*.test.ts'            # الكل
node --import tsx --test 'src/**/*.int.test.ts'        # يحتاج DATABASE_URL
node --import tsx --test --experimental-test-coverage 'src/**/*.test.ts'   # أين الفجوات؟
```

---

## 8. مثال من العالم الحقيقي
Project 4: اختبار "القطعة الأخيرة لا تُباع مرتين" (L3-M3.14) **لا يمكن** أن يكون unit — السباق يحدث في DB. هو اختبار تكامل بـ 10 معاملات متزامنة على PostgreSQL حقيقي يتحقق أن `bought === 1`. وفي المقابل، قاعدة "خصم الحجم 5% فوق 10,000" unit بـ 2ms. من يكتب الأولى كـ unit مع repository وهمي يحصل على اختبار أخضر **وسباقًا في الإنتاج**. اختر المستوى بحسب **أين يعيش الخطر**.

## 9. مثال من الإنتاج
فريق لديه 4,000 اختبار وتغطية 92%، ومع ذلك حوادث شهرية. التحليل: 70% من الاختبارات mocks تتحقق من "استُدعيت `repo.save` بـ X" — تنكسر عند كل refactoring (فيُعدَّل الاختبار ليمرّ)، ولا تكتشف SQL خاطئًا ولا قيدًا مفقودًا. استبدال 500 منها بـ 80 اختبار تكامل على DB حقيقي + 10 e2e خفّض الحوادث إلى الربع وزمن المجموعة إلى النصف (الـ mocks كانت بطيئة الإعداد!). **عدد الاختبارات والتغطية ليسا ثقة.**

---

## 10. مفاهيم خاطئة شائعة
1. **"الاختبارات تثبت أن الكود صحيح."** تثبت أن السلوكيات المختبَرة تعمل في الحالات المختبَرة؛ قيمتها في اكتشاف الكسر عند التغيير.
2. **"Unit test = اختبار لكل دالة/صف."** الوحدة سلوك عبر واجهة عامة؛ قد تغطي عدة دوال داخلية.
3. **"الـ mocks تجعل الاختبارات سريعة ومعزولة."** الـ fakes تفعل ذلك؛ الـ mocks تربط الاختبار بالتنفيذ.
4. **"اختبارات DB بطيئة فنستبدلها بـ SQLite/في الذاكرة."** تختبر عندها SQL مختلفًا؛ PostgreSQL محلي بمعاملات تُلغى سريع كفاية (ms لكل اختبار).
5. **"100% تغطية هدف."** التغطية أداة اكتشاف فجوات؛ الهدف ثقة بتكلفة معقولة.
6. **"TDD إما دائمًا أو أبدًا."** أداة سياقية؛ الصارم الوحيد: اختبار أحمر لكل خطأ قبل إصلاحه.

## 11. أخطاء شائعة
1. اختبارات تعتمد على الترتيب أو على بيانات متبقية من اختبار آخر → تفشل عشوائيًا (flaky) ثم تُتجاهل.
2. `Date.now()`/`Math.random()`/`setTimeout` حقيقية في الاختبار → غير حتمي وبطيء.
3. منطق في الاختبار يعيد حساب المتوقع (نسخة ثانية من الخطأ).
4. أسماء مثل `test1`, `works`؛ أو assert بلا رسالة فيفشل بـ `false !== true`.
5. اختبار المسار السعيد فقط؛ أو اختبار التنفيذ (أي دالة استُدعيت).
6. `try/catch` في الاختبار يبتلع الفشل؛ نسيان `await` على `assert.rejects` → اختبار يمرّ دائمًا.
7. مجموعة اختبارات تستغرق 40 دقيقة → لا أحد يشغّلها محليًا → الأخطاء تُكتشف في CI أو الإنتاج.

## 12. تمرين تصحيح
اختبار "يمرّ محليًا ويفشل في CI 1 من كل 5 مرات": `expect(order.createdAt).toEqual(new Date())`… ثم بعد "إصلاحه" بالتسامح 1 ثانية، اختبار آخر يفشل: `expected 3 rows, got 4`.
- **لاحظ:** الفشل غير حتمي ويزداد مع التوازي.
- **دليل:** الاختبار الأول يستخدم الساعة الحقيقية (الفرق في CI أكبر)؛ الثاني يعدّ صفوف جدول مشترك بينما اختبار آخر يُدرج فيه بالتوازي بلا معاملة.
- **فرضية:** عدم الحتمية (زمن) + عدم العزل (حالة مشتركة).
- **تجربة:** احقن `now` وثبّته؛ لفّ اختبارات DB في `BEGIN/ROLLBACK` لكل اختبار على اتصال خاص؛ شغّل المجموعة 20 مرة بـ `--test-concurrency` عالٍ.
- **استنتاج:** الاختبار المتذبذب ليس "حظًا"؛ له سبب دائمًا (زمن، ترتيب، حالة مشتركة، شبكة). أصلحه أو احذفه — لا تُعد تشغيله حتى يمرّ.

## 13. تمرين معماري
صمّم **استراتيجية اختبار Project 5** قبل بنائه: جدول بكل سلوك رئيسي (تسجيل، دخول، جلسة، تفويض، إبطال الجلسات، تحديد المعدّل) × المستوى المختار ولماذا (أين الخطر؟) × ما يُزيَّف وما يكون حقيقيًا × زمن التشغيل المستهدف. حدّد: كيف تُشغَّل اختبارات DB في CI (PostgreSQL كخدمة)، كيف تعزل، ما الـ e2e الخمسة التي تستحق، واختبار خاصية واحدًا على الأقل (مثلًا: تجزئة كلمة المرور لا تعيد النص). ثم ACTRR: الهرم أم الكأس لمشروعك ولماذا.

## 14. الصلة بعصر AI
الاختبارات هي **آلية التحقق الأولى** من كود يولّده نموذج (L8-M8.7): اكتب/راجع الاختبارات بنفسك من معايير القبول، ودع النموذج يجعلها خضراء — لا العكس (نموذج يكتب الكود والاختبار معًا قد يختبر ما كتبه لا ما أردته). AI ممتاز في: تعداد الحالات الحدّية، توليد builders وfakes، تحويل GWT إلى هياكل اختبار، واقتراح اختبارات خاصية. راجع مخرجاته بحثًا عن: mocks للتنفيذ، asserts فارغة أو ضعيفة (`toBeDefined`)، زمن حقيقي، واختبارات تنسخ منطق الكود.

## 15–17. Master / Understand / Defer
- 🔴 الغاية: ثقة للتغيير + توثيق حيّ؛ الأنواع الثلاثة بحسب ما هو حقيقي واختيار المستوى بحسب الخطر؛ AAA + اسم سلوكي + حتمي + معزول؛ ماذا تختبر وماذا لا؛ fake > mock ولماذا؛ DB بمعاملة تُلغى؛ HTTP بخادم حقيقي على منفذ 0؛ الزمن محقون؛ اختبار أحمر لكل خطأ.
- 🟠 الهرم vs الكأس؛ اختبارات الخاصية والعقد؛ التغطية كأداة فجوات؛ TDD كأداة سياقية؛ `mock.timers`؛ تشخيص الاختبارات المتذبذبة؛ builders.
- ⚪ أُطر الاختبار الكاملة (Vitest/Jest) وميزاتها، اختبار الواجهات الأمامية (Playwright) تفصيليًا، mutation testing، اختبار الحمل (يأتي في L7-M7.8)، snapshot testing ومخاطره.

## 18. الخلاصة
1. الاختبار يشتري ثقة قابلة للتكرار لتغيّر بلا خوف، ويوثّق السلوك حيًّا.
2. unit/integration/e2e بحسب ما هو حقيقي؛ اختبر كل سلوك في أرخص مستوى يمنح الثقة فيه، وحيث يعيش الخطر.
3. AAA، اسم يقرأه غير المبرمج، حتمي (ساعة وعشوائية محقونتان)، معزول (معاملة تُلغى)، سريع.
4. اختبر السلوك عبر الواجهة العامة بحالاته الحدّية والفاشلة؛ لا تختبر التنفيذ ولا المكتبة؛ fake قبل mock.
5. التغطية تكشف الفجوات فقط؛ كل خطأ يبدأ باختبار أحمر؛ الاختبار المتذبذب يُصلَح أو يُحذف.

## 19. مراجع رسمية
- Node.js — Test runner (`node:test`: hooks, `mock.timers`, coverage): https://nodejs.org/api/test.html
- Node.js — `node:assert` strict mode: https://nodejs.org/api/assert.html
- Martin Fowler — Test Doubles (fake/stub/spy/mock), Test Pyramid: https://martinfowler.com/bliki/TestDouble.html , https://martinfowler.com/bliki/TestPyramid.html
- Kent C. Dodds — The Testing Trophy and Testing Classifications: https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications
- fast-check — property-based testing for TypeScript: https://fast-check.dev/

## المصطلحات
| العربية | English |
|---|---|
| اختبار وحدة / تكامل / شامل | Unit / Integration / End-to-end test |
| هرم الاختبار / كأس الاختبار | Test pyramid / Testing trophy |
| ترتيب-فعل-تحقق | Arrange / Act / Assert (AAA) |
| بديل اختبار | Test double |
| مزيّف / بديل ثابت / جاسوس / محاكٍ | Fake / Stub / Spy / Mock |
| اختبار انحدار | Regression test |
| اختبار خاصية | Property-based test |
| اختبار متذبذب | Flaky test |
| تغطية | Coverage |
| التطوير الموجَّه بالاختبار | Test-Driven Development (TDD) |
| حتمي | Deterministic |
| دالة بناء (للاختبار) | Test data builder |
