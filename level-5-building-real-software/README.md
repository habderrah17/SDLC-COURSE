# LEVEL 5 — بناء برمجيات حقيقية
## Building Real Software

---

## 📍 أين أنا؟

```
✅ LEVEL 0–4
▶ LEVEL 5  Building Real Software                  ← أنت هنا
  LEVEL 6  Professional Engineering
  LEVEL 7  Advanced Systems
  LEVEL 8  AI-Native Software Engineering
  LEVEL 9  Professional Capstone
```

**درجة النضج:** ENGINEER → **PROFESSIONAL ENGINEER** (يشغّل ويطوّر).

> **أطول مستوى عمليًا.** مشروعان كبيران (5 و6) يأخذانك من "API يعمل" إلى "backend بمواصفات إنتاج".

---

## 🎯 ماذا يجب أن أعرف الآن؟

**قبل هذا المستوى:**
- HTTP بعمق (L2-M12), Transactions (L3-M14), Testing (L4-M11), Requirements (L4-M2), Project 4.

**بعد هذا المستوى** يجب أن تستطيع:
- **تصميم REST API** احترافي: resources, methods, status codes, pagination, filtering, sorting, versioning, idempotency, errors.
- بناء **Authentication** صحيحة (hashing, sessions vs JWT, cookies flags) و**Authorization** (roles, permissions, ownership, tenant isolation).
- التفكير كمهاجم: **threat, attacker, asset, trust boundary**؛ منع **XSS, CSRF, SQLi, SSRF, IDOR**؛ إدارة الأسرار.
- إجراء **threat modeling** (STRIDE) لميزة قبل بنائها.
- اكتشاف ومنع **race conditions** في منطق العمل (locks, optimistic/pessimistic concurrency, idempotency).
- شرح تشريح نظام إنتاج: **App → DB → Cache → Queue → Worker → External Services**.
- تصميم **caching** (ماذا، أين، كم، invalidation) و**background jobs** (producer/queue/consumer).
- شرح **ما يعني النشر** فعلًا، و**Docker** (image/container/volume/network)، و**CI/CD**، ومفاهيم **Cloud** بشكل مستقل عن المزوّد.

---

## 📚 الوحدات

| # | الوحدة | المفاهيم | الحالة |
|---|---|---|---|
| 5.1 | API Design | REST, resources & naming, HTTP methods semantics, status codes, error format, pagination (offset/cursor), filtering, sorting, versioning, idempotency keys, OpenAPI | 📋 |
| 5.2 | Authentication | identity, passwords (argon2/bcrypt, never encrypt), sessions vs JWT, cookies (HttpOnly/Secure/SameSite), token refresh, OAuth/OIDC (concept), MFA (concept), rate limiting | 📋 |
| 5.3 | Authorization | authN ≠ authZ, RBAC, permissions, resource ownership, multi-tenancy & tenant isolation, authz at every layer, deny by default | 📋 |
| 5.4 | Security From Beginner to Professional | threat/attacker/asset/trust boundary, least privilege, input validation, output encoding, secrets, encryption at rest/in transit, XSS, CSRF, SQL injection, SSRF, IDOR, dependency risks | 📋 |
| 5.5 | Threat Modeling | Assets → Entry points → Trust boundaries → Threats → Mitigations; STRIDE; data flow diagrams; threat model for Project 5 | 📋 |
| 5.6 | Concurrency in Business Logic | race conditions (double booking, double spend), atomicity, DB locks (`SELECT ... FOR UPDATE`), optimistic concurrency (version column), deadlocks, idempotency | 📋 |
| 5.7 | Anatomy of a Production System | Application → Database → Cache → Queue → Worker → External Services; connection pools; health checks; graceful shutdown; config | 📋 |
| 5.8 | Caching | why, what, where (browser/CDN/app/DB), TTL, invalidation strategies, cache-aside, stampede, consistency tradeoffs | 📋 |
| 5.9 | Queues & Background Jobs | why queue work, producer/queue/consumer, at-least-once delivery, idempotent consumers, retries/DLQ, file upload example | 📋 |
| 5.10 | Deployment From Zero | what deployment means, server, process manager, container, environments, DNS, HTTPS/certs, DB migrations in deploy, load balancer, rollback | 📋 |
| 5.11 | Docker | what problem it solves, image vs container, layers, Dockerfile, filesystem, networking (0.0.0.0!), volumes, Compose for app+db+redis+worker | 📋 |
| 5.12 | CI/CD | Code → Build → Test → Artifact → Deploy; pipelines, exit codes (!), environments, secrets in CI, deploy strategies (rolling/blue-green/canary — concept) | 📋 |
| 5.13 | Cloud (Provider-Agnostic) | compute, storage (object/block), managed DB, network/VPC, load balancer, secrets manager, monitoring; cost awareness | 📋 |
| 🛠 | [Project 5: Authenticated Application](../projects/README.md#project-5) | | 📋 |
| 🛠 | [Project 6: Production-style Backend](../projects/README.md#project-6) | | 📋 |
| ✔ | Checkpoint 5 | | 📋 |

---

## 🧠 النماذج الذهنية لهذا المستوى

```
Assets → Entry points → Trust boundaries → Threats → Mitigations

Application → Database → Cache → Queue → Worker → External Services

User uploads file → API accepts → queue → worker processes → notify

Code → Build → Test → Artifact → Deploy
```

---

## 🔒 تحديات الأمان في هذا المستوى

- مستخدم يعدّل `userId` ويرى بيانات غيره (IDOR)
- مستخدم يصل إلى بيانات tenant آخر
- reset token يُستخدم مرتين
- endpoint يسرّب stack trace
- رفع ملف يقبل محتوى تنفيذيًا

## 💥 تحديات الفشل في هذا المستوى

- قاعدة البيانات بطيئة
- Redis غير متاح
- مزوّد البريد معطل
- webhook مكرر
- worker ينهار في منتصف المعالجة
- network timeout

---

## ➡️ ما التالي؟

بعد Checkpoint 5 → **LEVEL 6 — Professional Engineering**: كيف يعمل المهندسون في فرق — code review, RFCs, ADRs, observability, incident response, product thinking, architecture styles.
