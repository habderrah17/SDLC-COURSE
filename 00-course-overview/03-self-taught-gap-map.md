# خريطة فجوات المتعلّم العصامي
# Self-Taught Knowledge Gap Map

> المتعلّم العصامي عادةً **قوي في الأعلى وضعيف في الأسفل**: يعرف React لكن لا يعرف ما هو الـ process. يعرف Prisma لكن لا يعرف ما هو الـ index.
> هذه الخريطة تحدد الفجوات الشائعة **بالأعراض** لتعرف أين تقف.

---

## 1. الصورة العامة

```
ما يعرفه العصامي عادةً                    ما ينقصه عادةً
─────────────────────────                 ─────────────────────────
Frameworks (React, Express, Next)   ←→    Why they exist / what they hide
Libraries (axios, prisma, lodash)   ←→    What happens underneath
Syntax (JS/TS, Python)              ←→    Memory model, execution model
"It works on my machine"            ←→    Process, environment, deployment
Copy-paste from StackOverflow/AI    ←→    Verification, debugging methodology
Building features                   ←→    Requirements, design, tradeoffs
Solo projects                       ←→    Team practices, code review, SDLC
```

---

## 2. اختبار التشخيص الذاتي (Self-Diagnosis)

أجب بصدق: **هل تستطيع شرح هذا لشخص آخر بدون بحث؟**

### Computer & OS

| السؤال | إن كان الجواب "لا" → |
|---|---|
| ما الفرق بين program و process؟ | Level 0, Module 3 |
| لماذا يظهر `EADDRINUSE: address already in use :::3000`؟ | Level 0, Module 5 |
| ما الذي يحدث في الذاكرة عند `const a = {x: 1}; const b = a; b.x = 2;`؟ | Level 2, Module 3 |
| لماذا Node.js "single-threaded" لكنه يتعامل مع آلاف الاتصالات؟ | Level 2, Module 7 |
| ما هو الـ environment variable ولماذا لا نضع الأسرار في الكود؟ | Level 0, Module 4 |
| ما الذي يحدث عند `Ctrl+C` في terminal؟ (signal) | Level 2, Module 5 |

### Networking

| السؤال | إن كان الجواب "لا" → |
|---|---|
| ما الذي يحدث بين كتابة `google.com` والضغط على Enter وظهور الصفحة؟ | Level 2, Modules 8–13 |
| ما الفرق بين TCP connection و HTTP request؟ | Level 2, Modules 9, 12 |
| ما هو الـ port ولماذا 443 و 80؟ | Level 0, Module 5 |
| لماذا يحتاج HTTPS شهادة (certificate)؟ | Level 2, Module 11 |
| ما الفرق بين 401 و 403؟ بين 400 و 422؟ بين 502 و 503؟ | Level 2, Module 12 |
| ما هو الـ CORS ولماذا يحدث فقط في المتصفح؟ | Level 2, Module 12 |

### Databases

| السؤال | إن كان الجواب "لا" → |
|---|---|
| لماذا الاستعلام سريع مع 1,000 صف وبطيء مع 10,000,000؟ | Level 3, Module 13 |
| ما هو الـ transaction ومتى تحتاجه؟ | Level 3, Module 14 |
| ما الفرق بين INNER JOIN و LEFT JOIN؟ | Level 3, Module 11 |
| ما هو N+1 query problem؟ | Level 3, Module 11 |
| كيف تصمم جداول لـ Users / Organizations / Orders؟ | Level 3, Module 12 |
| ماذا يحدث إذا حدّث مستخدمان نفس الصف في نفس اللحظة؟ | Level 5, Module 6 |

### Programming & CS

| السؤال | إن كان الجواب "لا" → |
|---|---|
| لماذا `array.includes()` داخل loop بطيء ومتى تستخدم Set؟ | Level 3, Modules 1–2, 8 |
| ما معنى O(n log n)؟ | Level 3, Module 8 |
| ما الفرق بين stack و queue وأين يظهران في JavaScript؟ | Level 3, Module 2 |
| ما هو الـ closure؟ | Level 1, Module 4 |
| لماذا `await` داخل `for` loop أبطأ من `Promise.all`؟ | Level 1, Module 11 |

### Software Engineering

| السؤال | إن كان الجواب "لا" → |
|---|---|
| ما الفرق بين requirement و feature؟ | Level 4, Module 2 |
| ما هي الـ acceptance criteria؟ | Level 4, Module 3 |
| ما الفرق بين unit test و integration test، وأيهما تكتب أولًا؟ | Level 4, Module 11 |
| كيف تغيّر كودًا قديمًا بدون اختبارات بأمان؟ | Level 4, Module 14 |
| ما الفرق بين `git merge` و `git rebase` ومتى تستخدم كلًّا منهما؟ | Level 1, Module 14 |
| كيف تجد الـ commit الذي كسر الميزة بين 200 commit؟ (bisect) | Level 1, Module 14 |

### Security

| السؤال | إن كان الجواب "لا" → |
|---|---|
| ما الفرق بين authentication و authorization؟ | Level 5, Modules 2–3 |
| لماذا لا نخزن كلمة المرور حتى لو مشفّرة (encrypted)، بل نستخدم hash؟ | Level 5, Module 2 |
| ما هو SQL injection وكيف تمنعه؟ | Level 5, Module 4 |
| ما هو IDOR؟ (`/api/users/123` → `/api/users/124`) | Level 5, Module 4 |
| ما هو الـ trust boundary؟ | Level 5, Module 4 |

### Production

| السؤال | إن كان الجواب "لا" → |
|---|---|
| ما الذي يحدث فعلًا عند "deploy"؟ | Level 5, Module 10 |
| ما الفرق بين Docker image و container؟ | Level 5, Module 11 |
| كيف تعرف أن الخادم بطيء قبل أن يشتكي المستخدمون؟ | Level 6, Module 6 |
| ماذا تفعل عندما يسقط الإنتاج في الثالثة فجرًا؟ | Level 6, Module 7 |
| ماذا يحدث عندما يُرسل webhook مرتين؟ | Level 7, Module 2 |

### AI

| السؤال | إن كان الجواب "لا" → |
|---|---|
| كيف تتحقق من أن الكود الذي كتبه AI صحيح وآمن؟ | Level 8, Module 7 |
| ما هو prompt injection في سياق coding agents؟ | Level 8, Module 9 |
| ما الذي يجب ألّا تدع AI يفعله بدون مراجعة بشرية؟ | Level 8, Module 10 |

---

## 3. أنماط الفجوات الشائعة (Common Gap Patterns)

### النمط 1: "The Framework Developer"
- **يعرف:** React, Next.js, Tailwind, Vercel
- **الفجوة:** لا يعرف ما يحدث تحت `fetch`، أو ما هو الـ server فعلًا، أو لماذا تظهر hydration errors
- **المسار:** Level 0 → 2 بتركيز خاص، ثم Level 5

### النمط 2: "The Script Writer"
- **يعرف:** Python scripts, automation, data munging
- **الفجوة:** لا يعرف كيف يبني نظامًا يعمل باستمرار، يتعامل مع مستخدمين متزامنين، ويُنشر
- **المسار:** Level 2 (process, concurrency) → Level 3 → Level 5

### النمط 3: "The AI-Assisted Builder"
- **يعرف:** كيف يصف ما يريده ويحصل على تطبيق يعمل
- **الفجوة:** لا يستطيع تصحيح الأخطاء عندما يفشل AI، لا يكتشف الثغرات، لا يعرف لماذا الكود مبني هكذا
- **المسار:** **كل المستويات بالترتيب**، مع تأجيل AI إلى Level 8 عمدًا

### النمط 4: "The Bootcamp Graduate"
- **يعرف:** CRUD app, REST, basic auth, Git basics
- **الفجوة:** لا يعرف CS (data structures, complexity, OS, networking)، ولا SE المتقدم (requirements, architecture, legacy, production)
- **المسار:** Level 2 → 3 بعمق، ثم Level 4 → 7

---

## 4. ما لا يُعلَّم عادةً خارج الجامعة (وسنعلّمه هنا)

```
✗ Memory model (stack/heap/references)
✗ Process model (what the OS actually does)
✗ Networking stack (TCP → TLS → HTTP as layers)
✗ Why indexes work (B-Trees, not magic)
✗ Why transactions exist (failure + concurrency)
✗ Complexity analysis as judgment, not interview trivia
✗ Requirements engineering
✗ Legacy code & safe change
✗ Threat modeling
✗ Distributed failure modes
✗ Observability & incident response
✗ Engineering communication (RFCs, ADRs, tradeoff language)
```

---

## 5. ما يُعلَّم في الجامعة ولا تحتاجه (ولن نضيّع وقتك فيه)

```
○ Compiler construction (parsing theory, LR grammars)
○ Automata theory, Turing machines (formally)
○ Advanced calculus / linear algebra for CS
○ Assembly programming in depth
○ OS kernel development
○ Formal verification
○ Advanced algorithm proofs
```

> سنذكر كل واحد منها **في سطر واحد**: ما هو، لماذا يوجد، أين يهم. ثم ننتقل.
