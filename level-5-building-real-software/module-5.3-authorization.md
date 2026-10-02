# Module 5.3 — التفويض
## Authorization: authN ≠ authZ, RBAC & permissions, ownership, multi-tenancy & tenant isolation, authz at every layer, deny by default

> **المستوى:** Level 5 | **الموقع:** [3 من 13]
> **السابق:** [M5.2 — Authentication](module-5.2-authentication.md) | **التالي:** [M5.4 — Security](module-5.4-security.md)

---

## 1. المتطلبات
- [ ] المصادقة تعطينا `userId` موثوقًا لكل طلب — [M5.2](module-5.2-authentication.md)
- [ ] 404 مقابل 403، مقاومة التعداد — [M5.1](module-5.1-api-design.md)
- [ ] الطبقات http → application → domain، use case بـ ports — [L4-M4.5](../level-4-software-engineering-foundations/module-4.5-software-design.md)
- [ ] schema متعدد المؤسسات في Project 4 (`organizations`, `tenant_id` في الجداول) — [Project 4](../projects/project-4-db-api/README.md), [L3-M3.12](../level-3-core-computer-science/module-3.12-database-design.md)
- [ ] المعاملات و`SET LOCAL` — [L3-M3.14](../level-3-core-computer-science/module-3.14-transactions-acid.md)

## 2. أهداف التعلّم
- التفريق الحاسم: المصادقة تجيب "من؟"، التفويض يجيب "هل يحق لـ *هذا الفاعل* فعل *هذا الفعل* على *هذا المورد* في *هذا السياق*؟" — ولماذا معظم ثغرات الويب الخطيرة (Broken Access Control، #1 في OWASP Top 10) هي فشل في الجزء الثاني.
- نمذجة الصلاحيات: **RBAC** (أدوار → صلاحيات)، **الملكية** (resource ownership)، **السمات/السياق** (ABAC: الوقت، الحالة، المبلغ)، و**العلاقات** (ReBAC: عضو في فريق يملك المشروع) — واختيار الأبسط الذي يكفي.
- بناء **سياسة مركزية** واحدة (`can(actor, action, resource)`) نقية وقابلة للاختبار، و**فرضها في كل طبقة**: HTTP (خشن)، use case (دقيق، على المورد المحمّل)، DB (العزل: `tenant_id` في كل استعلام أو Row-Level Security).
- تطبيق **Deny by default**، ومنع **IDOR** (الوصول بتغيير المعرّف)، وعزل المستأجرين (tenant isolation) في الكود والاستعلامات والكاش والطوابير.
- التعامل مع رفع الصلاحيات (privilege escalation) الأفقي والعمودي، سجل التدقيق (audit log)، واختبار التفويض **سلبيًا** (ما يجب أن يُرفض).

---

## 3. شرح للمبتدئ

### "مسجّل الدخول" ليس إذنًا
بعد M5.2 كل طلب يحمل `userId` موثوقًا. الخطأ الأشهر: اعتبار ذلك كافيًا. `GET /v1/orders/o_123` — المستخدم `u_7` مسجّل الدخول، لكن `o_123` يخصّ `u_9`. إن أعاد الخادم الطلب فهذه **IDOR** (Insecure Direct Object Reference): الوصول بتغيير المعرّف — وهي أكثر الثغرات شيوعًا في APIs الحقيقية لأن المصادقة تُبنى مرة في middleware، أما التفويض فيجب أن يُتخذ **لكل مورد في كل عملية**، وهناك ينساه الناس. التفويض سؤال رباعي: **الفاعل** (من، وبأي أدوار/عضويات) × **الفعل** (read/update/cancel/refund) × **المورد** (هذا الطلب تحديدًا، بحالته ومالكه ومستأجره) × **السياق** (المبلغ، الوقت، MFA حديث؟).

### نماذج الصلاحيات — من الأبسط
- **الملكية (Ownership):** `resource.ownerId === actor.id`. تكفي لتطبيقات المستهلك البسيطة (طلباتي، ملفي).
- **RBAC:** أدوار (customer, support, admin) تُمنح **صلاحيات** (`order:read`, `order:refund`)؛ الفحص على الصلاحية لا الدور (`can("order:refund")` لا `role === "admin"`) حتى تُعاد توزيع الصلاحيات بلا تغيير كود. الأدوار **ضمن نطاق** (admin في مؤسسة A ليس admin في B).
- **ABAC/السياق:** قواعد على السمات: "يمكن للدعم استرداد طلب إن كان المبلغ ≤ 100 والطلب خلال 30 يومًا". RBAC + بضع قواعد سمات يغطّي 95% من الأنظمة.
- **ReBAC (علاقات):** "يمكنك تعديل المستند إن كنت محرّرًا في مجلده أو مالك المساحة" — Google Zanzibar؛ لمنتجات تعاونية معقّدة (L7). لا تبدأ به.
الاختيار: ابدأ بالملكية + RBAC بنطاق المستأجر، واكتب القواعد السياقية كدوال صريحة. **اكتب السياسة قبل الكود** كجدول: الفاعل/الفعل/المورد/الشرط — هو جزء من المتطلبات (L4-M4.2) وسيُراجَع في نموذج التهديد (M5.5).

### السياسة المركزية النقية
بدل `if (user.role === "admin" || order.userId === user.id)` مبعثرة في 40 handler، دالة واحدة: `can(actor, action, resource): Decision` — **نقية** (لا I/O؛ تستقبل المورد المحمّل)، **تُرجع سببًا** (للسجل والتصحيح، لا للعميل بالضرورة)، **deny by default** (أي فعل غير مذكور = مرفوض)، ومُختبرة بجدول حالات **سلبية** قبل الإيجابية. المعلومات التي تحتاجها (العضويات، الأدوار) تُحمَّل مرة مع الجلسة أو من كاش قصير العمر — واحذر: إبطال الكاش عند تغيير الدور (M5.8).

### الفرض في كل طبقة (defense in depth)
1. **HTTP/router (خشن):** هل الطلب مصادَق؟ هل للمستخدم الصلاحية **العامة** للمسار (`order:refund` أصلًا)؟ يرفض 90% من المحاولات مبكرًا.
2. **Use case (دقيق):** حمّل المورد **ضمن نطاق المستأجر**، ثم `can(actor, "cancel", order)` قبل أي أثر. هذا هو الفحص الذي لا يُغفَل — لأن المورد الآن معروف.
3. **DB (العزل):** كل استعلام على جدول متعدد المستأجرين يحمل `WHERE tenant_id = $1` — **دائمًا**، بلا استثناء، حتى في `UPDATE/DELETE` (ليس `WHERE id = $1` وحدها!). والأقوى: **Row-Level Security** في PostgreSQL: سياسة على الجدول تضيف الشرط تلقائيًا من `current_setting('app.tenant_id')` التي تضبطها المعاملة بـ `SET LOCAL` — فحتى الاستعلام المنسي محميّ. التطبيق يتصل بدور **بلا** `BYPASSRLS`.
4. **خارج DB:** مفاتيح الكاش تحمل `tenant_id` (M5.8)، رسائل الطابور تحمل الفاعل والمستأجر ويُعاد الفحص عند التنفيذ (M5.9)، الملفات في تخزين الكائنات بمسار المستأجر وروابط موقّعة (M5.13)، السجلات/التقارير تُفلتر.
الطبقات **تتكرّر عمدًا**: نسيان واحدة لا يكشف البيانات.

### 403 أم 404؟ وما يُسجَّل
للموارد الفردية: **404** حين لا يحق للفاعل *معرفة الوجود* (طلبات الآخرين) — يمنع تعداد المعرّفات. **403** حين الوجود معروف للفاعل والمنع في الفعل (عضو يرى المشروع ولا يحق له حذفه). ولا تكشف السبب التفصيلي للعميل ("يتطلّب دور admin في المؤسسة X") — لكن سجّله: كل **رفض** تفويض يُسجَّل بـ `actor, action, resource, reason, requestId` → سلسلة رفضات = مهاجم يستكشف (M5.4 كشف). وكل فعل حسّاس **ناجح** (استرداد، تغيير دور، تصدير بيانات) يذهب إلى **audit log** غير قابل للتعديل (من، ماذا، على ماذا، متى، من أي IP) — متطلب تنظيمي غالبًا، وأداة التحقيق الأولى.

### رفع الصلاحيات
**أفقي:** مستخدم → بيانات مستخدم آخر بنفس الدور (IDOR). **عمودي:** مستخدم → صلاحيات أعلى: تعديل `role` في جسم `PATCH /users/me` (mass assignment — قائمة بيضاء للحقول القابلة للكتابة!)، endpoint إداري بلا فحص (`/admin/*` "مخفي")، JWT بـ `role: admin` معدّل (توقيع غير مُتحقَّق منه)، أو **ثقة في العميل**: السعر/الخصم/`isAdmin` قادمة من المتصفح (L2-M2.13 "السعر المجاني"). القاعدة: كل ما يؤثر على الصلاحية أو المال يُحسب في الخادم من مصادر موثوقة فقط.

---

## 4. النموذج الذهني

```
   authN: من؟ (M5.2)  ──▶  authZ: هل يحق لـ (الفاعل × الفعل × المورد × السياق)؟
   سياسة واحدة نقية: can(actor, action, resource) → allow | deny(reason)؛ غير المذكور = deny
   تُفرض 3 مرات: HTTP (الصلاحية العامة) → use case (على المورد المحمَّل) → DB (tenant_id في كل WHERE / RLS)
   + كاش/طوابير/ملفات بنطاق المستأجر، 404 لما لا يحق معرفته، سجّل كل رفض وكل فعل حسّاس
```

---

## 5. الرسم التوضيحي

```mermaid
flowchart LR
  R[Request + session] --> H{HTTP: authenticated and has order:cancel?}
  H -->|no| D1[401 / 403]
  H -->|yes| U[Use case: load order WHERE id AND tenant_id]
  U -->|not found| D2[404]
  U --> P{"can(actor, cancel, order)?"}
  P -->|deny| D3[404 or 403 + log denial]
  P -->|allow| X[Execute in transaction] --> DB[(RLS: tenant policy on every row)]
  X --> A[Audit log: actor, action, resource, ip]
```

```
   مصفوفة سياسة (جزء من المتطلبات — تُكتب قبل الكود):
   الفعل            customer(owner)   support(tenant)        admin(tenant)   anyone
   order:read       own only          any in tenant          any in tenant   —
   order:cancel     own & pending     —                      any & pending   —
   order:refund     —                 ≤ 10000c & ≤ 30 days   any             —
   user:role:set    —                 —                      not self        —
```

---

## 6. مثال بسيط

```typescript
// src/idor.ts — نفس الـ handler: قبل (IDOR) وبعد (نطاق + سياسة)
type Order = { id: string; tenantId: string; userId: string; status: "pending" | "paid" | "cancelled"; totalCents: number };
type Repo = { byId(id: string): Promise<Order | null>; byIdInTenant(tenantId: string, id: string): Promise<Order | null> };
type Actor = { id: string; tenantId: string; permissions: Set<string> };

// ✗ مصادَق — لكن أي مستخدم يقرأ أي طلب بتغيير المعرّف (IDOR)؛ وعبر المستأجرين أيضًا
export async function getOrderBefore(repo: Repo, _actor: Actor, id: string) { return repo.byId(id); }

// ✓ تحميل ضمن المستأجر (DB layer) + قرار على المورد المحمَّل (use case layer) + 404 يخفي الوجود
export async function getOrderAfter(repo: Repo, actor: Actor, id: string): Promise<Order | "not_found"> {
  const order = await repo.byIdInTenant(actor.tenantId, id); if (!order) return "not_found";
  const allowed = order.userId === actor.id || actor.permissions.has("order:read:any");
  return allowed ? order : "not_found";                                                     // لا 403: لا نكشف أن o_123 موجود لغيره
}
```

---

## 7. مثال كود

```typescript
// src/policy.ts — السياسة المركزية النقية: deny by default، أسباب مسمّاة، قواعد سياقية صريحة. لا I/O هنا — تُختبر كجدول
export type Role = "customer" | "support" | "admin";
export type Actor = { id: string; tenantId: string; roles: ReadonlySet<Role> };
export type Order = { id: string; tenantId: string; userId: string; status: "pending" | "paid" | "shipped" | "cancelled" | "refunded"; totalCents: number; createdAt: Date };
export type UserRow = { id: string; tenantId: string; roles: ReadonlySet<Role> };
export type Action = { type: "order:read"; order: Order } | { type: "order:cancel"; order: Order } | { type: "order:refund"; order: Order; now: Date } | { type: "user:role:set"; target: UserRow; role: Role };
export type Decision = { allow: true } | { allow: false; reason: string; hide?: boolean };   // hide → 404 بدل 403

const ROLE_PERMS: Record<Role, ReadonlySet<string>> = {                                     // RBAC: الدور → صلاحيات (الفحص على الصلاحية)
  customer: new Set(["order:read:own", "order:cancel:own"]),
  support:  new Set(["order:read:any", "order:refund:limited"]),
  admin:    new Set(["order:read:any", "order:cancel:any", "order:refund:any", "user:role:set"]),
};
const has = (a: Actor, p: string) => [...a.roles].some(r => ROLE_PERMS[r].has(p));
const deny = (reason: string, hide = false): Decision => ({ allow: false, reason, hide });
const ALLOW: Decision = { allow: true };
const REFUND_LIMIT_CENTS = 10_000, REFUND_WINDOW_MS = 30 * 86_400_000;

export function can(actor: Actor, action: Action): Decision {
  if ("order" in action && action.order.tenantId !== actor.tenantId) return deny("cross-tenant", true);        // العزل أولًا، دائمًا، ومخفي
  switch (action.type) {
    case "order:read":
      if (has(actor, "order:read:any")) return ALLOW;
      if (has(actor, "order:read:own") && action.order.userId === actor.id) return ALLOW;
      return deny("not-owner", true);
    case "order:cancel": {
      const canOwn = has(actor, "order:cancel:own"), isOwner = action.order.userId === actor.id;
      if (!has(actor, "order:cancel:any") && !(canOwn && isOwner)) return deny(canOwn ? "not-owner" : "no-permission", !has(actor, "order:read:any") && !isOwner);   // مخفي إن لم يحق له حتى رؤيته
      if (action.order.status !== "pending") return deny("not-cancellable");                                   // قاعدة حالة (409 في HTTP، ليست تفويضًا بحتًا لكنها تعيش هنا لتُختبر معًا)
      return ALLOW;
    }
    case "order:refund":
      if (has(actor, "order:refund:any")) return ALLOW;
      if (!has(actor, "order:refund:limited")) return deny("no-permission");
      if (action.order.totalCents > REFUND_LIMIT_CENTS) return deny("over-refund-limit");                       // ABAC: سمة المبلغ
      if (action.now.getTime() - action.order.createdAt.getTime() > REFUND_WINDOW_MS) return deny("refund-window-passed");   // ABAC: سمة الزمن
      return ALLOW;
    case "user:role:set":
      if (action.target.tenantId !== actor.tenantId) return deny("cross-tenant", true);
      if (!has(actor, "user:role:set")) return deny("no-permission");
      if (action.target.id === actor.id) return deny("cannot-change-own-role");                                 // ضد رفع/إسقاط الذات
      return ALLOW;
    default: { const _exhaustive: never = action; return deny(`unknown-action:${JSON.stringify(_exhaustive)}`); }   // deny by default حتى للمستقبل
  }
}
```

```typescript
// src/policy.test.ts — الاختبارات السلبية أولًا: جدول "يجب أن يُرفض"
import { test } from "node:test"; import assert from "node:assert/strict";
import { can, type Actor, type Order, type Role } from "./policy.js";
const actor = (id: string, tenantId: string, ...roles: Role[]): Actor => ({ id, tenantId, roles: new Set(roles) });
const order = (o: Partial<Order> = {}): Order => ({ id: "o1", tenantId: "t1", userId: "u1", status: "pending", totalCents: 5000, createdAt: new Date("2026-01-01"), ...o });
const now = new Date("2026-01-10");
const denied: Array<[string, Actor, Parameters<typeof can>[1], string]> = [
  ["other customer cannot read (hidden)", actor("u2", "t1", "customer"), { type: "order:read", order: order() }, "not-owner"],
  ["admin of another tenant cannot read (hidden)", actor("a9", "t2", "admin"), { type: "order:read", order: order() }, "cross-tenant"],
  ["support cannot cancel", actor("s1", "t1", "support"), { type: "order:cancel", order: order() }, "no-permission"],
  ["owner cannot cancel shipped", actor("u1", "t1", "customer"), { type: "order:cancel", order: order({ status: "shipped" }) }, "not-cancellable"],
  ["support cannot refund over limit", actor("s1", "t1", "support"), { type: "order:refund", order: order({ totalCents: 20_000 }), now }, "over-refund-limit"],
  ["support cannot refund after 30 days", actor("s1", "t1", "support"), { type: "order:refund", order: order(), now: new Date("2026-03-01") }, "refund-window-passed"],
  ["customer cannot refund", actor("u1", "t1", "customer"), { type: "order:refund", order: order(), now }, "no-permission"],
  ["admin cannot change own role", actor("a1", "t1", "admin"), { type: "user:role:set", target: { id: "a1", tenantId: "t1", roles: new Set(["admin"]) }, role: "customer" }, "cannot-change-own-role"],
  ["admin cannot set roles across tenants", actor("a1", "t1", "admin"), { type: "user:role:set", target: { id: "x", tenantId: "t2", roles: new Set(["customer"]) }, role: "admin" }, "cross-tenant"],
];
for (const [name, a, act, reason] of denied) test(`DENY: ${name}`, () => { const d = can(a, act); assert.equal(d.allow, false); if (!d.allow) assert.equal(d.reason, reason); });
test("hidden denials map to 404: cross-tenant and non-owner reads", () => { const d1 = can(actor("u2", "t1", "customer"), { type: "order:read", order: order() }); const d2 = can(actor("a9", "t2", "admin"), { type: "order:read", order: order() }); assert.ok(!d1.allow && d1.hide); assert.ok(!d2.allow && d2.hide); });
const allowed: Array<[string, Actor, Parameters<typeof can>[1]]> = [
  ["owner reads own", actor("u1", "t1", "customer"), { type: "order:read", order: order() }],
  ["support reads any in tenant", actor("s1", "t1", "support"), { type: "order:read", order: order() }],
  ["owner cancels pending", actor("u1", "t1", "customer"), { type: "order:cancel", order: order() }],
  ["admin cancels anyone's pending", actor("a1", "t1", "admin"), { type: "order:cancel", order: order({ userId: "u5" }) }],
  ["support refunds small & recent", actor("s1", "t1", "support"), { type: "order:refund", order: order(), now }],
  ["admin refunds anything", actor("a1", "t1", "admin"), { type: "order:refund", order: order({ totalCents: 999_999 }), now: new Date("2027-01-01") }],
];
for (const [name, a, act] of allowed) test(`ALLOW: ${name}`, () => assert.equal(can(a, act).allow, true));
```

```typescript
// src/rls.int.test.ts — الطبقة الثالثة: Row-Level Security في PostgreSQL. حتى الاستعلام المنسي (بلا WHERE tenant_id) لا يرى صفوف مستأجر آخر
import { test, before, after } from "node:test"; import assert from "node:assert/strict"; import pg from "pg";
const admin = new pg.Pool({ connectionString: process.env.DATABASE_URL ?? "postgres://app:app@127.0.0.1:5432/store", max: 2 });
let appPool: pg.Pool;
before(async () => {
  await admin.query(`
    DROP TABLE IF EXISTS rls_orders; DROP ROLE IF EXISTS app_rls;
    CREATE TABLE rls_orders (id text PRIMARY KEY, tenant_id text NOT NULL, user_id text NOT NULL, total_cents int NOT NULL);
    INSERT INTO rls_orders VALUES ('o1','t1','u1',100),('o2','t1','u2',200),('o3','t2','u3',300);
    ALTER TABLE rls_orders ENABLE ROW LEVEL SECURITY; ALTER TABLE rls_orders FORCE ROW LEVEL SECURITY;
    CREATE POLICY tenant_isolation ON rls_orders USING (tenant_id = current_setting('app.tenant_id', true)) WITH CHECK (tenant_id = current_setting('app.tenant_id', true));
    CREATE ROLE app_rls LOGIN PASSWORD 'app' NOBYPASSRLS; GRANT SELECT, INSERT, UPDATE, DELETE ON rls_orders TO app_rls;`);
  appPool = new pg.Pool({ connectionString: "postgres://app_rls:app@127.0.0.1:5432/store", max: 2 });   // التطبيق يتصل بدور بلا BYPASSRLS
});
after(async () => { await appPool.end(); await admin.query("DROP TABLE rls_orders; DROP ROLE app_rls"); await admin.end(); });
async function asTenant<T>(tenantId: string, fn: (c: pg.PoolClient) => Promise<T>) {     // كل معاملة تُعلن مستأجرها؛ SET LOCAL يزول مع COMMIT/ROLLBACK (لا تسريب عبر الـ pool)
  const c = await appPool.connect(); try { await c.query("BEGIN"); await c.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]); const r = await fn(c); await c.query("COMMIT"); return r; } catch (e) { await c.query("ROLLBACK"); throw e; } finally { c.release(); }
}
test("a forgotten WHERE tenant_id still cannot see other tenants' rows", async () => {
  const t1 = await asTenant("t1", c => c.query("SELECT id FROM rls_orders ORDER BY id")); assert.deepEqual(t1.rows.map(r => r.id), ["o1", "o2"]);
  const t2 = await asTenant("t2", c => c.query("SELECT id FROM rls_orders")); assert.deepEqual(t2.rows.map(r => r.id), ["o3"]);
});
test("IDOR by id across tenants returns zero rows; UPDATE/DELETE by id alone affect nothing", async () => {
  const r = await asTenant("t2", c => c.query("SELECT * FROM rls_orders WHERE id = 'o1'")); assert.equal(r.rowCount, 0);
  const u = await asTenant("t2", c => c.query("UPDATE rls_orders SET total_cents = 0 WHERE id = 'o1'")); assert.equal(u.rowCount, 0);
  const d = await asTenant("t2", c => c.query("DELETE FROM rls_orders WHERE id = 'o1'")); assert.equal(d.rowCount, 0);
});
test("cannot insert a row for another tenant (WITH CHECK); no tenant set → sees nothing", async () => {
  await assert.rejects(asTenant("t2", c => c.query("INSERT INTO rls_orders VALUES ('o9','t1','u9',1)")), /row-level security/);
  const c = await appPool.connect(); try { const r = await c.query("SELECT count(*)::int AS n FROM rls_orders"); assert.equal(r.rows[0].n, 0); } finally { c.release(); }   // deny by default على مستوى DB
});
```

```typescript
// src/enforce.ts — ربط الطبقات: middleware خشن + use case دقيق + تسجيل الرفض + audit للأفعال الحسّاسة
import { can, type Actor, type Action, type Order } from "./policy.js";
export type AuthzLogger = { denied(e: { actorId: string; action: string; resourceId?: string; reason: string; requestId: string }): void; audit(e: { actorId: string; action: string; resourceId: string; requestId: string; meta?: unknown }): void };
export class HttpError extends Error { constructor(public status: number, message: string) { super(message); } }

export function requirePermissionHint(actor: Actor, action: Action["type"]) {        // الطبقة 1: رفض مبكر لمن لا يملك الصلاحية العامة إطلاقًا (ليس بديلًا عن can على المورد)
  const anyRoleCould: Record<Action["type"], boolean> = { "order:read": true, "order:cancel": [...actor.roles].some(r => r === "customer" || r === "admin"), "order:refund": [...actor.roles].some(r => r === "support" || r === "admin"), "user:role:set": actor.roles.has("admin") };
  if (!anyRoleCould[action]) throw new HttpError(403, "Forbidden");
}
export function authorize(actor: Actor, action: Action, log: AuthzLogger, requestId: string) {   // الطبقة 2: على المورد المحمَّل، داخل use case، قبل أي أثر
  const d = can(actor, action);
  if (!d.allow) { const resourceId = "order" in action ? action.order.id : action.target.id; log.denied({ actorId: actor.id, action: action.type, resourceId, reason: d.reason, requestId }); throw new HttpError(d.hide ? 404 : d.reason === "not-cancellable" ? 409 : 403, d.hide ? "Not found" : "Forbidden"); }
}
export async function refundOrder(deps: { loadOrder: (tenantId: string, id: string) => Promise<Order | null>; doRefund: (o: Order) => Promise<void>; log: AuthzLogger; now: () => Date }, actor: Actor, orderId: string, requestId: string) {
  const order = await deps.loadOrder(actor.tenantId, orderId); if (!order) throw new HttpError(404, "Not found");   // الطبقة 3: التحميل ضمن المستأجر
  authorize(actor, { type: "order:refund", order, now: deps.now() }, deps.log, requestId);
  await deps.doRefund(order);
  deps.log.audit({ actorId: actor.id, action: "order:refund", resourceId: order.id, requestId, meta: { totalCents: order.totalCents } });   // audit للفعل الحسّاس الناجح
}
```

```bash
node --import tsx --test src/policy.test.ts                     # 16 pass (9 deny + 1 hide + 6 allow)
DATABASE_URL=postgres://app:app@127.0.0.1:5432/store node --import tsx --test src/rls.int.test.ts   # 3 pass
# فحص آلي لـ IDOR في CI (P5): لكل endpoint بمعرّف، استدعِه بجلسة مستخدم آخر → يجب 404/403، أبدًا 200
```

---

## 8. مثال من العالم الحقيقي
تطبيق فواتير: `GET /invoices/{id}/pdf` كان يتحقق من الجلسة فقط. باحث غيّر الرقم من 10452 إلى 10451 وحمّل فاتورة شركة أخرى بعنوانها وبنودها؛ المعرّفات تسلسلية (`serial`) فجمع 50k فاتورة في ساعة بسكربت. التصحيح استغرق يومًا (تحميل ضمن المستأجر + سياسة)، لكن الإبلاغ القانوني عن تسريب البيانات وتدقيق كل endpoint استغرق شهرين. ثلاثة دروس من ثلاث وحدات: معرّفات مُعتِمة (M5.1)، سياسة على المورد (هنا)، وRLS كشبكة أمان أخيرة.

## 9. مثال من الإنتاج
SaaS متعدد المستأجرين مع كاش Redis للتقارير: مفتاح الكاش `report:monthly:2026-01` بلا `tenant_id` — أول مستأجر يطلب التقرير يملؤه، والتالي يحصل على **تقرير غيره** لمدة TTL. لا IDOR ولا SQL خاطئ؛ العزل تسرّب من طبقة لم يفكّر فيها أحد. الإصلاح: دالة واحدة لبناء المفاتيح تُلزم `tenantId` كمعامل أول (`key(tenantId, ...parts)`)، واختبار يرفض أي `redis.set` بمفتاح بلا بادئة مستأجر، ومراجعة نفس الشيء في الطوابير والملفات والسجلات. **العزل خاصية للنظام كله، لا لـ SQL وحده.**

---

## 10. مفاهيم خاطئة شائعة
1. **"middleware المصادقة يكفي."** يثبت الهوية؛ القرار على المورد يحدث في كل use case.
2. **"الأدوار كافية."** الفحص على الصلاحية لا الدور، وضمن نطاق المستأجر، ومع الملكية والسياق.
3. **"403 أوضح للمستخدم من 404."** للموارد الفردية 403 يؤكّد الوجود ويُسهّل التعداد.
4. **"RLS يُبطئ ويُعقّد."** تكلفته شرط مفهرس إضافي؛ وتعقيده أقل من تدقيق 400 استعلام يدويًا بعد تسريب.
5. **"المعرّفات العشوائية (UUID) تمنع IDOR."** تُصعّب التخمين فقط؛ المعرّف قد يتسرّب (روابط، سجلات، ردود أخرى). التفويض على كل مورد.
6. **"لن يعرف أحد endpoint الإداري."** الأمن بالغموض ليس تفويضًا.

## 11. أخطاء شائعة
1. `WHERE id = $1` بلا `tenant_id` في `UPDATE/DELETE` (القراءات مُؤمَّنة والكتابات لا).
2. Mass assignment: `UPDATE users SET ... = $body` فيصل `role`/`tenant_id`/`isVerified` من العميل — قائمة بيضاء للحقول.
3. فحص التفويض **بعد** تنفيذ جزء من العمل (الإرسال ثم الفحص) أو داخل الواجهة فقط (إخفاء الزر ≠ منع).
4. كاش قرارات/أدوار بلا إبطال عند تغيير الدور (المطرود يبقى admin حتى انتهاء TTL).
5. رسائل طابور/وظائف مؤجّلة تُنفَّذ بدور النظام بلا إعادة فحص الفاعل الأصلي.
6. تمرير `tenantId` من **الطلب** (header/body/query) بدل من **الجلسة**.
7. endpoints "داخلية" بلا مصادقة لأنها "خلف الشبكة" (SSRF في M5.4 يصل إليها).
8. غياب الاختبارات السلبية: الاختبارات تثبت أن المالك يستطيع، لا أن غيره لا يستطيع.

## 12. تمرين تصحيح
بلاغ: عميل في مؤسسة A يرى في صفحة "طلباتي" طلبًا لا يعرفه، مرة كل بضعة أيام، ثم يختفي عند التحديث.
1. **دليل:** الطلب الغريب يخصّ مؤسسة B؛ السجل يُظهر أن الاستعلام `SELECT … WHERE tenant_id = $1` صحيح؛ لكن `$1` جاء من `current_setting('app.tenant_id')`؛ التطبيق يضبطه بـ `SET app.tenant_id` (بلا `LOCAL`) في بداية الطلب.
2. **فرضية:** `SET` بلا LOCAL يبقى على **الاتصال** بعد عودته إلى الـ pool؛ طلب تالٍ من مؤسسة A أخذ نفس الاتصال قبل أن يضبط قيمته (مسار استثنائي يتخطّى الضبط عند الخطأ المبكر) → يرى B.
3. **تجربة:** استنساخ: اتصالان في pool، طلب B ثم مسار استثنائي لـ A → تسريب. مؤكّد.
4. **الإصلاح:** `SET LOCAL` داخل معاملة فقط (يزول مع COMMIT/ROLLBACK)، أو `set_config(…, true)`؛ `RESET ALL` عند إعادة الاتصال للـ pool؛ RLS بـ `FORCE` + دور بلا BYPASSRLS؛ اختبار تكامل يتعمّد مسارًا استثنائيًا ثم يقرأ (كما في §7).
5. **أين أيضًا؟** أي حالة لكل-طلب على مورد مشترك: متغيرات على اتصال DB، `AsyncLocalStorage` مفقود السياق، كاش ذاكرة بمفتاح بلا مستأجر.

## 13. تمرين معماري
اكتب **مصفوفة السياسة** لـ Project 5 كاملة (الفاعلون: customer/support/admin/system؛ الموارد: users, orders, products, sessions, reports، والأفعال)، ثم: (1) `policy.ts` نقية مع اختبارات سلبية لكل خلية "—"؛ (2) أين تُفرض كل قاعدة (HTTP/use case/DB) ولماذا تتكرّر؛ (3) خطة RLS: الجداول، السياسات، دور التطبيق، كيف تضبط `app.tenant_id` في `withTransaction` من L3-M3.14 بحيث **يستحيل** تنفيذ استعلام بلا مستأجر؛ (4) audit log: schema (append-only، من يستطيع القراءة؟)، ما يُسجَّل، الاحتفاظ؛ (5) اختبار IDOR آلي يمرّ على كل مسار بمعرّف بجلستين؛ (6) ACTRR: RLS مقابل الاعتماد على الكود وحده، وRBAC مقابل ReBAC لميزة "مشاركة الطلب مع زميل".

## 14. الصلة بعصر AI
التفويض هو ما يُنتجه AI بثغرات بصمت: handlers صحيحة وظيفيًا تفحص الجلسة فقط، `byId` بلا مستأجر، `UPDATE` بكل حقول الجسم. السياسة المركزية + الاختبارات السلبية + RLS تجعل كود AI **محكومًا**: حتى لو نسي، DB ترفض والاختبار يحمرّ. في L8 ستُلزم كل تفويض لـ AI بـ "لا استعلام على جدول متعدد المستأجرين خارج `asTenant`" كقيد معماري قابل للفحص آليًا (lint/grep). ووكلاء AI الذين يعملون نيابة عن مستخدمين يحتاجون **نفس** نموذج التفويض (يتصرّفون بصلاحيات الفاعل لا بصلاحيات النظام) — خلط هذا هو مصدر "confused deputy" في L8-M8.9.

## 15–17. Master / Understand / Defer
- 🔴 الرباعية فاعل×فعل×مورد×سياق؛ IDOR وأفقي/عمودي؛ مصفوفة سياسة قبل الكود؛ `can()` نقية بـ deny by default وأسباب؛ RBAC على الصلاحيات بنطاق المستأجر + ملكية + قواعد سياقية؛ الفرض في HTTP/use case/DB وتكراره؛ `tenant_id` في كل WHERE بما فيها UPDATE/DELETE؛ `tenantId` من الجلسة لا الطلب؛ قائمة بيضاء للحقول القابلة للكتابة؛ 404 لما لا يحق معرفته؛ تسجيل الرفض وaudit log؛ اختبارات سلبية.
- 🟠 RLS بـ `SET LOCAL`/`set_config(…, true)` ودور بلا BYPASSRLS؛ العزل في الكاش/الطوابير/الملفات؛ إبطال كاش الأدوار؛ ABAC؛ `requirePermissionHint` كتحسين مبكر لا بديل.
- ⚪ ReBAC/Zanzibar (SpiceDB/OpenFGA)، محرّكات سياسات خارجية (OPA/Cedar)، تفويض مفوَّض (OAuth scopes بتفصيل)، XACML.

## 18. الخلاصة
1. المصادقة تعطي الهوية؛ التفويض قرار لكل مورد في كل عملية — غيابه (IDOR/Broken Access Control) هو الثغرة #1.
2. سياسة واحدة نقية `can(actor, action, resource)`، deny by default، تُختبر سلبيًا أولًا.
3. تُفرض ثلاث مرات: HTTP، use case على المورد المحمَّل ضمن المستأجر، DB (`tenant_id` دائمًا / RLS) — والكاش والطوابير والملفات بنطاق المستأجر.
4. 404 لما لا يحق معرفته، لا تفاصيل للعميل، سجّل كل رفض وكل فعل حسّاس.
5. كل ما يؤثر على الصلاحية أو المال يُحسب في الخادم من الجلسة، لا من الطلب.

## 19. مراجع رسمية
- OWASP Top 10 — A01 Broken Access Control: https://owasp.org/Top10/A01_2021-Broken_Access_Control/
- OWASP — Authorization Cheat Sheet; IDOR Prevention: https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html , https://cheatsheetseries.owasp.org/cheatsheets/Insecure_Direct_Object_Reference_Prevention_Cheat_Sheet.html
- PostgreSQL — Row Security Policies, `set_config`: https://www.postgresql.org/docs/current/ddl-rowsecurity.html , https://www.postgresql.org/docs/current/functions-admin.html#FUNCTIONS-ADMIN-SET
- NIST — RBAC model: https://csrc.nist.gov/projects/role-based-access-control
- Google — Zanzibar (ReBAC paper, for later): https://research.google/pubs/zanzibar-googles-consistent-global-authorization-system/

## المصطلحات
| العربية | English |
|---|---|
| تفويض / تحكّم في الوصول | Authorization / Access control |
| تحكّم في الوصول مكسور | Broken Access Control |
| مرجع كائن مباشر غير آمن | IDOR |
| رفع صلاحيات أفقي / عمودي | Horizontal / Vertical privilege escalation |
| تحكّم قائم على الأدوار / السمات / العلاقات | RBAC / ABAC / ReBAC |
| صلاحية | Permission |
| ملكية المورد | Resource ownership |
| تعدّد المستأجرين / عزل المستأجر | Multi-tenancy / Tenant isolation |
| رفض افتراضي | Deny by default |
| سياسة مركزية | Central policy |
| أمن الصفوف | Row-Level Security (RLS) |
| دفاع في العمق | Defense in depth |
| إسناد جماعي (ثغرة) | Mass assignment |
| سجل التدقيق | Audit log |
| نائب مرتبك | Confused deputy |
