# Module 5.6 — التزامن في منطق الأعمال
## Concurrency in Business Logic: double booking/double spend, atomic updates, pessimistic & optimistic locking, deadlocks, idempotency, unique constraints, distributed locks

> **المستوى:** Level 5 | **الموقع:** [6 من 13]
> **السابق:** [M5.5 — Threat Modeling](module-5.5-threat-modeling.md) | **التالي:** [M5.7 — Anatomy of a Production System](module-5.7-production-anatomy.md)

---

## 1. المتطلبات
> **قبل أن تتعلم هذا، يجب أن تفهم:**
- [ ] المعاملات، العزل، `FOR UPDATE`، `withTransaction` بإعادة المحاولة على 40001/40P01 — [L3-M3.14](../level-3-core-computer-science/module-3.14-transactions-acid.md)
- [ ] سباق القراءة-ثم-الكتابة، التحديث الذري بشرط — [L2-M2.13](../level-2-computer-systems/module-2.13-web-app-architecture.md), [L3-M3.14](../level-3-core-computer-science/module-3.14-transactions-acid.md)
- [ ] القيود كحَكَم نهائي (UNIQUE, CHECK) — [L3-M3.10](../level-3-core-computer-science/module-3.10-databases-from-zero.md)
- [ ] Idempotency-Key في API — [M5.1](module-5.1-api-design.md)
- [ ] حلقة الأحداث: التزامن داخل العملية بين `await`s — [L2-M2.7](../level-2-computer-systems/module-2.7-concurrency-event-loop.md)

## 2. أهداف التعلّم
- التعرّف على **سباقات منطق الأعمال** حيثما وُجد "اقرأ ثم قرّر ثم اكتب": حجز مزدوج، إنفاق مزدوج، كوبون يُستخدم مرتين، حدّ يُتجاوز، عدّاد خاطئ، "آخر واحد" يُباع مرتين — ولماذا لا تظهر في التطوير وتظهر في الإنتاج.
- اختيار الأداة الصحيحة من **السلّم**: تحديث ذري بشرط → قيد فريد/CHECK → قفل تشاؤمي (`FOR UPDATE`/`SKIP LOCKED`/advisory) → قفل تفاؤلي (`version` + 409 / `ETag` + `If-Match`) → SERIALIZABLE + retry → تسلسل عبر طابور.
- فهم **الجمود** (deadlock) وسببه (ترتيب أقفال متعاكس) وعلاجه (ترتيب ثابت، أقفال أقل، مهلة + retry)، و**الانتظار** كأثر جانبي للأقفال على الإنتاجية.
- جعل العمليات **idempotent** من الداخل (مفاتيح طبيعية، `ON CONFLICT`, حالة انتقالية) لا من الـ API فقط، وفهم حدود **الأقفال الموزّعة** (Redis `SET NX PX`، انتهاء، fencing tokens) ومتى تكون DB أبسط وأصح.
- كتابة **اختبار تزامن** إلزامي لكل كتابة على مورد مشترك (`Promise.all × N` على DB حقيقية) وإثبات الصحة بالأرقام.

---

## 3. شرح للمبتدئ

### لماذا الآن؟
في L3-M3.14 تعلّمت الآلية (المعاملات والعزل والأقفال). هنا تعلّم **التعرّف على المشكلة في منطق الأعمال** وتصميم الحل من البداية. كل سباق له الشكل نفسه: **اقرأ** حالة (رصيد، مخزون، "هل الكوبون مستخدم؟")، **قرّر** في الكود، **اكتب** النتيجة. بين القراءة والكتابة، طلب آخر فعل الشيء نفسه بنفس القراءة القديمة. في التطوير لا يحدث لأنك مستخدم واحد؛ في الإنتاج يحدث **بالضبط** حين يهم: عرض محدود، نقرة مزدوجة، إعادة محاولة شبكة (M5.1)، أو مهاجم يرسل 50 طلبًا متزامنًا عمدًا (هجوم السباق — race condition attack — طريقة معروفة لصرف كوبون مرارًا أو تجاوز حدّ سحب).

### السلّم: من الأبسط إلى الأثقل
1. **تحديث ذري بشرط** (الأفضل حين يكفي): `UPDATE wallets SET balance = balance - $1 WHERE id = $2 AND balance >= $1` ثم افحص `rowCount`. القرار **داخل** عبارة واحدة تنفّذها DB على أحدث قيمة تحت قفل الصف. لا قراءة مسبقة، لا سباق. ينطبق على: المخزون، الأرصدة، العدّادات، انتقالات الحالة (`UPDATE orders SET status='cancelled' WHERE id=$1 AND status='pending'`).
2. **القيود كحَكَم**: "مقعد واحد لكل حجز" → `UNIQUE (event_id, seat_no)`؛ "كوبون يُستخدم مرة لكل مستخدم" → `UNIQUE (coupon_id, user_id)`؛ "الرصيد لا يسلب" → `CHECK (balance >= 0)`. الإدراج المتزامن الثاني **يفشل** مهما كان كودك (L3-M3.10 "القيود حَكَم نهائي"). استخدم `INSERT … ON CONFLICT DO NOTHING RETURNING` لتعرف إن فزت دون استثناء.
3. **قفل تشاؤمي** (`SELECT … FOR UPDATE`): حين القرار يحتاج **عدة صفوف/حسابًا معقّدًا** قبل الكتابة (حدّ 3 إعارات نشطة = عدّ صفوف أخرى؛ write skew L3-M3.14): اقفل الصف "الأب" (المستخدم/الحساب) أولًا فيتسلسل كل من يمسّه. `FOR UPDATE SKIP LOCKED` لتوزيع عمل (طابور في DB: كل worker يأخذ صفوفًا غير مقفولة) و`NOWAIT` للفشل الفوري. **Advisory locks** (`pg_advisory_xact_lock(key)`) لقفل "مفهوم" لا صفًّا (مثلًا "تشغيل تقرير المستأجر X مرة واحدة في آن").
4. **قفل تفاؤلي** (optimistic): لا قفل أثناء تفكير المستخدم (دقائق!) — اقرأ مع `version`، عدّل، اكتب بـ `UPDATE … WHERE id=$1 AND version=$2` و`version = version + 1`؛ `rowCount = 0` → **409 Conflict** "تغيّر منذ قراءتك، أعد التحميل". في HTTP: `ETag` في GET و`If-Match` في PUT/PATCH (RFC 9110) — نفس الفكرة كعقد API (M5.1). مناسب للتحرير التعاوني ونماذج الإعدادات، لا للمخزون عالي التنافس (سيفشل الجميع ما عدا واحد ويعيدون).
5. **SERIALIZABLE + retry**: حين المنطق معقّد وتخشى نسيان قفل؛ DB تكتشف الشذوذ وترمي 40001، وأنت تعيد (L3-M3.14 `withTransaction`). ثمنه إعادات تحت التنافس.
6. **التسلسل عبر طابور** (M5.9): كل عمليات الكيان X تمرّ من مستهلك واحد (partition key) → لا تزامن أصلًا. للأنظمة الموزّعة والمعالجة الثقيلة.

القاعدة: **اختر أدنى درجة تكفي**، واكتب في PR لماذا.

### الجمود (Deadlock)
معاملة A تقفل الصف 1 ثم تطلب 2؛ B تقفل 2 ثم تطلب 1 → كلاهما ينتظر للأبد؛ PostgreSQL يكتشف ويقتل واحدة بـ `40P01`. يحدث في منطق الأعمال عند: تحويل بين حسابين (A→B وB→A متزامنين)، تحديث عدة صفوف بترتيب مختلف (`UPDATE … WHERE id IN (…)` بترتيب غير محدّد!)، FK + تحديث الأب. العلاج: (1) **ترتيب ثابت** للأقفال (رتّب المعرّفات تصاعديًا قبل القفل: `ORDER BY id FOR UPDATE`)؛ (2) أقفال أقل وأقصر (لا I/O خارجي داخل المعاملة)؛ (3) `lock_timeout` + retry على 40P01 (الآلية موجودة في `withTransaction`)؛ (4) قفل "الأب" الواحد بدل عدة أبناء.

### Idempotency من الداخل
M5.1 حلّت الطبقة الخارجية (مفتاح من العميل). داخل النظام الأحداث تتكرّر أيضًا: webhook يصل مرتين، وظيفة تُعاد بعد انهيار worker (M5.9 at-least-once)، retry داخلي. اجعل **العملية نفسها** idempotent: مفتاح طبيعي + `UNIQUE` + `ON CONFLICT DO NOTHING` (`payments(provider_event_id)`), انتقالات حالة بشرط (`WHERE status = 'pending'` — التنفيذ الثاني يحدّث 0 صف ويعتبر نجاحًا)، وتسجيل "ما تمّ" في **نفس المعاملة** مع الأثر. السؤال الهندسي لكل كتابة: **"ماذا لو نُفّذت مرتين؟"** — إن كان الجواب "كارثة" فليس لديك idempotency بعد.

### الأقفال الموزّعة — بحذر
حين يكون المورد خارج DB (استدعاء API خارجي مرة واحدة، مهمة مجدولة على N نسخة) يستخدم الناس Redis `SET key value NX PX 30000`. المشاكل الحقيقية: **الانتهاء مقابل مدة العمل** (العمل أخذ 40 ثانية، القفل انتهى عند 30، نسخة ثانية دخلت → اثنان يعملان) وGC pauses؛ الحل الصحيح **fencing token** (رقم متزايد يُرفق مع كل كتابة والمورد يرفض الأقدم) — وهو ما لا يدعمه معظم من يستخدم Redlock. القاعدة: إن كان الأثر النهائي في DB، فـ **DB هي القفل** (advisory lock/`FOR UPDATE`/قيد) وهي أبسط وأصحّ. إن كان الأثر خارجيًا، اجعله idempotent من جهته (مفتاح idempotency لمزوّد الدفع) بدل الاعتماد على القفل وحده.

### التزامن داخل العملية الواحدة
Node أحادي الخيط لكن **بين كل `await` وآخر** يدخل طلب آخر (L2-M2.7). كاش في الذاكرة يُقرأ ثم يُكتب؛ عدّاد `this.count++` بعد `await` — السباقات موجودة وإن كانت أندر. والحل نفسه: اجعل القرار والكتابة ذريين (بلا `await` بينهما) أو مرّر عبر طابور وعود (promise chain) لكل مفتاح. لكن تذكّر: مع N نسخة من الخادم (M5.10) **لا شيء في ذاكرة العملية يحميك** — الحَكَم المشترك هو DB/Redis.

---

## 4. النموذج الذهني

```
   كل "اقرأ → قرّر → اكتب" على مورد مشترك = سباق محتمل.  اسأل: ماذا يحدث لو وصل طلبان في نفس الملّي ثانية؟ ولو نُفّذ مرتين؟
   السلّم (اختر الأدنى الكافي):
     1 UPDATE … WHERE شرط (القرار داخل DB)   2 UNIQUE/CHECK + ON CONFLICT   3 FOR UPDATE على الأب (ترتيب ثابت)
     4 version + 409 / ETag + If-Match          5 SERIALIZABLE + retry          6 طابور بمفتاح تقسيم
   Deadlock = ترتيب أقفال متعاكس → رتّب، قلّل، مهلة + retry.   الحَكَم المشترك بين النسخ هو DB لا الذاكرة.
   الدليل: اختبار Promise.all × 50 على DB حقيقية — "بالضبط واحد ينجح".
```

---

## 5. الرسم التوضيحي

```mermaid
sequenceDiagram
  participant A as Request A
  participant B as Request B
  participant DB as PostgreSQL
  Note over A,B: ✗ read-decide-write
  A->>DB: SELECT stock FROM products WHERE id=7  (1)
  B->>DB: SELECT stock FROM products WHERE id=7  (1)
  A->>DB: UPDATE products SET stock = 0
  B->>DB: UPDATE products SET stock = 0
  Note over A,B: both "succeed" - sold twice
  Note over A,B: ✓ atomic conditional update
  A->>DB: UPDATE … SET stock = stock-1 WHERE id=7 AND stock >= 1  (rowCount 1)
  B->>DB: UPDATE … SET stock = stock-1 WHERE id=7 AND stock >= 1  (waits for A's row lock, then rowCount 0)
  B-->>B: 409 out of stock
```

```
   تفاؤلي عبر HTTP:
   GET /settings/42        → 200, ETag: "v7"
   PUT /settings/42  If-Match: "v7"  → UPDATE … WHERE id=42 AND version=7 → rowCount 1 → 200, ETag: "v8"
   PUT /settings/42  If-Match: "v7"  (من تبويب آخر)  → rowCount 0 → 412 Precondition Failed (أو 409) → أعد التحميل وادمج
```

---

## 6. مثال بسيط

```typescript
// src/coupon.ts — "كوبون يُستخدم مرة لكل مستخدم": ثلاث طرق، واحدة فقط صحيحة تحت التزامن
import type pg from "pg";
// ✗ 1) اقرأ ثم قرّر ثم اكتب — 50 طلبًا متزامنًا = 50 استخدامًا
export async function redeemRacy(c: pg.PoolClient, couponId: string, userId: string) {
  const used = await c.query("SELECT 1 FROM coupon_uses WHERE coupon_id=$1 AND user_id=$2", [couponId, userId]);
  if (used.rowCount) return "already_used";
  await c.query("INSERT INTO coupon_uses(coupon_id, user_id) VALUES ($1,$2)", [couponId, userId]); return "ok";
}
// ✓ 2) القيد حَكَم: UNIQUE(coupon_id, user_id) + ON CONFLICT → الإدراج الثاني يعيد 0 صف. بلا قفل صريح، بلا سباق، idempotent
export async function redeemAtomic(c: pg.PoolClient, couponId: string, userId: string) {
  const r = await c.query("INSERT INTO coupon_uses(coupon_id, user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING RETURNING 1", [couponId, userId]);
  return r.rowCount ? "ok" : "already_used";
}
// ✓ 3) حدّ استخدام إجمالي للكوبون (max_uses): تحديث ذري بشرط على صف الكوبون — القرار داخل العبارة
export async function redeemLimited(c: pg.PoolClient, couponId: string, userId: string) {
  const r = await c.query("UPDATE coupons SET uses = uses + 1 WHERE id=$1 AND uses < max_uses RETURNING uses", [couponId]);
  if (!r.rowCount) return "exhausted";
  await c.query("INSERT INTO coupon_uses(coupon_id, user_id) VALUES ($1,$2)", [couponId, userId]); return "ok";   // في نفس المعاملة: إن فشل الـ UNIQUE هنا تُلغى الزيادة أيضًا
}
```

---

## 7. مثال كود

```typescript
// src/db.ts — pool + withTransaction (من L3-M3.14) مع retry على serialization/deadlock ومهل
import pg from "pg";
export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL ?? "postgres://app:app@127.0.0.1:5432/store", max: 20 });
const RETRYABLE = new Set(["40001", "40P01"]);
export async function withTransaction<T>(fn: (c: pg.PoolClient) => Promise<T>, opts: { isolation?: "READ COMMITTED" | "REPEATABLE READ" | "SERIALIZABLE"; retries?: number } = {}): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    const c = await pool.connect();
    try { await c.query(`BEGIN ISOLATION LEVEL ${opts.isolation ?? "READ COMMITTED"}`); await c.query("SET LOCAL lock_timeout = '3s'; SET LOCAL statement_timeout = '5s'"); const r = await fn(c); await c.query("COMMIT"); return r; }
    catch (e) { await c.query("ROLLBACK").catch(() => {}); const code = (e as pg.DatabaseError).code; if (code && RETRYABLE.has(code) && attempt <= (opts.retries ?? 5)) { await new Promise(r => setTimeout(r, 10 * 2 ** attempt * Math.random())); continue; } throw e; }
    finally { c.release(); }
  }
}
```

```typescript
// src/booking.ts — أربع مشكلات أعمال وأدواتها من السلّم
import type pg from "pg";
export type Result = "ok" | "sold_out" | "insufficient_funds" | "conflict" | "limit_reached";

// (1) آخر مقعد: تحديث ذري بشرط + قيد UNIQUE(event_id, seat_no) كطبقة ثانية
export async function bookSeat(c: pg.PoolClient, eventId: string, seatNo: number, userId: string): Promise<Result> {
  const r = await c.query("INSERT INTO seats(event_id, seat_no, user_id) VALUES ($1,$2,$3) ON CONFLICT (event_id, seat_no) DO NOTHING RETURNING 1", [eventId, seatNo, userId]);
  return r.rowCount ? "ok" : "sold_out";
}
// (2) إنفاق مزدوج: خصم ذري بشرط الرصيد + CHECK(balance >= 0) كحارس أخير + دفتر أستاذ idempotent بمفتاح طبيعي
export async function spend(c: pg.PoolClient, walletId: string, cents: number, idemKey: string): Promise<Result> {
  const dup = await c.query("INSERT INTO ledger(wallet_id, idem_key, cents) VALUES ($1,$2,$3) ON CONFLICT (idem_key) DO NOTHING RETURNING 1", [walletId, idemKey, -cents]);
  if (!dup.rowCount) return "ok";                                                                       // نُفّذت من قبل: نجاح idempotent، لا خصم ثانٍ
  const r = await c.query("UPDATE wallets SET balance = balance - $1 WHERE id = $2 AND balance >= $1", [cents, walletId]);
  if (!r.rowCount) throw Object.assign(new Error("insufficient"), { result: "insufficient_funds" as Result });   // throw → ROLLBACK يلغي سطر الدفتر أيضًا
  return "ok";
}
// (3) حدّ "3 حجوزات نشطة لكل مستخدم" (write skew): اقفل صف المستخدم أولًا فيتسلسل العدّ والإدراج
export async function bookWithLimit(c: pg.PoolClient, userId: string, eventId: string, max = 3): Promise<Result> {
  await c.query("SELECT 1 FROM users WHERE id = $1 FOR UPDATE", [userId]);                              // قفل الأب
  const n = await c.query("SELECT count(*)::int AS n FROM bookings WHERE user_id = $1 AND active", [userId]);
  if (n.rows[0].n >= max) return "limit_reached";
  await c.query("INSERT INTO bookings(user_id, event_id, active) VALUES ($1,$2,true)", [userId, eventId]); return "ok";
}
// (4) تفاؤلي للتحرير البشري: version + 409
export async function updateProfile(c: pg.PoolClient, userId: string, expectedVersion: number, displayName: string): Promise<{ result: Result; version?: number }> {
  const r = await c.query("UPDATE profiles SET display_name = $1, version = version + 1 WHERE user_id = $2 AND version = $3 RETURNING version", [displayName, userId, expectedVersion]);
  return r.rowCount ? { result: "ok", version: r.rows[0].version } : { result: "conflict" };
}
// (5) تحويل بين محفظتين بلا deadlock: ترتيب ثابت للأقفال
export async function transfer(c: pg.PoolClient, from: string, to: string, cents: number): Promise<Result> {
  const [first, second] = [from, to].sort();                                                             // دائمًا بنفس الترتيب مهما كان الاتجاه
  await c.query("SELECT 1 FROM wallets WHERE id IN ($1,$2) ORDER BY id FOR UPDATE", [first, second]);
  const r = await c.query("UPDATE wallets SET balance = balance - $1 WHERE id = $2 AND balance >= $1", [cents, from]); if (!r.rowCount) return "insufficient_funds";
  await c.query("UPDATE wallets SET balance = balance + $1 WHERE id = $2", [cents, to]); return "ok";
}
```

```typescript
// src/concurrency.int.test.ts — الدليل بالأرقام: Promise.all × N على PostgreSQL حقيقية
import { test, before, after } from "node:test"; import assert from "node:assert/strict";
import { pool, withTransaction } from "./db.js"; import { bookSeat, spend, bookWithLimit, updateProfile, transfer } from "./booking.js"; import { redeemRacy, redeemAtomic } from "./coupon.js";

before(async () => { await pool.query(`
  DROP TABLE IF EXISTS seats, ledger, wallets, bookings, users, profiles, coupon_uses, coupons CASCADE;
  CREATE TABLE seats (event_id text, seat_no int, user_id text, PRIMARY KEY (event_id, seat_no));
  CREATE TABLE wallets (id text PRIMARY KEY, balance int NOT NULL CHECK (balance >= 0));
  CREATE TABLE ledger (id serial PRIMARY KEY, wallet_id text, idem_key text UNIQUE, cents int);
  CREATE TABLE users (id text PRIMARY KEY); CREATE TABLE bookings (id serial PRIMARY KEY, user_id text REFERENCES users(id), event_id text, active bool);
  CREATE TABLE profiles (user_id text PRIMARY KEY, display_name text, version int NOT NULL DEFAULT 1);
  CREATE TABLE coupons (id text PRIMARY KEY, uses int NOT NULL DEFAULT 0, max_uses int NOT NULL); CREATE TABLE coupon_uses (coupon_id text, user_id text, PRIMARY KEY (coupon_id, user_id));
  INSERT INTO wallets VALUES ('w1', 1000), ('w2', 1000); INSERT INTO users VALUES ('u1'); INSERT INTO profiles(user_id, display_name) VALUES ('u1', 'Ana'); INSERT INTO coupons VALUES ('c1', 0, 1000);`);
  for (let i = 0; i < 25; i++) { const c = await pool.connect(); c.release(); }   // تسخين الـ pool حتى يكون التزامن حقيقيًا
});
after(() => pool.end());
const settled = async <T>(ps: Promise<T>[]) => { const r = await Promise.allSettled(ps); return { ok: r.filter(x => x.status === "fulfilled").map(x => (x as PromiseFulfilledResult<T>).value), errors: r.filter(x => x.status === "rejected").map(x => (x as PromiseRejectedResult).reason as Error & { result?: string }) }; };

test("last seat: 50 concurrent bookings → exactly one succeeds", async () => {
  const { ok } = await settled(Array.from({ length: 50 }, (_, i) => withTransaction(c => bookSeat(c, "ev1", 1, `u${i}`))));
  assert.equal(ok.filter(r => r === "ok").length, 1); assert.equal(ok.filter(r => r === "sold_out").length, 49);
});
test("double spend: 30 concurrent 100c spends from 1000c → exactly 10 succeed, balance 0, ledger consistent", async () => {
  const { ok, errors } = await settled(Array.from({ length: 30 }, (_, i) => withTransaction(c => spend(c, "w1", 100, `spend-${i}`))));
  assert.equal(ok.length, 10); assert.equal(errors.length, 20); assert.ok(errors.every(e => e.result === "insufficient_funds"));
  const w = await pool.query("SELECT balance FROM wallets WHERE id='w1'"); assert.equal(w.rows[0].balance, 0);
  const l = await pool.query("SELECT count(*)::int AS n, coalesce(sum(cents),0)::int AS s FROM ledger WHERE wallet_id='w1'"); assert.deepEqual(l.rows[0], { n: 10, s: -1000 });   // الفاشلة لم تترك أثرًا (ROLLBACK)
});
test("idempotent retry: the same idem_key executed 5 times charges once", async () => {
  await pool.query("UPDATE wallets SET balance = 500 WHERE id = 'w1'");
  const { ok } = await settled(Array.from({ length: 5 }, () => withTransaction(c => spend(c, "w1", 200, "retry-same-key"))));
  assert.equal(ok.length, 5); assert.equal((await pool.query("SELECT balance FROM wallets WHERE id='w1'")).rows[0].balance, 300);
});
test("limit 3 active bookings under 10 concurrent attempts (write skew) → exactly 3", async () => {
  const { ok } = await settled(Array.from({ length: 10 }, (_, i) => withTransaction(c => bookWithLimit(c, "u1", `e${i}`))));
  assert.equal(ok.filter(r => r === "ok").length, 3); assert.equal((await pool.query("SELECT count(*)::int AS n FROM bookings WHERE user_id='u1' AND active")).rows[0].n, 3);
});
test("optimistic: two editors with the same version → one wins, the other gets conflict", async () => {
  const [a, b] = await Promise.all([withTransaction(c => updateProfile(c, "u1", 1, "Ana A")), withTransaction(c => updateProfile(c, "u1", 1, "Ana B"))]);
  assert.deepEqual([a.result, b.result].sort(), ["conflict", "ok"]); assert.equal((await pool.query("SELECT version FROM profiles WHERE user_id='u1'")).rows[0].version, 2);
});
test("transfers in both directions concurrently: no deadlock errors, money conserved", async () => {
  await pool.query("UPDATE wallets SET balance = 1000");
  const { ok, errors } = await settled(Array.from({ length: 40 }, (_, i) => withTransaction(c => transfer(c, i % 2 ? "w1" : "w2", i % 2 ? "w2" : "w1", 50))));
  assert.equal(errors.length, 0); assert.equal(ok.length, 40);
  const s = await pool.query("SELECT sum(balance)::int AS total FROM wallets"); assert.equal(s.rows[0].total, 2000);
});
test("coupon per user: racy version double-redeems, constraint version does not", async () => {
  const racy = await settled(Array.from({ length: 20 }, () => withTransaction(c => redeemRacy(c, "c1", "racer"))));
  assert.ok(racy.errors.length > 0 || racy.ok.filter(r => r === "ok").length >= 1);                     // بلا القيد لكان 20 "ok"؛ القيد (PK) يحوّل بعضها إلى أخطاء 23505 — الكود "الصحيح" لا يعتمد على ذلك
  const atomic = await settled(Array.from({ length: 20 }, () => withTransaction(c => redeemAtomic(c, "c1", "clean"))));
  assert.equal(atomic.errors.length, 0); assert.equal(atomic.ok.filter(r => r === "ok").length, 1); assert.equal(atomic.ok.filter(r => r === "already_used").length, 19);
});
```

```bash
DATABASE_URL=postgres://app:app@127.0.0.1:5432/store node --import tsx --test src/concurrency.int.test.ts    # 7 pass
# راقب أثناء الاختبار: SELECT wait_event_type, count(*) FROM pg_stat_activity GROUP BY 1;   ← Lock = المتسابقون ينتظرون قفل الصف (طبيعي ومرغوب هنا)
```

```sql
-- أدوات إضافية من السلّم
SELECT id FROM jobs WHERE status='queued' ORDER BY id FOR UPDATE SKIP LOCKED LIMIT 10;   -- توزيع عمل بين workers بلا تنافس (طابور في DB، M5.9)
SELECT pg_try_advisory_xact_lock(hashtext('report:' || $1));                               -- "مرة واحدة في آن" لمفهوم لا لصف؛ يزول مع المعاملة
UPDATE orders SET status = 'paid' WHERE id = $1 AND status = 'pending' RETURNING id;       -- انتقال حالة ذري: التنفيذ الثاني يحدّث 0 صف = idempotent
```

---

## 8. مثال من العالم الحقيقي
متجر أطلق "تخفيض 90% على 100 قطعة". الكود: `if (product.stock > 0) { product.stock--; save(); }`. خلال 3 ثوانٍ بيعت 640 قطعة. السبب ليس "حمل عالٍ" بل **قراءة ثم كتابة** عبر 8 نسخ من الخادم؛ الكاش في الذاكرة زاد الطين بلّة. الإصلاح سطر واحد: `UPDATE products SET stock = stock - 1 WHERE id = $1 AND stock > 0` + `CHECK (stock >= 0)` + اختبار `Promise.all × 200` يثبت أن المبيعات = 100 بالضبط. والدرس الأعمق: **اختبار التزامن إلزامي لكل كتابة على مورد مشترك**، لا عند الحادث.

## 9. مثال من الإنتاج
بنك رقمي: عملية "سحب فوري" تتحقق من الرصيد عبر خدمة الحسابات ثم تُنفّذ عبر خدمة الدفع — خدمتان، لا معاملة واحدة. مهاجم أرسل 30 سحبًا متزامنًا بنفس المبلغ من حساب فيه رصيد لعملية واحدة؛ 14 نجحت. الحل لم يكن "قفلًا موزّعًا" (جُرّب بـ Redis وفشل عند انتهاء القفل أثناء بطء المزوّد) بل **إعادة التصميم**: الحجز الذري في DB الحسابات أولًا (`UPDATE … WHERE available >= $1` ينشئ **hold** بمفتاح idempotency)، ثم التنفيذ الخارجي بنفس المفتاح، ثم تأكيد/إلغاء الحجز (نمط saga/outbox، L7-M7.2). القفل لا يصلح تصميمًا يقرأ في مكان ويكتب في آخر.

---

## 10. مفاهيم خاطئة شائعة
1. **"المعاملة وحدها تمنع السباق."** `BEGIN; SELECT; if; UPDATE; COMMIT` في READ COMMITTED **ما زال سباقًا**؛ المعاملة تجعل الكتابات ذرية، لا القرار.
2. **"Node أحادي الخيط فلا سباقات."** بين كل `await`ين يدخل طلب آخر، ومع N نسخ لا تحميك الذاكرة إطلاقًا.
3. **"القفل التفاؤلي للأداء دائمًا."** تحت تنافس عالٍ يفشل الجميع إلا واحدًا ويعيدون — أسوأ من قفل صف قصير.
4. **"Redlock يعطي قفلًا آمنًا."** بلا fencing token لا يضمن التفرّد عبر الانتهاء/التوقفات؛ وDB أبسط حين يكون الأثر فيها.
5. **"SERIALIZABLE يحلّ كل شيء بلا تفكير."** يرمي 40001 ويحتاج retry وتصميمًا لعمليات قصيرة؛ ولا يحميك من منطق موزّع عبر خدمات.
6. **"نادر فلا يهم."** النادر يحدث بالضبط عند الذروة أو تحت هجوم مقصود، وبالمال.

## 11. أخطاء شائعة
1. `SELECT` ثم `if` ثم `UPDATE` بدل `UPDATE … WHERE` شرطي؛ تجاهل `rowCount`.
2. `FOR UPDATE` على الصف الخطأ (الابن بدل الأب) فلا يتسلسل العدّ (write skew يبقى).
3. أقفال بترتيب غير ثابت (`WHERE id IN (…)` بلا `ORDER BY`) → deadlocks عشوائية.
4. I/O خارجي (دفع، بريد) داخل المعاملة تحت القفل → انتظار طويل وpool يجف (L3-M3.14).
5. idempotency في الـ API فقط بينما الوظائف/webhooks الداخلية تُعاد بلا حماية.
6. قيد `UNIQUE` غائب "لأن الكود يتحقق"؛ أو موجود لكن الكود يلتقط الاستثناء العام ويعيد 500 بدل 409.
7. اختبار التزامن بمتصفحين يدويًا ("لم أستطع إعادته") بدل `Promise.all × 50` على DB حقيقية مع pool ساخن.
8. قفل موزّع بـ TTL أقصر من أسوأ زمن للعمل، بلا تجديد ولا fencing.

## 12. تمرين تصحيح
سجل الإنتاج يُظهر deadlocks (`40P01`) يوميًا في "تطبيق الدفعة الشهرية": سكربت يحدّث أرصدة 10k محفظة بـ `UPDATE wallets SET balance = balance + $1 WHERE id = ANY($2)` دفعة من 500، بينما المستخدمون يحوّلون بين المحافظ.
1. **دليل:** `pg_stat_activity`/السجل يُظهر الدفعة تنتظر قفل محفظة يملكها تحويل مستخدم، والتحويل ينتظر محفظة تملكها الدفعة. الدفعة تقفل الصفوف **بترتيب الفحص الفيزيائي** (غير ثابت)، والتحويل بترتيب `sort()` من §7 — ترتيبان مختلفان.
2. **فرضية:** تعاكس ترتيب الأقفال بين عمليتين تمسّان نفس الصفوف.
3. **تجربة:** إعادة إنتاج محليًا: تحويل w2→w1 + دفعة على `ANY(['w1','w2'])` في حلقة → 40P01 خلال ثوانٍ.
4. **الإصلاح:** الدفعة تقفل بترتيب ثابت أولًا (`SELECT … WHERE id = ANY($1) ORDER BY id FOR UPDATE`) ثم تحدّث؛ دفعات أصغر (50) لتقصير مدة القفل؛ `withTransaction` يعيد على 40P01 (كان السكربت يموت)؛ ومقياس deadlocks في اللوحة. البديل الأقوى: الدفعة تكتب في `ledger` ذريًا لكل محفظة بعبارة واحدة بدل الدفعات.
5. **أين أيضًا؟** `UPDATE … WHERE … IN` في أي مكان، FK + تحديث الأب، فهارس فريدة تُحدَّث بترتيب مختلف.

## 13. تمرين معماري
اكتب **سياسة التزامن** لـ Project 5 (صفحة تُفرض بالمراجعة والاختبار): (1) جرد كل كتابة على مورد مشترك (مخزون، طلب، جلسة، كوبون، حدود المعدّل، رموز لمرة واحدة) وصنّفها على السلّم مع التبرير؛ (2) قاعدة "كل كتابة تجيب: ماذا لو نُفّذت مرتين؟ وماذا لو تزامن طلبان؟" في قالب PR؛ (3) ترتيب الأقفال القياسي (بأي مفتاح؟) وما الممنوع داخل المعاملة؛ (4) ETag/If-Match لأي مورد يُحرَّر بشريًا في `openapi.yaml` (M5.1)؛ (5) اختبار تزامن إلزامي (`Promise.all × 50`) لكل بند في الجرد مع الأرقام المتوقّعة؛ (6) ACTRR: أين ستحتاج طابورًا بمفتاح تقسيم (M5.9) بدل الأقفال، وأين قفل Redis مقبول رغم حدوده.

## 14. الصلة بعصر AI
كود AI للكتابات هو الحالة النموذجية لـ "اقرأ ثم قرّر ثم اكتب" — لأنه الأكثر شيوعًا في بيانات التدريب ويبدو واضحًا. يميل أيضًا إلى اقتراح "قفل Redis" كحل عام. قاعدتك في L8: كل كتابة مولَّدة على مورد مشترك تمرّ من سؤالَي §4 واختبار `Promise.all × N` **قبل** القبول — وهو اختبار لا يستطيع AI تزييفه لأنه يعمل على DB حقيقية. وAI مفيد جدًا في **توليد اختبارات التزامن** من سياستك ("لكل use case في الجرد اكتب اختبار تنافس بالقيم المتوقّعة") وفي شرح خطط الأقفال (`pg_locks`).

## 15. ما يجب إتقانه (Must Master) 🔴
- 🔴 شكل السباق (اقرأ→قرّر→اكتب) وأين يظهر في الأعمال؛ السؤالان (طلبان متزامنان؟ تنفيذ مرتين؟)؛ السلّم واختيار الأدنى؛ `UPDATE … WHERE` شرطي + `rowCount`؛ `UNIQUE/CHECK` + `ON CONFLICT … RETURNING`؛ `FOR UPDATE` على الأب ضد write skew؛ `version` + 409 و`ETag/If-Match`؛ deadlock وترتيب ثابت ومهلة+retry؛ idempotency داخلي بمفاتيح طبيعية وانتقالات حالة؛ اختبار `Promise.all × N` إلزامي.

## 16. ما يجب فهمه (Should Understand) 🟠
- 🟠 `SKIP LOCKED` كطابور في DB؛ advisory locks؛ SERIALIZABLE + retry كشبكة أمان؛ حدود الأقفال الموزّعة وfencing tokens؛ السباقات بين `await`s؛ هجمات السباق المقصودة.

## 17. ما يمكن تأجيله (Can Defer) ⚪
- ⚪ Saga/outbox عبر الخدمات (L7-M7.2)، CRDTs، MVCC داخليًا، تحليل الأقفال بـ `pg_locks` تفصيلًا، التحكّم في التزامن في قواعد غير علائقية.

## 18. الخلاصة
1. كل "اقرأ → قرّر → اكتب" على مورد مشترك سباق؛ يظهر في الإنتاج بالضبط حين يهم (ذروة، إعادة محاولة، هجوم).
2. انقل القرار إلى DB: تحديث ذري بشرط، قيود + `ON CONFLICT`؛ ثم `FOR UPDATE` على الأب؛ ثم تفاؤلي للتحرير البشري؛ ثم SERIALIZABLE؛ ثم طابور.
3. Deadlock = ترتيب أقفال متعاكس → رتّب، قلّل، مهلة + retry. لا I/O خارجي تحت القفل.
4. اجعل كل كتابة idempotent من الداخل (مفتاح طبيعي، انتقال حالة بشرط) — الأحداث تتكرّر دائمًا.
5. الدليل الوحيد المقبول: اختبار تزامن على DB حقيقية بأرقام متوقّعة — لكل كتابة على مورد مشترك.

## 19. مراجع رسمية
- PostgreSQL — Explicit Locking (`FOR UPDATE`, `SKIP LOCKED`, advisory locks, deadlocks): https://www.postgresql.org/docs/current/explicit-locking.html
- PostgreSQL — Transaction Isolation & serialization failures: https://www.postgresql.org/docs/current/transaction-iso.html
- PostgreSQL — `INSERT … ON CONFLICT`: https://www.postgresql.org/docs/current/sql-insert.html#SQL-ON-CONFLICT
- RFC 9110 — Conditional requests (`ETag`, `If-Match`, 412): https://www.rfc-editor.org/rfc/rfc9110#name-conditional-requests
- Martin Kleppmann — How to do distributed locking (fencing tokens): https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html
- OWASP — Race condition testing (WSTG-BUSL): https://owasp.org/www-project-web-security-testing-guide/
- PortSwigger — Race conditions (attack techniques): https://portswigger.net/web-security/race-conditions

## المصطلحات
| العربية | English |
|---|---|
| حالة سباق في منطق الأعمال | Business-logic race condition |
| حجز مزدوج / إنفاق مزدوج | Double booking / Double spend |
| تحديث ذري بشرط | Atomic conditional update |
| القيد كحَكَم | Constraint as arbiter |
| قفل تشاؤمي / تفاؤلي | Pessimistic / Optimistic locking |
| عمود الإصدار | Version column |
| طلب شرطي (ETag / If-Match) | Conditional request (ETag / If-Match) |
| جمود | Deadlock |
| ترتيب الأقفال | Lock ordering |
| انحراف الكتابة | Write skew |
| تخطّي المقفول | SKIP LOCKED |
| قفل استشاري | Advisory lock |
| قفل موزّع / رمز تسييج | Distributed lock / Fencing token |
| حجز (hold) | Hold / Reservation |
| اختبار التنافس | Contention test |
