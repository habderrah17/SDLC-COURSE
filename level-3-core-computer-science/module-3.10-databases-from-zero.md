# Module 3.10 — قواعد البيانات من الصفر
## Databases From Zero: why not files (with proof), tables/rows/columns, keys, relationships, constraints — and your first PostgreSQL

> **المستوى:** Level 3 | **الموقع:** [10 من 14]
> **السابق:** [M3.9 — Algorithms That Matter](module-3.9-algorithms-that-matter.md) | **التالي:** [M3.11 — SQL From Zero](module-3.11-sql-from-zero.md)

---

## 1. المتطلبات
- [ ] خريطة Frontend/Backend/DB وTrust Boundary — [L0-M0.7](../level-0-absolute-foundations/module-07-database-api-web-app.md)
- [ ] ملف JSON كتخزين في Project 1/2، وسباق read-modify-write — [L1-M1.10](../level-1-programming/module-1.10-io.md), [Project 1](../projects/project-1-cli/README.md)
- [ ] العمليات معزولة، الملفات مشتركة، الذاكرة تضيع عند الإيقاف — [L2-M2.5](../level-2-computer-systems/module-2.5-process-deep-dive.md)
- [ ] `Map`/Set/Heap/B-Tree كمفاهيم — M3.1, M3.4

## 2. أهداف التعلّم
- إثبات (بالتجربة) **لماذا ملف JSON يفشل** كقاعدة بيانات: التزامن (كتابتان متداخلتان تفسدان الملف)، الحجم (قراءة كل شيء لتعديل سجل)، البحث (O(n) بلا فهرس)، الانهيار أثناء الكتابة (ملف نصفي)، التكامل (لا أحد يمنع `order.userId` لمستخدم غير موجود).
- شرح **ما قاعدة البيانات العلائقية**: عملية خادم منفصلة (L2-M2.5) تمتلك الملفات، تتكلم عبر TCP (L2-M2.9)، تقدّم جداول/صفوف/أعمدة بأنواع، فهارس، معاملات، وقيودًا تحمي البيانات **من كل التطبيقات**.
- تصميم جدول: **المفتاح الأساسي** (primary key)، **المفتاح الأجنبي** (foreign key)، `NOT NULL`, `UNIQUE`, `CHECK`, `DEFAULT`، وأنواع PostgreSQL الأساسية (`bigint`, `text`, `numeric` للمال، `timestamptz`, `boolean`, `jsonb`).
- نمذجة **العلاقات الثلاث**: 1:1، 1:N (FK في جهة N)، N:M (جدول وسيط) — على User/Organization/Product/Order/OrderItem.
- تشغيل PostgreSQL محليًا (Docker)، الاتصال بـ `psql` و`pg` من Node، وفهم `DATABASE_URL`، pool الاتصالات، ولماذا الاتصال مورد غالٍ (fd + عملية في الخادم).

---

## 3. شرح للمبتدئ

### لماذا ليس ملفًا؟ (الإثبات الذي وعدناك به في L0)
في Project 1 و2 خزّنت في JSON. كان ذلك صحيحًا لعملية واحدة ومستخدم واحد. أضف خادم HTTP (Project 3) وطلبين متزامنين:
1. **التزامن**: الطلب A يقرأ `todos.json`، الطلب B يقرأ النسخة نفسها، A يكتب (+1)، B يكتب (+1 على القديمة) → ضاع تحديث (L0-M0.7 read-modify-write). ومع كتابتين **متداخلتين** فعليًا قد ينتهي الملف بـ JSON مكسور (سترى هذا في §6).
2. **الحجم**: لتعديل سجل واحد تقرأ 500MB وتكتب 500MB. الذاكرة (L2-M2.3)، الزمن، والقرص.
3. **البحث**: "طلبات المستخدم 42" = مرور على الكل O(n)؛ لا بحث ثنائي بلا ترتيب، لا ترتيب بلا إعادة كتابة.
4. **الانهيار أثناء الكتابة**: `writeFile` يُقطع (OOM killer، انقطاع كهرباء) → ملف نصفي → **كل** البيانات ضاعت. (الحل الجزئي: اكتب لملف مؤقت ثم `rename` ذري — وهذا بالضبط ما تفعله DB بطرق أعقد.)
5. **التكامل**: لا شيء يمنع `{ orderId: 7, userId: 999 }` لمستخدم محذوف، أو سعرًا نصيًا، أو بريدًا مكررًا. كل تطبيق (API، سكربت تقارير، أداة دعم) يجب أن يعيد كتابة هذه القواعد — وسينسى واحد منها.
6. **المشاركة**: عمليتان أو خادمان (L2-M2.13 stateless، cluster) يحتاجان **مصدر حقيقة واحدًا** خارجهما.

### ما قاعدة البيانات؟
**عملية خادم** (مثل خادمك HTTP لكنها تتكلم بروتوكولها على منفذ 5432) تمتلك مجلدًا من الملفات (الصفحات 8KB — M3.4) ولا يلمسها أحد سواها. تقدّم لكل العملاء، عبر TCP، **عقدًا واحدًا**: جداول بأنواع وقيود، فهارس (B+Tree) للبحث O(log n)، **معاملات** (M3.14) تجعل الكتابات المتزامنة آمنة والانهيار غير مدمّر (write-ahead log)، وصلاحيات. كل ما كتبته في M3.1–M3.9 (hash maps، أشجار، فرز، دمج، طوابير) **يعيش داخلها** محسّنًا على مدى 30 عامًا — واجهتك إليه لغة واحدة: **SQL** (M3.11).

**علائقية** (relational): البيانات في **جداول** (علاقات رياضيًا)، كل **صف** (row/record) كيان، كل **عمود** (column) خاصية بنوع ثابت. الجداول تترابط بـ **مفاتيح**، لا بتداخل. سنستخدم **PostgreSQL**: مفتوح المصدر، صارم في الأنواع، المعيار الفعلي للـ backend الحديث. (البدائل: MySQL/MariaDB مشابهة؛ SQLite ملف واحد مدمج — ممتازة للأدوات والاختبارات؛ NoSQL لاحقًا في L7 عندما تفهم ما تتنازل عنه.)

### الجدول: الأنواع والقيود هي النقطة
```sql
CREATE TABLE users (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,   -- معرّف تسلسلي (M3.9)
  email       text        NOT NULL UNIQUE,                        -- لا تكرار، لا فراغ
  display_name text       NOT NULL CHECK (length(display_name) BETWEEN 1 AND 100),
  created_at  timestamptz NOT NULL DEFAULT now()                  -- دائمًا timestamptz (مع المنطقة)، أبدًا timestamp
);
```
- **Primary key** (PK): يعرّف الصف بشكل فريد وغير فارغ؛ يُنشئ فهرسًا تلقائيًا؛ الجداول الأخرى تشير إليه. استخدم `bigint identity` (أو UUIDv7 — M3.9)؛ لا `email` كـ PK (يتغيّر).
- **`NOT NULL`**: `NULL` = "مجهول" وليس 0 أو "" — ويفسد المقارنات (`NULL = NULL` ليس true). اجعل الأعمدة `NOT NULL` افتراضيًا وأضف `NULL` بقرار.
- **`UNIQUE`**: يمنع التكرار **ذريًا حتى تحت التزامن** — ما لم يستطع `includes` ولا فحص "اقرأ ثم أدرج" فعله (سباق!). الطريقة الصحيحة الوحيدة لـ "بريد فريد" هي قيد DB (+ فهرس وظيفي `lower(email)`).
- **`CHECK`**: قواعد الصف (`price_cents >= 0`, `status IN (...)`). **`DEFAULT`**: قيم تلقائية.
- **الأنواع**: `text` (لا `varchar(255)` بلا سبب)، `bigint` للأعداد والمعرّفات (لا `int` → يمتلئ عند 2.1 مليار)، **`numeric(12,2)` أو `bigint` بالسنتات للمال** (أبدًا `float`/`double` — L2-M2.1)، `timestamptz`، `boolean`، `jsonb` لبيانات شبه منظمة (مع الانضباط: ليس بديلًا عن الأعمدة)، `uuid`, `bytea`, `enum` (أو `text + CHECK` أسهل للتغيير).

### العلاقات الثلاث (وأين يذهب المفتاح الأجنبي)
**Foreign key** (FK): عمود يحمل PK صف في جدول آخر، مع قيد `REFERENCES` يجعل DB **ترفض** مرجعًا لصف غير موجود وتقرر ماذا يحدث عند الحذف (`ON DELETE RESTRICT` افتراضي آمن / `CASCADE` حذف الأبناء / `SET NULL`).
- **1:N** (الأكثر): مؤسسة لها عدة مستخدمين → FK في جهة **N**: `users.organization_id REFERENCES organizations(id)`. طلب له عدة بنود → `order_items.order_id`.
- **N:M**: منتج في عدة طلبات، طلب يحوي عدة منتجات → **جدول وسيط** `order_items(order_id, product_id, quantity, unit_price_cents)` بـ PK مركّب أو id خاص؛ غالبًا يحمل بيانات العلاقة نفسها (الكمية، **السعر وقت الشراء** — لا تعتمد على `products.price` الذي يتغيّر!). كذلك `user_roles(user_id, role_id)`.
- **1:1**: نادر؛ تقسيم جدول (ملف شخصي اختياري، بيانات حساسة بصلاحيات مختلفة): FK `UNIQUE` في أحد الطرفين.
القاعدة العامة (**التطبيع** normalization، تفصيلها في M3.12): كل حقيقة في مكان واحد؛ لا تكرر اسم العميل في كل طلب — اربط بـ `user_id`. الاستثناء المقصود: لقطات تاريخية (سعر البند، عنوان الشحن وقت الطلب).

### الاتصال من Node: `pg` وpool
الاتصال = TCP 3-way (+TLS) + مصادقة + **عملية خادم مخصصة** في PostgreSQL لكل اتصال (fork! L2-M2.5) ≈ عشرات ms وعدة MB. لذلك **Pool**: 5–20 اتصالًا مفتوحًا يُعاد استخدامها؛ `pool.query` يستعير ويعيد؛ عند الإغلاق `pool.end()` (الخطوة 4 من graceful shutdown L2-M2.5). الحد الأقصى في الخادم `max_connections` (100 افتراضيًا) **مشترك بين كل نسخ تطبيقك** (10 نسخ × 20 = 200 > 100 → `too many clients`). `DATABASE_URL=postgres://user:pass@host:5432/db?sslmode=verify-full` من البيئة (L0-M0.4 secrets)، و**`sslmode=verify-full` في الإنتاج** (L2-M2.11). الاستعلامات **دائمًا بمعاملات** `$1` (M3.11: حقن SQL).

---

## 4. النموذج الذهني

```
ملف JSON يفشل عند: تزامن (lost update/ملف مكسور) | حجم | بحث O(n) | انهيار أثناء الكتابة | تكامل | مشاركة بين عمليات
DB = عملية خادم تملك الملفات، TCP:5432، عقد واحد لكل العملاء: أنواع + قيود + فهارس + معاملات + صلاحيات
جدول = صفوف بأعمدة مُنمَّطة ; PK يعرّف ; FK يربط ويحمي ; NOT NULL/UNIQUE/CHECK/DEFAULT = قواعد تُفرض ذريًا
1:N → FK في جهة N | N:M → جدول وسيط (+بيانات العلاقة) | 1:1 → FK UNIQUE ; لقطات تاريخية مقصودة
Node: pg Pool (5–20)، $1 دائمًا، DATABASE_URL + verify-full، pool.end() عند الإغلاق، max_connections مشترك
```

## 5. الرسم التوضيحي

```mermaid
sequenceDiagram
    participant A as request A
    participant B as request B
    participant F as todos.json
    A->>F: read (count=5)
    B->>F: read (count=5)
    A->>F: write count=6
    B->>F: write count=6  ← lost update
    Note over A,F: with overlapping writes the file can end as "...}{..." (broken JSON)
```

```mermaid
erDiagram
    ORGANIZATIONS ||--o{ USERS : "has many"
    USERS ||--o{ ORDERS : "places"
    ORDERS ||--|{ ORDER_ITEMS : "contains"
    PRODUCTS ||--o{ ORDER_ITEMS : "appears in"
    ORGANIZATIONS { bigint id PK
                    text name }
    USERS { bigint id PK
            bigint organization_id FK
            text email UK
            timestamptz created_at }
    PRODUCTS { bigint id PK
               text name
               bigint price_cents
               int stock }
    ORDERS { bigint id PK
             bigint user_id FK
             text status
             timestamptz created_at }
    ORDER_ITEMS { bigint order_id PK, FK
                  bigint product_id PK, FK
                  int quantity
                  bigint unit_price_cents }
```

```mermaid
flowchart LR
    APP1["api #1 (pool 10)"] -->|"TCP 5432"| PG["PostgreSQL server process"]
    APP2["api #2 (pool 10)"] -->|"TCP 5432"| PG
    CRON["report script"] -->|"TCP 5432"| PG
    PG --> BE["one backend process per connection (max_connections=100)"]
    PG --> FILES["data dir: 8KB pages + WAL (only postgres touches these)"]
```

## 6. مثال بسيط

```typescript
// src/file-db-fails.ts — إثبات 1: lost update وملف مكسور بكتابات متزامنة على JSON
import { readFile, writeFile, mkdtemp } from "node:fs/promises"; import { join } from "node:path"; import { tmpdir } from "node:os";
const dir = await mkdtemp(join(tmpdir(), "filedb-")), file = join(dir, "counter.json");
await writeFile(file, JSON.stringify({ count: 0, pad: "x".repeat(200_000) }));   // ملف كبير نسبيًا ليظهر التداخل

async function increment() {                                                        // read-modify-write بلا قفل
  const data = JSON.parse(await readFile(file, "utf8")) as { count: number; pad: string };
  data.count++;
  await writeFile(file, JSON.stringify(data));
}
await Promise.all(Array.from({ length: 50 }, increment));                           // 50 "طلبًا" متزامنًا
try { console.log("count =", (JSON.parse(await readFile(file, "utf8")) as { count: number }).count, "(expected 50)"); }   // غالبًا 1–5: lost updates
catch (e) { console.log("file is BROKEN JSON:", (e as Error).message.slice(0, 60)); }   // أو JSON مكسور بكتابتين متداخلتين
// الحل الملفّي الجزئي: قفل + كتابة لملف مؤقت ثم rename ذري — أي أنك بدأت تكتب قاعدة بيانات. لا تفعل. استخدم واحدة.
```

```bash
# تشغيل PostgreSQL محليًا (Docker) + أول جلسة psql
docker run --name pg-course -e POSTGRES_PASSWORD=dev -e POSTGRES_DB=store -p 5432:5432 -d postgres:17
docker exec -it pg-course psql -U postgres -d store
# داخل psql:  \dt (الجداول)  \d users (وصف جدول)  \q (خروج)
```

```sql
-- schema.sql — الجداول الخمسة بقيودها (شغّله: docker exec -i pg-course psql -U postgres -d store < schema.sql)
CREATE TABLE organizations (
  id   bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL
);
CREATE TABLE users (
  id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  organization_id bigint NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  email           text   NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX users_email_unique ON users (lower(email));           -- فريد بلا حساسية لحالة الأحرف، يُفرض ذريًا
CREATE TABLE products (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name        text   NOT NULL,
  price_cents bigint NOT NULL CHECK (price_cents >= 0),                   -- المال بالسنتات، لا float
  stock       integer NOT NULL DEFAULT 0 CHECK (stock >= 0)               -- DB تمنع المخزون السالب حتى تحت التزامن
);
CREATE TABLE orders (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    bigint NOT NULL REFERENCES users(id),
  status     text   NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','shipped','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE order_items (                                                 -- N:M بين orders وproducts + بيانات العلاقة
  order_id         bigint NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id       bigint NOT NULL REFERENCES products(id),
  quantity         integer NOT NULL CHECK (quantity > 0),
  unit_price_cents bigint NOT NULL,                                        -- لقطة السعر وقت الشراء (مقصودة)
  PRIMARY KEY (order_id, product_id)
);
```

## 7. مثال كود

```typescript
// src/db.ts — الاتصال الصحيح من Node: pool، معاملات $1، أخطاء القيود، وإغلاق نظيف
import pg from "pg";                                                        // npm i pg && npm i -D @types/pg
import { pathToFileURL } from "node:url";
const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL ?? "postgres://postgres:dev@localhost:5432/store",
  max: 10,                                                                   // × عدد نسخ التطبيق ≤ max_connections
  idleTimeoutMillis: 30_000, connectionTimeoutMillis: 5_000,                // لا تنتظر اتصالًا إلى الأبد (مهلة تنازلية)
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: true } : undefined,   // verify في الإنتاج (L2-M2.11)
});
pool.on("error", e => console.error("idle client error", e));              // اتصال خامل انقطع — لا تُسقط العملية

// عرض توضيحي يعمل فقط عند تشغيل الملف مباشرة (الوحدات الأخرى تستورد pool بلا آثار جانبية — L1-M1.8)
async function demo() {
  const c = await pool.connect();                                           // اتصال واحد مستعار: كل التجربة داخل معاملة ثم ROLLBACK (لا نلوّث البيانات؛ M3.14)
  try {
    await c.query("BEGIN");
    const org = await c.query<{ id: number }>("INSERT INTO organizations (name) VALUES ($1) RETURNING id", ["Demo Org"]);
    const orgId = org.rows[0]!.id;
    const user = await c.query<{ id: number }>(
      "INSERT INTO users (organization_id, email) VALUES ($1, $2) RETURNING id", [orgId, "Ali@Example.com"]);
    console.log("user", user.rows[0]!.id);

    // القيود تعمل حتى لو نسي التطبيق: بريد مكرر بحالة أحرف مختلفة، FK لمؤسسة غير موجودة، مخزون سالب
    for (const [sql, params] of [
      ["INSERT INTO users (organization_id, email) VALUES ($1, $2)", [orgId, "ali@example.com"]],
      ["INSERT INTO users (organization_id, email) VALUES ($1, $2)", [9999, "new@example.com"]],
      ["INSERT INTO products (name, price_cents, stock) VALUES ($1, $2, $3)", ["Pen", 150, -1]],
    ] as const) {
      await c.query("SAVEPOINT s");                                         // خطأ داخل معاملة يُبطلها كلها — إلا إن تراجعت إلى savepoint (M3.14)
      try { await c.query(sql, [...params]); }
      catch (e) { const err = e as pg.DatabaseError; console.log(err.code, err.constraint ?? err.detail); await c.query("ROLLBACK TO SAVEPOINT s"); }
      // 23505 users_email_unique | 23503 users_organization_id_fkey | 23514 products_stock_check  ← رموز SQLSTATE: ستحوّلها إلى 409/422 في Project 4
    }
    // أبدًا: c.query(`SELECT * FROM users WHERE email = '${input}'`)  ← حقن SQL (M3.11). دائمًا $1.
    const rows = await c.query("SELECT id, email, created_at FROM users WHERE organization_id = $1 ORDER BY id", [orgId]);
    console.table(rows.rows);
  } finally { await c.query("ROLLBACK"); c.release(); }                     // التجربة لم تحدث؛ والاتصال عاد للـ pool
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { await demo(); } finally { await pool.end(); }                        // الخطوة 4 من الإغلاق المتدرّج (L2-M2.5)
}
```

## 8. مثال من العالم الحقيقي
- **SQLite** داخل كل هاتف ومتصفح (تاريخ Chrome/Firefox، iMessage): DB بملف واحد — حتى "التطبيقات الصغيرة" لا تستخدم JSON.
- **Stripe/Shopify/GitLab/Instagram**: PostgreSQL كمصدر الحقيقة؛ Instagram شهير بتوسيع PostgreSQL لمئات الملايين.
- **Prisma/Drizzle/Knex**: ORMs وquery builders تولّد SQL فوق `pg` — ستفهم ما تولّده بعد M3.11، ولهذا نبدأ بـ SQL خام في Project 4.
- **PgBouncer**: وسيط pool مشترك عندما يتجاوز عدد نسخ التطبيق × pool الحد.

## 9. مثال من الإنتاج
**حادثة "طلبات بمستخدم محذوف ومخزون سالب":** متجر على MongoDB بلا schema صارم (نفس المشكلة مع JSON): سكربت دعم حذف مستخدمين "تجريبيين" → 3k طلب بلا مالك تُسقط صفحة التقارير (`null.email`). وتحت حملة تخفيضات، فحص المخزون في التطبيق (`if (product.stock > 0)` ثم `stock - 1`) تعرّض لسباق → 40 عملية بيع لمخزون 25. الترحيل إلى PostgreSQL: `REFERENCES ... ON DELETE RESTRICT` منع حذف مستخدم له طلبات (السكربت فشل بوضوح بدل أن يفسد صامتًا)، و`CHECK (stock >= 0)` + `UPDATE products SET stock = stock - 1 WHERE id = $1 AND stock >= 1` (تحديث ذري — M3.14) أنهيا البيع الزائد. **الدرس:** القواعد التي تعيش في DB تُفرض على **كل** العملاء وتحت **كل** تزامن؛ القواعد في التطبيق تُفرض حيث تذكّر المطوّر وضعها.

## 10. مفاهيم خاطئة شائعة

| ❌ | ✅ |
|---|---|
| "ملف JSON يكفي لمشروع صغير" | يكفي لعملية واحدة بلا تزامن؛ خادم HTTP = تزامن فورًا. SQLite أصغر وأصح. |
| "القيود تبطئ؛ أتحقق في الكود" | التحقق في الكود لا يصمد أمام السباقات ولا السكربتات الأخرى؛ القيد يصمد. |
| "`NULL` = 0 أو فارغ" | NULL = مجهول؛ `= NULL` لا تعمل؛ `NOT NULL` افتراضيًا. |
| "خزّن المال بـ `float`" | أبدًا؛ `numeric` أو `bigint` سنتات. |
| "اتصال جديد لكل استعلام" | عملية خادم وfd لكل اتصال؛ pool دائمًا، وراقب `max_connections`. |
| "ORM يعفيني من فهم DB" | ORM يولّد SQL؛ من لا يفهمه يكتب N+1 ولا يقرأ الأخطاء. |

## 11. أخطاء شائعة
1. `timestamp` بدل `timestamptz`؛ `int` لمعرّفات ستتجاوز 2.1 مليار؛ `varchar(255)` تلقائيًا.
2. تكرار بيانات بدل FK (اسم العميل في كل طلب) — أو العكس: الاعتماد على `products.price` الحالي في طلبات قديمة.
3. `email UNIQUE` بدون `lower()` → `Ali@` و`ali@` حسابان.
4. `ON DELETE CASCADE` على كل شيء (حذف مستخدم يمسح طلباته المالية!).
5. نسيان `pool.end()` → العملية لا تخرج / اتصالات معلّقة في الخادم.
6. كلمة المرور في الكود/الريبو بدل `DATABASE_URL` في البيئة.

## 12. تمرين تصحيح

```sql
-- جدول "يعمل" لكن بعد 3 أشهر: طلبات بلا مالك، إجماليات خاطئة، وتقارير تختلف بين الفروع
CREATE TABLE orders (
  id        serial,
  user_id   int,
  user_name varchar(50),
  total     float,
  status    varchar(20) DEFAULT 'pending',
  created   timestamp DEFAULT now()
);
```

<details><summary>💡 الحل</summary>

1. **لا `PRIMARY KEY`** على `id` (serial وحده ليس مفتاحًا) → تكرارات ممكنة ولا فهرس.
2. **`user_id int` بلا `REFERENCES` وبلا `NOT NULL`** → طلبات لمستخدمين غير موجودين/NULL. أضف `bigint NOT NULL REFERENCES users(id)`.
3. **`user_name` مكرر** → يختلف عن `users` عند تغيير الاسم (نسختان من الحقيقة). احذفه (أو وثّقه كلقطة مقصودة إن كان كذلك).
4. **`total float`** → إجماليات خاطئة (0.1+0.2). `bigint` سنتات أو `numeric(12,2)`؛ والأفضل حسابه من `order_items` أو تخزينه مع قيد.
5. **`status varchar` بلا `CHECK`** → `'Paid'`, `'payed'`, `'done'` في التقارير. `text NOT NULL CHECK (status IN (...))`.
6. **`created timestamp`** (بلا منطقة) → "تختلف بين الفروع": كل خادم يفسّرها بتوقيته. `timestamptz NOT NULL`.
7. `serial` → `bigint GENERATED ALWAYS AS IDENTITY`؛ `int` → `bigint`.
</details>

## 13. تمرين معماري
Project 4 يبدأ: اكتب schema للمتجر (الجداول الخمسة أعلاه + `categories` شجرية بـ `parent_id` من M3.4 + `addresses`). لكل FK قرّر `ON DELETE` وبرّر (ماذا يحدث لطلبات مستخدم يطلب حذف حسابه؟ GDPR vs سجلات مالية — تلميح: soft delete/anonymize). ما القيود التي تحمي من: بيع زائد، سعر سالب، طلب بلا بنود (هل تستطيع DB منعه؟ لماذا صعب؟)، بريدين بحالة أحرف مختلفة. ACTRR + ERD بـ Mermaid.

## 14. الصلة بعصر AI
AI يولّد schemas بسرعة — وبأخطاء التمرين 12 بالضبط (`float` للمال، `timestamp`، FK مفقودة، CASCADE عشوائي). اطلب صراحةً: *"PostgreSQL، bigint identity، timestamptz، المال بالسنتات، NOT NULL افتراضيًا، كل FK مع ON DELETE مبرَّر، CHECK على الحالات"*، وراجع كل `CASCADE` يدويًا. والقيود في DB هي أفضل حماية ضد كود AI (أو بشري) ينسى قاعدة عمل: DB لا تنسى.

## 15–17. Master / Understand / Defer
- 🔴 لماذا الملف يفشل (الأسباب الستة، بتجربة)؛ DB = عملية خادم بعقد واحد؛ جدول/صف/عمود/نوع؛ PK/FK/NOT NULL/UNIQUE/CHECK/DEFAULT ولماذا تُفرض في DB؛ العلاقات الثلاث وأين يذهب FK؛ الأنواع الصحيحة (bigint، text، timestamptz، المال)؛ pool + `$1` + `DATABASE_URL`.
- 🟠 `ON DELETE` الخيارات؛ فهرس وظيفي `lower(email)`؛ رموز SQLSTATE (23505/23503/23514)؛ `max_connections` المشترك؛ لقطات تاريخية مقصودة؛ `jsonb` ومتى.
- ⚪ تفاصيل WAL/MVCC الداخلية (M3.14 يلمسها)؛ PgBouncer؛ التقسيم (partitioning)؛ NoSQL ومتى (L7).

## 18. الخلاصة
1. الملف يفشل عند التزامن والحجم والبحث والانهيار والتكامل والمشاركة — وأي حل لذلك هو إعادة كتابة DB.
2. DB عملية خادم تملك الملفات وتقدّم عقدًا واحدًا لكل العملاء عبر TCP: أنواع، قيود، فهارس، معاملات.
3. PK يعرّف، FK يربط ويحمي، `NOT NULL/UNIQUE/CHECK` قواعد تُفرض ذريًا تحت أي تزامن ومن أي عميل.
4. 1:N → FK في جهة N؛ N:M → جدول وسيط يحمل بيانات العلاقة (لقطة السعر)؛ 1:1 → FK فريد.
5. من Node: pool محدود، `$1` دائمًا، `DATABASE_URL` من البيئة مع TLS، `pool.end()` عند الإغلاق.

## 19. مراجع رسمية
- PostgreSQL — Tutorial: Getting Started & SQL Language: https://www.postgresql.org/docs/current/tutorial.html
- PostgreSQL — Constraints (PK, FK, UNIQUE, CHECK, NOT NULL): https://www.postgresql.org/docs/current/ddl-constraints.html
- PostgreSQL — Data Types (numeric, timestamptz, jsonb): https://www.postgresql.org/docs/current/datatype.html
- node-postgres (`pg`) — Pooling: https://node-postgres.com/features/pooling
- PostgreSQL Wiki — Don't Do This (common schema mistakes): https://wiki.postgresql.org/wiki/Don%27t_Do_This

## المصطلحات
| العربية | English |
|---|---|
| قاعدة بيانات علائقية | Relational database |
| جدول / صف / عمود | Table / Row / Column |
| مخطط | Schema |
| مفتاح أساسي | Primary key (PK) |
| مفتاح أجنبي | Foreign key (FK) |
| قيد | Constraint |
| فريد / غير فارغ / تحقق / افتراضي | UNIQUE / NOT NULL / CHECK / DEFAULT |
| تكامل مرجعي | Referential integrity |
| علاقة واحد لمتعدد / متعدد لمتعدد | One-to-many / Many-to-many |
| جدول وسيط (ربط) | Join (junction) table |
| تطبيع | Normalization |
| تحديث مفقود | Lost update |
| مجمّع اتصالات | Connection pool |
| استعلام بمعاملات | Parameterized query |
| سجل الكتابة المسبقة | Write-ahead log (WAL) |

> **التالي:** [Module 3.11 — SQL From Zero](module-3.11-sql-from-zero.md)
