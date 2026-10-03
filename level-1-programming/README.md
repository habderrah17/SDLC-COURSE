# LEVEL 1 — البرمجة والتفكير الحاسوبي
## Programming + Computational Thinking

---

## 📍 أين أنا؟ (Where am I?)

```
✅ LEVEL 0  Absolute Foundations
▶ LEVEL 1  Programming + Computational Thinking    ← أنت هنا
  LEVEL 2  Computer Systems
  LEVEL 3  Core Computer Science
  LEVEL 4  Software Engineering Foundations
  LEVEL 5  Building Real Software
  LEVEL 6  Professional Engineering
  LEVEL 7  Advanced Systems
  LEVEL 8  AI-Native Software Engineering
  LEVEL 9  Professional Capstone
```

**درجة النضج:** BEGINNER → **يستطيع كتابة كود**.

---

## 🎯 ماذا يجب أن أعرف الآن؟

**قبل هذا المستوى (من Level 0):**
- ما البرنامج، ما العملية، ما بيئة التشغيل (Node)، ما compile-time vs runtime.
- الطرفية، المسارات، متغيرات البيئة، exit codes.
- أن الشبكة بطيئة وتفشل (سنحتاجها عند async).

**بعد هذا المستوى** يجب أن تستطيع:
- كتابة برامج TypeScript صغيرة **من الصفر** بدون framework: قراءة مدخلات، تحويل بيانات، إخراج نتائج.
- شرح النموذجين: `Input → Logic → State → Output` و`Data → Transformation → Result`.
- التفريق بين **القيمة والمرجع**، وشرح لماذا `const user = {...}` قابل للتعديل.
- شرح **الدالة، النطاق (scope)، الإغلاق (closure)، الحالة، الأثر الجانبي، الثبات (immutability)**.
- قراءة **stack trace** وتحديد السطر المسبب، واستخدام **breakpoints**.
- كتابة كود **غير متزامن** بـ `async/await` وشرح **لماذا** يوجد (I/O بطيء من Level 0) و**ما الـ event loop** بشكل أولي.
- استخدام **Git** بثقة: commit, branch, merge, rebase, remote, PR, revert, cherry-pick, bisect.
- تطبيق حلقة **Observe → Hypothesize → Test → Fix → Verify** على أي bug.

---

## 📚 الوحدات (Modules)

| # | الوحدة | المفاهيم | الحالة |
|---|---|---|---|
| 1.0 | [Setting Up: Node.js, TypeScript, Editor](module-1.0-setup.md) | تثبيت، `tsc`، `tsconfig` strict، تشغيل أول ملف، DevTools/VS Code debugger | ✅ |
| 1.1 | [Values, Variables, Types](module-1.1-values-variables-types.md) | value, variable, `let/const`, primitive types, `typeof`, type annotations | ✅ |
| 1.2 | [Expressions, Operators, Conditions](module-1.2-expressions-conditions.md) | expression vs statement, operators, `===`, truthiness, `if/else/switch`, early return | ✅ |
| 1.3 | [Loops & Iteration](module-1.3-loops.md) | `for`, `while`, `for..of`, `break/continue`, off-by-one | ✅ |
| 1.4 | [Functions, Scope, Closures](module-1.4-functions-scope-closures.md) | parameters/arguments, return, scope chain, closure, arrow functions, higher-order functions | ✅ |
| 1.5 | [Arrays & Transformations](module-1.5-arrays.md) | index, length, `push/pop/shift`, `map/filter/reduce/find/some/every`, iteration, mutation vs copy | ✅ |
| 1.6 | [Objects & References](module-1.6-objects-references.md) | properties, nested objects, **reference vs value** (first pass), `JSON`, optional chaining | ✅ |
| 1.7 | [State, Side Effects, Immutability](module-1.7-state-side-effects-immutability.md) | `Input → Logic → State → Output`; state, side effect, pure function, immutability | ✅ |
| 1.8 | [Modules](module-1.8-modules.md) | `import/export`, module boundaries, `package.json`, `npm`, dependencies | ✅ |
| 1.9 | [Errors: Exceptions, Result, Fail Fast](module-1.9-errors.md) | `Error`, `throw`, `try/catch/finally`, error types, when to throw vs return, stack trace anatomy | ✅ |
| 1.10 | [Input / Output](module-1.10-io.md) | `process.argv`, stdin/stdout, `fs` read/write, streams (intro), JSON files | ✅ |
| 1.11 | [Async & the Event Loop](module-1.11-async-event-loop.md) | why async (I/O!), callbacks → promises → `async/await`, `Promise.all`, event loop (intro), common async bugs | ✅ |
| 1.12 | [Debugging as a Method](module-1.12-debugging.md) | reading errors, stack traces, `console` family, breakpoints, watch, step over/into, reproducing, hypotheses | ✅ |
| 1.13 | [Git I: Snapshots, Commits, Branches](module-1.13-git-1.md) | what problem Git solves, repo, working tree, staging, commit, log, diff, branch, merge, conflicts | ✅ |
| 1.14 | [Git II: Remotes, PRs, Conflicts, Bisect](module-1.14-git-2.md) | remote, clone, push/pull, PR, rebase, interactive rebase, revert, reset, cherry-pick, bisect, stash | ✅ |
| 1.15 | [TypeScript Types: Thinking in Types](module-1.15-typescript-types.md) | interfaces, type aliases, unions, literal types, narrowing, generics (intro), `unknown` vs `any`, utility types | ✅ |
| 🛠 | [Project 1: CLI Application](../projects/project-1-cli/README.md) | todo CLI، نواة نقية، exit codes، Git | ✅ |
| 🛠 | [Project 2: Data-Processing Program](../projects/project-2-data-processing/README.md) | CSV → report.json، تحقق، سنتات، اختبارات | ✅ |
| ✔ | [Checkpoint 1](checkpoint-1.md) | 62 سؤالًا، 5 مهام، 7 سيناريوهات، 5 تصاميم | ✅ |

---

## 🧠 النماذج الذهنية لهذا المستوى

```
Input  →  Program Logic  →  State  →  Output
 (مدخل)      (منطق)         (حالة)     (مخرج)

Data  →  Transformation  →  Result
(بيانات)     (تحويل)          (نتيجة)

Observe → Hypothesize → Test → Fix → Verify      (debugging)
```

---

## ⚠️ ما لن نفعله في هذا المستوى (عمدًا)

- **لا frameworks** (React, Express, Next). تتعلم البرمجة أولًا.
- **لا مكتبات خارجية** تقريبًا (باستثناء TypeScript وأداة اختبار بسيطة في Project 2).
- **لا AI لكتابة الكود.** يُسمح بسؤاله "لماذا" بعد أن تحاول.

---

## 🔁 ما الذي سيعود لاحقًا؟

| المفهوم هنا | يعود في |
|---|---|
| Reference vs Value | L2-M3 (Stack/Heap/GC) بعمق |
| Async / Event loop (intro) | L2-M7 (Concurrency, Event loop بعمق), L5-M6 (Races) |
| Errors | L4-M9 (Error handling design), L6-M6 (Observability) |
| Git | L4 (SDLC), L6 (PRs, code review), L5 (CI/CD) |
| Modules | L4-M6 (Modularity), L6-M9 (Architecture) |
| Debugging | L4-M12 (Debugging Deeply) بأدوات أعمق |

---

## ➡️ ما التالي؟

بعد Checkpoint 1 → **LEVEL 2 — Computer Systems**: الآن وقد كتبت كودًا، سنفتح الغطاء: أين تعيش متغيراتك في الذاكرة فعلًا؟ ما الـ event loop حقًا؟ ماذا يحدث في الشبكة عند `fetch`؟
