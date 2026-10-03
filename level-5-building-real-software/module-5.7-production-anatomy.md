# Module 5.7 — تشريح نظام إنتاجي
## Anatomy of a Production System: config, connection pools, timeouts everywhere, health & readiness, graceful shutdown, resource limits, the request lifecycle end to end

> **المستوى:** Level 5 | **الموقع:** [7 من 13]
> **السابق:** [M5.6 — Concurrency in Business Logic](module-5.6-concurrency-business-logic.md) | **التالي:** [M5.8 — Caching](module-5.8-caching.md)

---

## 1. المتطلبات
> **قبل أن تتعلم هذا، يجب أن تفهم:**
- [ ] العملية، الإشارات (SIGTERM)، رموز الخروج، stdout/stderr — [L2-M2.5](../level-2-computer-systems/module-2.5-process-deep-dive.md)
- [ ] TCP، keep-alive، المهل، ECONNREFUSED/ETIMEDOUT — [L2-M2.9](../level-2-computer-systems/module-2.9-tcp-udp.md), [L2-M2.12](../level-2-computer-systems/module-2.12-http.md)
- [ ] pool الاتصالات وجفافه، `withTransaction` — [L3-M3.14](../level-3-core-computer-science/module-3.14-transactions-acid.md)
- [ ] متغيّرات البيئة، `.env`، fail-fast، الأسرار — [L0-M0.4](../level-0-absolute-foundations/module-04-files-terminal-shell.md), [M5.4](module-5.4-security.md)
- [ ] Problem Details + requestId والمسجّل المهيكل — [M5.1](module-5.1-api-design.md), [L4-M4.12](../level-4-software-engineering-foundations/module-4.12-debugging-deeply.md)

## 2. أهداف التعلّم
- رسم **رحلة الطلب كاملة** من DNS إلى الاستجابة: load balancer → reverse proxy → عملية Node → middleware → handler → pool → DB/cache/queue/خدمات خارجية → ورجوعًا، ومعرفة **أين تُقاس كل خطوة وأين يمكن أن تنتظر إلى الأبد**.
- بناء **خادم إنتاجي** بـ `node:http`: تهيئة مُتحقَّقة fail-fast، مهل على كل طبقة (headers/request/keep-alive/upstream/DB/statement)، حدود حجم الجسم، `/health` و`/ready` بمعانٍ مختلفة، **إيقاف رشيق** (SIGTERM → توقّف عن قبول → أكمل الجاري → أغلق pool → اخرج) مع مهلة قصوى.
- ضبط **pool الاتصالات** (حجم، `connectionTimeoutMillis`, `idleTimeoutMillis`, `statement_timeout`) وفهم العلاقة بين عدد النسخ × حجم pool × `max_connections`.
- التعامل مع **الموارد المحدودة**: ذاكرة (heap limit, OOM)، file descriptors، CPU (event loop lag)، وقراءة الأعراض مبكرًا.
- تطبيق قواعد **12-Factor** الأساسية عمليًا: التهيئة من البيئة، السجلات كتدفّق، العمليات عديمة الحالة قابلة للتخلّص (disposable)، التكافؤ بين البيئات.

---

## 3. شرح للمبتدئ

### "يعمل على جهازي" ≠ "يعمل في الإنتاج"
الفرق ليس الكود؛ الفرق هو **البيئة**: آلاف الاتصالات المتزامنة، شبكة تفشل، DB بطيئة أحيانًا، نسخ متعدّدة تُطلق وتُقتل، ذاكرة محدودة، ومشغّل (orchestrator) يسألك "هل أنت حي؟" ويرسل إشارات إيقاف. النظام الإنتاجي هو كود + **سلوك تحت هذه الظروف**. هذه الوحدة تبني "الهيكل العظمي" الذي ستُركّب عليه كل ميزة.

### رحلة طلب واحد (الخريطة الذهنية الثانية لـ L5)
```
Browser → DNS → TLS → Load Balancer → Reverse Proxy (nginx/ingress) → Node process (port 8080)
   → http.Server (headersTimeout, requestTimeout, keepAliveTimeout, maxHeaderSize)
   → body limit → requestId + logger → auth (M5.2) → authz (M5.3) → validation (M5.4) → handler
   → pool.connect (connectionTimeoutMillis) → statement_timeout → DB   |  cache (M5.8)  |  queue (M5.9)  |  fetch(upstream, AbortSignal.timeout)
   ← response (Problem Details on error) ← access log (status, ms, requestId)
```
كل سهم يمكن أن **ينتظر**. القاعدة: **لا انتظار بلا مهلة** في أي طبقة — وإلا تتراكم الطلبات المعلّقة حتى تنفد الاتصالات/الذاكرة (هذه قصة M5.1 "DB بطيئة" وM5.4 Slowloris).

### التهيئة (Configuration)
كل ما يختلف بين البيئات (منفذ، DATABASE_URL، أسرار، مستويات السجل، مهل) يأتي من **متغيّرات البيئة** (12-Factor III)، يُقرأ **مرة واحدة** عند الإقلاع، يُتحقَّق منه بمخطّط (نوع، نطاق، إلزامي)، ويفشل **فورًا** برسالة واضحة إن نقص (fail-fast، L0-M0.4) — لا `undefined` يسافر حتى ينفجر بعد ساعة. النتيجة كائن `config` **مجمّد** يُمرَّر لا متغيّر عام يُقرأ من كل مكان. والأسرار لا تُسجَّل أبدًا (M5.4) — اطبع المفاتيح لا القيم.

### Pool الاتصالات
الاتصال بـ DB غالٍ (TCP + TLS + مصادقة ≈ عشرات الملّي ثانية) ومحدود (`max_connections` في PostgreSQL، افتراضيًا 100، وكل اتصال يستهلك ذاكرة الخادم). الـ pool يحتفظ بـ N اتصالًا مفتوحًا ويُعيرها. الأرقام: **عدد النسخ × حجم pool لكل نسخة < max_connections − احتياطي للإدارة**. حجم pool الكبير **لا** يعني إنتاجية أكبر؛ DB تتشبّع عند بضعة أضعاف عدد الأنوية — pool من 10–20 لكل نسخة شائع، وأكثر منه يخلق طوابير داخل DB بدل خارجها. ضبط إلزامي: `connectionTimeoutMillis` (كم ننتظر اتصالًا من pool قبل الفشل — بدلًا من التعليق)، `idleTimeoutMillis`، `statement_timeout` على مستوى الدور/الجلسة. وعند النمو: **pooler** خارجي (PgBouncer) أمام DB.

### المهل في كل طبقة
- **الخادم**: `headersTimeout` (60s افتراضيًا)، `requestTimeout` (300s في Node ≥18 — اخفضه)، `keepAliveTimeout` (5s — اجعله **أطول** من مهلة خمول الـ LB/proxy أمامك وإلا ظهرت أخطاء 502 عشوائية: الـ LB يعيد استخدام اتصال أغلقه Node للتو).
- **الجسم**: حدّ حجم (1 MB للـ JSON) ومهلة قراءة.
- **المنبع (upstream)**: `fetch(url, { signal: AbortSignal.timeout(ms) })` دائمًا (L0-M0.6)، وميزانية زمن إجمالية للطلب (deadline) تمرَّر للمكالمات الداخلية.
- **DB**: `connectionTimeoutMillis` + `statement_timeout` + `lock_timeout` (M5.6).
القاعدة: مهلة الطبقة الخارجية **أطول** قليلًا من مجموع ما تحتها، وإلا انقطع العميل بينما العمل مستمرّ في الخلفية (عمل ضائع + آثار جزئية).

### Health مقابل Readiness
- **`/health` (liveness)**: "العملية حيّة وحلقة الأحداث تدور" — رخيص، بلا تبعيات. إن فشل → المشغّل **يعيد تشغيل** الحاوية. لا تفحص DB هنا، وإلا أعاد المشغّل تشغيل كل نسخك حين تتعطّل DB (عاصفة إعادة تشغيل تجعل الأمر أسوأ).
- **`/ready` (readiness)**: "أستطيع خدمة الطلبات الآن" — pool يستجيب (`SELECT 1` بمهلة قصيرة)، الهجرات مطبّقة، التهيئة محمّلة. إن فشل → المشغّل **يوقف إرسال الحركة** إليك دون قتلك. وأثناء الإيقاف الرشيق تُعيد 503 أولًا.
- **`/startup`** (اختياري): للتطبيقات بطيئة الإقلاع.

### الإيقاف الرشيق (Graceful shutdown)
عند النشر (M5.10) يُرسل المشغّل `SIGTERM` ثم ينتظر (30s افتراضيًا في Kubernetes) ثم `SIGKILL`. بلا معالجة: الطلبات الجارية تُقطع، المعاملات تُلغى، الوظائف تضيع (M5.9)، والعملاء يرون 502. الترتيب الصحيح: (1) علّم `ready=false` (المشغّل يسحب الحركة خلال ثوانٍ)؛ (2) `server.close()` — توقّف عن قبول اتصالات جديدة، وأغلق الاتصالات الخاملة (`closeIdleConnections`)؛ (3) انتظر الطلبات الجارية بمهلة قصوى (مثلًا 20s)؛ (4) أوقف worker/المستهلكين عند حدود الوظيفة؛ (5) أغلق pool (`pool.end()`) ثم اخرج بـ 0؛ (6) إن انقضت المهلة → اخرج بـ 1 (الـ SIGKILL آتٍ على أي حال). وبين (1) و(2) **أمهل** بضع ثوانٍ لأن LB لا يرى تغيّر readiness فورًا.

### الموارد المحدودة وأعراضها
- **ذاكرة**: حدّ heap في V8 (~2–4 GB افتراضيًا حسب الإصدار؛ اضبطه بـ `--max-old-space-size` ليتناسب مع حدّ الحاوية **مع هامش** لذاكرة غير heap: buffers، native). تسريب → RSS يصعد خطيًا → OOM kill (رمز 137) → أعد بناء الدليل بـ heap snapshot (L2-M2.3).
- **CPU / event loop**: عمل متزامن ثقيل (JSON ضخم، تشفير، regex كارثي، M5.4) يرفع **event loop lag**؛ راقبه (`perf_hooks.monitorEventLoopDelay`) وانقل الثقيل إلى worker threads أو طابور.
- **File descriptors**: كل socket/ملف واحد؛ `EMFILE` يعني تسريب اتصالات/ملفات غير مغلقة (تيّارات بلا `destroy`، fetch بلا استهلاك الجسم).
- **الاتصالات**: pool يجف → `connectionTimeoutMillis` يحمي؛ `pg_stat_activity` يُظهر من يمسكها.

### 12-Factor باختصار عملي
تهيئة من البيئة؛ تبعيات معلنة ومقفلة (lockfile)؛ خدمات مساندة كمورد قابل للاستبدال (URL)؛ build/release/run مفصولة (M5.12)؛ عمليات عديمة الحالة — أي حالة تعيش في DB/cache لا في ذاكرة العملية (وإلا تكسر النسخ المتعدّدة، M5.6)؛ المنفذ من البيئة؛ **disposability**: إقلاع سريع وإيقاف رشيق؛ السجلات إلى stdout كتدفّق أحداث (المنصّة تجمعها)؛ المهام الإدارية (هجرات) كعمليات لمرة واحدة.

---

## 4. النموذج الذهني

```
   النظام الإنتاجي = الكود + سلوكه حين: الشبكة تفشل، DB تبطئ، النسخ تُقتل، الموارد تنفد.
   Config: اقرأ مرة، تحقّق، افشل فورًا، جمّد.         Pool: نسخ × حجم < max_connections؛ connectionTimeout دائمًا.
   مهلة على كل سهم؛ الخارجي > مجموع الداخلي؛ keepAlive(Node) > idle(LB).
   /health = حي (بلا تبعيات)   /ready = أستطيع الخدمة (DB/هجرات)   SIGTERM → ready=false → close → drain(≤20s) → pool.end → exit.
   حالة العملية مؤقتة وقابلة للتخلّص — كل ما يهم في DB/cache/queue.
```

---

## 5. الرسم التوضيحي

```mermaid
flowchart LR
  C[Client] --> LB[Load balancer / Ingress]
  LB --> P1[Node #1]
  LB --> P2[Node #2]
  P1 --> POOL[(pg Pool max 10)]
  P2 --> POOL2[(pg Pool max 10)]
  POOL --> DB[(PostgreSQL max_connections 100)]
  POOL2 --> DB
  P1 --> R[(Cache)]
  P1 --> Q[(Queue)]
  P1 --> X[Upstream API<br/>fetch + AbortSignal.timeout]
  LB -. GET /ready every 5s .-> P1
  ORCH[Orchestrator] -. GET /health .-> P1
  ORCH -. SIGTERM on deploy .-> P1
```

```
   الإيقاف الرشيق على الخط الزمني (Kubernetes، terminationGracePeriodSeconds=30):
   t=0   SIGTERM  → ready=false (503 على /ready)
   t=0–3 انتظار قصير حتى يسحب LB الحركة (endpoint propagation)
   t=3   server.close() + closeIdleConnections()  → لا اتصالات جديدة؛ الجاري يكمل
   t≤23  آخر طلب جارٍ انتهى → worker أنهى الوظيفة الحالية → pool.end() → exit 0
   t=30  لم ننتهِ؟ SIGKILL (نحن نخرج بـ 1 عند 25 لنترك أثرًا في السجل)
```

---

## 6. مثال بسيط

```typescript
// src/config.ts — التهيئة: اقرأ مرة، تحقّق، افشل فورًا، جمّد، لا تسجّل الأسرار
type Spec<T> = { parse: (raw: string | undefined, key: string) => T; secret?: boolean };
const str = (opts: { default?: string; secret?: boolean } = {}): Spec<string> => ({ secret: opts.secret, parse: (raw, key) => { const v = raw ?? opts.default; if (v === undefined || v === "") throw new Error(`config: ${key} is required`); return v; } });
const int = (opts: { default?: number; min?: number; max?: number } = {}): Spec<number> => ({ parse: (raw, key) => { const v = raw === undefined ? opts.default : Number(raw); if (v === undefined || !Number.isInteger(v)) throw new Error(`config: ${key} must be an integer (got ${JSON.stringify(raw)})`); if ((opts.min !== undefined && v < opts.min) || (opts.max !== undefined && v > opts.max)) throw new Error(`config: ${key}=${v} out of range [${opts.min ?? "-∞"}, ${opts.max ?? "∞"}]`); return v; } });
const oneOf = <T extends string>(values: readonly T[], def?: T): Spec<T> => ({ parse: (raw, key) => { const v = (raw ?? def) as T | undefined; if (!v || !values.includes(v)) throw new Error(`config: ${key} must be one of ${values.join("|")}`); return v; } });

const SCHEMA = {
  NODE_ENV: oneOf(["development", "test", "production"] as const, "development"),
  PORT: int({ default: 8080, min: 0, max: 65535 }),      // 0 = منفذ عشوائي (للاختبارات)
  DATABASE_URL: str({ secret: true }),
  DB_POOL_MAX: int({ default: 10, min: 1, max: 100 }),
  DB_CONNECT_TIMEOUT_MS: int({ default: 2000, min: 100 }),
  DB_STATEMENT_TIMEOUT_MS: int({ default: 5000, min: 100 }),
  REQUEST_TIMEOUT_MS: int({ default: 15000, min: 1000 }),
  KEEP_ALIVE_TIMEOUT_MS: int({ default: 65000, min: 1000 }),      // > مهلة خمول الـ LB (60s في ALB مثلًا)
  SHUTDOWN_GRACE_MS: int({ default: 20000, min: 1000 }),
  BODY_LIMIT_BYTES: int({ default: 1_048_576, min: 1024 }),
  LOG_LEVEL: oneOf(["debug", "info", "warn", "error"] as const, "info"),
} as const;
export type Config = { readonly [K in keyof typeof SCHEMA]: ReturnType<(typeof SCHEMA)[K]["parse"]> };

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const out: Record<string, unknown> = {}; const errors: string[] = [];
  for (const [key, spec] of Object.entries(SCHEMA)) { try { out[key] = (spec as Spec<unknown>).parse(env[key], key); } catch (e) { errors.push((e as Error).message); } }
  if (errors.length) throw new Error(`invalid configuration:\n  - ${errors.join("\n  - ")}`);          // كل الأخطاء دفعة واحدة، لا واحدًا في كل إقلاع
  return Object.freeze(out) as Config;
}
export function redacted(cfg: Config): Record<string, unknown> {                                        // للسجل عند الإقلاع
  return Object.fromEntries(Object.entries(cfg).map(([k, v]) => [k, (SCHEMA as Record<string, Spec<unknown>>)[k]?.secret ? "<redacted>" : v]));
}
```

---

## 7. مثال كود

```typescript
// src/app.ts — الخادم الإنتاجي: مهل، حدود، health/ready، إيقاف رشيق، pool — بلا إطار عمل حتى ترى كل جزء
import http from "node:http"; import { once } from "node:events"; import { monitorEventLoopDelay } from "node:perf_hooks";
import pg from "pg"; import { type Config } from "./config.js";

export type Logger = { info: (o: object, msg: string) => void; warn: (o: object, msg: string) => void; error: (o: object, msg: string) => void };
export const jsonLogger = (level: string): Logger => { const lv = ["debug", "info", "warn", "error"].indexOf(level); const emit = (l: string, i: number) => (o: object, msg: string) => { if (i >= lv) process.stdout.write(JSON.stringify({ t: new Date().toISOString(), level: l, msg, ...o }) + "\n"); }; return { info: emit("info", 1), warn: emit("warn", 2), error: emit("error", 3) }; };

export function createApp(cfg: Config, log: Logger, deps: { pool: pg.Pool }) {
  const { pool } = deps; let ready = false; let inFlight = 0;
  const loopDelay = monitorEventLoopDelay({ resolution: 20 }); loopDelay.enable();

  const problem = (res: http.ServerResponse, status: number, title: string, extra: object = {}) => { if (res.headersSent) return; res.writeHead(status, { "content-type": "application/problem+json" }); res.end(JSON.stringify({ type: "about:blank", title, status, ...extra })); };
  const readJson = async (req: http.IncomingMessage): Promise<unknown> => {                             // حدّ الحجم أثناء القراءة لا بعدها
    const chunks: Buffer[] = []; let size = 0;
    for await (const chunk of req) { size += (chunk as Buffer).length; if (size > cfg.BODY_LIMIT_BYTES) { const e = new Error("payload too large") as Error & { status?: number }; e.status = 413; throw e; } chunks.push(chunk as Buffer); }
    return chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : undefined;
  };

  const server = http.createServer(async (req, res) => {
    const started = process.hrtime.bigint(); const requestId = (req.headers["x-request-id"] as string | undefined)?.slice(0, 64) ?? crypto.randomUUID();
    res.setHeader("x-request-id", requestId); inFlight++;
    res.on("close", () => { inFlight--; const ms = Number(process.hrtime.bigint() - started) / 1e6; log.info({ requestId, method: req.method, path: req.url, status: res.statusCode, ms: Math.round(ms) }, "request"); });
    try {
      const url = new URL(req.url ?? "/", "http://x");
      if (url.pathname === "/health") { res.writeHead(200, { "content-type": "application/json" }); return res.end(JSON.stringify({ status: "ok", loopDelayP99Ms: Math.round(loopDelay.percentile(99) / 1e6), rssMb: Math.round(process.memoryUsage().rss / 1048576) })); }
      if (url.pathname === "/ready") {
        if (!ready) return problem(res, 503, "shutting down or not ready");
        try { await pool.query({ text: "SELECT 1", query_timeout: 1000 } as pg.QueryConfig & { query_timeout: number }); res.writeHead(200, { "content-type": "application/json" }); return res.end(JSON.stringify({ status: "ready", pool: { total: pool.totalCount, idle: pool.idleCount, waiting: pool.waitingCount } })); }
        catch (e) { log.warn({ requestId, err: (e as Error).message }, "readiness failed"); return problem(res, 503, "database unavailable"); }
      }
      if (url.pathname === "/slow" && req.method === "GET") { await pool.query("SELECT pg_sleep($1)", [Number(url.searchParams.get("s") ?? "1")]); res.writeHead(200); return res.end("done"); }   // لتجربة الإيقاف الرشيق والمهل
      if (url.pathname === "/echo" && req.method === "POST") { const body = await readJson(req); res.writeHead(200, { "content-type": "application/json" }); return res.end(JSON.stringify({ requestId, body })); }
      return problem(res, 404, "not found");
    } catch (e) {
      const err = e as Error & { status?: number; code?: string };
      if (err.status === 413) return problem(res, 413, "payload too large", { limit: cfg.BODY_LIMIT_BYTES });
      if (err instanceof SyntaxError) return problem(res, 400, "malformed JSON");
      if (err.code === "57014") { log.warn({ requestId }, "statement timeout"); return problem(res, 504, "database timeout"); }   // statement_timeout → 504 بسرعة بدل التعليق
      log.error({ requestId, err: err.message, stack: err.stack }, "unhandled"); return problem(res, 500, "internal error", { requestId });
    }
  });
  server.keepAliveTimeout = cfg.KEEP_ALIVE_TIMEOUT_MS; server.headersTimeout = cfg.KEEP_ALIVE_TIMEOUT_MS + 1000;   // headersTimeout يجب أن يتجاوز keepAliveTimeout
  server.requestTimeout = cfg.REQUEST_TIMEOUT_MS; server.maxHeadersCount = 100;

  async function start(): Promise<number> { server.listen(cfg.PORT, "0.0.0.0"); await once(server, "listening"); ready = true; const addr = server.address(); const port = typeof addr === "object" && addr ? addr.port : cfg.PORT; log.info({ port }, "listening"); return port; }
  async function shutdown(reason: string, lbDrainMs = 0): Promise<number> {
    log.info({ reason, inFlight }, "shutdown: start"); ready = false;                                   // (1) /ready → 503
    if (lbDrainMs) await new Promise(r => setTimeout(r, lbDrainMs));                                    // (2) أمهل LB ليسحب الحركة
    const closed = new Promise<void>(r => server.close(() => r())); server.closeIdleConnections();      // (3) لا اتصالات جديدة؛ أغلق الخاملة
    const sweep = setInterval(() => server.closeIdleConnections(), 250).unref();                        // اتصالات keep-alive تصبح خاملة بعد انتهاء طلبها الجاري — أغلقها دوريًا وإلا لم يكتمل close
    const timeout = new Promise<"timeout">(r => setTimeout(() => r("timeout"), cfg.SHUTDOWN_GRACE_MS).unref());
    const outcome = await Promise.race([closed.then(() => "drained" as const), timeout]); clearInterval(sweep);   // (4) انتظر الجاري بمهلة
    if (outcome === "timeout") { log.warn({ inFlight }, "shutdown: grace exceeded, forcing"); server.closeAllConnections(); }
    await pool.end().catch(e => log.error({ err: (e as Error).message }, "pool.end failed"));           // (5) أغلق pool
    loopDelay.disable(); log.info({ outcome }, "shutdown: done"); return outcome === "drained" ? 0 : 1;
  }
  return { server, start, shutdown, get inFlight() { return inFlight; } };
}

export function createPool(cfg: Config) {
  return new pg.Pool({ connectionString: cfg.DATABASE_URL, max: cfg.DB_POOL_MAX, connectionTimeoutMillis: cfg.DB_CONNECT_TIMEOUT_MS, idleTimeoutMillis: 30_000,
    options: `-c statement_timeout=${cfg.DB_STATEMENT_TIMEOUT_MS} -c lock_timeout=3000 -c idle_in_transaction_session_timeout=10000` });   // مهل على مستوى الجلسة لكل اتصال
}
```

```typescript
// src/main.ts — نقطة الدخول: config → pool → app → إشارات
import { loadConfig, redacted } from "./config.js"; import { createApp, createPool, jsonLogger } from "./app.js";
const cfg = loadConfig(); const log = jsonLogger(cfg.LOG_LEVEL); log.info({ config: redacted(cfg), node: process.version, pid: process.pid }, "boot");
const pool = createPool(cfg); pool.on("error", e => log.error({ err: e.message }, "idle client error"));   // بدونه: استثناء غير معالج يقتل العملية حين تسقط DB
const app = createApp(cfg, log, { pool }); app.start().catch(e => { log.error({ err: (e as Error).message }, "failed to start"); process.exit(1); });
let stopping = false;
const stop = async (sig: string) => { if (stopping) return; stopping = true; process.exitCode = await app.shutdown(sig, cfg.NODE_ENV === "production" ? 3000 : 0); };
process.on("SIGTERM", () => void stop("SIGTERM")); process.on("SIGINT", () => void stop("SIGINT"));
process.on("unhandledRejection", e => { log.error({ err: String(e) }, "unhandledRejection"); void stop("unhandledRejection").then(() => process.exit(1)); });   // حالة غير معروفة → أوقف رشيقًا واخرج
process.on("uncaughtException", e => { log.error({ err: e.message, stack: e.stack }, "uncaughtException"); process.exit(1); });                                 // لا تحاول الاستمرار
```

```typescript
// src/app.test.ts — اختبارات: التهيئة تفشل مبكرًا، الحدود، الإيقاف الرشيق يُكمل الجاري ويرفض الجديد
import { test } from "node:test"; import assert from "node:assert/strict";
import { loadConfig } from "./config.js"; import { createApp, createPool, jsonLogger } from "./app.js";
const BASE_ENV = { DATABASE_URL: process.env.DATABASE_URL ?? "postgres://app:app@127.0.0.1:5432/store", PORT: "0", NODE_ENV: "test", SHUTDOWN_GRACE_MS: "5000", LOG_LEVEL: "error" };
const silent = jsonLogger("error");

test("config: all errors at once, secrets redacted, frozen", () => {
  assert.throws(() => loadConfig({ PORT: "abc", DB_POOL_MAX: "500" }), (e: Error) => e.message.includes("PORT must be an integer") && e.message.includes("DB_POOL_MAX=500 out of range") && e.message.includes("DATABASE_URL is required"));
  const cfg = loadConfig(BASE_ENV); assert.ok(Object.isFrozen(cfg)); assert.equal(cfg.KEEP_ALIVE_TIMEOUT_MS, 65000);
});
test("body limit → 413 problem+json; malformed → 400; requestId echoed", async () => {
  const cfg = loadConfig({ ...BASE_ENV, BODY_LIMIT_BYTES: "1024" }); const pool = createPool(cfg); const app = createApp(cfg, silent, { pool }); const port = await app.start();
  const big = await fetch(`http://127.0.0.1:${port}/echo`, { method: "POST", body: JSON.stringify({ x: "a".repeat(2000) }) }); assert.equal(big.status, 413); assert.equal(big.headers.get("content-type"), "application/problem+json");
  const bad = await fetch(`http://127.0.0.1:${port}/echo`, { method: "POST", body: "{oops", headers: { "x-request-id": "req-1" } }); assert.equal(bad.status, 400); assert.equal(bad.headers.get("x-request-id"), "req-1");
  assert.equal(await app.shutdown("test"), 0);
});
test("ready reflects DB + shutdown; graceful shutdown finishes in-flight and refuses new", async () => {
  const cfg = loadConfig(BASE_ENV); const pool = createPool(cfg); const app = createApp(cfg, silent, { pool }); const port = await app.start();
  assert.equal((await fetch(`http://127.0.0.1:${port}/ready`)).status, 200);
  const slow = fetch(`http://127.0.0.1:${port}/slow?s=1`);                                             // طلب جارٍ لمدة 1s
  await new Promise(r => setTimeout(r, 100));
  const done = app.shutdown("SIGTERM");                                                                 // بدء الإيقاف أثناء الطلب
  await new Promise(r => setTimeout(r, 50));
  await assert.rejects(fetch(`http://127.0.0.1:${port}/ready`));                                        // لا اتصالات جديدة (ECONNREFUSED)
  assert.equal((await slow).status, 200); assert.equal(await (await slow).text(), "done");            // الجاري اكتمل
  assert.equal(await done, 0);                                                                          // drained
});
test("statement_timeout turns a hung query into a fast 504", async () => {
  const cfg = loadConfig({ ...BASE_ENV, DB_STATEMENT_TIMEOUT_MS: "300" }); const pool = createPool(cfg); const app = createApp(cfg, silent, { pool }); const port = await app.start();
  const t0 = Date.now(); const r = await fetch(`http://127.0.0.1:${port}/slow?s=5`); assert.equal(r.status, 504); assert.ok(Date.now() - t0 < 2000);
  assert.equal((await fetch(`http://127.0.0.1:${port}/ready`)).status, 200);                           // الاتصال رجع سليمًا إلى pool
  await app.shutdown("test");
});
```

```bash
DATABASE_URL=postgres://app:app@127.0.0.1:5432/store node --import tsx --test src/app.test.ts    # 4 pass
# تجربة يدوية: node --import tsx src/main.ts &  ثم  curl -i localhost:8080/ready ; kill -TERM %1  → راقب سجل "shutdown: start … done"
# ذاكرة الحاوية 512Mi؟ شغّل بـ node --max-old-space-size=384 (هامش لغير heap)؛ راقب rss في /health
```

---

## 8. مثال من العالم الحقيقي
خدمة خلف AWS ALB تظهر فيها أخطاء 502 بنسبة 0.1% عشوائيًا، لا تظهر في السجلات (الطلب لم يصل إلى Node أصلًا). السبب الكلاسيكي: `keepAliveTimeout` في Node = 5s، ومهلة خمول ALB = 60s؛ الـ ALB يعيد استخدام اتصال keep-alive **أغلقه Node للتو** → reset → 502. الإصلاح: `keepAliveTimeout = 65s` و`headersTimeout = 66s` (أكبر من مهلة الـ LB) — سطران، أسابيع من البحث لمن لا يعرف رحلة الطلب. والدرس: الأخطاء التي "لا تظهر في سجلاتك" تعيش **بين** الطبقات؛ ارسم الرحلة.

## 9. مثال من الإنتاج
منصّة SaaS تنشر 20 مرة يوميًا وتشكو من "أخطاء عند كل نشر": عشرات 502/503 وعمليات دفع مقطوعة. التشريح: لا معالجة لـ SIGTERM (المشغّل يقتل بعد 30s بينما Node يتجاهل)، `/ready` يفحص Redis وDB معًا (فيسحب المشغّل الحركة حين يبطئ Redis رغم أن الكاش اختياري، M5.8)، وpool بحجم 50 × 12 نسخة = 600 > `max_connections=500` فتفشل الاتصالات عند التوسّع. الإصلاح الكامل من هذه الوحدة: shutdown مرتّب مع drain 3s، readiness يفحص **التبعيات الحرجة فقط**، pool 15 × 12 + PgBouncer، `statement_timeout=5s`، و**اختبار نشر** يقيس أخطاء النشر صفرًا كشرط إطلاق (M5.10/5.12).

---

## 10. مفاهيم خاطئة شائعة
1. **"pool أكبر = أسرع."** يخلق طوابير داخل DB؛ الحجم الصحيح صغير ومحسوب عبر كل النسخ.
2. **"`/health` يجب أن يفحص DB."** هذا readiness؛ خلطهما يسبّب عاصفة إعادة تشغيل عند تعطّل DB.
3. **"`process.exit()` في SIGTERM كافٍ."** يقطع الجاري ويضيّع الوظائف؛ الرشاقة ترتيب لا سطر.
4. **"المهلة الافتراضية موجودة."** `fetch` بلا مهلة، `pg` بلا `connectionTimeoutMillis`، `requestTimeout` 300s — الافتراضيات تنتظر طويلًا جدًا.
5. **"حالة في ذاكرة العملية مقبولة إن كانت صغيرة."** تكسر النسخ المتعدّدة وتضيع عند كل نشر؛ الحالة في DB/cache.
6. **"uncaughtException → سجّل واستمر."** العملية في حالة مجهولة؛ سجّل، أوقف رشيقًا، اخرج، ودع المشغّل يعيد التشغيل.

## 11. أخطاء شائعة
1. قراءة `process.env` من كل مكان بلا تحقّق؛ اكتشاف نقص المتغيّر بعد ساعة في مسار نادر.
2. `keepAliveTimeout` أقصر من مهلة الـ LB → 502 عشوائية.
3. نسيان `pool.on("error")` → سقوط DB يقتل العملية باستثناء غير معالج.
4. `/ready` يفحص تبعيات غير حرجة أو بلا مهلة (يعلّق ويُعلن غير جاهز خطأً).
5. الإيقاف بلا drain → LB يرسل طلبات إلى عملية أغلقت المنفذ؛ أو `server.close()` لا يكتمل أبدًا لأن اتصالات keep-alive الخاملة لا تُغلق (استدعِ `closeIdleConnections()` دوريًا كما في §7).
6. حدّ الجسم بعد القراءة الكاملة (`JSON.parse` على 100 MB) بدل أثناءها.
7. `--max-old-space-size` يساوي حدّ الحاوية (بلا هامش) → OOM kill رغم أن heap "تحت الحدّ".
8. تسجيل كائن التهيئة كاملًا بالأسرار عند الإقلاع.

## 12. تمرين تصحيح
بعد نشر، ترتفع زمن الاستجابة p99 إلى 10s ثم تعود الخدمة للانهيار كل 40 دقيقة؛ `/health` يستجيب دائمًا؛ السجل يُظهر `timeout exceeded when trying to connect` من pg، وRSS مستقر.
1. **دليل:** `pool.waitingCount` في `/ready` كبير وثابت؛ `pg_stat_activity` يُظهر 10 اتصالات بحالة `idle in transaction` منذ دقائق لكل نسخة.
2. **فرضية:** مسار جديد يأخذ عميلًا من pool ويفتح معاملة ولا يحرّره في فرع خطأ (لا `finally { release() }`) — التسريب يستهلك pool تدريجيًا ثم تُلقي كل الطلبات timeout؛ الانهيار كل 40 دقيقة = معدّل التسريب × حجم pool.
3. **تجربة:** `git diff` للنشر الأخير يُظهر `pool.connect()` مباشرًا بدل `withTransaction`؛ إعادة إنتاج محليًا بإرسال طلب يفشل في التحقق → اتصال عالق.
4. **الإصلاح:** استخدام `withTransaction` فقط (قاعدة lint: ممنوع `pool.connect` خارج db.ts)؛ `idle_in_transaction_session_timeout=10s` كشبكة أمان (كان مضبوطًا في `createPool` — لماذا لم يُنقذ؟ لأن المعاملة كانت نشطة لا خاملة؛ فأضف `statement_timeout`)؛ مقياس `pool.waitingCount` في اللوحة مع تنبيه.
5. **أين أيضًا؟** أي مورد يُؤخذ ويُعاد: ملفات، تيّارات، أقفال؛ ابحث عن `acquire` بلا `finally`.

## 13. تمرين معماري
صمّم "الهيكل الإنتاجي" لـ Project 6: (1) جدول **المهل** لكل طبقة (LB، Node، body، DB connect/statement/lock، upstream × 3، worker job) بقيم ومبرّر "الخارجي > مجموع الداخلي"؛ (2) حساب pool: النسخ المتوقّعة × الحجم + worker + هجرات < `max_connections`، ومتى PgBouncer؛ (3) عقد `/health` و`/ready` (ما يُفحص وما لا يُفحص ولماذا؛ Redis اختياري؟)؛ (4) تسلسل الإيقاف الرشيق لـ API ولـ worker (أين حدود الوظيفة؟ M5.9)؛ (5) حدود الموارد: ذاكرة الحاوية و`--max-old-space-size`، FD، event loop lag وما ينتقل إلى worker thread/طابور؛ (6) مخطّط التهيئة الكامل (`SCHEMA`) لكل البيئات؛ (7) ACTRR عن الخيار "إطار عمل (Fastify) أم `node:http` + هذه الطبقات يدويًا".

## 14. الصلة بعصر AI
AI يكتب handler جيدًا ويكتب "هيكلًا إنتاجيًا" سيئًا افتراضيًا: لا مهل، `process.exit` في SIGTERM، `/health` يفحص كل شيء، pool بحجم اعتباطي، تهيئة من `process.env.X!`. أعطه **قائمة مراجعة §4** كجزء من السياق (L8-M8.5) واطلب اختبارات الإيقاف الرشيق وحدود الجسم كما في §7 — وشغّلها. وAI ممتاز في مراجعة **التهيئة والمهل**: "هذا جدول المهل، أين لا تتحقق قاعدة الخارجي > الداخلي؟" وفي شرح رموز خروج/إشارات غامضة في السجلات (137، 143، `ECONNRESET` بين LB وNode).

## 15. ما يجب إتقانه (Must Master) 🔴
- 🔴 رحلة الطلب ونقاط الانتظار؛ التهيئة المُتحقَّقة fail-fast المجمّدة بلا أسرار في السجل؛ pool: `max`، `connectionTimeoutMillis`، حساب النسخ × الحجم، `pool.on("error")`؛ مهلة على كل طبقة وقاعدة الخارجي > الداخلي وkeepAlive > LB؛ `/health` ≠ `/ready`؛ تسلسل SIGTERM الرشيق بمهلة؛ حدّ الجسم أثناء القراءة؛ `statement_timeout` → 504؛ حالة العملية مؤقتة.

## 16. ما يجب فهمه (Should Understand) 🟠
- 🟠 `idle_in_transaction_session_timeout`؛ event loop lag وworker threads؛ `--max-old-space-size` والهامش؛ EMFILE وتسريب الموارد؛ PgBouncer؛ 12-Factor كاملة؛ unhandledRejection/uncaughtException.

## 17. ما يمكن تأجيله (Can Defer) ⚪
- ⚪ ضبط kernel/ulimit، HTTP/2 وgRPC keep-alive، service mesh، autoscaling على المقاييس (L7-M7.4)، تفاصيل Kubernetes probes (M5.13).

## 18. الخلاصة
1. النظام الإنتاجي = الكود + سلوكه حين تفشل الشبكة وتبطئ DB وتُقتل النسخ وتنفد الموارد.
2. التهيئة: اقرأ مرة، تحقّق، افشل فورًا بكل الأخطاء، جمّد، لا تسجّل الأسرار.
3. مهلة على كل سهم في رحلة الطلب؛ الخارجي أطول من مجموع الداخلي؛ keepAlive أطول من الـ LB؛ pool صغير محسوب مع `connectionTimeoutMillis`.
4. `/health` حيّ بلا تبعيات؛ `/ready` قادر على الخدمة بالتبعيات الحرجة فقط؛ SIGTERM → ready=false → drain → close → pool.end → exit.
5. العملية قابلة للتخلّص: الحالة في DB/cache/queue، السجلات إلى stdout، والمهام الإدارية عمليات منفصلة.

## 19. مراجع رسمية
- Node.js — `http.Server` timeouts (`keepAliveTimeout`, `headersTimeout`, `requestTimeout`): https://nodejs.org/api/http.html#serverkeepalivetimeout
- Node.js — `server.close`, `closeIdleConnections`, `closeAllConnections`: https://nodejs.org/api/http.html#serverclosecallback
- Node.js — Process signals & exit codes: https://nodejs.org/api/process.html#signal-events
- Node.js — `perf_hooks.monitorEventLoopDelay`: https://nodejs.org/api/perf_hooks.html#perf_hooksmonitoreventloopdelayoptions
- node-postgres — Pool options & events: https://node-postgres.com/apis/pool
- PostgreSQL — `statement_timeout`, `lock_timeout`, `idle_in_transaction_session_timeout`: https://www.postgresql.org/docs/current/runtime-config-client.html
- The Twelve-Factor App: https://12factor.net/
- Kubernetes — Liveness, Readiness and Startup Probes: https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/
- PgBouncer: https://www.pgbouncer.org/

## المصطلحات
| العربية | English |
|---|---|
| رحلة الطلب | Request lifecycle |
| تهيئة | Configuration |
| الفشل المبكر | Fail-fast |
| تجمّع الاتصالات | Connection pool |
| مهلة | Timeout |
| موازن الحمل / وكيل عكسي | Load balancer / Reverse proxy |
| فحص الحياة / الجاهزية | Liveness / Readiness probe |
| إيقاف رشيق | Graceful shutdown |
| تصريف الحركة | Draining |
| حدّ حجم الجسم | Body size limit |
| تأخّر حلقة الأحداث | Event loop lag |
| واصف ملف | File descriptor |
| قابل للتخلّص / عديم الحالة | Disposable / Stateless |
| منهجية الاثني عشر عاملًا | Twelve-Factor App |
| مجمّع اتصالات خارجي | External connection pooler (PgBouncer) |
