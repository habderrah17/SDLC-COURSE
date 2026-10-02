# LEVEL 4 — أسس هندسة البرمجيات
## Software Engineering Foundations

---

## 📍 أين أنا؟

```
✅ LEVEL 0  Absolute Foundations
✅ LEVEL 1  Programming + Computational Thinking
✅ LEVEL 2  Computer Systems
✅ LEVEL 3  Core Computer Science
▶ LEVEL 4  Software Engineering Foundations        ← أنت هنا
  LEVEL 5  Building Real Software
  LEVEL 6  Professional Engineering
  LEVEL 7  Advanced Systems
  LEVEL 8  AI-Native Software Engineering
  LEVEL 9  Professional Capstone
```

**درجة النضج:** DEVELOPER → **ENGINEER** (يصمّم ويتحقق).

---

## 🚪 الانتقال الكبير

```
Computer Science explains:       "How systems work."
                                 كيف تعمل الأنظمة

Software Engineering explains:   "How humans build and evolve software systems."
                                 كيف يبني البشر الأنظمة ويطوّرونها
```

حتى الآن تعلمت أن تجعل **الآلة** تفعل ما تريد. من الآن تتعلم أن تجعل **البشر** (أنت بعد 6 أشهر، زملاؤك، من سيرث كودك) قادرين على فهم وتغيير ما بنيت — وأن تبني **الشيء الصحيح** أصلًا.

---

## 🎯 ماذا يجب أن أعرف الآن؟

**قبل هذا المستوى:**
- Levels 0–3 كاملة، خصوصًا Git (L1)، modules (L1)، Project 4.

**بعد هذا المستوى** يجب أن تستطيع:
- شرح **SDLC** بكل مراحلها ولماذا هي **تكرارية** لا خطية.
- كتابة **متطلبات** حقيقية: functional, non-functional, constraints, assumptions, **acceptance criteria** (Given/When/Then)، ومعرفة حدود user stories.
- **تقدير** مهمة بتفكيكها وتحديد المخاطر، وشرح لماذا التقديرات غير مؤكدة.
- تطبيق **التجريد، التغليف، الوحدات، الاقتران والتماسك** على كود حقيقي.
- شرح **SOLID** كحكم لا كدوغما: لكل مبدأ مثال سيء، refactoring، ومتى **لا** تطبّقه.
- التعرف على 6 **أنماط تصميم** (Adapter, Strategy, Factory, Observer, Repository, DI) بالمشكلة والحل والمقايضة.
- كتابة **كود نظيف**: تسمية، دوال، تكرار، آثار جانبية.
- كتابة **اختبارات** unit/integration/e2e ومعرفة ماذا تختبر ولماذا، وبناء الثقة منها.
- **التصحيح بعمق**: stack traces, logs, breakpoints, profilers, network tools, DB inspection.
- **إعادة الهيكلة** بأمان بدون تغيير السلوك.
- التعامل مع **كود قديم ضخم**: archaeology, characterization tests, safe change.
- التفريق بين **الدين التقني** والكود السيئ.

---

## 📚 الوحدات

| # | الوحدة | المفاهيم | الحالة |
|---|---|---|---|
| 4.0 | CS vs SE — The Transition | why "it works" is the beginning, not the end; engineering judgment | 📋 |
| 4.1 | SDLC in Detail | Discovery → Requirements → Analysis → Planning → Design → Implementation → Testing → Review → Build → Release → Deploy → Monitor → Feedback → Maintain → Evolve; iterative reality; where projects die | 📋 |
| 4.2 | Requirements | what is a requirement, FR vs NFR, constraints, assumptions, ambiguity hunting, "feature ≠ requirement" | 📋 |
| 4.3 | User Stories & Acceptance Criteria | As a / I want / So that; Given / When / Then; limitations; INVEST; definition of done | 📋 |
| 4.4 | Engineering Estimation | why uncertain, decomposition, relative sizing, cone of uncertainty, risk-first, communicating ranges | 📋 |
| 4.5 | Software Design | requirements → architecture → design → implementation; design before code; sketching boundaries | 📋 |
| 4.6 | Abstraction, Encapsulation, Modularity | `sendEmail()` hides SMTP/auth/retry; interfaces; information hiding; module boundaries | 📋 |
| 4.7 | Coupling & Cohesion | types of coupling, measuring cohesion, simple → professional examples, dependency direction | 📋 |
| 4.8 | SOLID (Without Dogma) | S/O/L/I/D each: beginner explanation, bad example, refactor, professional reading, when NOT to apply | 📋 |
| 4.9 | Design Patterns That Matter | Adapter, Strategy, Factory, Observer, Repository, Dependency Injection — problem/solution/tradeoff; anti-patterns | 📋 |
| 4.10 | Clean Code | naming, function size & shape, duplication (and when it's OK), side effects, cyclomatic complexity, readability > cleverness | 📋 |
| 4.11 | Testing From Zero | why tests exist, unit/integration/e2e, test pyramid/trophy, AAA, what to test, test doubles, TDD (pragmatic), `Code → Expected → Test → Confidence` | 📋 |
| 4.12 | Debugging Deeply | stack traces (async!), structured logs, breakpoints & conditional breakpoints, CPU/memory profilers, network tools, DB query inspection, bisecting | 📋 |
| 4.13 | Refactoring | behavior-preserving change, small steps, catalog (extract, inline, rename, move), refactor under test | 📋 |
| 4.14 | Legacy Code | joining a huge codebase: repository archaeology, reading tests, git history/blame, logs, tracing execution, seams, characterization tests, safe change | 📋 |
| 4.15 | Technical Debt | debt vs bad code, deliberate vs accidental, interest, tracking, paying down strategically | 📋 |
| ✔ | Checkpoint 4 | | 📋 |

---

## 🧠 النماذج الذهنية لهذا المستوى

```
Requirements → Architecture → Design → Implementation

Code → Expected behavior → Test → Confidence

Working code → better structure → same behavior     (refactoring)

Problem Discovery → ... → Evolution → (iterate)      (SDLC)
```

---

## 🔁 ما الذي سيعود لاحقًا؟

| المفهوم هنا | يعود في |
|---|---|
| Requirements / Acceptance criteria | L5 كل مشروع, L8-M6 (AI delegation), L9 capstone |
| Design principles | L6-M9 (architecture styles), L7-M6 (system design) |
| Testing | L5-M12 (CI/CD), L8-M7 (AI verification) |
| Debugging | L6-M7 (incidents), L7 (distributed debugging) |
| Legacy code | L8-M5 (context engineering for AI on existing repos) |

---

## ➡️ ما التالي؟

بعد Checkpoint 4 → **LEVEL 5 — Building Real Software**: API design, authentication, authorization, security, concurrency, caching, queues, Docker, CI/CD, deployment — ومشروعان كبيران.
