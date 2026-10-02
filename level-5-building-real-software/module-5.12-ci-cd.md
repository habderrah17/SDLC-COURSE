# Module 5.12 — التكامل والتسليم المستمرّان
## CI/CD: pipeline as code, fast & trustworthy feedback, build-once/promote, quality gates, secrets in CI, environments & approvals, releases, and continuous deployment done safely

> **المستوى:** Level 5 | **الموقع:** [12 من 13]
> **السابق:** [M5.11 — Docker & Containers](module-5.11-docker-containers.md) | **التالي:** [M5.13 — Cloud Fundamentals](module-5.13-cloud-fundamentals.md)

---

## 1. المتطلبات
- [ ] Git: فروع، PRs، tags، rebase/merge، lockfile — [L1-M1.13](../level-1-programming/module-1.13-git-1.md), [L1-M1.14](../level-1-programming/module-1.14-git-2.md)
- [ ] هرم الاختبارات، الاختبارات المتكاملة على DB حقيقية، fake > mock — [L4-M4.11](../level-4-software-engineering-foundations/module-4.11-testing.md)
- [ ] build/release/deploy، artifact ثابت، deploy.sh، الهجرات كخطوة — [M5.10](module-5.10-deployment.md)
- [ ] الصور وCompose وlint الـ Dockerfile — [M5.11](module-5.11-docker-containers.md)
- [ ] سلسلة التوريد: SHA-pinned actions، `npm audit`، الأسرار — [M5.4](module-5.4-security.md)

## 2. أهداف التعلّم
- تصميم **pipeline** كشيفرة (في المستودع) بمراحل واضحة: فحوص سريعة → اختبارات (مع خدمات حقيقية) → بناء الصورة مرة → فحص → دفع → نشر staging → smoke → نشر prod (بموافقة أو تلقائيًا) — مع **تغذية راجعة < 10 دقائق** للمطوّر.
- تطبيق **build once, promote**: الـ artifact الذي اختُبر هو ما يُنشر، بالـ SHA، عبر البيئات؛ لا إعادة بناء لكل بيئة.
- وضع **بوابات جودة** (quality gates) معقولة: typecheck، lint، اختبارات، تغطية بحدّ أدنى على الكود المتغيّر، `npm audit` بعتبة، فحص الصورة والـ Dockerfile، فحص الأسرار — والتعامل مع **الاختبارات المتذبذبة** (flaky) بلا تعطيل الفريق ولا تجاهلها.
- إدارة **الأسرار في CI** بأمان: OIDC بدل مفاتيح طويلة العمر، بيئات محمية بموافقات، أقل صلاحية للـ token، actions مثبّتة بالـ SHA، عزل PRs من الـ forks.
- ربط CI/CD بـ **الثقافة**: trunk-based وPRs صغيرة، حماية الفرع الرئيسي بفحوص إلزامية، إصدارات SemVer من Conventional Commits، rollback = إعادة نشر SHA سابق، وقياس DORA الأربعة.

---

## 3. شرح للمبتدئ

### CI وCD وCD
- **Continuous Integration**: كل تغيير يُدمج في الفرع الرئيسي **كثيرًا** (يوميًا على الأقل) ويُتحقَّق منه آليًا (بناء + اختبارات) — فالخلافات تُكتشف بعد ساعات لا أسابيع. الفكرة ثقافية (دمج صغير متكرّر) قبل أن تكون أداة.
- **Continuous Delivery**: كل تغيير اجتاز الـ pipeline **قابل للنشر** بضغطة زر؛ النشر قرار بشري.
- **Continuous Deployment**: النشر إلى الإنتاج **تلقائي** بعد اجتياز البوابات. يحتاج اختبارات موثوقة، نشرًا بلا توقّف (M5.10)، مراقبة (M6.6)، وrollback سريعًا.
النموذج الذهني الرابع يكتمل: `Code → Build → Test → Artifact → Deploy`، آليًا، في كل commit.

### الـ pipeline كشيفرة
ملف YAML في المستودع (`.github/workflows/ci.yml`، أو GitLab CI/…) يصف المراحل؛ يُراجع كأي كود ويُصدَّر معه. المراحل النموذجية:
1. **سريعة (≤ 2 دقيقة)، بالتوازي**: `npm ci` (مع cache)، typecheck، lint، اختبارات الوحدة، فحص الأسرار، lint الـ Dockerfile.
2. **اختبارات متكاملة (≤ 5 دقائق)**: PostgreSQL وRedis **حقيقيان** كـ services (M4.11: fake > mock، وDB حقيقية للمنطق المعتمد عليها — M5.6/M5.9 تختبر بالضبط ما يهم).
3. **بناء الصورة مرة** بالـ SHA (`store-api:sha-abc123`)، فحص الثغرات، دفع إلى registry.
4. **نشر staging** بنفس الصورة → هجرات → smoke tests (مسار حقيقي، M5.10).
5. **نشر prod**: نفس الصورة؛ بموافقة (environment protection) أو تلقائيًا بعد staging؛ rolling/canary؛ smoke؛ إشعار.
**التغذية الراجعة السريعة** أهم من الشمول في المرحلة الأولى: المطوّر ينتظر؛ 10 دقائق هي الحدّ الذي بعده يبدّل السياق وتتراكم PRs. أدوات: cache لـ `node_modules`/طبقات Docker، توازي الوظائف، تقسيم الاختبارات، `concurrency` لإلغاء التشغيلات القديمة لنفس الفرع.

### Build once, promote
أخطر نمط: "ابنِ لـ staging، اختبر، ثم **ابنِ من جديد** لـ prod". البناء الثاني قد يختلف (تبعية، أساس صورة، وقت). القاعدة: صورة واحدة بالـ SHA تُبنى في مرحلة واحدة وتُنشر **نفسها** في كل بيئة؛ الوسوم الإضافية (`staging`, `v1.4.0`) مؤشّرات إلى نفس الـ digest. والتهيئة لكل بيئة من خارج الصورة (M5.10).

### بوابات الجودة — بلا تعصّب
- **إلزامية (تمنع الدمج)**: typecheck، lint (الأخطاء لا التنسيق فقط)، كل الاختبارات خضراء، لا ثغرات **حرجة/عالية** ذات إصلاح متاح، لا أسرار مكتشفة، Dockerfile يجتاز lint.
- **معلوماتية (تعليق على PR)**: التغطية والتغيّر فيها (عتبة على **الكود المتغيّر** لا الكلّي — تغطية 80% كلّية رقم سهل التلاعب)، حجم الحزمة، مدة الـ pipeline.
- **الاختبارات المتذبذبة**: اختبار يفشل أحيانًا بلا تغيير = **إمّا عيب في الاختبار (توقيت، ترتيب، حالة مشتركة) أو سباق حقيقي في الكود** (M5.6!). لا تعِد التشغيل تلقائيًا وتنسى: ضعه في **حجر** (quarantine: يعمل ولا يمنع) مع تذكرة ومالك ومهلة؛ أصلحه أو احذفه. المتذبذب المتجاهَل يقتل ثقة الفريق بالأخضر، وبعدها يتجاهلون الأحمر الحقيقي.

### الأسرار في CI
CI يملك مفاتيح مملكتك (registry، السحابة، الخوادم). القواعد: (1) **OIDC** بين CI ومزوّد السحابة (token قصير العمر لكل تشغيل) بدل مفاتيح طويلة العمر في secrets؛ (2) أقل صلاحية: `permissions:` صريحة لكل workflow (`contents: read`)، وtoken النشر لا يقرأ غير ما يحتاج؛ (3) **بيئات محمية** (`environment: production`) بموافقة بشرية ومراجعين وقصر على فرع `main`؛ (4) PRs من الـ forks لا ترى الأسرار ولا تنشر؛ (5) actions مثبّتة بالـ **SHA** (M5.4 — `uses: actions/checkout@<sha>`) مع Dependabot يحدّثها؛ (6) لا `echo $SECRET` في السجلات (الـ masking ليس مضمونًا للقيم المشتقّة)؛ (7) الـ runner نفسه: مُدار أو مُحصَّن، وقابل للتخلّص.

### الثقافة التي تجعله يعمل
- **Trunk-based**: فروع قصيرة العمر (ساعات–يومان)، PRs صغيرة (< 400 سطر) تُراجع سريعًا (M6.2)؛ الميزات غير المكتملة خلف أعلام (M5.10).
- **حماية `main`**: لا push مباشر، فحوص إلزامية، مراجعة واحدة على الأقل، تاريخ خطي.
- **الإصدارات**: Conventional Commits (`feat:`, `fix:`, `feat!:`) → SemVer تلقائي + CHANGELOG + tag + release من CI؛ كل صورة مرتبطة بـ SHA وtag.
- **Rollback** = إعادة نشر SHA سابق عبر نفس الـ pipeline (زر "re-run deploy" أو `workflow_dispatch` مع SHA) — لا أوامر يدوية على الخادم.
- **DORA metrics**: تكرار النشر، زمن من commit إلى prod، نسبة فشل التغييرات، زمن الاستعادة — الأرقام التي تخبرك إن كان الـ pipeline يعمل فعلًا.

---

## 4. النموذج الذهني

```
   كل commit: فحوص سريعة (≤2m) ∥ → اختبارات مع خدمات حقيقية (≤5m) → ابنِ الصورة مرة بالـ SHA → افحص → ادفع
             → staging (نفس الصورة) → هجرات → smoke → prod (موافقة/تلقائي) → smoke → إشعار. Rollback = أعد نشر SHA سابق.
   بوابات: إلزامية قليلة وموثوقة؛ معلوماتية للباقي؛ المتذبذب يُحجر بتذكرة لا يُعاد تشغيله بصمت.
   أسرار: OIDC + أقل صلاحية + بيئات محمية + forks معزولة + actions بالـ SHA.
   ثقافة: trunk-based، PRs صغيرة، main محمي، SemVer من الرسائل، قِس DORA.
```

---

## 5. الرسم التوضيحي

```mermaid
flowchart LR
  PR[Pull request] --> F[fast checks ≤2m<br/>typecheck · lint · unit · secrets · dockerfile-lint]
  F --> I[integration ≤5m<br/>postgres + redis services]
  I --> B[build image once<br/>store-api:sha-abc123]
  B --> SC[scan image + npm audit]
  SC --> PUSH[push to registry]
  PUSH -->|merge to main| ST[deploy staging<br/>migrate → rolling → smoke]
  ST --> APPR{environment: production<br/>required reviewers}
  APPR -->|approved| PRD[deploy prod<br/>same digest · canary → smoke]
  PRD --> N[notify + tag release]
  PRD -.failure.-> RB[rollback: redeploy previous sha]
```

---

## 6. مثال بسيط

```yaml
# .github/workflows/ci.yml — المرحلة 1+2: فحوص سريعة بالتوازي ثم اختبارات متكاملة بخدمات حقيقية
name: ci
on:
  pull_request:
  push: { branches: [main] }
permissions: { contents: read }                                   # أقل صلاحية افتراضيًا
concurrency: { group: ci-${{ github.ref }}, cancel-in-progress: true }   # تشغيل جديد يلغي القديم لنفس الفرع

jobs:
  fast:
    runs-on: ubuntu-24.04
    timeout-minutes: 5
    strategy:
      fail-fast: false
      matrix: { task: [typecheck, lint, unit, dockerfile-lint] }
    steps:
      - uses: actions/checkout@692973e3d937129bcbf40652eb9f2f61becf3332        # v4.1.7 — مثبّت بالـ SHA (M5.4). تحقّق من كل SHA من صفحة إصدار الـ action قبل النسخ، ودع Dependabot يحدّثها
      - uses: actions/setup-node@1e60f620b9541d16bece96c5465dc8ee9832be0b      # v4.0.3
        with: { node-version-file: .nvmrc, cache: npm }
      - run: npm ci
      - run: npm run ${{ matrix.task }}
  secrets-scan:
    runs-on: ubuntu-24.04
    timeout-minutes: 3
    steps:
      - uses: actions/checkout@692973e3d937129bcbf40652eb9f2f61becf3332
        with: { fetch-depth: 0 }
      - uses: gitleaks/gitleaks-action@44c470ffc35caa8b1eb3e8012ca53c2f9bea4eb5   # v2.3.6
        env: { GITHUB_TOKEN: "${{ secrets.GITHUB_TOKEN }}" }
  integration:
    needs: [fast]
    runs-on: ubuntu-24.04
    timeout-minutes: 10
    services:
      postgres:
        image: postgres:16.4-alpine
        env: { POSTGRES_USER: app, POSTGRES_PASSWORD: app, POSTGRES_DB: store }
        ports: ["5432:5432"]
        options: >-
          --health-cmd "pg_isready -U app -d store" --health-interval 5s --health-timeout 3s --health-retries 10
      redis:
        image: redis:7.4-alpine
        ports: ["6379:6379"]
        options: --health-cmd "redis-cli ping" --health-interval 5s --health-timeout 2s --health-retries 10
    env:
      DATABASE_URL: postgres://app:app@127.0.0.1:5432/store
      REDIS_URL: redis://127.0.0.1:6379
    steps:
      - uses: actions/checkout@692973e3d937129bcbf40652eb9f2f61becf3332
      - uses: actions/setup-node@1e60f620b9541d16bece96c5465dc8ee9832be0b
        with: { node-version-file: .nvmrc, cache: npm }
      - run: npm ci
      - run: npm run migrate
      - run: npm run test:integration -- --test-reporter=junit --test-reporter-destination=junit.xml
      - uses: actions/upload-artifact@50769540e7f4bd5e21e526ee35c689e35e0d6874   # v4.4.0
        if: always()
        with: { name: junit, path: junit.xml }
      - run: npm audit --omit=dev --audit-level=high                             # بوابة: لا high/critical في تبعيات الإنتاج
```

---

## 7. مثال كود

```yaml
# .github/workflows/cd.yml — المرحلة 3→5: ابنِ مرة، افحص، ادفع، انشر staging ثم prod بنفس الـ digest
name: cd
on:
  push: { branches: [main] }
  workflow_dispatch:
    inputs: { sha: { description: "SHA to (re)deploy — rollback by choosing a previous one", required: false } }
permissions: { contents: read, packages: write, id-token: write }     # id-token: OIDC إلى السحابة بلا مفاتيح طويلة العمر
concurrency: { group: cd-production, cancel-in-progress: false }        # النشرات لا تتداخل ولا تُلغى منتصفها

env:
  IMAGE: ghcr.io/${{ github.repository }}/store-api
  SHA: ${{ inputs.sha || github.sha }}

jobs:
  build:
    runs-on: ubuntu-24.04
    timeout-minutes: 15
    outputs: { digest: "${{ steps.push.outputs.digest }}" }
    steps:
      - uses: actions/checkout@692973e3d937129bcbf40652eb9f2f61becf3332
        with: { ref: "${{ env.SHA }}" }
      - uses: docker/setup-buildx-action@988b5a0280414f521da01fcc63a27aeeb4b104db   # v3.6.1
      - uses: docker/login-action@9780b0c442fbb1117ed29e0efdff1e18412f7567         # v3.3.0
        with: { registry: ghcr.io, username: "${{ github.actor }}", password: "${{ secrets.GITHUB_TOKEN }}" }
      - id: push
        uses: docker/build-push-action@5cd11c3a4ced054e52742c5fd54dca954e0edd85    # v6.7.0
        with:
          context: .
          target: runtime
          push: true
          tags: ${{ env.IMAGE }}:sha-${{ env.SHA }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          provenance: true
          sbom: true
      - uses: aquasecurity/trivy-action@6e7b7d1fd3e4fef0c5fa8cce1229c54b2c9bd0d8    # 0.24.0
        with: { image-ref: "${{ env.IMAGE }}@${{ steps.push.outputs.digest }}", severity: "CRITICAL,HIGH", ignore-unfixed: true, exit-code: "1" }

  deploy-staging:
    needs: [build]
    runs-on: ubuntu-24.04
    timeout-minutes: 15
    environment: { name: staging, url: https://staging-api.example.com }
    steps:
      - uses: actions/checkout@692973e3d937129bcbf40652eb9f2f61becf3332
      - name: migrate then deploy the SAME digest
        run: ./scripts/deploy.sh staging "${IMAGE}@${{ needs.build.outputs.digest }}"
        env: { DEPLOY_KEY: "${{ secrets.STAGING_DEPLOY_KEY }}" }
      - name: smoke
        run: ./scripts/smoke.sh https://staging-api.example.com

  deploy-production:
    needs: [build, deploy-staging]
    runs-on: ubuntu-24.04
    timeout-minutes: 20
    environment: { name: production, url: https://api.example.com }    # محمية: مراجعون مطلوبون + فرع main فقط (إعدادات المستودع)
    steps:
      - uses: actions/checkout@692973e3d937129bcbf40652eb9f2f61becf3332
      - name: canary 10% → verify → 100%
        run: ./scripts/deploy.sh production "${IMAGE}@${{ needs.build.outputs.digest }}" --canary
        env: { DEPLOY_KEY: "${{ secrets.PROD_DEPLOY_KEY }}" }
      - run: ./scripts/smoke.sh https://api.example.com
      - name: tag & release notes
        if: ${{ !inputs.sha }}
        run: node dist/release.js --sha "$SHA"
        env: { GITHUB_TOKEN: "${{ secrets.GITHUB_TOKEN }}" }
```

```bash
# scripts/smoke.sh — ما يفحصه المستخدم لا ما تفحصه العملية (M5.10)
#!/usr/bin/env bash
set -euo pipefail
BASE="$1"
curl -fsS -m 5 "$BASE/ready" | grep -q '"status":"ready"'
code=$(curl -s -o /dev/null -w '%{http_code}' -m 5 "$BASE/v1/products?limit=1"); [ "$code" = 200 ] || { echo "products: $code"; exit 1; }
code=$(curl -s -o /dev/null -w '%{http_code}' -m 5 "$BASE/v1/orders");            [ "$code" = 401 ] || { echo "orders should require auth: $code"; exit 1; }   # بوابة الأمن لا تُنسى
echo "smoke ok: $BASE"
```

```typescript
// src/release.ts — Conventional Commits → SemVer التالي + CHANGELOG (خالص، قابل للاختبار؛ CI يغلّفه بـ git log و gh release)
export type Commit = { sha: string; message: string };
export type Parsed = { type: string; scope?: string; breaking: boolean; subject: string; sha: string };
const RE = /^(?<type>feat|fix|perf|refactor|docs|test|build|ci|chore|revert)(?:\((?<scope>[\w\-./]+)\))?(?<bang>!)?:\s+(?<subject>.+)$/;
export function parseCommit(c: Commit): Parsed | null {
  const [head = "", ...body] = c.message.split("\n"); const m = RE.exec(head.trim()); if (!m?.groups) return null;
  const breaking = m.groups.bang === "!" || body.some(l => /^BREAKING[ -]CHANGE:/.test(l.trim()));
  return { type: m.groups.type!, scope: m.groups.scope, breaking, subject: m.groups.subject!.trim(), sha: c.sha };
}
export type Bump = "major" | "minor" | "patch" | null;
export function bumpFor(parsed: Parsed[], currentMajor: number): Bump {
  if (parsed.some(p => p.breaking)) return currentMajor === 0 ? "minor" : "major";                  // 0.x: الكسر يرفع minor (SemVer §4)
  if (parsed.some(p => p.type === "feat")) return "minor";
  if (parsed.some(p => p.type === "fix" || p.type === "perf" || p.type === "revert")) return "patch";
  return null;                                                                                     // docs/chore فقط: لا إصدار
}
export function nextVersion(current: string, bump: Bump): string {
  const m = /^v?(\d+)\.(\d+)\.(\d+)$/.exec(current); if (!m) throw new Error(`bad version ${current}`);
  const [maj, min, pat] = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (bump === "major") return `${maj + 1}.0.0`; if (bump === "minor") return `${maj}.${min + 1}.0`; if (bump === "patch") return `${maj}.${min}.${pat + 1}`; return current.replace(/^v/, "");
}
export function changelog(version: string, parsed: Parsed[], date = new Date().toISOString().slice(0, 10)): string {
  const sections: [string, (p: Parsed) => boolean][] = [["⚠ BREAKING CHANGES", p => p.breaking], ["Features", p => p.type === "feat"], ["Bug Fixes", p => p.type === "fix"], ["Performance", p => p.type === "perf"], ["Reverts", p => p.type === "revert"]];
  const lines = [`## ${version} (${date})`];
  for (const [title, pred] of sections) { const items = parsed.filter(pred); if (!items.length) continue; lines.push("", `### ${title}`, ...items.map(p => `- ${p.scope ? `**${p.scope}:** ` : ""}${p.subject} (${p.sha.slice(0, 7)})`)); }
  return lines.join("\n") + "\n";
}
export function plan(current: string, commits: Commit[]) {
  const parsed = commits.map(parseCommit).filter((p): p is Parsed => p !== null); const unparsed = commits.length - parsed.length;
  const bump = bumpFor(parsed, Number(/^v?(\d+)/.exec(current)?.[1] ?? 0)); const version = nextVersion(current, bump);
  return { bump, version, unparsed, notes: bump ? changelog(version, parsed) : "" };
}
```

```typescript
// src/release.test.ts
import { test } from "node:test"; import assert from "node:assert/strict"; import { parseCommit, plan, nextVersion } from "./release.js";
test("parses conventional commits incl. scope, bang and footer", () => {
  assert.deepEqual(parseCommit({ sha: "abc1234", message: "feat(api): add cursor pagination" }), { type: "feat", scope: "api", breaking: false, subject: "add cursor pagination", sha: "abc1234" });
  assert.equal(parseCommit({ sha: "x", message: "fix!: reject empty Idempotency-Key" })?.breaking, true);
  assert.equal(parseCommit({ sha: "x", message: "refactor: split\n\nBREAKING CHANGE: /v1/products now paginates" })?.breaking, true);
  assert.equal(parseCommit({ sha: "x", message: "wip stuff" }), null);
});
test("bump rules: breaking>feat>fix; 0.x breaking is minor; chores produce no release", () => {
  assert.equal(plan("1.4.2", [{ sha: "a", message: "fix: x" }, { sha: "b", message: "feat: y" }]).version, "1.5.0");
  assert.equal(plan("1.4.2", [{ sha: "a", message: "feat!: z" }]).version, "2.0.0");
  assert.equal(plan("0.9.0", [{ sha: "a", message: "feat!: z" }]).version, "0.10.0");
  const none = plan("v1.4.2", [{ sha: "a", message: "chore: deps" }, { sha: "b", message: "docs: readme" }]); assert.equal(none.bump, null); assert.equal(none.version, "1.4.2"); assert.equal(none.notes, "");
  assert.equal(nextVersion("1.4.2", "patch"), "1.4.3"); assert.throws(() => nextVersion("1.4", "patch"));
});
test("changelog groups sections and counts unparsed commits", () => {
  const p = plan("1.0.0", [{ sha: "aaaaaaa1", message: "feat(orders): cancel endpoint" }, { sha: "bbbbbbb2", message: "fix: 404 instead of 403 for foreign tenant" }, { sha: "ccccccc3", message: "merge branch" }]);
  assert.equal(p.unparsed, 1); assert.match(p.notes, /^## 1\.1\.0 \(\d{4}-\d{2}-\d{2}\)\n\n### Features\n- \*\*orders:\*\* cancel endpoint \(aaaaaaa\)\n\n### Bug Fixes\n- 404 instead of 403 for foreign tenant \(bbbbbbb\)\n$/);
});
```

```bash
node --import tsx --test src/release.test.ts    # 3 pass
# في CI: LAST=$(git describe --tags --abbrev=0) ; git log --format='%H%x00%B%x1e' "$LAST..HEAD" | node dist/release-cli.js  → gh release create vX.Y.Z --notes-file notes.md --target "$SHA"
# محليًا قبل الدفع — نفس البوابات بلا انتظار: npm run typecheck && npm run lint && npm test && npm run dockerfile-lint   (اجعلها سكربت `npm run ci:local` وربما pre-push hook)
```

---

## 8. مثال من العالم الحقيقي
فريق من 6 مطوّرين: pipeline يأخذ 28 دقيقة (اختبارات متسلسلة، بلا cache، بناء الصورة في كل PR)، واختباران متذبذبان "يُعاد تشغيلهما دائمًا". النتيجة: PRs تنتظر، الناس يدمجون بالتجميع، وذات مرة فشل حقيقي في اختبار التزامن (M5.6) أُعيد تشغيله حتى نجح — ووصل السباق إلى الإنتاج. الإصلاح: مصفوفة فحوص سريعة متوازية + cache (3 دقائق للـ PR)، بناء الصورة على `main` فقط، حجر المتذبذبين بتذاكر (أحدهما كان سباقًا حقيقيًا في الكود، الآخر `setTimeout` في الاختبار)، وقاعدة "لا إعادة تشغيل بلا تعليق يشرح السبب". زمن commit→prod انخفض من 3 أيام إلى 40 دقيقة، ونسبة فشل التغييرات من 18% إلى 4%.

## 9. مثال من الإنتاج
منظّمة تكتشف أن مفتاح نشر سحابي طويل العمر في secrets الـ CI تسرّب عبر سجل workflow (أُطبع في رسالة خطأ مشتقّة لم يُقنّعها الـ masking). التحقيق يُظهر أيضًا أن PRs من forks كانت تشغّل workflow بـ `pull_request_target` مع الأسرار. الإصلاح الهيكلي: OIDC بين CI والسحابة (token لكل تشغيل، صلاحية 15 دقيقة، مقيّد بالمستودع والفرع والبيئة)، حذف كل المفاتيح طويلة العمر، `permissions` دنيا لكل workflow، بيئة `production` بمراجعين وقصر على `main`، actions بالـ SHA مع Dependabot، وفحص ثابت للـ workflows (zizmor/actionlint) في البوابة. والدرس المتكرّر من M5.4: **أقصر عمر للسر وأقل صلاحية** أفضل من أي "حذر".

---

## 10. مفاهيم خاطئة شائعة
1. **"CI = أداة."** CI ممارسة الدمج الصغير المتكرّر؛ الأداة تتحقق منها فقط. فروع تعيش أسابيع مع "CI أخضر" ليست CI.
2. **"الأخضر يعني آمنًا."** يعني أن ما اختبرته يمرّ؛ البوابات تُصمَّم وتُراجع كما يُراجع الكود.
3. **"إعادة تشغيل المتذبذب حلّ."** هو إخفاء؛ قد يكون سباقًا حقيقيًا. حجر + تذكرة + إصلاح.
4. **"نبني لكل بيئة."** بناء واحد بالـ SHA يُرقّى؛ إعادة البناء تكسر "ما اختُبر هو ما نُشر".
5. **"Continuous Deployment للشركات الكبيرة فقط."** هو للفرق التي تملك اختبارات موثوقة ونشرًا بلا توقّف ومراقبة — بأي حجم؛ وبدونها لا يصلح لأي حجم.
6. **"الأسرار في secrets آمنة."** هي متاحة لكل خطوة لها إذن؛ قصر الصلاحية والعمر والبيئة هو الأمان.

## 11. أخطاء شائعة
1. pipeline > 10 دقائق للـ PR؛ بلا cache؛ بلا توازي؛ بناء الصورة في كل PR.
2. `uses: action@v4` بلا SHA؛ `permissions` غائبة (الافتراضي واسع)؛ `pull_request_target` مع checkout لكود الـ fork.
3. اختبارات متكاملة بـ mocks للـ DB بدل خدمة حقيقية → تفشل في الإنتاج فقط.
4. `npm install` في CI؛ عدم تثبيت إصدار Node (`.nvmrc`)؛ `latest` للصور في services.
5. النشر بأوامر يدوية على الخادم "لأن الـ pipeline بطيء" → انحراف لا يمكن تتبّعه.
6. بوابة تغطية كلّية 80% تُلبّى باختبارات فارغة؛ أو `npm audit` يمنع الدمج على ثغرة بلا إصلاح متاح (استخدم `ignore-unfixed`/استثناء مؤقّت بمهلة).
7. السماح بإلغاء نشر منتصفه (`cancel-in-progress` على CD) أو نشرين متداخلين.
8. لا `timeout-minutes` → وظيفة معلّقة تحجز الـ runner ساعات.

## 12. تمرين تصحيح
النشر إلى prod نجح (أخضر)، لكن الميزة الجديدة غير موجودة؛ staging يُظهرها. `docker inspect` على prod يُظهر صورة بـ digest يختلف عن المدفوع من آخر تشغيل.
1. **دليل:** سجل `deploy-production` يُظهر `IMAGE:latest` في أمر النشر؛ `latest` يشير إلى صورة بُنيت قبل ساعتين من workflow آخر (hotfix على فرع) دفع `latest` أيضًا.
2. **فرضية:** النشر بوسم قابل للتغيير بدل الـ digest؛ أي workflow يدفع `latest` يغيّر ما يُنشر.
3. **تجربة:** مقارنة digests في registry مقابل `needs.build.outputs.digest` → مختلفان؛ إعادة النشر بالـ digest الصحيح تُظهر الميزة.
4. **الإصلاح:** النشر دائمًا بـ `IMAGE@sha256:…` من مخرجات وظيفة البناء (كما في §7)؛ حذف وسم `latest` نهائيًا؛ smoke test يتحقق من رأس `X-Build-SHA` الذي يعيده التطبيق (M5.7 التهيئة تتضمّن SHA) ويقارنه بـ SHA الـ workflow؛ `concurrency` على CD بلا إلغاء.
5. **أين أيضًا؟** أي وسم قابل للتغيير في الـ pipeline (`node:22`, `actions/x@v4`, `staging` tag)؛ أي خطوة تنشر ما لم تبنِه هي.

## 13. تمرين معماري
صمّم **pipeline Project 6** كاملًا (ملفات YAML + مستند قصير): (1) المراحل وأزمنتها المستهدفة وما يعمل بالتوازي؛ (2) البوابات الإلزامية مقابل المعلوماتية ولماذا كل واحدة؛ (3) سياسة المتذبذبين (حجر، تذكرة، مهلة أسبوعان)؛ (4) خطة الأسرار: OIDC إلى السحابة (M5.13)، بيئات staging/production وقواعد حمايتهما، forks؛ (5) build once: أين يُخزَّن الـ digest ويُمرَّر؛ (6) النشر: API ثم worker أم العكس (M5.10 §13)، canary ومعاييره، rollback عبر `workflow_dispatch` بـ SHA؛ (7) الإصدارات: Conventional Commits إلزامية (commitlint في PR) → release تلقائي؛ (8) لوحة DORA: كيف تحسب كل مقياس من بيانات CI/Git؛ (9) ACTRR لـ "Continuous Delivery بموافقة" مقابل "Continuous Deployment" لفريقك الآن.

## 14. الصلة بعصر AI
AI يولّد workflows تعمل لكنها `@v4` بلا SHA، بلا `permissions`، بـ `npm install`، وتبني لكل بيئة. راجعه بقائمة §4، ومرّر الملف على actionlint/zizmor. الأهم: في L8 سيصبح الـ pipeline **خط الدفاع الأول ضد كود مولَّد**: نفس البوابات (أنواع، اختبارات على خدمات حقيقية، فحص أسرار وثغرات، lint أمني) تحكم على كود الإنسان والوكيل سواء — فاستثمر فيها الآن. وAI ممتاز في: تحليل سجل pipeline فاشل وتلخيص السبب، واقتراح تقسيم الاختبارات لتقليل الزمن، وكتابة smoke tests من `openapi.yaml`.

## 15–17. Master / Understand / Defer
- 🔴 CI كممارسة دمج صغير متكرّر؛ المراحل وزمن التغذية الراجعة ≤ 10 دقائق (cache، توازي، concurrency)؛ اختبارات متكاملة بخدمات حقيقية؛ build once بالـ SHA/digest والترقية عبر البيئات؛ البوابات الإلزامية القليلة الموثوقة؛ سياسة المتذبذبين؛ `permissions` دنيا، actions بالـ SHA، بيئات محمية، forks معزولة، OIDC؛ smoke يمثّل المستخدم؛ rollback = إعادة نشر SHA؛ main محمي وPRs صغيرة؛ Conventional Commits → SemVer.
- 🟠 DORA وكيف تُقاس؛ تقسيم الاختبارات وتوازيها؛ SBOM وprovenance؛ فحص الـ workflows ثابتًا؛ Dependabot/Renovate كسياسة؛ junit reports؛ pre-push hooks.
- ⚪ GitOps/ArgoCD، runners ذاتية الاستضافة وتحصينها، monorepo pipelines (affected-only)، توقيع الصور (cosign/SLSA)، merge queues.

## 18. الخلاصة
1. CI = دمج صغير متكرّر يُتحقَّق منه آليًا؛ CD = كل تغيير قابل للنشر (أو يُنشر) عبر نفس المسار الآلي.
2. المراحل: سريعة متوازية → متكاملة بخدمات حقيقية → ابنِ الصورة مرة → افحص → staging → smoke → prod؛ ≤ 10 دقائق للـ PR.
3. ما اختُبر هو ما يُنشر: digest واحد يُرقّى عبر البيئات؛ rollback إعادة نشر SHA سابق.
4. بوابات قليلة موثوقة؛ المتذبذب يُحجر ويُصلَح لا يُعاد تشغيله؛ الأخضر يستحق الثقة أو لا قيمة له.
5. أسرار CI بأقل صلاحية وأقصر عمر (OIDC، بيئات محمية، actions بالـ SHA، forks معزولة) — والثقافة (trunk-based، PRs صغيرة، main محمي) هي ما يجعل كل هذا يعمل.

## 19. مراجع رسمية
- GitHub Actions — Workflow syntax (`permissions`, `concurrency`, `environment`, `services`): https://docs.github.com/en/actions/writing-workflows/workflow-syntax-for-github-actions
- GitHub Actions — Security hardening (SHA pinning, OIDC, `pull_request_target`): https://docs.github.com/en/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions
- GitHub — Deployment environments & required reviewers: https://docs.github.com/en/actions/managing-workflow-runs-and-deployments/managing-deployments/managing-environments-for-deployment
- GitHub — Protected branches & required status checks: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches
- Conventional Commits 1.0.0: https://www.conventionalcommits.org/en/v1.0.0/
- Semantic Versioning 2.0.0: https://semver.org/
- DORA — Four key metrics: https://dora.dev/guides/dora-metrics-four-keys/
- Martin Fowler — Continuous Integration: https://martinfowler.com/articles/continuousIntegration.html
- actionlint: https://github.com/rhysd/actionlint · zizmor: https://github.com/woodruffw/zizmor
- Node.js — test runner reporters (junit): https://nodejs.org/api/test.html#test-reporters

## المصطلحات
| العربية | English |
|---|---|
| التكامل المستمرّ | Continuous Integration (CI) |
| التسليم / النشر المستمرّ | Continuous Delivery / Deployment (CD) |
| خط أنابيب كشيفرة | Pipeline as code |
| حلقة التغذية الراجعة | Feedback loop |
| بوابة جودة | Quality gate |
| اختبار متذبذب | Flaky test |
| حجر الاختبارات | Test quarantine |
| ابنِ مرة ورقِّ | Build once, promote |
| ترقية المنتج بين البيئات | Artifact promotion |
| بيئة محمية / موافقة | Protected environment / Approval |
| مصادقة OIDC للـ CI | OIDC federation |
| أقل صلاحية | Least privilege |
| التطوير على الفرع الرئيسي | Trunk-based development |
| حماية الفرع | Branch protection |
| رسائل الالتزام الاصطلاحية | Conventional Commits |
| الإصدار الدلالي | Semantic Versioning (SemVer) |
| مقاييس DORA الأربعة | DORA four key metrics |
| قائمة مكوّنات البرمجية | SBOM |
