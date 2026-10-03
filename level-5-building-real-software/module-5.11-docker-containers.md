# Module 5.11 — Docker والحاويات
## Docker & Containers: what a container really is, images vs containers, a production Dockerfile (multi-stage, non-root, signals), networking inside Compose, and running app + db + cache + worker locally

> **المستوى:** Level 5 | **الموقع:** [11 من 13]
> **السابق:** [M5.10 — Deployment](module-5.10-deployment.md) | **التالي:** [M5.12 — CI/CD](module-5.12-ci-cd.md)

---

## 1. المتطلبات
> **قبل أن تتعلم هذا، يجب أن تفهم:**
- [ ] العملية، PID، الإشارات، نظام الملفات، المستخدمون والصلاحيات — [L2-M2.4](../level-2-computer-systems/module-2.4-operating-systems.md), [L2-M2.5](../level-2-computer-systems/module-2.5-process-deep-dive.md)
- [ ] 127.0.0.1 مقابل 0.0.0.0، المنافذ، DNS — [L0-M0.5](../level-0-absolute-foundations/module-05-processes-ports-localhost.md), [L2-M2.10](../level-2-computer-systems/module-2.10-dns.md)
- [ ] الإيقاف الرشيق، `/health`/`/ready`، التهيئة من البيئة — [M5.7](module-5.7-production-anatomy.md)
- [ ] artifact ثابت، `npm ci`، lockfile وسلسلة التوريد — [M5.10](module-5.10-deployment.md), [M5.4](module-5.4-security.md)
- [ ] Redis كخدمة مساندة والعامل — [M5.8](module-5.8-caching.md), [M5.9](module-5.9-queues-jobs-workers.md)

## 2. أهداف التعلّم
- شرح **ما الحاوية فعلًا**: عملية Linux عادية معزولة بـ namespaces (ما تراه) ومقيّدة بـ cgroups (ما تستهلكه) فوق نظام ملفات طبقي — **ليست** آلة افتراضية؛ ولماذا هذا يفسّر كل سلوكها (PID 1، الإشارات، الشبكة، الذاكرة).
- التمييز بين **الصورة** (artifact ثابت بطبقات، M5.10) و**الحاوية** (عملية تعمل منها) و**السجل** (registry) والوسوم (tags) مقابل **digests**.
- كتابة **Dockerfile إنتاجي** لـ Node: صورة أساس مثبّتة الإصدار، multi-stage، ترتيب الطبقات للتخزين المؤقت، `npm ci --omit=dev`، `.dockerignore`، مستخدم غير root، `CMD` بصيغة exec + init لتمرير SIGTERM، `HEALTHCHECK`، بلا أسرار في الطبقات.
- فهم **شبكة الحاويات**: لماذا يجب الاستماع على `0.0.0.0`، أسماء الخدمات كـ DNS داخل Compose، نشر المنافذ، ولماذا `localhost` داخل الحاوية ليس جهازك.
- تشغيل **بيئة التطوير الكاملة** لـ Project 6 بـ Compose: `api` + `worker` + `postgres` + `redis` مع healthchecks و`depends_on` الشرطي، volumes للبيانات، حدود موارد، وسجلات إلى stdout؛ ومعرفة حدود Compose مقابل المنصّات (M5.13).

---

## 3. شرح للمبتدئ

### الحاوية = عملية بنظّارة
شغّل `node dist/main.js` على Linux. الآن اطلب من النواة: (1) أعطِ هذه العملية **رؤية خاصة**: جدول عمليات خاص (ترى نفسها PID 1)، شبكة خاصة (واجهة وIP خاصان)، نظام ملفات جذر خاص، أسماء مضيف ومستخدمين خاصة — هذه **namespaces**؛ (2) **قيّد** استهلاكها: 512 MB ذاكرة، نصف نواة CPU، عدد PIDs — هذه **cgroups**؛ (3) أعطِها نظام ملفات مكوّنًا من **طبقات** للقراءة فقط (نظام أساس + Node + كودك) فوقها طبقة كتابة مؤقتة تختفي عند الحذف — هذا **union filesystem**. هذه هي الحاوية. لا نواة ثانية، لا جهاز افتراضي، لا "نظام تشغيل داخلها" بالمعنى الحقيقي؛ `ps` على المضيف يراها عملية عادية. لذلك: تقلع في ملّي ثوانٍ، وتشارك نواة المضيف (عزل أضعف من VM)، و**حدّ الذاكرة الحقيقي** هو cgroup (تجاوزه = OOM kill رمز 137، M5.7)، والإشارات تصل إلى **PID 1 داخلها** — بقواعد PID 1 الخاصة.

### صورة، حاوية، سجل
- **الصورة** (image): artifact ثابت = طبقات + بيانات وصفية (أي أمر يُشغَّل، أي مستخدم، أي منفذ). تُبنى من **Dockerfile** مرة وتُدفع إلى **registry** (Docker Hub، GHCR، ECR). هي الـ artifact من M5.10 بشكل محمول: نفس الصورة على جهازك وstaging وprod.
- **الحاوية**: عملية (أو أكثر) تعمل من صورة + طبقة كتابة. احذفها وأنشئ غيرها بلا أثر — **قابلة للتخلّص** (12-Factor). أي شيء يجب أن يبقى (بيانات DB، رفوعات) يعيش في **volume** خارج طبقة الكتابة.
- **الوسم** (`node:22-alpine`) مؤشّر قابل للتغيير: `22-alpine` اليوم ≠ غدًا. **الـ digest** (`node@sha256:…`) ثابت. للإنتاج: ثبّت الأساس بالـ digest (أو على الأقل إصدارًا كاملًا `22.12.0-alpine3.20`) وجدّده عمدًا (Dependabot/Renovate، M5.12). ولا تنشر `latest` لصورتك أبدًا — وسم بالـ SHA.

### Dockerfile إنتاجي — القواعد ولماذا
1. **أساس صغير ومثبّت**: `node:22-alpine` (~50 MB) أو `node:22-slim` (Debian؛ أقل مفاجآت مع مكتبات native). الصور الصغيرة = سطح هجوم أقل وسحب أسرع.
2. **Multi-stage**: مرحلة `build` فيها TypeScript وdevDependencies؛ مرحلة `runtime` تنسخ `dist/` و`node_modules` الإنتاجية فقط. الصورة النهائية بلا مترجم ولا أدوات بناء.
3. **ترتيب الطبقات للتخزين المؤقت**: كل تعليمة طبقة؛ تغيّر طبقة يُبطل ما بعدها. انسخ `package*.json` وثبّت **قبل** نسخ الكود → تغيير الكود لا يعيد `npm ci` (دقائق → ثوانٍ).
4. **`npm ci --omit=dev`** من lockfile (M5.10)، و`.dockerignore` يستبعد `node_modules`, `.git`, `.env`, `dist` المحلية — وإلا نسخت أسرارك ومئات الميغابايت إلى الصورة.
5. **مستخدم غير root**: `USER node` (موجود في الصورة الرسمية). اختراق التطبيق لا يعطي root داخل الحاوية (وربما خارجها).
6. **الإشارات وPID 1**: `CMD ["node", "dist/main.js"]` **بصيغة exec** (مصفوفة) لا `CMD node dist/main.js` (صيغة shell تجعل `/bin/sh` هو PID 1 ولا يمرّر SIGTERM → حاويتك تنتظر 10 ثوانٍ ثم SIGKILL، وداعًا للإيقاف الرشيق M5.7). وPID 1 لا يحصد العمليات اليتيمة ولا يملك معالجات إشارات افتراضية؛ استخدم `--init` (tini) أو `ENTRYPOINT ["tini","--"]`.
7. **`HEALTHCHECK`** يستدعي `/health` (M5.7) حتى تعرف الأدوات (Compose/Swarm) الحالة؛ Kubernetes يستخدم probes الخاصة به.
8. **بلا أسرار في الطبقات**: `ENV SECRET=…` أو `COPY .env` يبقى في تاريخ الصورة إلى الأبد؛ الأسرار وقت التشغيل عبر البيئة/ملفات مركّبة (M5.10)، ووقت البناء عبر `--mount=type=secret`.
9. **`EXPOSE`** توثيق فقط؛ النشر الفعلي بـ `-p`/`ports`. و**استمع على `0.0.0.0`**: الحاوية لها شبكتها؛ `127.0.0.1` داخلها لا يراه أحد خارجها (L0-M0.5 — الدرس يعود بحذافيره).
10. **الذاكرة**: Node لا يرى حدّ cgroup تلقائيًا في كل الإصدارات؛ اضبط `--max-old-space-size` ≈ 75% من حدّ الحاوية (M5.7).

### الشبكة داخل Compose
Compose ينشئ شبكة خاصة ويسجّل **اسم كل خدمة كاسم DNS**: من حاوية `api`، PostgreSQL هو `postgres:5432` لا `localhost:5432`. من **جهازك** تصل إلى ما نُشر بـ `ports: "5432:5432"` فقط. ثلاثة أخطاء كلاسيكية: التطبيق يستمع على 127.0.0.1 (لا يصل أحد)؛ `DATABASE_URL=…@localhost` داخل الحاوية (ECONNREFUSED — localhost هو الحاوية نفسها)؛ المتصفح يستدعي `http://api:8080` (المتصفح على جهازك لا يعرف DNS الـ Compose — استخدم المنفذ المنشور أو proxy).

### Compose: بيئة التطوير الكاملة
ملف واحد يصف `api`, `worker`, `postgres`, `redis` (والـ proxy اختياريًا): الصور، البيئة، المنافذ، volumes، **healthcheck** لكل خدمة و`depends_on: condition: service_healthy` حتى لا يقلع `api` قبل أن تقبل DB الاتصالات (و`api` نفسه يجب أن يتحمّل DB غير جاهزة — M5.7 readiness + retry عند الإقلاع). للتطوير: bind mount للكود + `tsx watch`؛ للإنتاج المحلي: الصورة المبنية. Compose ممتاز لجهاز واحد (تطوير، CI، خادم صغير) — لا يوزّع على عدة أجهزة ولا يعيد الجدولة؛ هناك تبدأ المنصّات (M5.13).

### الأمن والحجم
افحص الصور (`docker scout`/Trivy في CI) للثغرات المعروفة في طبقات النظام؛ أعد البناء دوريًا لأن الأساس يتلقّى تصحيحات؛ **read-only root filesystem** (`read_only: true` + tmpfs لـ /tmp) حين يمكن؛ أسقط القدرات (`cap_drop: [ALL]`) و`no-new-privileges`؛ ولا تركّب `docker.sock` داخل حاوية إلا وأنت تفهم أنه root على المضيف.

---

## 4. النموذج الذهني

```
   حاوية = عملية Linux عادية + namespaces (رؤية) + cgroups (حدود) + طبقات ملفات (صورة) — لا VM.
   صورة = artifact ثابت بطبقات (ابنِها مرة، وسمها بالـ SHA، ثبّت الأساس بالـ digest). حاوية = نسخة قابلة للتخلّص؛ الدائم في volume.
   Dockerfile: أساس صغير مثبّت → package*.json → npm ci → الكود → multi-stage → USER node → CMD exec + init → HEALTHCHECK → بلا أسرار.
   الشبكة: استمع على 0.0.0.0؛ اسم الخدمة هو DNS؛ localhost داخل الحاوية = الحاوية نفسها؛ المتصفح خارج الشبكة.
   Compose لجهاز واحد: healthcheck + depends_on الشرطي + volumes + حدود موارد + سجلات stdout.
```

---

## 5. الرسم التوضيحي

```mermaid
flowchart TB
  subgraph HOST[Host Linux kernel]
    subgraph NET[compose network: appnet]
      API[api container<br/>node dist/main.js<br/>listens 0.0.0.0:8080<br/>USER node, mem 512M]
      WRK[worker container<br/>node dist/worker.js]
      PG[(postgres container<br/>volume pgdata)]
      RD[(redis container)]
    end
    B[Browser on host] -- "localhost:8080 published port" --> API
  end
  API -- "postgres:5432 (DNS)" --> PG
  WRK -- "postgres:5432" --> PG
  API -- "redis:6379" --> RD
  WRK -- "redis:6379" --> RD
```

```
   طبقات الصورة (من الأسفل إلى الأعلى) وما يُعاد بناؤه عند تغيير الكود:
   [alpine + node 22 @sha256]      ← لا يتغيّر (cache)
   [COPY package*.json]            ← لا يتغيّر (cache)
   [RUN npm ci --omit=dev]         ← لا يتغيّر (cache)  ← أغلى طبقة محفوظة
   [COPY dist/ من مرحلة build]     ← يتغيّر مع كل commit (ثوانٍ)
   [USER node / CMD / HEALTHCHECK] ← بيانات وصفية
```

---

## 6. مثال بسيط

```dockerfile
# Dockerfile — Node API إنتاجي: multi-stage، مثبّت، غير root، إشارات صحيحة، بلا أسرار
# syntax=docker/dockerfile:1.7
ARG NODE_IMAGE=node:22.12.0-alpine3.20@sha256:0000000000000000000000000000000000000000000000000000000000000000   # ثبّت بالـ digest الحقيقي من `docker pull` ثم `docker inspect`

FROM ${NODE_IMAGE} AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force                       # تبعيات الإنتاج فقط، من lockfile

FROM ${NODE_IMAGE} AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci                                                             # كل التبعيات (TypeScript) لمرحلة البناء فقط
COPY tsconfig.json ./
COPY src ./src
RUN npm run build && npm test                                          # الاختبارات على نفس الكود الذي سيُشحن

FROM ${NODE_IMAGE} AS runtime
ENV NODE_ENV=production NODE_OPTIONS=--max-old-space-size=384         # ≈75% من حدّ 512M
RUN apk add --no-cache tini                                            # init لـ PID 1: يمرّر SIGTERM ويحصد اليتامى
WORKDIR /app
COPY --from=deps  --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node package.json ./
USER node                                                              # غير root
EXPOSE 8080
HEALTHCHECK --interval=10s --timeout=2s --start-period=5s --retries=3 CMD wget -qO- http://127.0.0.1:8080/health || exit 1
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/main.js"]                                           # صيغة exec: node هو من يستقبل SIGTERM (عبر tini)
```

```text
# .dockerignore — ما لا يدخل سياق البناء أبدًا
node_modules
dist
.git
.env*
*.md
coverage
.github
```

---

## 7. مثال كود

```yaml
# compose.yaml — Project 6 محليًا: api + worker + postgres + redis، healthchecks، ترتيب إقلاع، volumes، حدود، أمن
name: store
services:
  postgres:
    image: postgres:16.4-alpine
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: app                      # تطوير فقط؛ في الإنتاج: secrets/البيئة الخارجية
      POSTGRES_DB: store
    command: ["postgres", "-c", "max_connections=100", "-c", "log_min_duration_statement=200"]
    volumes:
      - pgdata:/var/lib/postgresql/data            # الدائم خارج الحاوية
      - ./db/init:/docker-entrypoint-initdb.d:ro   # سكربتات أولية (مرة واحدة عند إنشاء volume)
    ports: ["5432:5432"]                           # للأدوات على جهازك فقط
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app -d store"]
      interval: 5s
      timeout: 3s
      retries: 10
    deploy: { resources: { limits: { memory: 512M } } }

  redis:
    image: redis:7.4-alpine
    command: ["redis-server", "--maxmemory", "128mb", "--maxmemory-policy", "allkeys-lru", "--save", ""]   # كاش خالص (M5.8)
    healthcheck: { test: ["CMD", "redis-cli", "ping"], interval: 5s, timeout: 2s, retries: 10 }
    deploy: { resources: { limits: { memory: 192M } } }

  migrate:                                          # هجرات كخطوة منفصلة قبل api/worker (M5.10)
    build: { context: ., target: runtime }
    command: ["node", "dist/migrate.js"]
    environment: &app_env
      NODE_ENV: development
      PORT: "8080"
      DATABASE_URL: postgres://app:app@postgres:5432/store      # اسم الخدمة = DNS، لا localhost
      REDIS_URL: redis://redis:6379
      LOG_LEVEL: debug
    depends_on:
      postgres: { condition: service_healthy }
    restart: "no"

  api:
    build: { context: ., target: runtime }
    image: store-api:dev
    environment: *app_env
    ports: ["8080:8080"]                            # الخادم يستمع على 0.0.0.0:8080 داخل الحاوية (M5.7)
    depends_on:
      migrate:  { condition: service_completed_successfully }
      redis:    { condition: service_started }     # Redis اختياري: لا ننتظر صحته (M5.8)
    healthcheck: { test: ["CMD", "wget", "-qO-", "http://127.0.0.1:8080/ready"], interval: 10s, timeout: 2s, retries: 3, start_period: 10s }
    stop_grace_period: 30s                          # SIGTERM ثم انتظار 30s قبل SIGKILL (M5.7)
    read_only: true
    tmpfs: ["/tmp"]
    security_opt: ["no-new-privileges:true"]
    cap_drop: ["ALL"]
    deploy: { resources: { limits: { memory: 512M, cpus: "1.0" } } }
    logging: { driver: json-file, options: { max-size: "10m", max-file: "3" } }

  worker:
    build: { context: ., target: runtime }
    command: ["node", "dist/worker.js"]
    environment: *app_env
    depends_on:
      migrate: { condition: service_completed_successfully }
    stop_grace_period: 60s                          # الوظائف أطول من الطلبات (M5.9)
    read_only: true
    tmpfs: ["/tmp"]
    security_opt: ["no-new-privileges:true"]
    cap_drop: ["ALL"]
    deploy: { resources: { limits: { memory: 512M } }, replicas: 2 }

volumes:
  pgdata:
```

```yaml
# compose.override.yaml — يُدمج تلقائيًا في التطوير: الكود مركّب وإعادة تشغيل تلقائية؛ لا يُستخدم في CI/الإنتاج (COMPOSE_FILE=compose.yaml)
services:
  api:
    build: { context: ., target: build }
    command: ["npx", "tsx", "watch", "src/main.ts"]
    volumes: ["./src:/app/src:ro"]
    read_only: false
  worker:
    build: { context: ., target: build }
    command: ["npx", "tsx", "watch", "src/worker.ts"]
    volumes: ["./src:/app/src:ro"]
    read_only: false
```

```bash
# الأوامر اليومية
docker compose up -d --build                 # ابنِ وشغّل الكل بالترتيب (postgres healthy → migrate → api/worker)
docker compose ps                            # الحالة + health
docker compose logs -f api worker            # السجلات (stdout) — لا ملفات داخل الحاوية
docker compose exec postgres psql -U app store -c 'SELECT type, status, count(*) FROM jobs GROUP BY 1,2'
docker compose stop api                      # يرسل SIGTERM وينتظر stop_grace_period → راقب "shutdown: done" في السجل
docker compose down                          # أوقف واحذف الحاويات (volume pgdata يبقى)؛ -v لحذف البيانات
# فحص الصورة
docker build -t store-api:$(git rev-parse --short HEAD) --target runtime .
docker image history store-api:dev           # الطبقات وأحجامها — هل node_modules الإنتاجية فقط؟
docker run --rm -it --entrypoint sh store-api:dev -c 'whoami && ls dist && env | grep -i secret'   # node؛ لا أسرار
docker scout cves store-api:dev              # أو: trivy image store-api:dev
# التشخيص الكلاسيكي
docker compose exec api wget -qO- http://postgres:5432 || true    # هل DNS/الشبكة تعمل؟ (الخطأ المتوقّع: "wrong version" من PG = الاتصال وصل)
docker stats                                 # الذاكرة مقابل الحدود؛ 137 في `docker inspect` = OOM
```

```typescript
// src/dockerfile-lint.ts — قواعد §3 كفحص آلي للـ Dockerfile (يعمل في CI، M5.12): لا تعتمد على الذاكرة البشرية
export type Finding = { rule: string; line?: number; message: string };
export function lintDockerfile(text: string): Finding[] {
  const lines = text.split("\n"); const out: Finding[] = []; const push = (rule: string, message: string, line?: number) => out.push({ rule, line, message });
  const instr = lines.map((l, i) => ({ i: i + 1, l: l.trim() })).filter(x => x.l && !x.l.startsWith("#"));
  const froms = instr.filter(x => /^FROM\s/i.test(x.l));
  for (const f of froms) { const img = f.l.split(/\s+/)[1] ?? ""; if (!img.startsWith("$") && !/@sha256:[0-9a-f]{64}$/.test(img)) { if (/:latest$|^[^:@]+$/.test(img)) push("pinned-base", `base image "${img}" is not pinned (use a full version or @sha256 digest)`, f.i); else push("digest-recommended", `base image "${img}" pinned by tag only; prefer @sha256 digest`, f.i); } }
  const stages = froms.length; if (stages < 2) push("multi-stage", "single-stage build ships build tools and devDependencies");
  const lastFrom = froms.at(-1)?.i ?? 0; const runtime = instr.filter(x => x.i > lastFrom);
  if (!runtime.some(x => /^USER\s+(?!root\b)\S+/i.test(x.l))) push("non-root", "runtime stage never switches to a non-root USER");
  const cmd = runtime.find(x => /^CMD\s/i.test(x.l)); if (!cmd) push("cmd", "no CMD in runtime stage"); else if (!/^CMD\s*\[/i.test(cmd.l)) push("exec-form", "CMD uses shell form: /bin/sh becomes PID 1 and swallows SIGTERM", cmd.i);
  const entry = runtime.find(x => /^ENTRYPOINT\s/i.test(x.l)); if (entry && !/^ENTRYPOINT\s*\[/i.test(entry.l)) push("exec-form", "ENTRYPOINT uses shell form", entry.i);
  if (!runtime.some(x => /tini|dumb-init/.test(x.l))) push("init", "no init (tini/dumb-init) — run with --init or add tini so PID 1 forwards signals and reaps zombies");
  if (!runtime.some(x => /^HEALTHCHECK\s/i.test(x.l))) push("healthcheck", "no HEALTHCHECK in runtime stage");
  for (const x of instr) {
    if (/^RUN\s.*npm\s+install\b/.test(x.l) && !/npm ci/.test(x.l)) push("npm-ci", "use `npm ci` (lockfile) instead of `npm install`", x.i);
    if (/^(ENV|ARG)\s+\w*(SECRET|PASSWORD|TOKEN|KEY)\w*\s*=?\s*\S+/i.test(x.l) && !/=\s*$/.test(x.l)) push("secret-in-layer", "secret-looking ENV/ARG value baked into image layers", x.i);
    if (/^COPY\s+\.env/.test(x.l)) push("secret-in-layer", "COPY .env bakes secrets into the image", x.i);
    if (/^COPY\s+\.\s+\./.test(x.l) && x.i < (instr.find(y => /npm ci/.test(y.l))?.i ?? Infinity)) push("layer-order", "COPY . . before npm ci defeats dependency layer caching", x.i);
  }
  return out;
}
```

```typescript
// src/dockerfile-lint.test.ts
import { test } from "node:test"; import assert from "node:assert/strict"; import { lintDockerfile } from "./dockerfile-lint.js";
const GOOD = `# syntax=docker/dockerfile:1.7
ARG NODE_IMAGE=node:22.12.0-alpine3.20@sha256:${"a".repeat(64)}
FROM \${NODE_IMAGE} AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
FROM \${NODE_IMAGE} AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY src ./src
RUN npm run build
FROM \${NODE_IMAGE} AS runtime
RUN apk add --no-cache tini
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
USER node
HEALTHCHECK CMD wget -qO- http://127.0.0.1:8080/health || exit 1
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/main.js"]`;
const BAD = `FROM node:latest
WORKDIR /app
COPY . .
RUN npm install
ENV API_SECRET=supersecret123
COPY .env .env
CMD node src/main.js`;
test("production Dockerfile passes", () => assert.deepEqual(lintDockerfile(GOOD), []));
test("the typical first Dockerfile triggers every rule", () => {
  const rules = new Set(lintDockerfile(BAD).map(f => f.rule));
  for (const r of ["pinned-base", "multi-stage", "non-root", "exec-form", "init", "healthcheck", "npm-ci", "secret-in-layer", "layer-order"]) assert.ok(rules.has(r), `expected rule ${r}`);
});
test("tag-only pin is a recommendation, shell-form ENTRYPOINT is flagged", () => {
  const f = lintDockerfile(`FROM node:22.12.0-alpine3.20 AS a\nRUN npm ci\nFROM node:22.12.0-alpine3.20\nUSER node\nHEALTHCHECK CMD true\nENTRYPOINT tini -- node dist/main.js\nCMD ["node","dist/main.js"]`);
  assert.ok(f.some(x => x.rule === "digest-recommended")); assert.ok(f.some(x => x.rule === "exec-form" && /ENTRYPOINT/.test(x.message))); assert.ok(!f.some(x => x.rule === "pinned-base"));
});
```

```bash
node --import tsx --test src/dockerfile-lint.test.ts    # 3 pass — وأضفه إلى CI: node dist/dockerfile-lint-cli.js Dockerfile || exit 1
```

---

## 8. مثال من العالم الحقيقي
فريق يحتفل بـ "Docker يعمل!" ثم: (1) الصورة 1.4 GB (نسخ `node_modules` المحلية بلا `.dockerignore` + devDependencies + بلا multi-stage) → النشر 6 دقائق؛ (2) كل نشر يقطع الطلبات رغم أن الكود فيه إيقاف رشيق — `CMD npm start` بصيغة shell: `sh` هو PID 1 ويبتلع SIGTERM، وnpm لا يمرّره بموثوقية؛ (3) المتصفح لا يصل إلى الـ API لأن الخادم يستمع على `127.0.0.1` داخل الحاوية؛ (4) حاوية DB "فقدت البيانات" بعد `docker compose down -v` في سكربت تنظيف. بعد تطبيق §6/§7: 180 MB، نشر 40 ثانية، إيقاف رشيق يعمل (`docker compose stop` يُظهر "shutdown: done")، volume مسمّى مع نسخ احتياطي، وlint الـ Dockerfile في CI حتى لا تعود الأخطاء.

## 9. مثال من الإنتاج
شركة تكتشف في مراجعة أمنية أن صورة الإنتاج تحوي مفتاح AWS في طبقة قديمة (`ENV AWS_SECRET_ACCESS_KEY=` أُزيل من الـ Dockerfile لاحقًا، لكن الطبقة بقيت في تاريخ الصور المدفوعة إلى السجل)، وأن الحاوية تعمل root مع `docker.sock` مركّبًا "لأداة النشر". خطة الإصلاح: تدوير المفتاح فورًا (M5.4)، حذف الصور القديمة من السجل، أسرار وقت التشغيل فقط عبر مدير أسرار، `USER node` + `read_only` + `cap_drop: ALL`، إزالة `docker.sock` (النشر من CI لا من داخل الحاوية)، وفحص الصور والـ Dockerfile كبوابة في CI (M5.12). الدرس: الصورة **سجل دائم** لكل ما مرّ بها؛ عامل الطبقات كأنها Git عام.

---

## 10. مفاهيم خاطئة شائعة
1. **"الحاوية آلة افتراضية خفيفة."** عملية معزولة تشارك نواة المضيف؛ هذا يفسّر سرعتها وحدود عزلها.
2. **"`localhost` داخل الحاوية هو جهازي."** هو الحاوية نفسها؛ الخدمات بأسمائها، والمضيف بـ `host.docker.internal` عند الحاجة.
3. **"`EXPOSE` يفتح المنفذ."** توثيق؛ النشر بـ `ports`/`-p`، والاستماع يجب أن يكون على `0.0.0.0`.
4. **"حذف السطر من الـ Dockerfile يحذف السر."** الطبقات تبقى في الصور المدفوعة؛ دوّر السر.
5. **"Docker يجعل التطوير والإنتاج متطابقين تلقائيًا."** نفس الصورة نعم؛ لكن الموارد والشبكة والأسرار والحجم تختلف — التكافؤ قرار مستمر.
6. **"Compose للإنتاج الموزّع."** لجهاز واحد؛ التوزيع وإعادة الجدولة والتوسّع للمنصّات (M5.13).

## 11. أخطاء شائعة
1. `FROM node` أو `node:latest`؛ لا `.dockerignore`؛ `COPY . .` قبل `npm ci`.
2. `CMD npm start` / صيغة shell؛ بلا init → SIGTERM لا يصل، zombies تتراكم.
3. التطبيق على 127.0.0.1؛ `DATABASE_URL` بـ localhost داخل الحاوية.
4. تشغيل root؛ `docker.sock` مركّب؛ بلا حدود ذاكرة (حاوية واحدة تخنق المضيف).
5. بيانات DB في طبقة الكتابة بلا volume؛ أو `down -v` في سكربتات.
6. `depends_on` بلا `condition` → السباق مع إقلاع DB؛ أو الاعتماد عليه فقط بلا retry في التطبيق.
7. `--max-old-space-size` غير مضبوط مع حدّ الحاوية → OOM 137 "غامض".
8. السجلات إلى ملفات داخل الحاوية؛ تضخّم json-file بلا `max-size`.

## 12. تمرين تصحيح
`docker compose up` ينجح، `docker compose ps` يُظهر `api` **healthy**، لكن من جهازك `curl localhost:8080/health` يعيد "connection reset"، ومن حاوية `worker` استدعاء `http://api:8080` يعطي ECONNREFUSED.
1. **دليل:** `docker compose logs api` يُظهر `listening on 127.0.0.1:8080` — التهيئة تقرأ `HOST` بافتراضي `127.0.0.1` ورثناه من بيئة التطوير القديمة. والـ HEALTHCHECK يستدعي `http://127.0.0.1:8080/health` **من داخل الحاوية** فينجح.
2. **فرضية:** الخادم يستمع على loopback الحاوية فقط؛ لا المنفذ المنشور ولا الخدمات الأخرى (عبر واجهة الشبكة) تصل إليه؛ وفحص الصحة "أعمى" لأنه يفحص من الداخل غير ما يفحصه المستخدم.
3. **تجربة:** `docker compose exec api wget -qO- http://127.0.0.1:8080/health` ينجح؛ `docker compose exec worker wget -qO- http://api:8080/health` يفشل → تأكّدت.
4. **الإصلاح:** الاستماع على `0.0.0.0` داخل الحاوية دائمًا (M5.7 `server.listen(port, "0.0.0.0")`؛ احذف متغيّر `HOST` المربك أو اجعل الافتراضي 0.0.0.0 في الحاوية)؛ أبقِ HEALTHCHECK على 127.0.0.1 (محلي للحاوية، وهذا غرضه: هل العملية حيّة؟) لكن أضف اختبارًا في CI يشغّل الصورة ويستدعي **المنفذ المنشور من الخارج** (smoke، M5.10) — الفحص الذي يمثّل المستخدم.
5. **أين أيضًا؟** أي خدمة تُهيّأ بـ `HOST`؛ أي فحص صحة يفحص غير مسار المستخدم؛ وجدار ناري/security group يسمح من الداخل لا من الخارج (M5.13).

## 13. تمرين معماري
صمّم **حزمة الحاويات** لـ Project 6: (1) Dockerfile نهائي (الأهداف deps/build/runtime، الأساس بالـ digest، الحجم المستهدف < 200 MB، init، non-root، HEALTHCHECK) وما الذي يختلف للعامل (نفس الصورة بأمر مختلف أم صورة منفصلة؟ ACTRR)؛ (2) `compose.yaml` للتطوير + override + ملف CI (بلا منافذ منشورة، بلا bind mounts)؛ (3) سياسة الوسوم (`sha-<git>` + `v1.4.0`؛ متى `latest` لا أبدًا)؛ (4) خطة الأسرار: تطوير/CI/إنتاج؛ (5) حدود الموارد لكل خدمة وربطها بـ `--max-old-space-size` وpool (M5.7)؛ (6) فحص الصور والـ Dockerfile كبوابة؛ (7) خطة النسخ الاحتياطي لـ volume الـ DB محليًا؛ (8) ما الذي **لا** يحلّه Compose وستحتاجه من M5.13.

## 14. الصلة بعصر AI
AI يولّد Dockerfiles تعمل لكنها single-stage وroot وبصيغة shell وبلا `.dockerignore`؛ وcompose بلا healthcheck ولا حدود. `lintDockerfile` من §7 (وHadolint) هو ردّك الآلي: ولّد ثم افحص. اطلب منه صراحة قائمة §4 ("multi-stage، digest، USER node، exec-form + tini، HEALTHCHECK، بلا أسرار"). وهو ممتاز في: تفسير أخطاء الشبكة بين الحاويات (ECONNREFUSED على localhost)، وتصغير الصور (`image history` → ما الطبقة الضخمة؟)، وترجمة Compose إلى manifests للمنصّة (M5.13) مع مراجعتك.

## 15. ما يجب إتقانه (Must Master) 🔴
- 🔴 الحاوية = عملية + namespaces + cgroups + طبقات؛ صورة/حاوية/registry؛ وسوم مقابل digests؛ Dockerfile: أساس مثبّت، ترتيب الطبقات، `npm ci`, `.dockerignore`, multi-stage, `USER node`, CMD exec + init, HEALTHCHECK, بلا أسرار؛ `0.0.0.0` وDNS الخدمات وlocalhost؛ volumes للدائم؛ Compose مع healthcheck وdepends_on الشرطي وstop_grace_period وحدود الذاكرة؛ السجلات إلى stdout؛ `--max-old-space-size` مع الحدّ.

## 16. ما يجب فهمه (Should Understand) 🟠
- 🟠 `read_only`/`cap_drop`/`no-new-privileges`؛ فحص الصور؛ BuildKit secrets وcache mounts؛ override files؛ `host.docker.internal`؛ OOM 137 والتشخيص؛ صور distroless.

## 17. ما يمكن تأجيله (Can Defer) ⚪
- ⚪ تفاصيل namespaces/cgroups v2 وOCI runtime، rootless Docker، صور متعدّدة المعماريات (buildx)، شبكات Docker المتقدّمة، Swarm.

## 18. الخلاصة
1. الحاوية عملية Linux معزولة ومقيّدة فوق صورة طبقية — لا VM؛ وهذا يفسّر PID 1 والإشارات والشبكة والذاكرة.
2. الصورة هي الـ artifact الثابت: ابنِها مرة، وسمها بالـ SHA، ثبّت الأساس بالـ digest، ولا أسرار في الطبقات.
3. Dockerfile إنتاجي: أساس صغير، طبقات مرتّبة للتخزين المؤقت، `npm ci`, multi-stage, `USER node`, CMD exec + tini, HEALTHCHECK.
4. الشبكة: استمع على `0.0.0.0`؛ اسم الخدمة هو DNS؛ localhost داخل الحاوية هو الحاوية.
5. Compose يشغّل النظام كاملًا على جهاز واحد بـ healthchecks وترتيب إقلاع وvolumes وحدود؛ التوزيع للمنصّات.

## 19. مراجع رسمية
- Docker — Dockerfile reference: https://docs.docker.com/reference/dockerfile/
- Docker — Building best practices (multi-stage, cache, non-root): https://docs.docker.com/build/building/best-practices/
- Docker — Compose file reference (`healthcheck`, `depends_on`, `stop_grace_period`): https://docs.docker.com/reference/compose-file/
- Docker — Networking in Compose: https://docs.docker.com/compose/how-tos/networking/
- Node.js Docker — Best practices (official image, `USER node`, init): https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md
- tini — A tiny but valid init for containers: https://github.com/krallin/tini
- Hadolint — Dockerfile linter: https://github.com/hadolint/hadolint
- Trivy — Container image scanning: https://aquasecurity.github.io/trivy/
- Linux man — namespaces(7), cgroups(7): https://man7.org/linux/man-pages/man7/namespaces.7.html

## المصطلحات
| العربية | English |
|---|---|
| حاوية | Container |
| صورة | Image |
| سجل الصور | Registry |
| وسم / بصمة | Tag / Digest |
| فضاءات الأسماء | Namespaces |
| مجموعات التحكّم | cgroups |
| نظام ملفات طبقي | Union/layered filesystem |
| بناء متعدّد المراحل | Multi-stage build |
| طبقة | Layer |
| تخزين طبقات البناء مؤقتًا | Build cache |
| صيغة exec / shell | Exec form / Shell form |
| عملية init (PID 1) | Init process (PID 1) |
| فحص صحة | HEALTHCHECK |
| مجلّد دائم | Volume |
| تركيب ربطي | Bind mount |
| نشر منفذ | Port publishing |
| مهلة الإيقاف | Stop grace period |
| نظام ملفات للقراءة فقط | Read-only root filesystem |
