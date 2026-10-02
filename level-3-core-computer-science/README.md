# LEVEL 3 — علوم الحاسوب الأساسية
## Core Computer Science

---

## 📍 أين أنا؟

```
✅ LEVEL 0  Absolute Foundations
✅ LEVEL 1  Programming + Computational Thinking
✅ LEVEL 2  Computer Systems
▶ LEVEL 3  Core Computer Science                   ← أنت هنا
  LEVEL 4  Software Engineering Foundations
  LEVEL 5  Building Real Software
  LEVEL 6  Professional Engineering
  LEVEL 7  Advanced Systems
  LEVEL 8  AI-Native Software Engineering
  LEVEL 9  Professional Capstone
```

**درجة النضج:** DEVELOPER (يبني ميزات بأدوات صحيحة).

> **ليس تحضيرًا لمقابلات.** لكل هيكل بيانات نسأل: ما المشكلة التي يحلها؟ ما العمليات التي يجعلها فعّالة؟ أين أراه في برمجيات حقيقية؟

---

## 🎯 ماذا يجب أن أعرف الآن؟

**قبل هذا المستوى:**
- Level 1: arrays, objects, functions, recursion (basic), loops.
- Level 2: memory (stack/heap/references), memory hierarchy, process isolation, Project 3.

**بعد هذا المستوى** يجب أن تستطيع:
- اختيار الهيكل الصحيح (Array / Map / Set / Stack / Queue / Tree / Heap / Graph) **بناءً على العمليات المطلوبة** وتبرير الاختيار.
- تقدير تعقيد كود بـ **Big-O** بالحدس (1 → 10 → 100 → 1000 عملية) واكتشاف `O(n²)` المخفي.
- التعرف على **الخوارزميات الأساسية** (بحث، فرز، اجتياز، تقسيم) ومتى تستخدم المدمج ومتى تفكر.
- شرح **ما المشكلة التي تحلها قاعدة البيانات** (من Level 0) الآن بالتفصيل: جداول، مفاتيح، علاقات.
- كتابة **SQL** بثقة: `SELECT/WHERE/ORDER BY/LIMIT/JOIN/GROUP BY/INSERT/UPDATE/DELETE`، ومعرفة الفرق بين JOINs، واكتشاف N+1.
- **تصميم** schema لـ User / Organization / Product / Order / OrderItem مع العلاقات الصحيحة.
- شرح **Index** بنموذج ذهني صحيح (B-Tree بشكل مبسّط)، قراءة `EXPLAIN`، ومعرفة المقايضات.
- شرح **Transaction** و**ACID** من مثال تحويل المال، ومعرفة متى تحتاجها.
- بناء **API مدعوم بقاعدة بيانات** (Project 4) بـ SQL خام أولًا.

---

## 📚 الوحدات

| # | الوحدة | المفاهيم | الحالة |
|---|---|---|---|
| 3.1 | Arrays & Hash Maps (Deep) | contiguous memory, index O(1), insert/delete cost, hash function, `Map`/`Object`, collisions (concept), when `includes` kills you | 📋 |
| 3.2 | Sets, Stacks, Queues | `Set` for dedup/membership, stack (call stack, undo, parsing), queue (task queues, BFS), deque | 📋 |
| 3.3 | Linked Lists | why they exist, O(1) insert at head, cache-unfriendly, LRU cache example | 📋 |
| 3.4 | Trees | hierarchy, DOM, file systems, JSON, binary trees, BST (concept), traversal (pre/in/post/level), B-Tree preview | 📋 |
| 3.5 | Heaps & Priority Queues | priority scheduling, top-K, job queues with priority | 📋 |
| 3.6 | Graphs | nodes/edges, adjacency list, BFS/DFS, dependency resolution, cycle detection, shortest path (concept) | 📋 |
| 3.7 | Algorithmic Thinking | decomposition, searching (linear/binary), sorting (what built-in does), traversal, recursion vs iteration, divide & conquer | 📋 |
| 3.8 | Big-O From Intuition | counting operations, O(1)/O(log n)/O(n)/O(n log n)/O(n²), space complexity, real software examples | 📋 |
| 3.9 | Algorithms That Matter | recognizing complexity in code, choosing structures, reducing work, precomputation, tradeoffs; what NOT to master | 📋 |
| 3.10 | Databases From Zero | why not files (revisited with proof), tables/rows/columns, primary/foreign keys, relationships (1:1, 1:N, N:M), constraints | 📋 |
| 3.11 | SQL From Zero | `SELECT`, `WHERE`, `ORDER BY`, `LIMIT`, `JOIN` (INNER/LEFT), `GROUP BY`/aggregates, `INSERT`, `UPDATE`, `DELETE`, N+1 problem | 📋 |
| 3.12 | Database Design | modeling User/Org/Product/Order/OrderItem, normalization (1NF–3NF pragmatically), naming, migrations | 📋 |
| 3.13 | Indexes | full scan vs index seek, B-Tree mental model, composite indexes, `EXPLAIN ANALYZE`, write cost, when NOT to index | 📋 |
| 3.14 | Transactions & ACID | transfer money, crash in the middle, `BEGIN/COMMIT/ROLLBACK`, ACID each letter, isolation levels (intro), connection pooling | 📋 |
| 🛠 | [Project 4: Database-backed API](../projects/README.md#project-4) | PostgreSQL, raw SQL, migrations, transactions, indexes | 📋 |
| ✔ | Checkpoint 3 | | 📋 |

---

## 🧠 النماذج الذهنية لهذا المستوى

```
Data structure choice = "What operations do I need to be fast?"

1 op → 10 → 100 → 1,000 → 1,000,000     "How does work grow with input?"

Database without index: scan everything.
Database with index:    find efficiently (at a write cost).

Step 1: subtract.  Step 2: add.  Crash between?  → Transaction.
```

---

## 🔁 ما الذي سيعود لاحقًا؟

| المفهوم هنا | يعود في |
|---|---|
| Hash maps / Sets | L5-M8 (cache keys), L7-M8 (performance) |
| Queues | L5-M9 (message queues), L7 |
| Trees / Graphs | L4 (dependency graphs), L6-M9 (module graphs) |
| Big-O | كل قرار أداء لاحق |
| Transactions | L5-M6 (concurrency), L5 payments, L7-M2 (distributed workflows) |
| Indexes | L7-M8 (performance), L7-M3 (replication) |

---

## ➡️ ما التالي؟

بعد Checkpoint 3 → **LEVEL 4 — Software Engineering Foundations**: الانتقال الكبير. علوم الحاسوب شرحت "كيف تعمل الأنظمة". الآن: "كيف يبني البشر الأنظمة ويطوّرونها" — SDLC، متطلبات، تصميم، اختبار، refactoring، legacy code.
