# Module 5.9 — الطوابير والوظائف والعمّال
## Queues, Jobs & Workers: background work, the transactional outbox, at-least-once delivery, idempotent handlers, retries & backoff, dead-letter queues, leases and crash recovery

> **المستوى:** Level 5 | **الموقع:** [9 من 13]
> **السابق:** [M5.8 — Caching](module-5.8-caching.md) | **التالي:** [M5.10 — Deployment](module-5.10-deployment.md)

---

## 1. المتطلبات
> **قبل أن تتعلم هذا، يجب أن تفهم:**
- [ ] الطابور (FIFO) كبنية بيانات — [L3-M3.2](../level-3-core-computer-science/module-3.2-sets-stacks-queues.md)
- [ ] المعاملات، `FOR UPDATE SKIP LOCKED`، الـ idempotency من الداخل، `withTransaction` — [L3-M3.14](../level-3-core-computer-science/module-3.14-transactions-acid.md), [M5.6](module-5.6-concurrency-business-logic.md)
- [ ] مشكلة الكتابة المزدوجة (DB + بريد/استدعاء خارجي) ونمط outbox كفكرة — [L3-M3.14](../level-3-core-computer-science/module-3.14-transactions-acid.md)
- [ ] الإيقاف الرشيق وSIGTERM — [M5.7](module-5.7-production-anatomy.md)
- [ ] T-15 من نموذج التهديد: الوظيفة تحمل الفاعل والمستأجر والعامل يعيد التفويض — [M5.5](module-5.5-threat-modeling.md), [M5.3](module-5.3-authorization.md)
- [ ] إعادة المحاولة بـ backoff + jitter، والأخطاء العابرة مقابل الدائمة — [L3-M3.9](../level-3-core-computer-science/module-3.9-algorithms-that-matter.md), [L1-M1.9](../level-1-programming/module-1.9-errors.md)

## 2. أهداف التعلّم
- تمييز **ما ينتمي إلى الخلفية** (بريد، PDF، ويبهوك صادر، معالجة صورة، مزامنة، تقارير) عن ما يجب أن يحدث داخل الطلب، وفهم أثر ذلك على زمن الاستجابة والموثوقية.
- حلّ **مشكلة الكتابة المزدوجة** بـ **Transactional Outbox**: إدراج الوظيفة في **نفس معاملة** الكتابة التجارية، فلا وظيفة بلا بيانات ولا بيانات بلا وظيفة.
- بناء طابور على PostgreSQL: **claim** بـ `FOR UPDATE SKIP LOCKED`، **lease** (مهلة رؤية) لاستعادة الوظائف بعد انهيار العامل، إعادة محاولة بـ backoff + jitter، حدّ محاولات ثم **dead-letter**، أولويات وجدولة.
- كتابة **معالجات idempotent** لأن التسليم **at-least-once** دائمًا: مفاتيح طبيعية، جدول "ما تمّ"، انتقالات حالة بشرط؛ وفهم لماذا "exactly-once" وعد لا يُحقَّق إلا بالـ idempotency من جهة المستهلك.
- تشغيل **عامل إنتاجي**: تزامن محدود، إيقاف رشيق عند حدود الوظيفة، تمديد lease للوظائف الطويلة، مقاييس (عمق الطابور، عمر أقدم وظيفة، معدّل الفشل)، والسياق الأمني في كل وظيفة.

---

## 3. شرح للمبتدئ

### لماذا الخلفية؟
الطلب يجب أن يعود **سريعًا** و**موثوقًا**. إرسال بريد (300 ms–3 s، ويفشل)، توليد PDF (ثوانٍ)، استدعاء مزوّد خارجي (M5.5 F2)، تحديث 10k صف — كلها لا تنتمي إلى دورة الطلب: تبطّئه، وأي فشل فيها يُفشل الطلب رغم أن **العمل الأساسي نجح**. الحل: الطلب يكتب الحقيقة في DB ويسجّل "وظيفة" (job) — ثم يعود 202/201 فورًا. **عامل** (worker) منفصل يلتقط الوظيفة وينفّذها، ويعيد المحاولة إن فشلت. هذا هو النموذج الذهني الثالث لـ L5: `User uploads file → API accepts → queue → worker → notify`.

### مشكلة الكتابة المزدوجة
```
✗ await db.commit(order); await queue.push({ type: "email", orderId });   // انهيار بين السطرين → طلب بلا بريد أبدًا
✗ await queue.push(...); await db.commit(order);                           // العكس → بريد عن طلب غير موجود (أو لم يُلتزم بعد)
```
DB والطابور نظامان مختلفان ولا معاملة تجمعهما. **Transactional Outbox**: الوظيفة صف في جدول داخل DB نفسها، يُدرج **في نفس المعاملة** مع الطلب. إمّا كلاهما أو لا شيء. العامل يقرأ من الجدول. (مع وسيط خارجي — RabbitMQ/SQS/Kafka — يُضاف "relay" ينقل من الجدول إلى الوسيط؛ الفكرة نفسها.) لهذا نبدأ بطابور على PostgreSQL: صحيح، مرئي بـ SQL، كافٍ حتى آلاف الوظائف في الثانية، وبلا مكوّن إضافي يفشل.

### دورة حياة الوظيفة
```
queued ──claim──▶ running ──ok──▶ done
   ▲                 │ fail (attempts < max)  → queued (run_at = now + backoff)
   │                 │ fail (attempts = max)  → dead  (DLQ: تُفحص يدويًا / تُعاد)
   └── lease expired (worker crashed) ◀───────┘
```
- **Claim**: `UPDATE jobs SET status='running', locked_until = now() + lease, attempts = attempts + 1 WHERE id = (SELECT id FROM jobs WHERE status='queued' AND run_at <= now() ORDER BY priority, run_at FOR UPDATE SKIP LOCKED LIMIT 1) RETURNING *` — عبارة واحدة ذرية؛ N عامل لا يأخذون نفس الوظيفة (M5.6 السلّم درجة 3).
- **Lease (مهلة الرؤية)**: إن انهار العامل أثناء التنفيذ لا أحد يعلم. بعد انقضاء `locked_until` تعود الوظيفة متاحة. الوظائف الطويلة **تمدّد** الـ lease دوريًا (heartbeat). النتيجة الحتمية: الوظيفة قد تُنفَّذ **مرتين** (انهيار بعد الأثر وقبل `done`، أو تباطؤ تجاوز الـ lease).
- **Retry**: فشل عابر (مهلة، 503 من المزوّد، 40001) → أعد بعد `base × 2^attempt × jitter` بسقف؛ فشل دائم (تحقق فشل، 4xx من المزوّد، سجل غير موجود) → **لا تعد**، أرسل إلى DLQ فورًا مع السبب. تصنيف الأخطاء جزء من المعالج (L1-M1.9).
- **Dead-letter**: الوظائف التي استنفدت محاولاتها تُحفظ مع آخر خطأ، وتنبيه عند تراكمها، وأداة لإعادتها بعد الإصلاح. حذفها صامتًا = ضياع عمل العميل.

### at-least-once ⇒ idempotent handlers
أي نظام موثوق يسلّم **مرة على الأقل** (الاعتراف قد يضيع). "exactly-once" = at-least-once + معالج **idempotent**. أدوات M5.6 نفسها: مفتاح طبيعي + `UNIQUE` + `ON CONFLICT DO NOTHING` (جدول `processed(job_id)` أو `emails_sent(order_id, kind)`), انتقال حالة بشرط (`WHERE status='pending'`), ومفتاح idempotency للمزوّد الخارجي (نفس `job.id` كـ `Idempotency-Key`). والأثر و"تسجيل أنه تمّ" في **معاملة واحدة** حين يكون الأثر في DB؛ وحين يكون خارجيًا (بريد) اقبل ندرة التكرار أو استخدم مفتاح المزوّد.

### الوظيفة تحمل سياقها (T-15)
العامل ليس "مستخدمًا خارقًا". الحمولة (payload) تحمل `tenantId` و`actorId` و`requestId`، والمعالج **يعيد التفويض** (`can()` M5.3) ويضبط `app.tenant_id` لـ RLS قبل أي استعلام؛ وقد تغيّرت الصلاحيات بين الإدراج والتنفيذ (حُذف المستخدم؟) — فالمعالج يتحقق من **الحالة الآن**. والحمولة **صغيرة**: معرّفات لا كائنات (البيانات تُقرأ طازجة من DB عند التنفيذ)، ولا أسرار.

### العامل الإنتاجي
حلقة: claim → execute (مع مهلة لكل وظيفة!) → complete/fail؛ **تزامن محدود** (مثلًا 5 وظائف في آن لكل عملية — I/O-bound) ولا تتجاوز قدرة المزوّد الخارجي (rate limits)؛ **إيقاف رشيق**: عند SIGTERM توقّف عن claim، أكمل الجاري (أو أعده إلى queued إن طال)، ثم اخرج (M5.7)؛ **polling** بفاصل مع backoff عند الفراغ أو `LISTEN/NOTIFY` للاستيقاظ الفوري؛ **مقاييس**: عمق الطابور لكل نوع، **عمر أقدم وظيفة queued** (أهم مؤشّر تأخّر)، معدّل الفشل، مدة التنفيذ، حجم DLQ؛ وتنظيف `done` القديمة (أرشفة/حذف دوري) حتى لا يتضخّم الجدول ويبطئ الـ claim (فهرس جزئي على `status='queued'`).

### متى وسيط خارجي؟
حين تحتاج: عشرات آلاف الوظائف/ثانية، fan-out لعدة مستهلكين (pub/sub)، إعادة تشغيل التدفّق (Kafka log)، أو عزل الحمل عن DB الرئيسية. حينها تحتفظ بـ outbox في DB + relay، وتُبقي كل قواعد هذه الوحدة (idempotency، DLQ، lease ≈ visibility timeout في SQS، ack في RabbitMQ). المفاهيم نفسها بأسماء مختلفة.

---

## 4. النموذج الذهني

```
   الطلب يكتب الحقيقة + الوظيفة في معاملة واحدة (outbox) ويعود فورًا. العامل ينفّذ لاحقًا ويعيد المحاولة.
   claim ذري (SKIP LOCKED) + lease (الانهيار يُستعاد) ⇒ at-least-once ⇒ كل معالج idempotent (مفتاح طبيعي / processed / حالة بشرط).
   فشل عابر → backoff+jitter؛ دائم → DLQ فورًا؛ استنفاد → DLQ مع السبب + تنبيه + أداة إعادة.
   الوظيفة تحمل tenant/actor/requestId والعامل يعيد التفويض ويقرأ الحالة طازجة. الحمولة معرّفات لا كائنات.
   العامل: تزامن محدود، مهلة لكل وظيفة، heartbeat للطويلة، SIGTERM عند حدود الوظيفة، مقياس "عمر أقدم وظيفة".
```

---

## 5. الرسم التوضيحي

```mermaid
sequenceDiagram
  participant U as Client
  participant API as API
  participant DB as PostgreSQL (orders + jobs)
  participant W as Worker
  participant M as Mail provider
  U->>API: POST /orders
  API->>DB: BEGIN - INSERT order - INSERT job(send_receipt, {orderId, tenantId, actorId}) - COMMIT
  API-->>U: 201 Created
  loop poll / LISTEN
    W->>DB: claim: UPDATE jobs … SKIP LOCKED … RETURNING (lease 60s)
  end
  W->>DB: set tenant, re-authorize, read order fresh
  W->>M: send(receipt) Idempotency-Key = job.id (timeout 10s)
  alt success
    W->>DB: UPDATE jobs SET status='done' + INSERT processed(job_id)
  else transient failure
    W->>DB: status='queued', run_at = now()+backoff, last_error
  else attempts exhausted / permanent
    W->>DB: status='dead', last_error (DLQ alert)
  end
  Note over W,DB: worker crash → lease expires → another worker reclaims (job may run twice ⇒ idempotent)
```

---

## 6. مثال بسيط

```typescript
// src/outbox.ts — الفكرة الجوهرية في عشرة أسطر: الوظيفة تُدرج في نفس معاملة الكتابة التجارية
import type pg from "pg";
export type JobInput = { type: string; payload: Record<string, unknown>; runAt?: Date; priority?: number; maxAttempts?: number; idemKey?: string };
export async function enqueue(c: pg.PoolClient | pg.Pool, j: JobInput): Promise<string | null> {
  const r = await c.query(
    `INSERT INTO jobs(type, payload, run_at, priority, max_attempts, idem_key) VALUES ($1, $2, coalesce($3, now()), $4, $5, $6)
     ON CONFLICT (idem_key) DO NOTHING RETURNING id`,                                                  // idem_key اختياري: "أرسل تذكيرًا واحدًا لهذا الطلب" حتى لو استُدعي enqueue مرتين
    [j.type, JSON.stringify(j.payload), j.runAt ?? null, j.priority ?? 100, j.maxAttempts ?? 5, j.idemKey ?? null]);
  return r.rows[0]?.id ?? null;
}
// الاستخدام داخل use case (M4.11 ports): نفس الـ client = نفس المعاملة
// await withTransaction(async c => {
//   const order = await orders.create(c, input);
//   await enqueue(c, { type: "send_receipt", payload: { orderId: order.id, tenantId, actorId, requestId } });   // T-15: السياق في الحمولة
//   return order;
// });   // COMMIT يحفظ الاثنين معًا؛ ROLLBACK يلغيهما معًا — لا كتابة مزدوجة
```

```sql
-- src/schema.sql — جدول الوظائف: فهرس جزئي على المتاح فقط (الجدول يكبر، الاستعلام يبقى سريعًا)
CREATE TABLE IF NOT EXISTS jobs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type          text NOT NULL,
  payload       jsonb NOT NULL,
  status        text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','running','done','dead')),
  priority      int  NOT NULL DEFAULT 100,
  run_at        timestamptz NOT NULL DEFAULT now(),
  attempts      int  NOT NULL DEFAULT 0,
  max_attempts  int  NOT NULL DEFAULT 5,
  locked_until  timestamptz,
  locked_by     text,
  last_error    text,
  idem_key      text UNIQUE,
  created_at    timestamptz NOT NULL DEFAULT now(),
  finished_at   timestamptz
);
CREATE INDEX IF NOT EXISTS jobs_claim_idx ON jobs (priority, run_at) WHERE status = 'queued';
CREATE INDEX IF NOT EXISTS jobs_running_idx ON jobs (locked_until) WHERE status = 'running';
CREATE TABLE IF NOT EXISTS processed (job_id uuid PRIMARY KEY, handler text NOT NULL, at timestamptz NOT NULL DEFAULT now());   -- "ما تمّ": حارس idempotency للمعالجات ذات الأثر في DB
```

---

## 7. مثال كود

```typescript
// src/queue.ts — claim ذري بـ SKIP LOCKED، استعادة الـ lease، retry/backoff، DLQ، heartbeat، مقاييس
import pg from "pg"; import { readFileSync } from "node:fs"; import { fileURLToPath } from "node:url"; import path from "node:path";
export type Job = { id: string; type: string; payload: Record<string, unknown>; attempts: number; max_attempts: number; locked_until: Date };
export class PermanentError extends Error { constructor(msg: string, opts?: ErrorOptions) { super(msg, opts); this.name = "PermanentError"; } }   // لا تُعاد — إلى DLQ فورًا

export class PgQueue {
  constructor(private pool: pg.Pool, private workerId = `${process.pid}-${Math.random().toString(36).slice(2, 8)}`) {}
  async migrate() { await this.pool.query(readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), "schema.sql"), "utf8")); }

  /** يستعيد أولًا الوظائف التي انتهى lease عاملها (انهيار) ثم يأخذ وظيفة واحدة ذريًا */
  async claim(types: string[], leaseMs = 60_000): Promise<Job | null> {
    await this.pool.query(`UPDATE jobs SET status = 'queued', locked_until = NULL, locked_by = NULL, last_error = coalesce(last_error, '') || ' [lease expired]'
                           WHERE status = 'running' AND locked_until < now()`);                      // رخيص بفضل jobs_running_idx؛ في الإنتاج يكفي كل بضع ثوانٍ لا كل claim
    const r = await this.pool.query<Job>(
      `UPDATE jobs SET status = 'running', attempts = attempts + 1, locked_until = now() + ($2 || ' milliseconds')::interval, locked_by = $3
       WHERE id = (SELECT id FROM jobs WHERE status = 'queued' AND run_at <= now() AND type = ANY($1) ORDER BY priority, run_at FOR UPDATE SKIP LOCKED LIMIT 1)
       RETURNING id, type, payload, attempts, max_attempts, locked_until`, [types, String(leaseMs), this.workerId]);
    return r.rows[0] ?? null;
  }
  async heartbeat(id: string, leaseMs = 60_000) { await this.pool.query(`UPDATE jobs SET locked_until = now() + ($2 || ' milliseconds')::interval WHERE id = $1 AND locked_by = $3`, [id, String(leaseMs), this.workerId]); }
  async complete(id: string, c: pg.PoolClient | pg.Pool = this.pool) { await c.query(`UPDATE jobs SET status = 'done', finished_at = now(), locked_until = NULL WHERE id = $1`, [id]); }
  async fail(job: Job, err: Error, opts: { baseMs?: number; maxMs?: number } = {}) {
    const permanent = err instanceof PermanentError || job.attempts >= job.max_attempts;
    const backoff = Math.min(opts.maxMs ?? 10 * 60_000, (opts.baseMs ?? 1000) * 2 ** job.attempts) * (0.5 + Math.random());   // jitter 0.5–1.5×
    await this.pool.query(`UPDATE jobs SET status = $2, run_at = now() + ($3 || ' milliseconds')::interval, locked_until = NULL, last_error = $4, finished_at = CASE WHEN $2 = 'dead' THEN now() END WHERE id = $1`,
      [job.id, permanent ? "dead" : "queued", String(permanent ? 0 : Math.round(backoff)), `${err.name}: ${err.message}`.slice(0, 2000)]);
    return permanent ? "dead" : "retry";
  }
  async release(id: string) { await this.pool.query(`UPDATE jobs SET status = 'queued', locked_until = NULL, attempts = attempts - 1 WHERE id = $1 AND locked_by = $2`, [id, this.workerId]); }   // إيقاف رشيق: أعدها بلا احتساب محاولة
  async retryDead(id: string) { await this.pool.query(`UPDATE jobs SET status = 'queued', attempts = 0, run_at = now(), last_error = NULL WHERE id = $1 AND status = 'dead'`, [id]); }
  async metrics() {
    const r = await this.pool.query(`SELECT type, status, count(*)::int AS n, extract(epoch FROM now() - min(run_at) FILTER (WHERE status = 'queued' AND run_at <= now()))::int AS oldest_queued_s FROM jobs GROUP BY type, status ORDER BY 1, 2`);
    return r.rows as { type: string; status: string; n: number; oldest_queued_s: number | null }[];
  }
}
```

```typescript
// src/worker.ts — حلقة العامل: تزامن محدود، مهلة لكل وظيفة، heartbeat، إيقاف رشيق عند حدود الوظيفة
import type pg from "pg"; import { PgQueue, PermanentError, type Job } from "./queue.js";
export type Ctx = { job: Job; pool: pg.Pool; signal: AbortSignal; log: (o: object, m: string) => void };
export type Handler = (payload: Record<string, unknown>, ctx: Ctx) => Promise<void>;
export class Worker {
  private running = new Set<Promise<void>>(); private stopping = false; private wake: (() => void) | null = null;
  private log: (o: object, m: string) => void;
  constructor(private q: PgQueue, private pool: pg.Pool, private handlers: Record<string, Handler>, private opts: { concurrency?: number; jobTimeoutMs?: number; leaseMs?: number; pollMs?: number; log?: (o: object, m: string) => void } = {}) { this.log = opts.log ?? (() => {}); }

  async run() {
    const { concurrency = 5, pollMs = 500, leaseMs = 60_000 } = this.opts; const types = Object.keys(this.handlers);
    while (!this.stopping) {
      if (this.running.size >= concurrency) { await Promise.race(this.running); continue; }
      const job = await this.q.claim(types, leaseMs);
      if (!job) { await new Promise<void>(r => { this.wake = r; setTimeout(r, pollMs).unref(); }); this.wake = null; continue; }   // فراغ: نم قليلًا (أو LISTEN/NOTIFY للاستيقاظ)
      const p = this.execute(job, leaseMs).finally(() => this.running.delete(p)); this.running.add(p);
    }
    await Promise.allSettled(this.running);                                                           // الإيقاف الرشيق: أكمل الجاري
  }
  private async execute(job: Job, leaseMs: number) {
    const handler = this.handlers[job.type]!; const ac = new AbortController(); const { jobTimeoutMs = 30_000 } = this.opts;
    const timer = setTimeout(() => ac.abort(new Error(`job timeout ${jobTimeoutMs}ms`)), jobTimeoutMs);
    const hb = setInterval(() => void this.q.heartbeat(job.id, leaseMs).catch(() => {}), Math.max(1000, leaseMs / 3));   // الوظائف الطويلة تمدّد الـ lease
    const t0 = Date.now();
    try {
      await Promise.race([handler(job.payload, { job, pool: this.pool, signal: ac.signal, log: this.log }), new Promise<never>((_, rej) => ac.signal.addEventListener("abort", () => rej(ac.signal.reason)))]);
      await this.q.complete(job.id); this.log({ jobId: job.id, type: job.type, ms: Date.now() - t0, attempt: job.attempts }, "job done");
    } catch (e) {
      const outcome = await this.q.fail(job, e as Error); this.log({ jobId: job.id, type: job.type, attempt: job.attempts, outcome, err: (e as Error).message }, outcome === "dead" ? "job dead-lettered" : "job failed, will retry");
    } finally { clearTimeout(timer); clearInterval(hb); }
  }
  async stop() { this.stopping = true; this.wake?.(); await Promise.allSettled(this.running); }        // SIGTERM → لا claim جديد، انتظر الجاري
}
export { PermanentError };
```

```typescript
// src/handlers.ts — معالجات idempotent تحمل سياقها وتعيد التفويض (T-15)
import type { Handler } from "./worker.js"; import { PermanentError } from "./queue.js";
export const mailer = { sent: [] as { key: string; to: string }[], failUntilAttempt: 0, async send(key: string, to: string, attempt: number) { if (attempt < this.failUntilAttempt) { const e = new Error("503 provider busy"); throw e; } if (!this.sent.some(s => s.key === key)) this.sent.push({ key, to }); } };   // المزوّد يحترم Idempotency-Key

export const sendReceipt: Handler = async (payload, { job, pool }) => {
  const { orderId, tenantId, actorId } = payload as { orderId: string; tenantId: string; actorId: string };
  if (!orderId || !tenantId || !actorId) throw new PermanentError("malformed payload");                 // لا معنى لإعادة المحاولة
  const order = (await pool.query("SELECT id, tenant_id, customer_email, status FROM orders WHERE id = $1 AND tenant_id = $2", [orderId, tenantId])).rows[0];   // المستأجر في WHERE (M5.3) + حالة طازجة
  if (!order) throw new PermanentError("order not found (deleted since enqueue)");
  if (order.status === "cancelled") return;                                                              // تغيّرت الحالة منذ الإدراج: لا شيء لنفعله، نجاح
  await mailer.send(job.id, order.customer_email, job.attempts);                                         // job.id كمفتاح idempotency للمزوّد: التكرار بعد انهيار لا يرسل مرتين
};
export const applyCredit: Handler = async (payload, { job, pool }) => {                                  // أثر في DB: الحارس processed + الأثر في معاملة واحدة
  const { walletId, cents } = payload as { walletId: string; cents: number };
  const c = await pool.connect();
  try {
    await c.query("BEGIN");
    const guard = await c.query("INSERT INTO processed(job_id, handler) VALUES ($1, 'applyCredit') ON CONFLICT DO NOTHING RETURNING 1", [job.id]);
    if (guard.rowCount) await c.query("UPDATE wallets SET balance = balance + $1 WHERE id = $2", [cents, walletId]);   // التنفيذ الثاني: الحارس موجود → لا أثر مزدوج
    await c.query("COMMIT");
  } catch (e) { await c.query("ROLLBACK").catch(() => {}); throw e; } finally { c.release(); }
};
```

```typescript
// src/queue.int.test.ts — على PostgreSQL حقيقية: outbox، لا ازدواج بين العمّال، retry→DLQ، استعادة الانهيار، idempotency، إيقاف رشيق
import { test, before, after } from "node:test"; import assert from "node:assert/strict"; import pg from "pg";
import { PgQueue, PermanentError } from "./queue.js"; import { Worker } from "./worker.js"; import { enqueue } from "./outbox.js"; import { sendReceipt, applyCredit, mailer } from "./handlers.js";
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL ?? "postgres://app:app@127.0.0.1:5432/store", max: 15 }); const q = new PgQueue(pool);
const until = async (pred: () => Promise<boolean>, ms = 8000) => { const t0 = Date.now(); while (!(await pred())) { if (Date.now() - t0 > ms) throw new Error("timeout waiting"); await new Promise(r => setTimeout(r, 25)); } };
before(async () => { await pool.query("DROP TABLE IF EXISTS jobs, processed, orders, wallets CASCADE"); await q.migrate(); await pool.query(`CREATE TABLE orders (id text PRIMARY KEY, tenant_id text, customer_email text, status text); CREATE TABLE wallets (id text PRIMARY KEY, balance int); INSERT INTO wallets VALUES ('w1', 0);`); });
after(() => pool.end());

test("outbox: job and order commit together; rollback leaves neither", async () => {
  const c = await pool.connect();
  try { await c.query("BEGIN"); await c.query("INSERT INTO orders VALUES ('o1','t1','a@x.io','paid')"); await enqueue(c, { type: "send_receipt", payload: { orderId: "o1", tenantId: "t1", actorId: "u1" } }); await c.query("COMMIT");
        await c.query("BEGIN"); await c.query("INSERT INTO orders VALUES ('o2','t1','b@x.io','paid')"); await enqueue(c, { type: "send_receipt", payload: { orderId: "o2", tenantId: "t1", actorId: "u1" } }); await c.query("ROLLBACK"); } finally { c.release(); }
  assert.equal((await pool.query("SELECT count(*)::int AS n FROM jobs")).rows[0].n, 1); assert.equal((await pool.query("SELECT count(*)::int AS n FROM orders")).rows[0].n, 1);
  assert.ok(await enqueue(pool, { type: "reminder", payload: {}, idemKey: "reminder:o1" }));
  assert.equal(await enqueue(pool, { type: "reminder", payload: {}, idemKey: "reminder:o1" }), null);   // idem_key: لا تذكير مزدوج
  await pool.query("DELETE FROM jobs WHERE type = 'reminder'");
});
test("3 workers × 60 jobs: every job processed exactly once, no duplicates", async () => {
  await pool.query("DELETE FROM jobs"); const seen: string[] = [];
  for (let i = 0; i < 60; i++) await pool.query("INSERT INTO jobs(type, payload) VALUES ('count', $1)", [JSON.stringify({ i })]);
  const workers = Array.from({ length: 3 }, () => new Worker(q, pool, { count: async p => { seen.push(String(p.i)); await new Promise(r => setTimeout(r, 5)); } }, { concurrency: 4, pollMs: 20 }));
  const runs = workers.map(w => w.run()); await until(async () => (await pool.query("SELECT count(*)::int AS n FROM jobs WHERE status='done'")).rows[0].n === 60); await Promise.all(workers.map(w => w.stop())); await Promise.all(runs);
  assert.equal(seen.length, 60); assert.equal(new Set(seen).size, 60);
});
test("transient failure retries with backoff; permanent error dead-letters immediately; exhausted → dead", async () => {
  await pool.query("DELETE FROM jobs"); mailer.sent.length = 0; mailer.failUntilAttempt = 3;                                  // المحاولتان 1 و2 تفشلان، 3 تنجح
  await pool.query("INSERT INTO jobs(type, payload, max_attempts) VALUES ('send_receipt', $1, 5), ('send_receipt', $2, 5), ('boom', '{}', 2)", [JSON.stringify({ orderId: "o1", tenantId: "t1", actorId: "u1" }), JSON.stringify({ orderId: "o1" })]);   // الثانية بلا tenant → PermanentError
  await pool.query("UPDATE jobs SET run_at = now()");
  const w = new Worker(q, pool, { send_receipt: sendReceipt, boom: async () => { throw new Error("ETIMEDOUT"); } }, { concurrency: 2, pollMs: 20 }); const run = w.run();
  const fastRetry = setInterval(() => void pool.query("UPDATE jobs SET run_at = now() WHERE status='queued'"), 30);                 // نضغط الـ backoff للاختبار
  await until(async () => (await pool.query("SELECT count(*)::int AS n FROM jobs WHERE status IN ('done','dead')")).rows[0].n === 3); clearInterval(fastRetry); await w.stop(); await run;
  const rows = (await pool.query("SELECT type, status, attempts, last_error FROM jobs ORDER BY type, attempts")).rows;
  assert.deepEqual(rows.map(r => [r.type, r.status, r.attempts]), [["boom", "dead", 2], ["send_receipt", "dead", 1], ["send_receipt", "done", 3]]);
  assert.ok(rows.find(r => r.status === "dead" && r.type === "send_receipt")!.last_error.startsWith("PermanentError")); assert.equal(mailer.sent.length, 1);   // المزوّد استلم مرة واحدة رغم 3 محاولات
});
test("crash recovery: a job whose lease expired is reclaimed by another worker; idempotent handler applies the effect once", async () => {
  await pool.query("DELETE FROM jobs; DELETE FROM processed; UPDATE wallets SET balance = 0");
  const { rows: [j] } = await pool.query("INSERT INTO jobs(type, payload) VALUES ('apply_credit', $1) RETURNING id", [JSON.stringify({ walletId: "w1", cents: 500 })]);
  const first = await q.claim(["apply_credit"], 100);                                                 // عامل "ينهار": claim بـ lease 100ms ثم… صمت
  assert.equal(first?.id, j.id);
  await applyCredit(first!.payload, { job: first!, pool, signal: new AbortController().signal, log: () => {} });   // لنفترض أنه طبّق الأثر ثم مات قبل complete
  await new Promise(r => setTimeout(r, 150));
  const second = await q.claim(["apply_credit"], 60_000); assert.equal(second?.id, j.id); assert.equal(second?.attempts, 2);   // استُعيدت بعد انقضاء الـ lease
  await applyCredit(second!.payload, { job: second!, pool, signal: new AbortController().signal, log: () => {} }); await q.complete(second!.id);
  assert.equal((await pool.query("SELECT balance FROM wallets WHERE id='w1'")).rows[0].balance, 500);   // مرة واحدة فقط رغم تنفيذين (processed guard)
});
test("graceful stop: in-flight job finishes, nothing new is claimed; metrics expose oldest queued age", async () => {
  await pool.query("DELETE FROM jobs"); let finished = 0;
  for (let i = 0; i < 5; i++) await pool.query("INSERT INTO jobs(type, payload) VALUES ('slow', '{}')");
  const w = new Worker(q, pool, { slow: async () => { await new Promise(r => setTimeout(r, 200)); finished++; } }, { concurrency: 1, pollMs: 20 }); const run = w.run();
  await until(async () => (await pool.query("SELECT count(*)::int AS n FROM jobs WHERE status='running'")).rows[0].n === 1); await w.stop(); await run;
  assert.equal(finished, 1); const m = await q.metrics(); const queued = m.find(r => r.type === "slow" && r.status === "queued")!; assert.equal(queued.n, 4); assert.ok(queued.oldest_queued_s !== null && queued.oldest_queued_s >= 0);
  assert.equal((await pool.query("SELECT count(*)::int AS n FROM jobs WHERE status='running'")).rows[0].n, 0);
});
```

```bash
DATABASE_URL=postgres://app:app@127.0.0.1:5432/store node --import tsx --test src/queue.int.test.ts    # 5 pass
# لوحة سريعة بـ SQL: SELECT type, status, count(*), max(now()-run_at) FROM jobs GROUP BY 1,2;   ← oldest queued age هو المؤشّر الأهم
# DLQ: SELECT id, type, attempts, last_error FROM jobs WHERE status='dead' ORDER BY finished_at DESC LIMIT 20;   ثم retryDead(id) بعد الإصلاح
# تنظيف: DELETE FROM jobs WHERE status='done' AND finished_at < now() - interval '7 days';   (وظيفة مجدولة)
```

---

## 8. مثال من العالم الحقيقي
تطبيق تسجيل كان يرسل بريد الترحيب داخل طلب `POST /signup`. حين تعطّل مزوّد البريد 20 دقيقة، **فشل التسجيل نفسه** لآلاف المستخدمين (الطلب يعيد 500 بعد إنشاء الحساب — فيحاول المستخدم مجدّدًا ويحصل على "البريد مستخدم"). الإصلاح: outbox — إنشاء الحساب + وظيفة `send_welcome` في معاملة واحدة، 201 فورًا؛ العامل يعيد المحاولة بـ backoff حتى يعود المزوّد. الزمن المتوسّط للطلب انخفض من 900 ms إلى 40 ms، وتعطّل المزوّد صار "تأخّر بريد" لا "تعطّل تسجيل". وبسبب الـ lease وُجد أن 0.02% من الرسائل أُرسلت مرتين → مفتاح idempotency للمزوّد (= `job.id`) أزالها.

## 9. مثال من الإنتاج
منصّة فواتير تشغّل عامل "توليد PDF + إرسال" على SQS. حادثة: وظيفة تولّد PDF ضخمًا تأخذ 4 دقائق بينما visibility timeout = 2 دقيقة → تُستلم من عامل ثانٍ وثالث؛ ثلاثة PDF وثلاثة رسائل للعميل، وتضاعف الحمل حتى شبه انهيار ("retry storm"). ثلاثة إصلاحات من هذه الوحدة: heartbeat يمدّد الـ lease للوظائف الطويلة، مهلة للوظيفة نفسها (`jobTimeoutMs`) أقل من الـ lease، وحارس `processed(job_id)` + مفتاح idempotency للإرسال. وأضيف تنبيه "عمر أقدم وظيفة > 5 دقائق" و"DLQ > 0" إلى اللوحة (M6.6).

---

## 10. مفاهيم خاطئة شائعة
1. **"أدفع إلى الطابور بعد COMMIT وينتهي الأمر."** انهيار بين الاثنين يضيّع الوظيفة؛ الـ outbox في نفس المعاملة هو الحل.
2. **"الطابور يضمن التنفيذ مرة واحدة."** يضمن مرة على الأقل؛ "مرة واحدة فعليًا" تأتي من idempotency المعالج.
3. **"أحتاج Kafka/RabbitMQ من اليوم الأول."** جدول في PostgreSQL + `SKIP LOCKED` يكفي لمعظم الأنظمة طويلًا، وبقواعد تشغيل نفسها.
4. **"الفشل = أعد المحاولة دائمًا."** الأخطاء الدائمة (حمولة فاسدة، 4xx) تُعاد إلى الأبد وتُغرق DLQ متأخّرة؛ صنّف ثم قرّر.
5. **"العامل موثوق فلا يحتاج تفويضًا."** الوظيفة تحمل سياق فاعلها وتُعيد التحقق؛ وإلا صار الطابور طريقًا لتجاوز M5.3 (T-15).
6. **"DLQ للتخزين."** DLQ إشارة تحتاج تنبيهًا ومالكًا وأداة إعادة؛ وإلا فهي حذف بطيء.

## 11. أخطاء شائعة
1. حمولة تحمل كائنات كاملة (طلب، عميل) فتُنفَّذ على بيانات قديمة؛ احمل معرّفات واقرأ طازجًا.
2. بلا مهلة للوظيفة → عامل معلّق إلى الأبد يستهلك slot من التزامن.
3. lease أقصر من أسوأ زمن تنفيذ وبلا heartbeat → تنفيذ مزدوج/ثلاثي.
4. backoff بلا jitter ولا سقف؛ أو retry على 40001 وعلى "غير موجود" بنفس المعاملة.
5. `SIGTERM` يقتل العامل منتصف وظيفة بلا release/انتظار (M5.7).
6. جدول jobs بلا فهرس جزئي → claim يبطئ مع ملايين `done`؛ وبلا تنظيف.
7. تسجيل الحمولة كاملة في السجلات (قد تحوي PII)؛ أسرار في الحمولة.
8. تزامن العامل أعلى من حدود المزوّد الخارجي → 429 متتالية → عاصفة إعادة.

## 12. تمرين تصحيح
لوحة المقاييس: `oldest_queued_s` لنوع `generate_report` يرتفع خطيًا منذ ساعتين؛ العمّال "تعمل" (CPU منخفض)، لا أخطاء في السجل، DLQ فارغة.
1. **دليل:** `SELECT status, count(*) FROM jobs WHERE type='generate_report' GROUP BY 1` → 5 `running` منذ ساعتين، `locked_until` يُجدَّد كل 20 ثانية (heartbeat حيّ!).
2. **فرضية:** المعالج معلّق في انتظار شيء بلا مهلة (استدعاء تخزين خارجي؟) والـ heartbeat يُبقي الـ lease حيًّا فلا تُستعاد الوظائف؛ `jobTimeoutMs` ضُبط على 0 = معطّل لهذا النوع "لأن التقارير طويلة".
3. **تجربة:** `pg_stat_activity` للعامل لا يُظهر استعلامًا؛ heap snapshot/`--inspect` يُظهر 5 وعود معلّقة على `fetch` إلى خدمة التخزين (بلا `AbortSignal`).
4. **الإصلاح:** مهلة إلزامية لكل وظيفة (حدّ أعلى 15 دقيقة للتقارير) وممنوع تعطيلها؛ كل I/O خارجي في المعالجات بمهلة (قاعدة lint)؛ heartbeat **يتوقّف** عند تجاوز مهلة الوظيفة؛ تنبيه على "running لأكثر من X" لا على DLQ فقط.
5. **أين أيضًا؟** أي معالج يستدعي شبكة بلا `signal`؛ أي heartbeat غير مرتبط بمهلة.

## 13. تمرين معماري
صمّم **طبقة الخلفية** لـ Project 6: (1) جرد كل ما يخرج من دورة الطلب (بريد، ويبهوك صادر، تصدير CSV، معالجة الملفات المرفوعة، تنظيف دوري، مزامنة مخزون) مع: الحمولة (معرّفات + tenant/actor/requestId)، idempotency (مفتاح طبيعي/processed/مفتاح مزوّد)، تصنيف الأخطاء العابرة/الدائمة، max_attempts وbackoff، lease/heartbeat/مهلة، الأولوية، والتزامن المسموح مقابل حدود المزوّد؛ (2) النموذج الذهني `upload → API accepts → queue → worker → notify` كمخطّط تسلسل مع كل نقاط الفشل (M5.5 الفصل) وماذا يحدث فيها: DB بطيئة، worker ينهار منتصف الوظيفة، المزوّد ساقط ساعة، webhook مكرّر؛ (3) الإيقاف الرشيق للعامل أثناء النشر؛ (4) المقاييس والتنبيهات (عمر أقدم وظيفة، DLQ، running الطويلة) وأداة إعادة DLQ؛ (5) ACTRR لـ "PostgreSQL queue أم Redis/BullMQ أم SQS" بمعايير الحجم والفصل والتشغيل.

## 14. الصلة بعصر AI
AI يقترح "BullMQ/Redis" فورًا ويكتب `await queue.add()` **بعد** COMMIT (الكتابة المزدوجة الكلاسيكية)، ومعالجات غير idempotent، وبلا تصنيف للأخطاء. أعطه القواعد: outbox في المعاملة، at-least-once ⇒ idempotent، تصنيف عابر/دائم، lease+heartbeat+مهلة، سياق أمني في الحمولة — واطلب اختبارات §7 (خصوصًا "الانهيار منتصف الوظيفة" و"3 عمّال بلا ازدواج"). وهو ممتاز في توليد **سيناريوهات الفشل** للمخطّط (§13 بند 2) وفي كتابة استعلامات لوحة الطابور. والوكلاء (L8-M8.4) أنفسهم أنظمة وظائف: نفس القواعد تنطبق على "مهامهم" الطويلة.

## 15. ما يجب إتقانه (Must Master) 🔴
- 🔴 ما ينتمي إلى الخلفية؛ مشكلة الكتابة المزدوجة والـ outbox في المعاملة؛ claim ذري بـ `SKIP LOCKED`؛ lease والاستعادة بعد الانهيار؛ at-least-once ⇒ معالجات idempotent (processed/مفتاح طبيعي/حالة بشرط/مفتاح مزوّد)؛ تصنيف عابر/دائم؛ backoff + jitter + سقف؛ DLQ بمالك وتنبيه وأداة إعادة؛ الحمولة معرّفات + tenant/actor؛ العامل يعيد التفويض؛ مهلة لكل وظيفة؛ إيقاف رشيق؛ مقياس عمر أقدم وظيفة.

## 16. ما يجب فهمه (Should Understand) 🟠
- 🟠 heartbeat للطويلة؛ `LISTEN/NOTIFY`؛ الأولويات والجدولة (`run_at`)؛ الفهرس الجزئي والتنظيف؛ relay إلى وسيط خارجي؛ مقابلات المفاهيم في SQS/RabbitMQ/BullMQ؛ حدود معدّل المزوّد والتزامن.

## 17. ما يمكن تأجيله (Can Defer) ⚪
- ⚪ Kafka وسجلات الأحداث وإعادة التشغيل، exactly-once semantics في Kafka، sagas وتنسيق العمليات الطويلة (L7-M7.2)، تقسيم الطوابير بالمفتاح، CDC.

## 18. الخلاصة
1. الخلفية لكل ما يبطّئ الطلب أو يفشل خارجيًا؛ الطلب يكتب الحقيقة + الوظيفة في **معاملة واحدة** (outbox) ويعود فورًا.
2. claim ذري + lease ⇒ at-least-once ⇒ كل معالج idempotent؛ "exactly-once" يُبنى في المستهلك لا يُشترى.
3. صنّف الفشل: عابر → backoff + jitter بسقف؛ دائم/مستنفَد → DLQ مع السبب وتنبيه وأداة إعادة.
4. الوظيفة تحمل سياقها (tenant/actor/requestId) والعامل يعيد التفويض ويقرأ الحالة طازجة؛ حمولة صغيرة من معرّفات.
5. العامل الإنتاجي: تزامن محدود، مهلة لكل وظيفة، heartbeat، إيقاف رشيق عند حدود الوظيفة، ومقياس "عمر أقدم وظيفة" على اللوحة.

## 19. مراجع رسمية
- PostgreSQL — `SELECT … FOR UPDATE SKIP LOCKED`: https://www.postgresql.org/docs/current/sql-select.html#SQL-FOR-UPDATE-SHARE
- PostgreSQL — `LISTEN` / `NOTIFY`: https://www.postgresql.org/docs/current/sql-notify.html
- microservices.io — Transactional Outbox pattern: https://microservices.io/patterns/data/transactional-outbox.html
- AWS SQS — Visibility timeout & dead-letter queues: https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-visibility-timeout.html
- RabbitMQ — Consumer acknowledgements: https://www.rabbitmq.com/docs/confirms
- BullMQ — Jobs, retries & backoff: https://docs.bullmq.io/
- AWS Architecture Blog — Exponential backoff and jitter: https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/
- Node.js — `AbortSignal` & `AbortController`: https://nodejs.org/api/globals.html#class-abortcontroller

## المصطلحات
| العربية | English |
|---|---|
| عمل في الخلفية | Background work |
| وظيفة / عامل | Job / Worker |
| طابور | Queue |
| صندوق الصادر المعاملاتي | Transactional outbox |
| مشكلة الكتابة المزدوجة | Dual-write problem |
| استلام الوظيفة | Claim |
| عقد إيجار / مهلة الرؤية | Lease / Visibility timeout |
| نبض | Heartbeat |
| تسليم مرة على الأقل | At-least-once delivery |
| معالج idempotent | Idempotent handler |
| خطأ عابر / دائم | Transient / Permanent error |
| تراجع أسّي مع تشويش | Exponential backoff with jitter |
| طابور الرسائل الميتة | Dead-letter queue (DLQ) |
| رسالة سامة | Poison message |
| عاصفة إعادة المحاولة | Retry storm |
| عمر أقدم وظيفة | Oldest job age (queue lag) |
| ناقل / وسيط رسائل | Relay / Message broker |
