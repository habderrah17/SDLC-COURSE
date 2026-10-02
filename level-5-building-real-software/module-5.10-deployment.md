# Module 5.10 — النشر
## Deployment: environments, immutable artifacts, release vs deploy, zero-downtime strategies (rolling, blue/green, canary), safe migrations, rollback, feature flags, and a real first deploy

> **المستوى:** Level 5 | **الموقع:** [10 من 13]
> **السابق:** [M5.9 — Queues, Jobs & Workers](module-5.9-queues-jobs-workers.md) | **التالي:** [M5.11 — Docker & Containers](module-5.11-docker-containers.md)

---

## 1. المتطلبات
- [ ] العمليات، الإشارات، systemd كفكرة، SSH والـ shell — [L0-M0.4](../level-0-absolute-foundations/module-04-files-terminal-shell.md), [L2-M2.5](../level-2-computer-systems/module-2.5-process-deep-dive.md)
- [ ] IP/ports/0.0.0.0، reverse proxy، TLS والشهادات — [L0-M0.5](../level-0-absolute-foundations/module-05-processes-ports-localhost.md), [L2-M2.11](../level-2-computer-systems/module-2.11-tls.md)
- [ ] الإيقاف الرشيق، `/health` و`/ready`، التهيئة من البيئة — [M5.7](module-5.7-production-anatomy.md)
- [ ] الهجرات: expand → migrate → contract — [L4-M4.13](../level-4-software-engineering-foundations/module-4.13-refactoring.md), [L3-M3.12](../level-3-core-computer-science/module-3.12-database-design.md)
- [ ] Git tags، lockfile، SemVer — [L1-M1.14](../level-1-programming/module-1.14-git-2.md), [M5.4](module-5.4-security.md)
- [ ] الأقفال الاستشارية — [M5.6](module-5.6-concurrency-business-logic.md)

## 2. أهداف التعلّم
- التمييز بين **build** (كود → artifact ثابت)، **release** (artifact + تهيئة بيئة)، **deploy** (تشغيل الإصدار على البنية)، و**rollback** (العودة إلى إصدار سابق) — والنموذج الذهني الرابع لـ L5: `Code → Build → Test → Artifact → Deploy`.
- تصميم **بيئات** (dev/staging/prod) بتكافؤ معقول وفروق صريحة (بيانات، أسرار، حجم)، و**artifact غير قابل للتغيير** يُنشر نفسه في كل بيئة.
- تنفيذ **نشر بلا توقّف**: rolling مع readiness + إيقاف رشيق، blue/green، canary؛ ومتى يكفي recreate.
- جعل **الهجرات آمنة للنشر**: متوافقة للخلف دائمًا (expand/contract)، تُشغَّل **قبل** الكود الجديد، بقفل ضد التشغيل المتزامن، بلا أقفال طويلة على الجداول، وقابلية التراجع للكود لا للبيانات.
- بناء **أول نشر حقيقي** على خادم Linux: مستخدم خدمة، systemd، reverse proxy مع TLS، أسرار خارج Git، سكربت نشر ذري بالروابط الرمزية (symlink) + smoke test + rollback بأمر واحد؛ وفهم **feature flags** كفصل بين النشر والإطلاق.

---

## 3. شرح للمبتدئ

### أربع كلمات مختلفة
- **Build**: تحويل الكود عند commit معيّن إلى **artifact**: ملف/صورة يحوي كل ما يلزم للتشغيل (كود مترجم + `node_modules` المثبّتة من lockfile + نسخة Node). يُبنى **مرة واحدة** ويُسمّى بالـ SHA/الإصدار. لا تبنِ على خادم الإنتاج: البناء غير حتمي (شبكة، نسخ) ويحتاج أدوات لا تريدها هناك.
- **Release**: artifact + تهيئة بيئة (متغيّرات، أسرار، URLs). نفس الـ artifact يصبح إصدارات مختلفة لـ staging وprod (12-Factor V).
- **Deploy**: جعل الإصدار يخدم الحركة. هنا تعيش الاستراتيجيات.
- **Rollback**: العودة إلى الإصدار السابق **بسرعة** — سهل للكود إن كان الـ artifact السابق محفوظًا، صعب للبيانات؛ لذا تُصمَّم الهجرات لتسمح للكود القديم بالعمل مع المخطّط الجديد.

### البيئات
- **dev**: جهازك؛ بيانات وهمية؛ كل شيء محلي (M5.11 Compose).
- **staging** (pre-prod): نسخة مصغّرة من الإنتاج بنفس الـ artifact ونفس أنواع الخدمات (PostgreSQL نفس الإصدار الرئيسي!)، بيانات مجهّلة أو مولّدة؛ هنا تُشغَّل الهجرات أولًا وsmoke tests والاختبارات التي لا تجرؤ عليها في prod.
- **prod**: الوحيدة التي تهم؛ أسرار مستقلة، نسخ احتياطية مُختبَرة الاستعادة، وصول مقيّد ومسجّل.
الفروق بين البيئات **صريحة في التهيئة فقط** (M5.7 `SCHEMA`)، لا في الكود (`if (env === "production")` فروع نادرة وخطرة).

### الاستراتيجيات
- **Recreate**: أوقف القديم، شغّل الجديد. ثوانٍ من التوقّف. مقبول لأدوات داخلية أو نافذة صيانة.
- **Rolling**: N نسخة؛ استبدل واحدة واحدة: شغّل الجديدة → انتظر `/ready` → أدخلها في الـ LB → أرسل SIGTERM للقديمة (تصريف M5.7) → التالية. بلا توقّف، لكن **إصداران يعملان معًا** لدقائق → الـ API والمخطّط يجب أن يكونا متوافقين عبر إصدار واحد.
- **Blue/Green**: بيئتان كاملتان؛ انشر على الخاملة (green)، اختبرها، حوّل الـ LB دفعة واحدة؛ rollback = تحويل عكسي فوري. ثمنه ضعف الموارد ونفس شرط التوافق للمخطّط (DB مشتركة).
- **Canary**: الإصدار الجديد يأخذ 1% → 10% → 50% → 100% من الحركة مع مراقبة الأخطاء وp99 عند كل خطوة؛ **توقّف تلقائي وتراجع** عند تجاوز عتبة. الأكثر أمانًا، ويحتاج مقاييس (M6.6) وتوجيهًا بالنسب.
القاسم المشترك: **readiness + إيقاف رشيق + توافق N/N-1** = الأساس التقني لأي نشر بلا توقّف.

### الهجرات داخل النشر
القواعد الذهبية: (1) **كل هجرة متوافقة للخلف** مع الكود الحالي: أضف عمودًا nullable/بقيمة افتراضية، لا تُعِد التسمية ولا تحذف في نفس الإصدار (expand → migrate data → contract بعد إصدار، L4-M4.13)؛ (2) **شغّل الهجرات قبل نشر الكود الجديد** كخطوة منفصلة (12-Factor XII)، لا عند إقلاع كل نسخة (سباق N نسخ — وإن فعلت فبقفل استشاري)؛ (3) **لا أقفال طويلة**: `ADD COLUMN … DEFAULT` ثابت رخيص في PG ≥ 11، لكن `ALTER TYPE`/`NOT NULL` على جدول ضخم أو `CREATE INDEX` بلا `CONCURRENTLY` يقفل الجدول دقائق؛ اضبط `lock_timeout` قصيرًا في الهجرة حتى تفشل بدل أن تجمّد الإنتاج؛ (4) **هجرات البيانات على دفعات** (M5.6 §12)؛ (5) الهجرة صغيرة، مرقّمة، لا تُعدَّل بعد دمجها، وفي جدول `schema_migrations` مع checksum؛ (6) **rollback للكود لا يحتاج rollback للمخطّط** إن احترمت (1) — و"down migration" نادرًا ما تُشغَّل في الإنتاج؛ خطّط للأمام (fix-forward).

### أول نشر حقيقي (VPS واحد)
قبل Docker وKubernetes، افهم الطبقات بيديك: (1) خادم Linux، مستخدم `deploy` بلا صلاحيات root للتطبيق، جدار ناري يفتح 22/80/443 فقط؛ (2) Node مثبّت بإصدار محدّد؛ (3) الـ artifact يُرفع إلى `/srv/app/releases/<sha>/` (بناء على CI، M5.12)، والأسرار في `/etc/app/env` بصلاحيات 600 خارج Git؛ (4) `systemd` يشغّل `node dist/main.js` كخدمة: إعادة تشغيل عند الانهيار، سجلات إلى journald، `KillSignal=SIGTERM` + `TimeoutStopSec=30` (M5.7)، حدود موارد؛ (5) **reverse proxy** (Caddy أو nginx) ينهي TLS (شهادة Let's Encrypt تلقائية)، يمرّر إلى `127.0.0.1:8080`، ويضيف الرؤوس الأمنية (M5.4)؛ (6) **النشر الذري**: `current → releases/<sha>` رابط رمزي يُبدَّل بأمر واحد (`ln -sfn`) ثم `systemctl restart` (أو reload لصفر توقّف مع نسختين) → smoke test على `/ready` و مسار حقيقي → إن فشل: أعد الرابط إلى الإصدار السابق وأعد التشغيل (rollback < 30 ثانية)؛ احتفظ بآخر 5 إصدارات.
بعد أن تفهم هذا، M5.11 تضع الـ artifact في صورة، وM5.13 تجعل المنصّة تدير الخطوات 4–6.

### Feature flags: فصل النشر عن الإطلاق
النشر = الكود موجود في الإنتاج. الإطلاق = المستخدمون يرونه. **علم ميزة** (flag) من التهيئة/جدول يسمح بنشر الكود "مطفأً"، ثم تشغيله لنسبة/مستأجر/مجموعة داخلية، وإطفائه فورًا عند مشكلة بلا نشر. ثمنه: فروع في الكود يجب **تنظيفها** بعد الإطلاق (دين تقني، L4-M4.15)، واختبار الحالتين.

### قائمة النشر الآمن
artifact ثابت بالـ SHA؛ الاختبارات خضراء على نفس الـ artifact؛ الهجرة متوافقة للخلف ومُشغَّلة على staging؛ `/ready` + إيقاف رشيق مُختبران؛ خطة rollback بأمر واحد مجرّبة؛ مراقبة الأخطاء وp99 خلال النشر (لوحة مفتوحة)؛ النشر في ساعات عمل الفريق لا الجمعة ليلًا؛ تغيير واحد في كل نشر (صغير ومتكرّر أسهل تشخيصًا من ضخم ونادر — M5.12).

---

## 4. النموذج الذهني

```
   Code → Build (artifact ثابت بالـ SHA) → Test (نفس الـ artifact) → Release (+ تهيئة البيئة) → Deploy (استراتيجية) → Verify (smoke, متريكس) → أو Rollback
   بلا توقّف = readiness + إيقاف رشيق + توافق N/N-1 (API ومخطّط).
   الهجرة: متوافقة للخلف، قبل الكود، بقفل، بلا أقفال طويلة (lock_timeout)، البيانات على دفعات، fix-forward.
   VPS: مستخدم خدمة + systemd + proxy/TLS + أسرار خارج Git + releases/<sha> + current symlink + smoke + rollback بأمر.
   Feature flag يفصل النشر عن الإطلاق. انشر صغيرًا، كثيرًا، نهارًا، مع لوحة مفتوحة.
```

---

## 5. الرسم التوضيحي

```mermaid
flowchart LR
  G[git tag v1.4.0 / sha abc123] --> B[Build once: artifact abc123]
  B --> T[Test the artifact]
  T --> S[Release to staging: abc123 + staging config]
  S --> M1[Run migrations on staging] --> SM[Smoke tests]
  SM --> P[Release to prod: abc123 + prod config]
  P --> M2[Run migrations on prod: backward compatible] --> D[Deploy rolling / canary]
  D --> V{errors & p99 OK?}
  V -- yes --> DONE[100% traffic, keep previous artifact]
  V -- no --> R[Rollback: previous artifact, schema untouched]
```

```
   Rolling على 3 نسخ (الإصدار القديم O، الجديد N):
   t0  [O][O][O]                    LB → O,O,O
   t1  [O][O][O][N]  N: /ready 200  LB → O,O,O,N
   t2  SIGTERM → [O*][O][O][N]      O*: ready=false → تصريف → خروج     LB → O,O,N
   t3  [O][O][N][N] … t5 [N][N][N]
   طوال t1–t5: O وN يعملان معًا على نفس DB ⇒ المخطّط يخدم الاثنين، والعميل قد يصيب O ثم N في طلبين متتاليين.
```

---

## 6. مثال بسيط

```typescript
// src/rollout.ts — منطق النشر التدريجي (rolling/canary) كدالّة خالصة قابلة للاختبار: ترقيةٌ واحدة في كل خطوة، تحقّق، وتراجع تلقائي
export type Instance = { id: string; version: string; ready: boolean };
export type Probe = (inst: Instance) => Promise<{ ready: boolean; errorRate: number }>;   // /ready + مقياس أخطاء بعد إدخالها في الحركة
export type RolloutEvent = { step: number; action: "start" | "ready" | "promote" | "rollback" | "abort"; instance?: string; reason?: string };
export async function rollingDeploy(fleet: Instance[], newVersion: string, probe: Probe, opts: { maxErrorRate?: number; readyTimeoutSteps?: number; start: (id: string, v: string) => Promise<Instance>; stop: (id: string) => Promise<void> }): Promise<{ ok: boolean; fleet: Instance[]; events: RolloutEvent[] }> {
  const events: RolloutEvent[] = []; const previous = fleet.map(i => ({ ...i })); let current = fleet.map(i => ({ ...i })); let step = 0;
  for (const old of previous) {
    step++; const fresh = await opts.start(`${old.id}'`, newVersion); events.push({ step, action: "start", instance: fresh.id });
    let ready = false; for (let k = 0; k < (opts.readyTimeoutSteps ?? 10); k++) { if ((await probe(fresh)).ready) { ready = true; break; } }
    if (!ready) { events.push({ step, action: "abort", instance: fresh.id, reason: "never became ready" }); await opts.stop(fresh.id); return { ok: false, fleet: current, events };}   // لم ندخلها في الحركة: لا ضرر، لا تراجع مطلوب
    events.push({ step, action: "ready", instance: fresh.id }); current = [...current, { ...fresh, ready: true }];
    const health = await probe(fresh);                                                                   // الآن تحت حركة حقيقية
    if (health.errorRate > (opts.maxErrorRate ?? 0.02)) {
      events.push({ step, action: "rollback", instance: fresh.id, reason: `error rate ${health.errorRate}` });
      for (const i of current.filter(i => i.version === newVersion)) await opts.stop(i.id);             // أزل كل الجديد، القديم ما زال يخدم
      return { ok: false, fleet: previous, events };
    }
    await opts.stop(old.id); current = current.filter(i => i.id !== old.id); events.push({ step, action: "promote", instance: old.id, reason: "old instance drained" });   // SIGTERM → تصريف (M5.7)
  }
  return { ok: true, fleet: current, events };
}
```

---

## 7. مثال كود

```typescript
// src/migrate.ts — مشغّل هجرات إنتاجي: ترقيم، checksum، قفل استشاري ضد التشغيل المتزامن، lock_timeout، معاملة لكل هجرة
import pg from "pg"; import { createHash } from "node:crypto"; import { readdirSync, readFileSync } from "node:fs"; import path from "node:path";
export type Migration = { version: number; name: string; sql: string; checksum: string; noTransaction?: boolean };
export function loadMigrations(dir: string): Migration[] {
  return readdirSync(dir).filter(f => /^\d{4}_[\w-]+\.sql$/.test(f)).sort().map(f => { const sql = readFileSync(path.join(dir, f), "utf8"); return { version: Number(f.slice(0, 4)), name: f.slice(5, -4), sql, checksum: createHash("sha256").update(sql).digest("hex"), noTransaction: /^--\s*no-transaction/m.test(sql) }; });   // CREATE INDEX CONCURRENTLY لا يعمل داخل معاملة
}
export async function migrate(pool: pg.Pool, migrations: Migration[], log: (m: string) => void = () => {}): Promise<number[]> {
  const c = await pool.connect(); const applied: number[] = [];
  try {
    while (!(await c.query("SELECT pg_try_advisory_lock(727272) AS ok")).rows[0].ok) await new Promise(r => setTimeout(r, 200));   // نسخ متعدّدة تقلع معًا؟ واحدة فقط تهاجر والباقي ينتظر ثم يجد كل شيء مطبّقًا. try + نوم لا pg_advisory_lock المعلّق: الجلسة المعلّقة تحمل snapshot فتُجمّد CREATE INDEX CONCURRENTLY (deadlock حقيقي رأيناه)
    try {
      await c.query("CREATE TABLE IF NOT EXISTS schema_migrations (version int PRIMARY KEY, name text NOT NULL, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())");
      const done = new Map<number, string>((await c.query("SELECT version, checksum FROM schema_migrations")).rows.map(r => [r.version, r.checksum]));
      for (const m of migrations) {
        const seen = done.get(m.version);
        if (seen !== undefined) { if (seen !== m.checksum) throw new Error(`migration ${m.version}_${m.name} was modified after being applied (checksum mismatch) — write a new migration instead`); continue; }
        log(`applying ${m.version}_${m.name}`);
        if (m.noTransaction) { await c.query(m.sql); await c.query("INSERT INTO schema_migrations(version, name, checksum) VALUES ($1,$2,$3)", [m.version, m.name, m.checksum]); }
        else { try { await c.query("BEGIN"); await c.query("SET LOCAL lock_timeout = '5s'"); await c.query(m.sql); await c.query("INSERT INTO schema_migrations(version, name, checksum) VALUES ($1,$2,$3)", [m.version, m.name, m.checksum]); await c.query("COMMIT"); } catch (e) { await c.query("ROLLBACK").catch(() => {}); throw new Error(`migration ${m.version}_${m.name} failed: ${(e as Error).message}`, { cause: e }); } }   // lock_timeout: افشل بدل أن تجمّد الإنتاج
        applied.push(m.version);
      }
    } finally { await c.query("SELECT pg_advisory_unlock(727272)"); }
  } finally { c.release(); }
  return applied;
}
```

```typescript
// src/deploy.test.ts — الهجرات (PostgreSQL حقيقية) + منطق rolling/canary (خالص)
import { test, before, after } from "node:test"; import assert from "node:assert/strict"; import pg from "pg"; import { mkdtempSync, writeFileSync } from "node:fs"; import { tmpdir } from "node:os"; import path from "node:path";
import { loadMigrations, migrate } from "./migrate.js"; import { rollingDeploy, type Instance } from "./rollout.js";
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL ?? "postgres://app:app@127.0.0.1:5432/store", max: 5 });
before(() => pool.query("DROP TABLE IF EXISTS schema_migrations, customers CASCADE")); after(() => pool.end());
const dir = mkdtempSync(path.join(tmpdir(), "mig-")); const write = (f: string, sql: string) => writeFileSync(path.join(dir, f), sql);

test("migrations: ordered, idempotent, concurrent-safe, checksum-guarded, backward compatible (expand)", async () => {
  write("0001_create_customers.sql", "CREATE TABLE customers (id serial PRIMARY KEY, name text NOT NULL);");
  write("0002_expand_add_email.sql", "ALTER TABLE customers ADD COLUMN email text;");                     // expand: nullable، الكود القديم يعمل
  write("0003_email_index.sql", "-- no-transaction\nCREATE INDEX CONCURRENTLY IF NOT EXISTS customers_email_idx ON customers (email);");
  const ms = loadMigrations(dir); assert.deepEqual(ms.map(m => m.version), [1, 2, 3]); assert.equal(ms[2]!.noTransaction, true);
  const results = await Promise.all([migrate(pool, ms), migrate(pool, ms), migrate(pool, ms)]);          // 3 نسخ تقلع معًا
  assert.deepEqual(results.flat().sort(), [1, 2, 3]);                                                     // طُبّقت مرة واحدة إجمالًا
  assert.deepEqual(await migrate(pool, ms), []);                                                           // إعادة التشغيل: لا شيء
  await pool.query("INSERT INTO customers(name) VALUES ('old code still works without email')");
  write("0002_expand_add_email.sql", "ALTER TABLE customers ADD COLUMN email text NOT NULL;");           // أحدهم عدّل هجرة مطبّقة
  await assert.rejects(migrate(pool, loadMigrations(dir)), /modified after being applied/);
});
test("migration failure rolls back that migration only and reports the cause", async () => {
  write("0002_expand_add_email.sql", "ALTER TABLE customers ADD COLUMN email text;");                     // أعد الأصل
  write("0004_bad.sql", "ALTER TABLE customers ADD COLUMN phone text; ALTER TABLE nope ADD COLUMN x int;");
  await assert.rejects(migrate(pool, loadMigrations(dir)), /migration 4_bad failed: relation "nope" does not exist/);
  assert.equal((await pool.query("SELECT count(*)::int AS n FROM information_schema.columns WHERE table_name='customers' AND column_name='phone'")).rows[0].n, 0);   // ROLLBACK ألغى phone أيضًا
  assert.equal((await pool.query("SELECT max(version) FROM schema_migrations")).rows[0].max, 3);
});
test("rolling deploy: promotes instance by instance; aborts if never ready; rolls back on error rate", async () => {
  const fleet = (): Instance[] => [{ id: "a", version: "v1", ready: true }, { id: "b", version: "v1", ready: true }, { id: "c", version: "v1", ready: true }];
  const stopped: string[] = []; const ops = { start: async (id: string, version: string) => ({ id, version, ready: false }), stop: async (id: string) => { stopped.push(id); } };
  const good = await rollingDeploy(fleet(), "v2", async () => ({ ready: true, errorRate: 0.001 }), ops);
  assert.ok(good.ok); assert.deepEqual(good.fleet.map(i => i.version), ["v2", "v2", "v2"]); assert.deepEqual(stopped, ["a", "b", "c"]); assert.equal(good.events.filter(e => e.action === "promote").length, 3);
  stopped.length = 0; const never = await rollingDeploy(fleet(), "v2", async () => ({ ready: false, errorRate: 0 }), { ...ops, readyTimeoutSteps: 3 });
  assert.equal(never.ok, false); assert.equal(never.fleet.length, 3); assert.ok(never.fleet.every(i => i.version === "v1")); assert.deepEqual(stopped, ["a'"]); assert.equal(never.events.at(-1)?.action, "abort");
  stopped.length = 0; let calls = 0; const canary = await rollingDeploy(fleet(), "v2", async i => ({ ready: true, errorRate: i.version === "v2" && ++calls > 2 ? 0.2 : 0 }), ops);   // الثانية الجديدة تُظهر 20% أخطاء تحت الحركة
  assert.equal(canary.ok, false); assert.deepEqual(canary.fleet.map(i => i.id), ["a", "b", "c"]); assert.ok(canary.events.some(e => e.action === "rollback" && /0.2/.test(e.reason ?? "")));
  assert.ok(stopped.includes("a'") && stopped.includes("b'"));                                            // أُزيل كل الجديد؛ "a" القديمة كانت قد أُوقفت لكن الخطة تعيد الأسطول السابق (في الواقع: تشغيلها من جديد)
});
```

```bash
# أول نشر حقيقي على VPS (Ubuntu) — الخطوات بيديك مرة واحدة قبل أتمتتها في M5.12
# (1) الخادم: مستخدم خدمة + جدار ناري
sudo adduser --system --group --home /srv/app deploy && sudo ufw allow 22,80,443/tcp && sudo ufw enable
# (2) Node بإصدار ثابت (نفس .nvmrc/engines في المشروع) و(3) الأسرار خارج Git
sudo mkdir -p /etc/app && sudo tee /etc/app/env >/dev/null <<'ENV'
NODE_ENV=production
PORT=8080
DATABASE_URL=postgres://app:********@10.0.0.5:5432/store
SESSION_SECRET=********
ENV
sudo chmod 600 /etc/app/env && sudo chown root:deploy /etc/app/env && sudo chmod 640 /etc/app/env
# (4) systemd: إعادة تشغيل عند الانهيار، SIGTERM + مهلة 30s (M5.7)، سجلات إلى journald
sudo tee /etc/systemd/system/app.service >/dev/null <<'UNIT'
[Unit]
Description=Store API
After=network-online.target
[Service]
User=deploy
WorkingDirectory=/srv/app/current
EnvironmentFile=/etc/app/env
ExecStart=/usr/bin/node dist/main.js
Restart=always
RestartSec=2
KillSignal=SIGTERM
TimeoutStopSec=30
LimitNOFILE=65536
MemoryMax=512M
NoNewPrivileges=true
ProtectSystem=strict
ReadWritePaths=/srv/app/uploads
[Install]
WantedBy=multi-user.target
UNIT
sudo systemctl daemon-reload && sudo systemctl enable app
# (5) Caddy كـ reverse proxy مع TLS تلقائي (Let's Encrypt) + رؤوس أمنية (M5.4)
sudo tee /etc/caddy/Caddyfile >/dev/null <<'CADDY'
api.example.com {
  encode gzip
  header {
    Strict-Transport-Security "max-age=31536000; includeSubDomains"
    X-Content-Type-Options nosniff
    -Server
  }
  reverse_proxy 127.0.0.1:8080 {
    health_uri /ready
    health_interval 5s
  }
}
CADDY
sudo systemctl reload caddy
```

```bash
# deploy.sh — نشر ذري بالروابط الرمزية + هجرة + smoke + rollback؛ يُستدعى من CI (M5.12) بـ SHA محدّد
#!/usr/bin/env bash
set -euo pipefail
SHA="$1"; ART="artifact-${SHA}.tar.gz"; REL="/srv/app/releases/${SHA}"; CUR="/srv/app/current"
PREV="$(readlink -f "$CUR" 2>/dev/null || true)"
mkdir -p "$REL" && tar -xzf "/tmp/${ART}" -C "$REL"                                   # artifact مبني مسبقًا: dist/ + node_modules/ (lockfile) + package.json
( cd "$REL" && set -a && . /etc/app/env && set +a && node dist/migrate.js )            # (1) الهجرات أولًا — متوافقة للخلف، فالكود القديم ما زال يعمل
ln -sfn "$REL" "${CUR}.tmp" && mv -Tf "${CUR}.tmp" "$CUR"                              # (2) تبديل ذري للرابط
sudo systemctl restart app                                                              # (3) SIGTERM → تصريف → إقلاع الجديد (مع نسختين وproxy: reload بلا توقّف)
for i in $(seq 1 20); do curl -fsS -m 2 http://127.0.0.1:8080/ready >/dev/null && break; sleep 1; [ "$i" = 20 ] && { echo "not ready"; false; }; done
curl -fsS -m 5 http://127.0.0.1:8080/v1/products?limit=1 >/dev/null                    # (4) smoke: مسار حقيقي لا /health فقط
echo "deployed ${SHA}"; ls -dt /srv/app/releases/* | tail -n +6 | xargs -r rm -rf       # احتفظ بآخر 5
# rollback بأمر واحد (يُنفَّذ يدويًا أو بـ trap ERR): ln -sfn "$PREV" "$CUR" && sudo systemctl restart app
```

```typescript
// src/flags.ts — feature flags من التهيئة/الجدول: نشر مطفأ، إطلاق تدريجي بالمستأجر/النسبة، إطفاء فوري بلا نشر
import { createHash } from "node:crypto";
export type Flag = { key: string; enabled: boolean; percentage?: number; tenants?: string[] };
export function isOn(flag: Flag | undefined, ctx: { tenantId?: string; userId?: string }): boolean {
  if (!flag || !flag.enabled) return false;
  if (flag.tenants?.length && ctx.tenantId && flag.tenants.includes(ctx.tenantId)) return true;
  if (flag.percentage !== undefined) { const bucket = parseInt(createHash("sha1").update(`${flag.key}:${ctx.userId ?? ctx.tenantId ?? ""}`).digest("hex").slice(0, 8), 16) % 100; return bucket < flag.percentage; }   // ثابت لنفس المستخدم (لا يتذبذب بين الطلبات)
  return !flag.tenants?.length;
}
// if (isOn(flags.get("new_checkout"), { tenantId, userId })) return newCheckout(...); return oldCheckout(...);   ← ومهمّة تنظيف بعد 100%: احذف الفرع القديم والعلم
```

---

## 8. مثال من العالم الحقيقي
فريق صغير ينشر بـ `git pull && npm install && pm2 restart` على الخادم. ثلاث حوادث في شهر: (1) `npm install` سحب إصدارًا فرعيًا جديدًا من مكتبة (بلا `npm ci`) كسر الإنتاج بينما staging سليم؛ (2) نشر منتصف اليوم أعاد التشغيل أثناء 40 عملية دفع (بلا إيقاف رشيق)؛ (3) هجرة `RENAME COLUMN` نُشرت مع الكود، لكن `pm2 restart` أخذ 10 ثوانٍ كانت فيها النسخة القديمة تقرأ العمود القديم → 500. الانتقال إلى §7: artifact مبني مرة على CI بـ `npm ci`، systemd بـ SIGTERM/30s، expand→contract للعمود، deploy.sh بالرابط الرمزي وsmoke وrollback — صفر حوادث نشر في الربع التالي، والنشر صار 8 مرات في اليوم بدل مرتين في الأسبوع.

## 9. مثال من الإنتاج
منصّة SaaS على Kubernetes تنشر بـ canary 5% → 25% → 100% بتوجيه من service mesh ومعايير تلقائية (5xx < 0.5%، p99 < 400 ms خلال 10 دقائق لكل مرحلة). حادثة كادت تقع: إصدار جديد يكتب حقلًا بتنسيق جديد يقرأه الإصدار القديم بشكل خاطئ — canary بدا سليمًا (أخطاؤه صفر) لكن **النسخ القديمة** بدأت تخطئ عند قراءة ما كتبه الجديد. الدرس: معيار canary يجب أن يراقب **الأسطول كله** لا الـ canary فقط، وتوافق N/N-1 يشمل **البيانات المكتوبة** لا المخطّط فحسب (نفس مبدأ expand/contract على مستوى التنسيق: اكتب القديم والجديد، اقرأ أيهما، ثم انتقل). أُضيف اختبار "توافق إصدارين" يشغّل O وN معًا على نفس DB في CI.

---

## 10. مفاهيم خاطئة شائعة
1. **"النشر = git pull على الخادم."** البناء على الإنتاج غير حتمي وغير قابل للتراجع؛ artifact ثابت يُبنى مرة.
2. **"down migration تحميني."** نادرًا ما تُشغَّل بأمان مع بيانات جديدة؛ الحماية الحقيقية هجرات متوافقة للخلف وfix-forward.
3. **"blue/green يعني لا حاجة للتوافق."** DB مشتركة؛ وقد تعود إلى blue بعد أن كتب green بيانات بتنسيق جديد.
4. **"staging مضيعة للوقت لفريق صغير."** هو المكان الوحيد الذي تجرّب فيه الهجرة على مخطّط حقيقي قبل prod؛ يمكن أن يكون صغيرًا ومؤقتًا.
5. **"النشر نادرًا أكثر أمانًا."** النشر الضخم النادر يراكم المخاطر ويصعّب التشخيص؛ الصغير المتكرّر أقل خطرًا بشرط الأتمتة.
6. **"feature flag مجاني."** كل علم فرع يجب اختباره وحذفه؛ الأعلام المنسية ديون وثغرات.

## 11. أخطاء شائعة
1. `npm install` بدل `npm ci` في البناء؛ بناء على الخادم؛ artifact بلا SHA.
2. الهجرة عند إقلاع كل نسخة بلا قفل → سباق N نسخ؛ أو هجرة مع الكود الجديد في نفس اللحظة بلا توافق. (ودقيقة: الانتظار المعلّق على `pg_advisory_lock` يحمل snapshot يجمّد `CREATE INDEX CONCURRENTLY` في الجلسة الفائزة → deadlock؛ لذا `try_lock` + نوم في §7.)
3. `CREATE INDEX` بلا `CONCURRENTLY`، أو `ALTER` ثقيل بلا `lock_timeout` → تجميد الإنتاج دقائق.
4. تعديل هجرة بعد دمجها (checksum) بدل كتابة هجرة جديدة.
5. أسرار في الـ artifact أو في `systemd` unit داخل Git؛ ملف env بصلاحيات 644.
6. smoke test على `/health` فقط (العملية حيّة لكن DB/الهجرة/التهيئة خاطئة) بدل مسار حقيقي.
7. بلا rollback مجرّب: أول مرة تنفّذه هي أثناء الحادثة.
8. نشر الجمعة مساءً أو قبل عطلة؛ عدة تغييرات كبيرة في نشر واحد.

## 12. تمرين تصحيح
بعد نشر rolling، 3% من الطلبات تعيد 500 لمدة 4 دقائق ثم تختفي؛ لا تظهر في staging؛ السجل: `column "first_name" does not exist` من النسخ **الجديدة**.
1. **دليل:** الهجرة 0007 تضيف `first_name` و`last_name` وتحذف `display_name` في **نفس الهجرة**؛ الخطأ من النسخ الجديدة لا القديمة — غريب.
2. **فرضية:** deploy.sh على الخوادم الثلاثة يعمل بالتوازي؛ الخادم 2 شغّل الكود الجديد **قبل** أن ينهي الخادم 1 الهجرة (بسبب القفل الاستشاري انتظر 2 ثم وجدها مطبّقة)، وبين الإقلاع وانتهاء الهجرة خدم طلبات بمخطّط قديم. وأيضًا: النسخ القديمة بعد الهجرة فقدت `display_name` (أخطاؤها غرقت في 4 دقائق).
3. **تجربة:** إعادة إنتاج على staging بنسختين وتأخير مصطنع في الهجرة → نفس 500.
4. **الإصلاح:** الهجرة **خطوة منفصلة قبل** أي نشر كود (job واحد في CI، M5.12)، لا داخل deploy.sh لكل خادم؛ تقسيم 0007 إلى expand (إضافة الأعمدة + backfill على دفعات + كتابة مزدوجة في الكود) ثم contract بعد إصدار؛ اختبار "الكود القديم على المخطّط الجديد" في CI؛ readiness يتحقق من `schema_migrations.max(version) >= REQUIRED_VERSION` فلا تدخل نسخة الحركة قبل جاهزية المخطّط.
5. **أين أيضًا؟** كل هجرة تحذف/تعيد تسمية؛ كل نشر يشغّل الهجرة في كل نسخة.

## 13. تمرين معماري
اكتب **خطة نشر Project 6** (مستند تشغيلي يُراجع): (1) خريطة البيئات (dev Compose / staging / prod) وفروق التهيئة فقط؛ (2) تعريف الـ artifact (محتوى، تسمية بالـ SHA، أين يُخزَّن، كم إصدارًا يُحتفظ به)؛ (3) ترتيب خطوات النشر للـ API **والعامل** (M5.9: من يُنشر أولًا حين تتغيّر حمولة الوظائف؟ قاعدة: العامل يفهم القديم والجديد قبل أن يكتب الـ API الجديد)؛ (4) سياسة الهجرات (توافق N/N-1، lock_timeout، CONCURRENTLY، دفعات، checksum، خطوة منفصلة)؛ (5) الاستراتيجية (rolling أم blue/green أم canary) مع معايير التوقّف وخطة rollback بأمر واحد وزمنها المستهدف؛ (6) smoke tests (قائمة مسارات) ولوحة النشر؛ (7) feature flags: أيها تحتاج وجدول تنظيفها؛ (8) ACTRR لـ "VPS + systemd" مقابل "حاويات على منصّة" في المرحلة الحالية.

## 14. الصلة بعصر AI
AI يكتب سكربتات نشر تبدو مقنعة وتفعل `git pull && npm install && pm2 restart`، وهجرات `RENAME COLUMN` في خطوة واحدة، وDockerfiles بلا SIGTERM. قيّمه بقائمة §3 "النشر الآمن" وبسؤال واحد: "ماذا يحدث لطلب دفع جارٍ لحظة النشر؟ ولنسخة قديمة بعد الهجرة؟". وهو ممتاز في: مراجعة الهجرات بحثًا عن أقفال طويلة ("هل هذه العبارة تأخذ ACCESS EXCLUSIVE على جدول كبير؟")، وتوليد وحدات systemd/Caddyfile من متطلباتك، وكتابة قوائم تحقق ما قبل النشر لمستودعك تحديدًا.

## 15–17. Master / Understand / Defer
- 🔴 build/release/deploy/rollback؛ artifact ثابت بالـ SHA مبني مرة بـ `npm ci`؛ البيئات وفروق التهيئة فقط؛ rolling يحتاج readiness + إيقاف رشيق + توافق N/N-1؛ الهجرات: متوافقة للخلف، قبل الكود، خطوة واحدة بقفل، `lock_timeout`، `CONCURRENTLY`، checksum، fix-forward؛ النشر الذري بالرابط الرمزي + smoke على مسار حقيقي + rollback بأمر مجرّب؛ systemd بـ SIGTERM/مهلة؛ أسرار خارج Git بصلاحيات مقيّدة؛ انشر صغيرًا كثيرًا نهارًا.
- 🟠 blue/green وcanary ومعاييرهما (مراقبة الأسطول كله)؛ feature flags وتنظيفها؛ تقسيم النشر بين API والعامل؛ readiness المرتبط بإصدار المخطّط؛ Caddy/nginx وTLS التلقائي؛ `ProtectSystem`/`MemoryMax` في systemd.
- ⚪ GitOps، service mesh والتوجيه بالنسب، تفاصيل Kubernetes Deployments/rollouts (M5.13)، نشر DB متعدّدة المناطق، تحليل أقفال PostgreSQL لكل عبارة DDL.

## 18. الخلاصة
1. `Code → Build → Test → Artifact → Deploy`: artifact ثابت بالـ SHA يُبنى مرة ويُنشر نفسه في كل بيئة؛ الفروق في التهيئة.
2. بلا توقّف = readiness + إيقاف رشيق + توافق N/N-1 للـ API والمخطّط والبيانات المكتوبة.
3. الهجرات: متوافقة للخلف، قبل الكود، بقفل، بلا أقفال طويلة، على دفعات، لا تُعدَّل بعد دمجها، fix-forward.
4. أول نشر بيديك: مستخدم خدمة، systemd، proxy/TLS، أسرار خارج Git، رابط رمزي + smoke + rollback بأمر.
5. انشر صغيرًا، كثيرًا، نهارًا، مع لوحة مفتوحة؛ وافصل الإطلاق عن النشر بأعلام تُنظَّف.

## 19. مراجع رسمية
- The Twelve-Factor App — V. Build, release, run / XII. Admin processes: https://12factor.net/build-release-run
- PostgreSQL — `ALTER TABLE` notes on locking & defaults: https://www.postgresql.org/docs/current/sql-altertable.html
- PostgreSQL — `CREATE INDEX CONCURRENTLY`: https://www.postgresql.org/docs/current/sql-createindex.html#SQL-CREATEINDEX-CONCURRENTLY
- systemd — `systemd.service` (KillSignal, TimeoutStopSec, Restart): https://www.freedesktop.org/software/systemd/man/latest/systemd.service.html
- systemd — `systemd.exec` sandboxing (ProtectSystem, NoNewPrivileges): https://www.freedesktop.org/software/systemd/man/latest/systemd.exec.html
- Caddy — Automatic HTTPS & reverse_proxy: https://caddyserver.com/docs/automatic-https
- npm — `npm ci`: https://docs.npmjs.com/cli/v10/commands/npm-ci
- Martin Fowler — Feature Toggles: https://martinfowler.com/articles/feature-toggles.html
- Google SRE Book — Release Engineering: https://sre.google/sre-book/release-engineering/

## المصطلحات
| العربية | English |
|---|---|
| بناء / إصدار / نشر / تراجع | Build / Release / Deploy / Rollback |
| منتج بناء ثابت | Immutable artifact |
| بيئة (تطوير/تجريبية/إنتاج) | Environment (dev/staging/prod) |
| تكافؤ البيئات | Dev/prod parity |
| نشر بلا توقّف | Zero-downtime deployment |
| إعادة الإنشاء / تدريجي / أزرق-أخضر / كناري | Recreate / Rolling / Blue-green / Canary |
| توافق الإصدارين المتجاورين | N/N-1 compatibility |
| هجرة متوافقة للخلف | Backward-compatible migration |
| توسيع ← ترحيل ← تقليص | Expand → Migrate → Contract |
| الإصلاح إلى الأمام | Fix-forward |
| مجموع تحقق الهجرة | Migration checksum |
| اختبار دخاني | Smoke test |
| نشر ذري بالرابط الرمزي | Atomic symlink deploy |
| علم ميزة | Feature flag |
| نافذة صيانة | Maintenance window |
