# Checkpoint 2 — نقطة التفتيش: أنظمة الحاسوب
## Checkpoint 2 — Computer Systems

> **لا تنتقل إلى Level 3 قبل اجتياز الأقسام الأربعة** وتسليم Project 3 بمراحله الثلاث.
> اجتياز = تجيب **بكلماتك، بدون الرجوع للوحدات**، وتستطيع رسم الصورة على ورقة، **وتكتب الكود المطلوب بيدك**، **وتفسّر المخرجات الحقيقية** (`top`, `ss`, `curl -v`, `dig`) لا الأمثلة فقط.
> إن فشلت في سؤال، الرابط بجانبه يعيدك للوحدة.

---

## القسم 1: الفحص المفاهيمي (Conceptual Check)

### البيانات والعتاد
1. لماذا `"é".length` و`Buffer.byteLength("é")` و`[..."👨‍👩‍👧"].length` تعطي أجوبة مختلفة؟ ما الطبقات الثلاث للنص؟ — [M2.1](module-2.1-bits-bytes-encoding.md)
2. ما أكبر عدد صحيح آمن في `number`؟ ماذا تفعل بمعرّفات 64 بت القادمة من DB؟ — [M2.1](module-2.1-bits-bytes-encoding.md)
3. لماذا تظهر `Ø§Ù„Ø³Ù„Ø§Ù…` بدل `السلام`؟ أين الخطأ: الكتابة أم القراءة أم كلاهما؟ — [M2.1](module-2.1-bits-bytes-encoding.md)
4. اذكر الهرم بالدورات: L1، RAM، SSD، شبكة داخل المركز. ما النتيجة العملية على "قراءة من الكاش vs من DB"? — [M2.2](module-2.2-cpu-cache-ram.md)
5. لماذا المرور على مصفوفة عشوائيًا أبطأ 10× من تسلسليًا رغم نفس عدد العمليات؟ ما خط الكاش؟ — [M2.2](module-2.2-cpu-cache-ram.md)
6. CPU-bound vs I/O-bound: كيف تعرف أيهما من `top`؟ ولماذا "نوى أكثر" لا يسرّع الثاني؟ — [M2.2](module-2.2-cpu-cache-ram.md), [M2.4](module-2.4-operating-systems.md)

### الذاكرة ونظام التشغيل
7. ما الذي يحميه `const` وما الذي لا يحميه؟ أين يعيش الكائن وأين المرجع؟ — [M2.3](module-2.3-memory-stack-heap-gc.md)
8. كيف يقرر GC أن كائنًا "قمامة"؟ اذكر أنماط التسرّب الخمسة. — [M2.3](module-2.3-memory-stack-heap-gc.md)
9. الفرق بين `heap out of memory` (V8) و`Killed` (exit 137)؟ من يرسل كلًّا منهما ولماذا العلاج مختلف؟ — [M2.3](module-2.3-memory-stack-heap-gc.md), [M2.4](module-2.4-operating-systems.md), [M2.5](module-2.5-process-deep-dive.md)
10. ما syscall؟ لماذا `console.log` في حلقة ساخنة يبطّئ 100×؟ — [M2.4](module-2.4-operating-systems.md)
11. اشرح الذاكرة الافتراضية بثلاث فوائد. لماذا `VmSize` ≫ `RSS`؟ ما swap ولماذا كارثي للخوادم؟ — [M2.4](module-2.4-operating-systems.md)
12. حالات الخيط الثلاث. ما تبديل السياق وما تكلفته الخفية؟ — [M2.4](module-2.4-operating-systems.md)
13. ما fd؟ لماذا `rm app.log` لم يحرّر القرص؟ ما `EMFILE` ولماذا لا يحلّه GC؟ — [M2.4](module-2.4-operating-systems.md)
14. كيف تمكّن المقاطعات async؟ ارسم السلسلة من بطاقة الشبكة إلى `await`. — [M2.4](module-2.4-operating-systems.md), [M2.7](module-2.7-concurrency-event-loop.md)

### العمليات والخيوط
15. SIGTERM vs SIGKILL: من يرسلهما، أيهما يُلتقط، وماذا يعني exit 143 و137؟ — [M2.5](module-2.5-process-deep-dive.md)
16. اذكر خطوات الإغلاق الرشيق الست بالترتيب. لماذا مهلة قصوى؟ لماذا الإشارة الثانية = خروج فوري؟ — [M2.5](module-2.5-process-deep-dive.md)
17. لماذا `process.on("uncaughtException", () => {})` يجعل الخادم **أخطر**؟ من أين تأتي المتانة إذن؟ — [M2.5](module-2.5-process-deep-dive.md)
18. `exec("cmd " + input)` vs `execFile("cmd", [input])` — ما الهجوم؟ — [M2.5](module-2.5-process-deep-dive.md)
19. عملية vs خيط: 4 فروق. لماذا `counter++` من خيطين يعطي نتيجة خاطئة؟ — [M2.6](module-2.6-threads.md)
20. طبقات Node الثلاث من الخيوط: ما الذي يذهب لكلٍّ منها؟ لماذا `UV_THREADPOOL_SIZE` لا يسرّع الشبكة؟ — [M2.6](module-2.6-threads.md)
21. متى تستخدم worker_threads ومتى لا؟ ما خطأ "Worker لكل طلب"؟ — [M2.6](module-2.6-threads.md)

### التزامن وحلقة الأحداث
22. التزامن vs التوازي بمثال النادل. أين يقع Node؟ — [M2.7](module-2.7-concurrency-event-loop.md)
23. كيف ينتظر خيط واحد 10,000 سوكت؟ ما `epoll_wait`؟ — [M2.7](module-2.7-concurrency-event-loop.md)
24. اذكر مراحل الحلقة بالترتيب ومتى تُفرَّغ microtasks و`nextTick`. ما التجويع؟ — [M2.7](module-2.7-concurrency-event-loop.md)
25. اذكر 5 أشياء تحجب الحلقة و3 لا تحجبها. كيف تقيس الحجب؟ — [M2.7](module-2.7-concurrency-event-loop.md)
26. `cluster` vs `worker_threads` vs خدمة منفصلة: متى كلٌّ منها؟ ماذا يحدث للكاش في الذاكرة مع `cluster`؟ — [M2.7](module-2.7-concurrency-event-loop.md)

### الشبكات
27. "الإنترنت best effort" — ما الأشياء الأربعة التي قد تحدث لحزمة؟ من يصلحها؟ — [M2.8](module-2.8-networking-from-zero.md)
28. ما NAT؟ نتيجتاه العمليتان لمطوّر الويب؟ — [M2.8](module-2.8-networking-from-zero.md)
29. الطبقات الأربع وعنوان كلٍّ منها. ما التغليف ولماذا يسمح باستبدال TCP بـ QUIC بلا تغيير HTTP؟ — [M2.8](module-2.8-networking-from-zero.md)
30. كيف يخدم خادم على منفذ واحد ملايين الاتصالات؟ ما الرباعية؟ — [M2.8](module-2.8-networking-from-zero.md)
31. `ETIMEDOUT` vs `ECONNREFUSED` على مستوى الحزم. ما الأداة التي تحسم؟ — [M2.8](module-2.8-networking-from-zero.md), [M2.9](module-2.9-tcp-udp.md)
32. المصافحة الثلاثية: لماذا 1 RTT؟ ما نتيجتها على تصميم العملاء (pool/keep-alive)؟ — [M2.9](module-2.9-tcp-udp.md)
33. **"TCP تيار لا رسائل"** — اشرح بمثال، واذكر طرق التأطير الثلاث وأين يستخدم HTTP كلًّا منها. — [M2.9](module-2.9-tcp-udp.md), [M2.12](module-2.12-http.md)
34. ما flow control وما علاقته بـ backpressure في streams؟ ما slow start ونتيجته؟ — [M2.9](module-2.9-tcp-udp.md)
35. لماذا قد يبقى اتصال "مفتوحًا" وهو ميت؟ كيف تكتشفه؟ — [M2.9](module-2.9-tcp-udp.md)
36. متى UDP أفضل؟ ما الذي يحله QUIC؟ — [M2.9](module-2.9-tcp-udp.md)
37. ارسم هرم DNS ومسار استعلام غير مخزّن. ما TTL ولماذا "الانتشار" اسم مضلّل؟ اكتب وصفة الهجرة. — [M2.10](module-2.10-dns.md)
38. A/AAAA/CNAME/NS/TXT/MX — جملة لكلٍّ. — [M2.10](module-2.10-dns.md)
39. `dns.lookup` vs `dns.resolve`: ثلاثة فروق، ولماذا عطل DNS قد يبطّئ `fs.readFile`؟ — [M2.10](module-2.10-dns.md)

### الأمن والـ HTTP
40. الضمانات الثلاث لـ TLS. لماذا تشفير بلا هوية عديم القيمة؟ — [M2.11](module-2.11-tls.md)
41. ماذا تربط الشهادة؟ ما سلسلة الثقة؟ ما الأربعة التي يتحقق منها العميل؟ — [M2.11](module-2.11-tls.md)
42. لماذا `rejectUnauthorized: false` ممنوع؟ ما البديل الصحيح لـ CA خاصة؟ — [M2.11](module-2.11-tls.md)
43. ما TLS termination؟ ما شرط الثقة بـ `X-Forwarded-For`؟ ماذا يرى مزوّد الإنترنت مع HTTPS؟ — [M2.11](module-2.11-tls.md)
44. اكتب طلب HTTP/1.1 ورده بالبايتات (CRLF!). لماذا `Content-Length` بالبايتات لا الأحرف؟ — [M2.12](module-2.12-http.md)
45. GET/POST/PUT/DELETE: آمنة؟ idempotent؟ لماذا idempotency تهمّ الشبكة؟ ما خطر GET بأثر جانبي؟ — [M2.12](module-2.12-http.md)
46. 401 vs 403؛ 502 vs 503 vs 504؛ 301 vs 302؛ متى 429 و422؟ لماذا "200 مع error" خطأ؟ — [M2.12](module-2.12-http.md)
47. لماذا الكوكيز تجعل CSRF ممكنًا و`Authorization` لا؟ ما SameSite/HttpOnly/Secure؟ — [M2.12](module-2.12-http.md)
48. `no-cache` vs `no-store`؛ ETag/304؛ ما `Vary` ولماذا غيابه يسرّب بيانات؟ — [M2.12](module-2.12-http.md)
49. CORS: من يحمي؟ هل يحمي الخادم؟ ما preflight؟ — [M2.12](module-2.12-http.md)
50. HTTP/1.1 → 2 → 3: ما الذي يتغير وما الذي لا يتغير لك؟ — [M2.12](module-2.12-http.md)

### الصورة الكاملة (إلزامية)
51. تتبّع `POST /cart/items` من تلمسان إلى فرانكفورت: سمِّ 8 طبقات، وما قد يفشل في كلٍّ، وكم RTT قبل أول بايت باردًا ودافئًا. — [M2.13](module-2.13-web-app-architecture.md)
52. لماذا "الزمن رحلات لا بايتات"؟ ثلاث طرق لتقليل الرحلات. — [M2.13](module-2.13-web-app-architecture.md)
53. ما "عديم الحالة"؟ أين تذهب: الجلسات، الملفات المرفوعة، rate limit، الكاش، مصدر الحقيقة؟ لماذا تنكشف المشكلة فقط عند N ≥ 2؟ — [M2.13](module-2.13-web-app-architecture.md)
54. سلسلة المهلات من المتصفح إلى DB: ما القاعدة وما الخطر عند كسرها؟ — [M2.13](module-2.13-web-app-architecture.md)
55. اكتب من ذاكرتك قائمة مراجعة الإنتاج المشتقة من Level 2 (≥ 8 بنود، كلٌّ مع وحدته). — [M2.13](module-2.13-web-app-architecture.md)

---

## القسم 2: الفحص البرمجي (Coding Check)

> بيدك. بلا AI. `strict` + `noUncheckedIndexedAccess`. لا `any`/`as`/`!` خارج المحقّقات. الوحدات المدمجة فقط.

### مهمة 2.1 — التأطير
اكتب `framer.ts`: دالة نقية `feed(state, chunk: Buffer): { messages: Buffer[]; state }` لبروتوكول length-prefix (uint32 BE) بحد 1MB، واختبرها بـ `node:test` على: رسالة في 7 chunks، 3 رسائل في chunk، طول > الحد (خطأ)، chunk فارغ، بايتات متبقية بين الاستدعاءات. ≥ 8 اختبارات. ثم اربطها بخادم `net` echo بـ ≤ 25 سطرًا إضافيًا.

### مهمة 2.2 — الإغلاق الرشيق
خذ خادم `node:http` بسيطًا (`/slow` ينام 3 ثوانٍ) وأضف: `/health` و`/ready`، إغلاق رشيق على SIGTERM/SIGINT بمهلة 8s، إشارة ثانية = خروج 130، `uncaughtException` → إغلاق بـ 1. اكتب سكربت bash يثبت AC: طلب `/slow` جارٍ + `kill -TERM` → الطلب يكتمل، `/ready` 503، خروج 0 خلال < 4s.

### مهمة 2.3 — قياس الحجب وإصلاحه
اكتب `lag.ts`: `monitorEventLoopDelay` + خادم بـ endpoint `/sum?n=` يجمع 1..n (n حتى 1e9). قِس p99 lag تحت `autocannon`/حلقة `fetch` بينما `/sum?n=1e9` يعمل. ثم أصلح بطريقتين منفصلتين: (أ) chunking بـ `setImmediate`؛ (ب) `worker_threads` pool بحجم `availableParallelism()-1`. جدول: p99 lag وزمن `/sum` لكل من الثلاثة.

### مهمة 2.4 — HTTP بالدلالات
اكتب `notes-api.ts` بـ `node:http` (≤ 120 سطرًا): CRUD بالرموز الصحيحة (201+Location، 204 idempotent، 405+Allow، 413 قبل القراءة، 415، 422)، ETag/304 على القائمة، `no-store`، CORS بقائمة سماح مع preflight، مهلات. اختبره بـ `curl -i` والصق 6 مخرجات في `CHECKPOINT.md`.

### مهمة 2.5 — تشخيص بالأدوات
شغّل خادمك من 2.4، ثم اجمع واشرح **سطرًا سطرًا** في `CHECKPOINT.md`: `ss -tlnp | grep <port>`، `ss -tn state established | head`، `ls /proc/<pid>/fd | wc -l` قبل وبعد 100 اتصال keep-alive، `strace -c -p <pid>` لـ 5 ثوانٍ تحت حمل، `curl -w` بتوقيتات dns/tcp/tls/ttfb لموقع HTTPS بعيد مرتين على نفس الاتصال.

---

## القسم 3: فحص التصحيح (Debugging Check)

> لكل سيناريو اكتب: المتوقع، الفعلي، الفرضية، التجربة (الأمر/الأداة)، السبب الجذري، "أين أيضًا؟" — **قبل** فتح الحل.

### 3.1
```
$ node server.js    # خادم TCP دردشة
# محليًا: ممتاز. على الإنترنت: رسائل مدموجة "{"a":1}{"b":2}" وأحيانًا SyntaxError: Unexpected end of JSON input
```
<details><summary>الحل</summary>
الطبقة: TCP (M2.9). تيار بلا حدود رسائل؛ محليًا الحزم صغيرة وسريعة فتطابق chunk = رسالة بالصدفة. السبب الجذري: لا تأطير. الإصلاح: `\n`-delimited أو length-prefix مع buffer لكل اتصال وحد حجم. "أين أيضًا؟": أي `on("data", JSON.parse)`، وقارئ HTTP يدوي يفترض الترويسات في chunk واحد.
</details>

### 3.2
```
Error: connect ETIMEDOUT 10.20.0.15:5432
$ dig db.internal → 10.30.0.8     # الجديد
$ node -e "require('dns').lookup('db.internal', console.log)" → 10.20.0.15   # القديم
```
<details><summary>الحل</summary>
الطبقة: DNS (M2.10). `lookup` = getaddrinfo = `/etc/hosts` + كاش OS؛ `dig` يسأل الـ resolver مباشرة. السبب: سطر في `/etc/hosts` أو كاش OS بـ TTL طويل، أو pool اتصالات قديم لم يُعد الحل. التجربة: `grep db.internal /etc/hosts`، `resolvectl query`. "أين أيضًا؟": كل خادم لم يُعد تشغيله بعد الهجرة؛ أي كاش DNS أبدي في التطبيق.
</details>

### 3.3
```
# K8s: Pods القديمة تُقتل بـ 137 بعد 30s عند كل نشر؛ عملاء يرون ECONNRESET
process.on("SIGTERM", () => console.log("shutting down"));
```
<details><summary>الحل</summary>
الطبقة: العملية/الإشارات (M2.5). المعالج يسجّل ولا يخرج → العملية تستمر بقبول طلبات 30s → SIGKILL (137) في منتصفها → RST للعملاء. الإصلاح: وصفة الإغلاق الست + `/ready` 503 أولًا + مهلة < 30s. "أين أيضًا؟": كل خدمة سجّلت معالج إشارة بلا `exit`؛ workers الطوابير (رسائل غير مؤكَّدة).
</details>

### 3.4
```
# API: p50 = 6ms، p99 = 1.9s بنمط كل 60 ثانية. DB p99 = 4ms. CPU 100% على نواة واحدة لحظيًا.
```
<details><summary>الحل</summary>
الطبقة: حلقة الأحداث (M2.7). حجب دوري: `setInterval` كل دقيقة يفعل JSON ضخمًا/فرزًا/regex على الخيط الرئيسي؛ كل الطلبات الواصلة أثناءه تنتظر. التجربة: `monitorEventLoopDelay` max يطابق 1.9s وتوقيته. الإصلاح: worker_threads أو خدمة منفصلة. "أين أيضًا؟": أي مهمة مجدولة داخل خادم HTTP؛ `JSON.parse` لأجسام كبيرة بلا حد.
</details>

### 3.5
```
Error: EMFILE: too many open files
$ ls /proc/$PID/fd | wc -l → 1024     $ lsof -p $PID | awk '{print $5}' | sort | uniq -c → 990 IPv4
```
<details><summary>الحل</summary>
الطبقة: OS/fds (M2.4) + TCP (M2.9). 990 سوكت = اتصالات صادرة لا تُغلق (اتصال DB/HTTP جديد لكل طلب بلا pool، أو keep-alive بلا حد/مهلة). GC لا يحرّر fds. الإصلاح: pool واحد + مهلات خمول + `maxSockets`؛ ثم `ulimit` كضبط لا كعلاج. "أين أيضًا؟": ملفات بلا `close`، watchers، أبناء بلا kill.
</details>

### 3.6
```
# بعد تجديد الشهادة: المتصفحات بخير؛ Node وAndroid: UNABLE_TO_VERIFY_LEAF_SIGNATURE
# PR مقترح: agent = new https.Agent({ rejectUnauthorized: false })
```
<details><summary>الحل</summary>
الطبقة: TLS (M2.11). الخادم يقدّم الورقة بلا الوسيطة (cert.pem بدل fullchain.pem)؛ المتصفحات تجلبها/تخزّنها فتخفي الخطأ. ارفض الـ PR (يفتح MITM). الإصلاح: fullchain + اختبار `openssl s_client … Verify return code: 0` بعد كل تجديد + مراقبة الانتهاء. "أين أيضًا؟": `NODE_TLS_REJECT_UNAUTHORIZED=0` في Dockerfiles؛ `sslmode=require` للـ DB.
</details>

### 3.7
```
# CDN أمام API. مستخدم يرى بيانات مستخدم آخر في GET /me لمدة 5 دقائق.
# الرد: Cache-Control: public, max-age=300   (بلا Vary)
```
<details><summary>الحل</summary>
الطبقة: HTTP caching (M2.12). رد مصادَق معلَّم `public` بلا `Vary: Authorization/Cookie` → CDN يخدم أول رد للجميع. الإصلاح الفوري: `private, no-store` + purge. الدائم: افتراضي `no-store` في middleware ويُفتح الكاش صراحةً للعام فقط + اختبار ترويسات الكاش على المسارات المصادَقة. "أين أيضًا؟": أي endpoint نُسخ من قالب عام؛ ردود تعتمد على `Accept-Language` بلا `Vary`.
</details>

### 3.8
```
# بعد التوسّع من نسخة إلى 3: تسجيل خروج عشوائي، ملفات مرفوعة "تختفي"، rate limit 100 صار 300، 502 عند النشر، كل السجلات من IP الموازن.
```
<details><summary>الحل</summary>
الطبقة: المعمارية (M2.13). أربعة أعراض سببها **حالة في العملية/القرص** (جلسات، ملفات، عدّادات) ظهرت عند N > 1 → Redis/Object storage؛ 502 = لا إغلاق رشيق/ready (M2.5)؛ IP الموازن = لا `trust proxy` بقائمة IPs (M2.11). ارفض sticky sessions كحل دائم. "أين أيضًا؟": أي `Map` عالمية في خادم، أي كتابة على القرص المحلي، أي "يعمل على staging".
</details>

---

## القسم 4: الفحص المعماري (Architecture Check)

> أجب بصيغة **Assumption / Constraint / Tradeoff / Risk / Recommendation**. نصف صفحة لكل سؤال. لا كود.

### 4.1 — ميزانية الزمن
منتج يخدم تلمسان ومرسيليا من خادم في فرانكفورت. الطلب الأشيع: 6 استدعاءات API متسلسلة من الواجهة. احسب الزمن البارد والدافئ بالرحلات. اقترح ثلاث خطوات مرتّبة بالعائد/التكلفة (keep-alive، HTTP/2، تجميع endpoints، CDN، منطقة أقرب) مع الأرقام المتوقعة لكلٍّ.

### 4.2 — عقد دورة الحياة
اكتب "عقد تشغيل" يُفرض على كل خدمة في الشركة: ترتيب الإغلاق ومهلته (وعلاقتها بمهلة المنظّم)، `/health` vs `/ready`، التعامل مع المهام الطويلة عند SIGTERM، سلسلة المهلات الخارجية→الداخلية، الحدود (جسم، اتصالات، heap مقابل الحاوية)، وكيف يُختبر كل بند آليًا في CI.

### 4.3 — أين يعمل كل عمل؟
خدمة واحدة تحتاج: API سريعة، توليد PDF (CPU 2–5s)، 20k WebSocket خامل، إرسال 50k إشعار عند حدث، مهمة تجميع كل 5 دقائق. لكل عمل: الحلقة الرئيسية / worker pool / cluster / خدمة+طابور — مع العزل عند الفشل، الذاكرة، أثر SIGTERM، وما تراقبه.

### 4.4 — الشبكة والثقة
صمّم شبكة الإنتاج: subnets (عام/خاص/DB)، قواعد الجدار الناري بأقل صلاحيات، NAT للصادر، أين ينتهي TLS وما يُعاد تشفيره داخليًا، `trust proxy`، حماية SSRF/DNS rebinding (فحص العناوين الخاصة **بعد** الحل)، DNS TTLs وخطة failover بين منطقتين.

### 4.5 — سياسة HTTP للمنتج
وثيقة صفحة واحدة تُفرض بـ middleware: الافتراضيات الآمنة (مهلات، حدود، `no-store`، ترويسات أمنية)، قواعد الكاش لثلاث فئات مع `Vary`، خريطة أنواع الأخطاء → رموز، سياسة إعادة المحاولة للعملاء وIdempotency-Key، CORS. ما يُفرض آليًا وما يُترك للمراجعة.

---

## بطاقة الاجتياز (Pass Card)

| القسم | المعيار | ✅ |
|---|---|---|
| 1 | 48/55 سؤالًا بإجابة صحيحة **بكلماتك** مع رسم حيث طُلب (الأسئلة 51–55 إلزامية) | |
| 2 | المهام الخمس: typecheck نظيف، تعمل، اختبارات 2.1 خضراء، جدول 2.3 وقياسات 2.5 موثّقة | |
| 3 | 7/8 سيناريوهات بمنهج مكتوب **قبل** فتح الحل، مع تسمية الطبقة و"أين أيضًا؟" | |
| 4 | 5 صفحات ACTRR، كل واحدة بأرقام (RTT، مهلات، حدود) لا صفات | |
| 🛠 | Project 3 مسلّم بمراحله الثلاث (s1/s2/s3)، ≥ 20 اختبارًا، CHALLENGES.md بأدلة قياس | |

**درجة النضج بعد الاجتياز:** تفهم ما يحدث **تحت** كودك: كيف تُمثَّل البيانات، أين تعيش، كيف تنفّذها المعالج والنواة، كيف تتشارك العمليات والخيوط الآلة، وكيف يعبر طلب واحد الشبكة من المتصفح إلى DB عبر DNS وTCP وTLS وHTTP — وتستطيع **تشخيص** الأعطال في كل طبقة بالأدوات (`top`, `lsof`, `strace`, `ss`, `tcpdump`, `dig`, `openssl`, `curl -v`) لا بالتخمين، و**تصميم** خدمة تحترم حدود كل طبقة (مهلات، حدود، إغلاق رشيق، لا حالة في العملية). **لا تعرف بعد** كيف تنظّم البيانات خوارزميًا ولا كيف تعمل قاعدة البيانات من الداخل (فهارس، معاملات) — وهذا ما يفتحه **Level 3**.

> **التالي:** [Level 3 — Core Computer Science](../level-3-core-computer-science/README.md)
