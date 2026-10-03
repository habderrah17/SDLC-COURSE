# Project 7 — تمرين نظام موزّع: ثلاث خدمات، شبكة تفشل، ولا خصم مزدوج
## Project 7 — Distributed System Exercise: Orders + Payments + Notifications over HTTP and a queue, with injected partial failure, idempotency, circuit breaking, sagas, and distributed tracing

> **المستوى:** Level 7 | **بعد:** [M7.1](../../level-7-advanced-systems/module-7.1-distributed-systems-1-2-10.md)–[M7.9](../../level-7-advanced-systems/module-7.9-microservices-in-depth.md) و[Project 6](../project-6-production-backend/README.md) | **قبل:** [Checkpoint 7](../../level-7-advanced-systems/checkpoint-7.md)
> **المدة المقترحة:** 25–35 ساعة صافية على خمس مراحل.
> **قاعدة:** هذا المشروع **ليس** "ابنِ microservices" — هو "اجعل ثلاث عمليات تتواصل عبر شبكة تفشل وتبقى الحالة صحيحة". تبدأ بثلاث خدمات تعمل بشكل ساذج، ثم تحقن الفشل **بنفسك** (Toxiproxy أو وكيل فوضى تكتبه)، وتُثبت كل إصلاح باختبار يُعيد إنتاج العطل. كل الأرقام (مهل، عتبات، سعات) تُكتب مع مبرّرها. AI مفيد لتوليد سيناريوهات فشل إضافية ومراجعة الـ saga **بعد** أن تمرّ اختباراتك.

---

## 1. المشكلة (Problem)

Project 6 جعل `storeapi` إنتاجيًا — لكنه عملية منطقية واحدة أمام قاعدة واحدة. هنا تُقسّم مسار "إنشاء طلب ودفعه وإشعار العميل" إلى **ثلاث خدمات** بثلاث قواعد بيانات، تتواصل عبر HTTP (للاستعلامات والأوامر المتزامنة) وطابور (للأحداث)، ثم تُدخل الشبكة بينها كـ **خصم**: تأخير، فقدان، تكرار، انقطاع. ستكتشف بنفسك كل ما درسته في Level 7: المهلة التي تعني "لا أعرف" (M7.2)، الخصم المزدوج من webhook مكرّر، تراكم الطلبات حين تبطؤ المدفوعات (M7.5)، الحالة غير المتّسقة بعد انقطاع (M7.3/M7.9)، وعدم القدرة على تصحيح أي شيء بلا `trace_id` عبر الخدمات (M6.6). الهدف النهائي: **تقرير مصالحة يُظهر صفر خصم مزدوج وصفر طلب ضائع** بعد ساعة من الفوضى المحقونة.

تبني على **خمس مراحل**:

| المرحلة | الموضوع | الهدف |
|---|---|---|
| **S1 — Naive split** | M7.1, M6.9 | ثلاث خدمات (Orders/Payments/Notifications) بقواعد منفصلة، HTTP متزامن، طابور للإشعارات؛ تعمل في المسار السعيد؛ `trace_id` يمرّ عبر الكل |
| **S2 — Chaos proxy** | M7.1, M7.2 | وكيل فوضى بين الخدمات (تأخير/فقدان/تكرار/انقطاع قابلة للتحكّم بـ API)؛ تسجيل كل الأعطال الناتجة **قبل** أي إصلاح |
| **S3 — Correctness under failure** | M7.2, M7.7 | deadline مُمرَّر، تصنيف الأخطاء، إعادة بميزانية، idempotency في Orders وPayments والبوابة الوهمية، webhooks بأي ترتيب، آلة حالة شرطية |
| **S4 — Resilience & consistency** | M7.5, M7.9, M7.3 | حواجز وقاطع لكل اعتماد، طوابير محدودة + 503/Retry-After، saga بتعويضات، outbox + idempotent consumer، مصالحة دورية |
| **S5 — Proof** | M7.8, M6.6 | ساعة فوضى تحت حمل مفتوح النموذج؛ لوحات p99/lag/الطوابير؛ تقرير مصالحة؛ postmortem لأسوأ عطل اكتشفته؛ ADR "هل كان التقسيم يستحق؟" |

**النموذج:** `Client → Orders ──HTTP──▶ Payments ──HTTP──▶ Fake Gateway` و`Orders/Payments ──outbox──▶ Queue ──▶ Notifications`، والشبكة بين كل سهمين قابلة للكسر.

## 2. المتطلبات (Requirements)

### Functional
| # | المتطلب | المرحلة |
|---|---|---|
| F1 | `POST /orders` (Orders) ينشئ طلبًا بـ `Idempotency-Key`، يحجز العناصر محليًا، ويستدعي Payments | S1 |
| F2 | `POST /payments` (Payments) يُفوّض الدفع عبر **بوابة وهمية** تدعم مفتاح idempotency وتُرسل webhooks (`authorized`/`captured`/`failed`) قد تتكرّر وتصل بأي ترتيب | S1, S3 |
| F3 | `POST /webhooks/gateway` (Payments) يستقبل webhooks موقّعة | S1, S3 |
| F4 | Notifications يستهلك أحداث `order.completed`/`order.failed` ويُرسل بريدًا (MailHog) **مرة واحدة** لكل حدث | S1, S4 |
| F5 | `GET /orders/:id` يُظهر حالة الطلب والدفع وآخر أحداث الـ saga | S1 |
| F6 | وكيل فوضى بـ API: `POST /chaos {route, latencyMs, lossRate, dupRate, partition}` | S2 |
| F7 | مهمّة مصالحة: تقارن Orders/Payments/البوابة وتُصلح أو تُبلّغ عن الفروق | S4 |
| F8 | `GET /metrics` لكل خدمة + تتبّع موزّع (OpenTelemetry أو سجلات بـ `trace_id`/`span_id`) | S1, S5 |

### Non-Functional
| # | المتطلب | الرقم | المرحلة |
|---|---|---|---|
| N1 | لا خصم مزدوج **أبدًا** تحت أي سيناريو فوضى | 0 في تقرير المصالحة | S3–S5 |
| N2 | لا طلب "مدفوع بلا تسجيل" ولا "مُسجَّل كمدفوع بلا دفع" بعد المصالحة | 0 خلال ≤ 2 دقيقة | S4 |
| N3 | `POST /orders` p99 ≤ 2s في الوضع الطبيعي؛ ≤ 3s مع Payments بطيئة (تدهور رشيق لا انهيار) | قياس مفتوح النموذج | S4, S5 |
| N4 | Payments معطّلة 5 دقائق → Orders تظلّ تخدم `GET` وتُرجع 503 + Retry-After لـ `POST` خلال ≤ 50ms (قاطع مفتوح) | p99 ≤ 50ms للرفض | S4 |
| N5 | كل طلب قابل للتتبّع من Client إلى MailHog بـ `trace_id` واحد | 100% | S1, S5 |
| N6 | كل إعادة محاولة لها deadline وميزانية؛ نسبة الإعادات ≤ 10% من الطلبات الأصلية | قياس | S3 |

### Constraints
- TypeScript/Node لكل الخدمات؛ PostgreSQL لكل خدمة (ثلاث قواعد أو ثلاث schemas منفصلة بصلاحيات تمنع العبور)؛ الطابور على PostgreSQL (outbox + relay، M5.9/M7.9) أو Redis Streams — بقرار ADR.
- الفوضى تُحقن بوكيل (Toxiproxy أو وكيل TCP/HTTP تكتبه ≤ 200 سطر) — **لا** بتعديل كود الخدمات.
- كل شيء يعمل بـ `docker compose up` (orders, payments, notifications, gateway-fake, chaos, 3×postgres، mailhog).

### Assumptions
- بوابة الدفع الوهمية تدعم `Idempotency-Key` وتُعيد نفس النتيجة للمفتاح نفسه، وتُرسل webhooks بتأخير عشوائي وتكرار 20%.
- الحمل المستهدف صغير (≤ 50 طلب/ثانية) — المشروع عن **الصحّة** لا السعة.

### Out of scope
- Kubernetes، service mesh، gRPC؛ واجهة مستخدم؛ عملات متعدّدة؛ استرداد جزئي.

## 3. معايير القبول (Acceptance Criteria)

- **AC1 (Idempotent create)** Given `POST /orders` بمفتاح K، When يُعاد الطلب نفسه 5 مرات (بعضها أثناء فقدان 30%)، Then طلب واحد في DB، نفس `order_id` في كل ردّ ناجح، و409 للمتزامن أثناء التنفيذ.
- **AC2 (Timeout ≠ failure)** Given Payments تستجيب بعد 3s ومهلة Orders 1s، When يُنشأ طلب، Then Orders لا تُعلن "فشل الدفع"، بل `pending_reconciliation`، والمصالحة تُحوّلها إلى الحالة الحقيقية خلال ≤ 2 دقيقة، وتُرسل بريد واحد فقط.
- **AC3 (Duplicate/out-of-order webhooks)** Given دفع مُفوَّض، When يصل `captured` مرتين ثم `authorized` متأخّرًا، Then الحالة النهائية `captured`، حدث واحد في `payment_events` لكل انتقال، لا بريد مكرّر.
- **AC4 (One gateway charge)** Given فقدان 50% بين Payments والبوابة، When تُنشأ 200 دفعة، Then سجل البوابة يُظهر ≤ 200 تفويض فريد (مفتاح واحد لكل دفعة) وصفر مفاتيح مزدوجة التفويض.
- **AC5 (Circuit breaker)** Given Payments معطّلة، When تُرسل 100 `POST /orders` خلال 10s، Then بعد العتبة تُرفض فورًا بـ 503 + `Retry-After` (p99 ≤ 50ms)، `GET /orders/:id` يعمل، وبعد التعافي يُغلق القاطع خلال ≤ 30s.
- **AC6 (Backpressure)** Given Payments بطيئة (2s) وحمل 50/ثانية، When يمتلئ طابور Orders المحدود، Then الزائد يُرفض بـ 503 خلال ≤ 50ms ولا ينمو استهلاك الذاكرة، وp99 للمقبول ≤ 3s.
- **AC7 (Saga compensation)** Given الدفع مرفوض، When تنتهي الـ saga، Then الحجز المحلي محرَّر، `order.failed` في outbox، بريد "فشل" واحد؛ وإن انهار Orders بين الحجز والدفع، Then الاستئناف يُكمل دون حجز مزدوج.
- **AC8 (Outbox, no dual write)** Given انهيار Orders مباشرة بعد COMMIT، When يعود، Then الحدث يُنشر (relay) وقد يصل مرتين، وNotifications تُرسل مرة واحدة.
- **AC9 (Partition)** Given انقطاع 60s بين Orders وPayments أثناء 30 طلبًا، When يُشفى، Then المصالحة تُعيد الاتساق ولا طلب يبقى في حالة غير نهائية > 2 دقيقة.
- **AC10 (Tracing)** Given أي طلب، When يُبحث عن `trace_id` في السجلات/Jaeger، Then تظهر spans من Orders وPayments وGateway وrelay وNotifications مرتبطة.
- **AC11 (Chaos hour)** Given ساعة من الفوضى المختلطة تحت حمل مفتوح 20/ثانية، When تنتهي، Then تقرير المصالحة: 0 خصم مزدوج، 0 طلب ضائع، 0 بريد مكرّر، وكل الطلبات في حالة نهائية.

## 4. المفاهيم المطبّقة (Concepts Applied)

| المفهوم | أين يظهر | الوحدة |
|---|---|---|
| ثلاث نتائج للطلب؛ لا حالة قرار في الذاكرة | كل استدعاء HTTP؛ idempotency في DB | M7.1 |
| deadline propagation، تصنيف الأخطاء، backoff+jitter+budget | عميل HTTP مشترك بين الخدمات | M7.2 |
| idempotency key بحالة in-progress وبصمة | Orders وPayments والبوابة | M7.2, M7.7 |
| آلة حالة شرطية + webhooks بأي ترتيب + مصالحة | Payments | M7.7 |
| قاطع + حاجز + طابور محدود + 503/Retry-After | Orders → Payments | M7.5 |
| saga بالتنسيق مع تعويضات idempotent وحالة محفوظة | Orders | M7.9 |
| outbox + relay + idempotent consumer | Orders/Payments → Notifications | M7.9, M5.9 |
| eventual consistency وما يراه المستخدم | `GET /orders/:id` بحالة `pending` صريحة | M7.3 |
| تتبّع موزّع، lag، percentiles، حمل مفتوح | S5 | M6.6, M7.8 |
| حقن الفشل كأداة هندسية | وكيل الفوضى | M7.5 |

## 5. التصميم (Design)

```text
                    ┌──────────── chaos proxy (latency / loss / dup / partition per route) ────────────┐
Client ──▶ Orders ──┼──HTTP──▶ Payments ──┼──HTTP──▶ Fake Gateway ──webhooks (dup 20%, random order)──▶ Payments
            │ [orders_db]        │ [payments_db]
            │ saga_state         │ payments (state, version)
            │ idempotency_keys   │ idempotency_keys
            │ outbox ──relay──┐  │ outbox ──relay──┐
            │                 ▼  │                 ▼
            │              queue (PG table or Redis Streams)
            │                        │
            │                        ▼
            │               Notifications ── processed_events (PK) ──▶ MailHog
            └── reconciler (every 60s): orders × payments × gateway ledger → fix or report
```

**القرارات المطلوب توثيقها (ADR لكل منها):** (1) الطابور على PG أم Redis Streams؛ (2) orchestration في Orders مقابل خدمة saga مستقلّة؛ (3) مهل كل حافة ومصدرها (deadline 8s عند الحافة → Orders→Payments 3s → Payments→Gateway 2s)؛ (4) عتبات القاطع والحاجز وسعة الطابور بالأرقام (قانون Little: سعة الطابور ≈ المعدّل × الزمن المقبول)؛ (5) من يُولّد مفتاح idempotency للبوابة (= `payment.id`).

**آلة حالة الطلب:** `created → reserving → awaiting_payment → paid | payment_failed | pending_reconciliation → completed | cancelled` — كل انتقال `UPDATE … WHERE state = $from` ويُسجَّل في `order_events`.

**مخطّط أساسي (Orders):**
```sql
CREATE TABLE orders (id uuid PRIMARY KEY, customer_id uuid NOT NULL, amount_cents int NOT NULL, state text NOT NULL, version int NOT NULL DEFAULT 1, created_at timestamptz DEFAULT now());
CREATE TABLE idempotency_keys (key text PRIMARY KEY, fingerprint text NOT NULL, state text NOT NULL, response jsonb, created_at timestamptz DEFAULT now());
CREATE TABLE saga_state (order_id uuid PRIMARY KEY REFERENCES orders(id), step text NOT NULL, attempts int DEFAULT 0, updated_at timestamptz DEFAULT now());
CREATE TABLE outbox (id uuid PRIMARY KEY, topic text NOT NULL, payload jsonb NOT NULL, created_at timestamptz DEFAULT now(), sent_at timestamptz);
CREATE INDEX ON outbox (created_at) WHERE sent_at IS NULL;
```

## 6. خطة التنفيذ (Implementation Plan)

| # | الخطوة | ناتج قابل للتحقّق |
|---|---|---|
| 1 | S1: الهيكل الثلاثي + البوابة الوهمية + MailHog + Compose؛ عميل HTTP مشترك يمرّر `traceparent` | المسار السعيد يعمل؛ `trace_id` واحد في سجلات الخدمات الثلاث |
| 2 | S2: وكيل الفوضى + سكربت `chaos.sh` بسيناريوهات مسمّاة (slow-payments, lossy-gateway, dup-webhooks, partition) | **جدول الأعطال قبل الإصلاح**: لكل سيناريو ما حدث بالأرقام (خصومات مزدوجة، طلبات ضائعة، p99) |
| 3 | S3: deadline + تصنيف + retry بميزانية؛ idempotency في Orders/Payments؛ آلة حالة Payments الشرطية؛ webhooks بأي ترتيب | AC1–AC4 تمرّ تحت الفوضى |
| 4 | S4: قاطع + حاجز + طابور محدود؛ saga مع تعويضات واستئناف؛ outbox + relay + idempotent consumer؛ reconciler | AC5–AC9 تمرّ |
| 5 | S5: k6 (arrival-rate) + ساعة فوضى مختلطة؛ لوحات؛ تقرير المصالحة؛ postmortem؛ ADR "هل استحقّ التقسيم؟" | AC10–AC11؛ المستندات |

## 7. التحديات المدمجة (Built-in Challenges) — سيناريوهات الفوضى

نفّذ كل سيناريو **قبل** الإصلاح (S2) وسجّل الضرر، ثم **بعده** (S3/S4) وأثبت الإصلاح باختبار آلي يُعيد إنتاج السيناريو.

### 7.1 Failure — "Payments بطيئة → Orders تتراكم" (M7.5)
تأخير 2.5s على `orders→payments` تحت 30 طلب/ثانية. قبل: اتصالات Orders تنفد، `GET` يفشل أيضًا، الذاكرة تنمو. بعد: حاجز 20 متزامنًا + طابور محدود 60 + 503 للزائد، `GET` غير متأثّر، p99 للمقبول ≤ 3s.

### 7.2 Failure — "Webhook مكرّر → دفع مزدوج" (M7.7)
dup 50% على webhooks + ترتيب عشوائي. قبل: `captured` مرتين يُنشئ حدثين وبريدين، وفي بعض التصاميم خصمًا ثانيًا. بعد: انتقال شرطي؛ `payment_events` بلا تكرار؛ بريد واحد.

### 7.3 Failure — "timeout ثم إعادة → خصم مزدوج في البوابة" (M7.2)
فقدان 50% على `payments→gateway`. قبل: كل timeout يُعاد بمفتاح جديد → البوابة تُفوّض مرتين. بعد: مفتاح ثابت = `payment.id`؛ سجل البوابة يُظهر تفويضًا واحدًا لكل دفعة.

### 7.4 Failure — "انقطاع الشبكة → حالة غير متّسقة" (M7.3/M7.9)
partition 60s بين Orders وPayments بعد أن أرسلت Orders الطلب. قبل: Orders تقول `payment_failed` بينما Payments `authorized` → عميل خُصم منه وطلبه ملغى. بعد: `pending_reconciliation` + مصالحة تُصلح خلال دقيقتين، وتعويض فقط عند التأكّد.

### 7.5 Failure — "انهيار Orders منتصف الـ saga" (M7.9)
`docker kill orders` بعد حجز العناصر وقبل الدفع. قبل: حجز معلّق إلى الأبد. بعد: الاستئناف من `saga_state` عند الإقلاع؛ لا حجز مزدوج (reserve idempotent).

### 7.6 Failure — "انهيار بعد COMMIT وقبل النشر" (M7.9)
`kill -9` محقون بعد COMMIT في Orders. قبل (dual write): طلب مكتمل بلا بريد. بعد: outbox → relay يُرسل عند العودة؛ Notifications idempotent رغم التكرار.

### 7.7 Failure — "عاصفة إعادة" (M7.2)
Payments تُرجع 503 لـ 30s تحت حمل. قبل: الإعادات تُضاعف الحمل 3× وتمنع التعافي. بعد: ميزانية 10% + backoff + jitter + احترام `Retry-After`؛ لوحة "إعادات/أصلية" ≤ 0.1.

### 7.8 Failure — "ساعة الفوضى" (M7.8)
كل ما سبق بالتناوب لمدة ساعة تحت حمل مفتوح 20/ثانية. المخرج: تقرير المصالحة (AC11)، percentiles لكل مسار، أسوأ 5 traces مع تفسيرها.

### 7.9 اختياري — Architecture — "الدمج العكسي"
اكتب ADR: لو كان هذا منتجًا حقيقيًا لفريق واحد، هل تُبقي الخدمات الثلاث أم تدمجها في monolith معياري مع outbox؟ بالأرقام من S5 (زمن، توافر، ساعات التشغيل).

## 8. المخرجات (Deliverables)
1. المستودع: الخدمات الثلاث + البوابة الوهمية + وكيل الفوضى + Compose + سكربتات السيناريوهات.
2. `docs/failure-log.md`: جدول "قبل/بعد" لكل سيناريو بالأرقام.
3. اختبارات آلية لكل AC (تشغيل الفوضى من الاختبار عبر API الوكيل).
4. `docs/adr/`: القرارات الخمسة + ADR الدمج العكسي.
5. `docs/reconciliation-report.md` بعد ساعة الفوضى، و`docs/postmortem.md` لأسوأ عطل اكتشفته أثناء المشروع (بصيغة M6.7).
6. لوحة (Grafana أو SQL) بـ: p99 لكل مسار، حالة القاطع، حجم الطوابير، الإعادات/الأصلية، الطلبات غير النهائية > دقيقتين.

## 9. قائمة المراجعة الذاتية (Self-Review Checklist)
- [ ] هل يوجد أي `Map`/متغيّر في الذاكرة يُتّخذ عليه قرار (idempotency، قاطع مشترك بين النسخ، حالة saga)؟ (M7.1)
- [ ] هل لكل استدعاء شبكة: مهلة مشتقّة من deadline، تصنيف، سياسة إعادة صريحة، ومفتاح إن كانت الإعادة غير آمنة بدونه؟ (M7.2)
- [ ] هل مفتاح البوابة ثابت لكل دفعة وليس لكل محاولة؟ (M7.7)
- [ ] هل كل انتقال حالة شرطي (`WHERE state = $from`)؟ هل اختبرت webhook مكرّرًا **ومعكوس الترتيب**؟
- [ ] هل الإعادة في طبقة واحدة فقط (لا SDK + خدمة + وكيل)؟
- [ ] هل القاطع لكل اعتماد، لا يُحسب 4xx، وله fallback (503 + Retry-After وليس خطأ 500)؟ (M7.5)
- [ ] هل لكل طابور سقف وسياسة امتلاء؟ ما الذي يراه العميل عندها؟
- [ ] هل كل خطوة saga وكل تعويض idempotent؟ هل حالة الـ saga في DB؟ هل اختبرت الانهيار بين كل خطوتين؟ (M7.9)
- [ ] هل الأحداث تُكتب في نفس معاملة التغيير (outbox)؟ هل المستهلك يحفظ `event_id` في نفس معاملة أثره؟
- [ ] هل المصالحة تعتبر البوابة مصدر الحقيقة؟ هل تعمل تلقائيًا وتُبلّغ عمّا لا تستطيع إصلاحه؟
- [ ] هل تستطيع فتح أي بريد في MailHog والوصول إلى الطلب الأصلي بـ `trace_id` خلال دقيقة؟ (M6.6)
- [ ] هل اختبار الحمل مفتوح النموذج مع إحماء وفحص صحّة الردود؟ (M7.8)
- [ ] هل كل رقم (مهلة/عتبة/سعة) له سطر مبرّر في ADR؟
- [ ] هل كتبت بصدق في ADR 7.9 ما إذا كان التقسيم يستحق لفريق واحد؟
