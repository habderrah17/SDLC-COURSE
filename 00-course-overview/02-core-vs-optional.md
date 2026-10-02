# الأساسي مقابل الاختياري — Core vs Optional
## MUST MASTER / SHOULD UNDERSTAND / CONCEPTUAL AWARENESS / DEFER

> لكل مجال في الكورس، هذا الجدول يحدد **ما يجب أن تتقنه فعلًا** وما يكفي أن تعرف وجوده.
> القاعدة: **ما لا يمكن تفويضه للذكاء الاصطناعي يجب أن تتقنه أنت.**

---

## التصنيفات

| الرمز | الدرجة | الاختبار |
|---|---|---|
| 🔴 | **MUST MASTER** | تستطيع شرحه من الصفر، تطبيقه بيدك، اكتشاف أخطائه في كود غيرك، واتخاذ قرار بناءً عليه |
| 🟠 | **SHOULD UNDERSTAND** | تستطيع شرحه وقراءة كود يستخدمه، وتعرف متى تحتاجه، لكن قد تحتاج مرجعًا لتطبيقه |
| 🟡 | **CONCEPTUAL AWARENESS** | تعرف ما هو، ولماذا يوجد، وأين يهم. تعرف الكلمة التي تبحث عنها |
| ⚪ | **DEFER** | أجّله. لن يعيقك جهلك به الآن |

---

## 1. Computer Systems (أنظمة الحاسوب)

| الموضوع | الدرجة | ملاحظة |
|---|---|---|
| Hardware vs Software, Program vs Process | 🔴 | أساس كل شيء لاحق |
| Binary, Bytes, Text encoding (UTF-8) | 🟠 | تحتاجه لفهم `Buffer`، الملفات، الـ encoding bugs |
| Hexadecimal | 🟡 | تقرأه في الألوان، عناوين الذاكرة، hashes |
| Memory hierarchy (CPU → Cache → RAM → Disk) | 🟠 | يفسّر لماذا الـ cache مهم ولماذا الـ disk I/O بطيء |
| Stack vs Heap, References vs Values | 🔴 | مصدر رئيسي للـ bugs في JavaScript |
| Garbage Collection, Memory Leaks | 🟠 | تحتاجه لتشخيص خادم يستهلك ذاكرة متزايدة |
| CPU registers, pipelining, branch prediction | ⚪ | لا يؤثر على قراراتك اليومية |
| Floating point representation | 🟡 | يكفي أن تعرف `0.1 + 0.2 !== 0.3` وألّا تخزن المال كـ float |

## 2. Operating Systems (أنظمة التشغيل)

| الموضوع | الدرجة | ملاحظة |
|---|---|---|
| What an OS does (process, memory, files, permissions, network) | 🔴 | |
| Process: PID, environment, lifecycle, exit codes, signals | 🔴 | تحتاجه في Docker، deployment، debugging |
| Threads, shared memory | 🟠 | Node.js single-threaded لكن worker threads و DB servers تعتمد عليها |
| Concurrency vs Parallelism | 🔴 | |
| Event Loop (Node.js) | 🔴 | |
| File permissions (chmod, owner) | 🟠 | |
| Virtual memory concept | 🟡 | يكفي فهم أن كل process لها فضاء ذاكرة معزول |
| Scheduling algorithms, kernel internals | ⚪ | |

## 3. Networking (الشبكات)

| الموضوع | الدرجة | ملاحظة |
|---|---|---|
| Client/Server, IP, Port, localhost | 🔴 | |
| TCP: connection, reliability, ordering | 🔴 | |
| UDP: when and why | 🟡 | |
| DNS resolution | 🟠 | تحتاجه عند deployment وتشخيص "الموقع لا يفتح" |
| TLS: certificates, public/private keys, CA, handshake (conceptual) | 🟠 | |
| HTTP: methods, headers, status codes, body, cookies | 🔴 | |
| HTTP caching headers | 🟠 | |
| HTTP/2, HTTP/3 differences | 🟡 | |
| TCP congestion control algorithms | ⚪ | |
| Cryptography math (RSA, elliptic curves) | ⚪ | |

## 4. Data Structures & Algorithms

| الموضوع | الدرجة | ملاحظة |
|---|---|---|
| Array, Hash Map (Object/Map), Set | 🔴 | 90% من الكود اليومي |
| Stack, Queue | 🔴 | call stack، task queue، BFS/DFS |
| Linked List | 🟠 | تفهم لماذا توجد، نادرًا ما تكتبها |
| Tree (binary, n-ary), traversal | 🟠 | DOM، file systems، JSON، DB indexes |
| Heap / Priority Queue | 🟡 | schedulers، task priorities |
| Graph: BFS, DFS, basic shortest path | 🟠 | dependencies، social graphs، routing |
| Big-O: O(1), O(log n), O(n), O(n log n), O(n²) | 🔴 | |
| Recursion, divide and conquer | 🟠 | |
| Sorting: knowing built-in is O(n log n) | 🔴 | لا تحتاج كتابة quicksort من الذاكرة |
| Balanced trees (Red-Black, AVL) internals | ⚪ | يكفي معرفة أن B-Tree هو ما يستخدمه DB index |
| Dynamic programming, advanced graph algos | ⚪ | إلا إذا احتجتها |

## 5. Databases

| الموضوع | الدرجة | ملاحظة |
|---|---|---|
| Tables, rows, columns, primary/foreign keys | 🔴 | |
| SQL: SELECT, WHERE, JOIN, GROUP BY, INSERT, UPDATE, DELETE | 🔴 | لا تعتمد على ORM فقط |
| Relationships: 1:1, 1:N, N:M | 🔴 | |
| Indexes: what, why, tradeoffs, reading EXPLAIN | 🔴 | |
| Transactions & ACID | 🔴 | |
| Isolation levels | 🟠 | تحتاجها عند الـ concurrency bugs |
| Normalization (1NF–3NF) | 🟠 | |
| Connection pooling | 🟠 | |
| Query planner internals, B-Tree internals | 🟡 | |
| NoSQL types (document, key-value, columnar) | 🟡 | |
| Replication, sharding | 🟠 (Level 7) | |

## 6. Software Engineering

| الموضوع | الدرجة | ملاحظة |
|---|---|---|
| SDLC (all phases, iterative nature) | 🔴 | |
| Requirements: functional, non-functional, constraints, acceptance criteria | 🔴 | لا يمكن تفويضها |
| Estimation: decomposition, uncertainty | 🟠 | |
| Abstraction, Encapsulation, Modularity, Coupling, Cohesion | 🔴 | |
| SOLID (as judgment, not dogma) | 🟠 | |
| Design patterns: Adapter, Strategy, Factory, Observer, Repository, DI | 🟠 | |
| Clean code: naming, functions, duplication | 🔴 | |
| Testing: unit, integration, e2e; what to test | 🔴 | |
| Debugging methodology | 🔴 | **أهم مهارة على الإطلاق** |
| Refactoring safely | 🔴 | |
| Legacy code techniques | 🟠 | |
| Technical debt reasoning | 🟠 | |
| Git: commit, branch, merge, rebase, PR, revert, bisect | 🔴 | |
| UML diagrams formally | ⚪ | يكفي Mermaid/ASCII واضح |

## 7. Security

| الموضوع | الدرجة | ملاحظة |
|---|---|---|
| Threat, attacker, asset, trust boundary | 🔴 | |
| Authentication: sessions, tokens, password hashing | 🔴 | |
| Authorization: roles, permissions, tenant isolation | 🔴 | |
| Input validation, least privilege, secrets management | 🔴 | |
| XSS, CSRF, SQL injection, IDOR, SSRF | 🔴 | |
| Threat modeling (STRIDE conceptually) | 🟠 | |
| Encryption at rest/in transit (conceptual) | 🟠 | |
| Implementing crypto primitives yourself | ⚪ | **لا تفعل** |
| Penetration testing techniques | 🟡 | |

## 8. Concurrency & Distributed Systems

| الموضوع | الدرجة | ملاحظة |
|---|---|---|
| Race conditions in business logic | 🔴 | |
| Locks, optimistic vs pessimistic concurrency | 🟠 | |
| Deadlocks (concept, how to avoid) | 🟠 | |
| Partial failure, timeouts, retries, idempotency | 🔴 | |
| Eventual consistency | 🟠 | |
| Replication, load balancing, caching | 🟠 | |
| CAP (correctly) | 🟠 | |
| Circuit breakers, graceful degradation | 🟠 | |
| Consensus algorithms (Paxos, Raft) | 🟡 | تعرف أنها تحل "الاتفاق على قيمة" وأن etcd/Zookeeper تطبّقها |
| Vector clocks, CRDTs | ⚪ | |

## 9. Production & Operations

| الموضوع | الدرجة | ملاحظة |
|---|---|---|
| Deployment concepts: process, environment, DNS, HTTPS, LB | 🔴 | |
| Docker: image, container, volume, network | 🟠 | |
| CI/CD pipeline concept | 🔴 | |
| Cloud primitives: compute, storage, DB, network, LB, secrets | 🟠 | provider-agnostic |
| Observability: logs, metrics, traces | 🔴 | |
| Incident response loop | 🔴 | |
| Kubernetes internals | ⚪ | 🟡 اعرف ما يحل |
| Infrastructure as Code tooling | 🟡 | |

## 10. AI-Native Engineering

| الموضوع | الدرجة | ملاحظة |
|---|---|---|
| Vibe coding vs engineering | 🔴 | |
| Structured delegation (spec, constraints, acceptance criteria) | 🔴 | |
| Verification pipeline (compile → typecheck → test → behavior → security → review) | 🔴 | |
| AI failure modes | 🔴 | |
| Prompt injection, tool permissions, secret exposure | 🔴 | |
| Human-in-the-loop boundaries | 🔴 | |
| Context engineering | 🟠 | |
| Model internals (transformers, training) | ⚪ | |

---

## الخلاصة: 13 مجالًا لا يُفوَّض للذكاء الاصطناعي

```
1.  Debugging                  لأن AI لا يملك الـ context الحقيقي للنظام
2.  Requirements               لأن AI لا يعرف المستخدم ولا العمل
3.  Architecture               لأن القرارات المعمارية تحمل مسؤولية طويلة الأمد
4.  HTTP                       لأن كل شيء على الويب يمر عبره
5.  Databases                  لأن البيانات هي الأصل الأغلى
6.  Security                   لأن الخطأ فيها كارثي ولا يُكتشف بسهولة
7.  Testing                    لأن الاختبار هو الدليل، وAI قد يكتب اختبارًا يمر دون أن يختبر شيئًا
8.  Git                        لأنه ذاكرة الفريق وسجل القرارات
9.  System Design              لأن التصميم هو ترجمة القيود إلى بنية
10. Concurrency                لأن أخطاءها لا تظهر إلا في الإنتاج
11. Failures                   لأن الأنظمة الحقيقية تفشل دائمًا
12. Observability              لأنك لا تستطيع إصلاح ما لا تراه
13. SDLC                       لأنها الإطار الذي يحمل كل ما سبق
```
