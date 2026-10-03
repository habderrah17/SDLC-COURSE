# LEVEL 2 — أنظمة الحاسوب
## Computer Systems

---

## 📍 أين أنا؟

```
✅ LEVEL 0  Absolute Foundations
✅ LEVEL 1  Programming + Computational Thinking
▶ LEVEL 2  Computer Systems                        ← أنت هنا
  LEVEL 3  Core Computer Science
  LEVEL 4  Software Engineering Foundations
  LEVEL 5  Building Real Software
  LEVEL 6  Professional Engineering
  LEVEL 7  Advanced Systems
  LEVEL 8  AI-Native Software Engineering
  LEVEL 9  Professional Capstone
```

**درجة النضج:** BEGINNER → DEVELOPER (يفهم ما تحت الكود).

> **هذا أثقل مستوى مفاهيميًا.** لا تستعجل. كل وحدة هنا تفسّر عشرات الـ bugs التي ستواجهها لاحقًا.

---

## 🎯 ماذا يجب أن أعرف الآن؟

**قبل هذا المستوى:**
- Level 0 كاملًا (CPU/RAM/Storage, process, ports, client/server).
- Level 1: variables, objects, references (first pass), async/await (intro), functions.

**بعد هذا المستوى** يجب أن تستطيع:
- شرح كيف تُمثَّل الأرقام والنصوص والصور كبتات، ولماذا `0.1 + 0.2 !== 0.3`، وما UTF-8.
- رسم التسلسل الهرمي CPU → Cache → RAM → Storage وشرح لماذا يهم كودك.
- شرح **Stack vs Heap**، وأين يعيش `const user = {...}`، وما يفعله **Garbage Collector**، وكيف يحدث **memory leak**.
- شرح مهام نظام التشغيل، و**Process** بعمق (PID, memory, env, lifecycle, signals, graceful shutdown).
- شرح **Thread** مقابل Process، والذاكرة المشتركة.
- التفريق بدقة بين **Concurrency** و**Parallelism**، وشرح **Node.js Event Loop** بأمثلة من الخوادم وقواعد البيانات.
- شرح رحلة طلب كاملة: **Browser → DNS → TCP → TLS → HTTP → Server → Application → Database**، طبقةً طبقة.
- قراءة طلب HTTP خام وفهم methods, headers, status codes, cookies, caching, CORS.
- بناء خادم HTTP **من TCP الخام** (Project 3).

---

## 📚 الوحدات

| # | الوحدة | المفاهيم | الحالة |
|---|---|---|---|
| 2.1 | [Bits, Bytes, Binary, Hex, Data Representation](module-2.1-bits-bytes-encoding.md) | bit, byte, binary, hex, integers, floating point, ASCII/UTF-8, `Buffer`, encoding bugs | ✅ |
| 2.2 | [CPU, Registers, Instructions, Cache, RAM, Storage](module-2.2-cpu-cache-ram.md) | instruction cycle, registers, cache hierarchy, locality, why the hierarchy matters | ✅ |
| 2.3 | [Memory: Stack, Heap, References, GC, Leaks](module-2.3-memory-stack-heap-gc.md) | call stack, heap, allocation, reference semantics, `const` vs immutability, GC (mark & sweep), leak patterns, heap snapshots | ✅ |
| 2.4 | [Operating Systems](module-2.4-operating-systems.md) | process mgmt, memory mgmt (virtual memory concept), file system, permissions, networking, devices, syscalls | ✅ |
| 2.5 | [Process Deep Dive](module-2.5-process-deep-dive.md) | program vs process (revisited), memory layout, PID, env, lifecycle, exit codes, **signals** (SIGINT/SIGTERM/SIGKILL), graceful shutdown | ✅ |
| 2.6 | [Threads](module-2.6-threads.md) | process → thread, shared memory, context switch, worker threads in Node | ✅ |
| 2.7 | [Concurrency vs Parallelism; The Event Loop](module-2.7-concurrency-event-loop.md) | concurrency (progress) vs parallelism (simultaneous), event loop phases, microtasks/macrotasks, blocking the loop, libuv thread pool, DB/web server examples | ✅ |
| 2.8 | [Networking From Zero](module-2.8-networking-from-zero.md) | network, IP (v4/v6), port (revisited), packet, routing, private/public, NAT (concept) | ✅ |
| 2.9 | [TCP & UDP](module-2.9-tcp-udp.md) | connection, 3-way handshake, reliability, ordering, flow control, congestion (concept), keep-alive, connection pools, UDP when/why | ✅ |
| 2.10 | [DNS](module-2.10-dns.md) | domain → resolver → root → TLD → authoritative → IP; TTL; `dig`; a real traced request | ✅ |
| 2.11 | [TLS](module-2.11-tls.md) | encryption, symmetric/asymmetric (concept), certificates, CA, chain of trust, handshake, HTTPS | ✅ |
| 2.12 | [HTTP — From Zero to Professional](module-2.12-http.md) | request/response anatomy, methods (GET/POST/PUT/PATCH/DELETE), headers, body, status codes, cookies, caching headers, auth headers, CORS, HTTP/1.1 vs 2 vs 3 (concept) | ✅ |
| 2.13 | [Web Application Architecture](module-2.13-web-app-architecture.md) | all layers connected: Browser → DNS → TLS → HTTP → Server → App → DB; where time goes; where failures happen | ✅ |
| 🛠 | [Project 3: HTTP Server from scratch](../projects/project-3-http-server/README.md) | raw TCP → parse HTTP → node:http، تأطير، keep-alive، إغلاق رشيق، 14 AC | ✅ |
| ✔ | [Checkpoint 2](checkpoint-2.md) | 55 سؤالًا، 5 مهام، 8 سيناريوهات، 5 تصاميم | ✅ |

---

## 🧠 النماذج الذهنية لهذا المستوى

```
CPU → Cache → RAM → Storage → Network        (كل خطوة أبطأ ~100-1000×)

Program (disk) → Process (RAM) → Thread(s) (execution)

Concurrency  = multiple tasks make progress
Parallelism  = multiple tasks execute at the same instant

Browser → DNS → TCP → TLS → HTTP → Server → Application → Database
```

---

## 🔁 ما الذي سيعود لاحقًا؟

| المفهوم هنا | يعود في |
|---|---|
| Memory hierarchy | L3-M13 (why indexes), L5-M8 (caching), L7-M8 (performance) |
| Process & signals | L5-M11 (Docker), L5-M10 (deployment), L7-M4 (scaling) |
| Event loop | L5-M6 (concurrency bugs), L7-M8 (performance) |
| TCP | L5-M7 (connection pools), L7-M2 (timeouts/retries) |
| HTTP | L5-M1 (API design), L5-M2 (auth), L5-M8 (caching), L7 |

---

## ➡️ ما التالي؟

بعد Checkpoint 2 → **LEVEL 3 — Core Computer Science**: هياكل البيانات، الخوارزميات، Big-O كأدوات حكم؛ ثم قواعد البيانات وSQL من الصفر.
