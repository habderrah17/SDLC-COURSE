# التحديات — Challenges

> التحديات **مدمجة داخل الوحدات** (كل وحدة فيها Debugging Exercise وArchitecture Exercise). هذا فهرس عرضي يجمعها حسب النوع والمستوى، ليتمكن المتعلم من **التدرّب المركّز** على مهارة واحدة.

---

## 1. تحديات التصحيح (Debugging Challenges)

| المستوى | النوع | أمثلة | أين |
|---|---|---|---|
| Beginner | syntax bug, logic bug, type bug | exit code يُبتلع، مسار نسبي، out of memory | L0 (كل وحدة), L1 |
| Intermediate | API bug, DB bug, async bug | HTML كـ JSON، N+1، `await` في loop، promise غير معالجة | L2, L3 |
| Advanced | race condition, cache bug, authorization bug | read-modify-write، stale cache، IDOR | L5 |
| Professional | distributed failure, production latency, partial outage | webhook مكرر، retry storm، DB connection exhaustion | L7 |

**المنهجية الثابتة:** Observe → Evidence → Hypothesis → Experiment → Conclusion. **حدّد الطبقة أولًا.**

---

## 2. تحديات المعمارية (Architecture Challenges)

```
"One server, one DB, 100 users."       (L0–L3)
"100,000 users."                       (L5)
"1 million users."                     (L7)
```

لكل مرحلة: ما ينكسر؟ ما يتغير؟ ما لا يحتاج تغييرًا (ولماذا لا تغيّره)؟

---

## 3. تحديات مراجعة الكود (Code Review Challenges) — L4, L6

كود معيب عمدًا. تراجعه. ثم تقرأ **مراجعة مهندس أول (Senior Engineer Review)** وتقارن.

- دالة بأسماء مضللة وآثار جانبية خفية
- وحدة بـ coupling عالٍ
- خدمة بثغرة authz
- تغيير نظام يكسر عقد API

---

## 4. تحديات تصميم الأنظمة (System Design Challenges) — L7

| التحدي | التركيز |
|---|---|
| URL shortener | hashing, read-heavy, caching, redirects |
| Notification system | fan-out, queues, preferences, retries, idempotency |
| File upload service | large files, async processing, storage, virus scan, signed URLs |
| Payment workflow | transactions, idempotency, external provider failure, reconciliation |
| Chat system | real-time, ordering, presence, delivery guarantees |

كلها بعملية الـ 11 خطوة.

---

## 5. تحديات الأمان (Security Challenges) — L5

| السيناريو | السؤال |
|---|---|
| مستخدم يعدّل ID مستخدم آخر | ما الثغرة؟ لماذا تحدث؟ كيف نصلحها؟ |
| مستخدم يصل إلى tenant آخر | |
| reset token يُستخدم مرتين | |
| endpoint يسرّب stack traces | |
| رفع ملف يقبل محتوى تنفيذيًا | |

---

## 6. تحديات الفشل (Failure Challenges) — L5, L7

| الفشل | السلوك اللائق المطلوب |
|---|---|
| قاعدة البيانات بطيئة | timeouts, degraded mode, no cascading |
| Redis غير متاح | fallback to DB, not crash |
| مزوّد البريد معطل | queue + retry, user not blocked |
| webhook مكرر | idempotent processing |
| worker ينهار | job re-queued, no partial side effects |
| network timeout | treat as unknown, idempotent retry |

---

## 7. تحديات الأداء (Performance Challenges) — L3, L7

لكل تحدٍّ السؤال الوحيد: **"ما العنق الزجاجي؟"** — CPU / Memory / Network / Database / Cache / Serialization. **قِس قبل أن تخمّن.**
