# LEVEL 6 — الهندسة الاحترافية
## Professional Engineering

---

## 📍 أين أنا؟

```
✅ LEVEL 0–5
▶ LEVEL 6  Professional Engineering                ← أنت هنا
  LEVEL 7  Advanced Systems
  LEVEL 8  AI-Native Software Engineering
  LEVEL 9  Professional Capstone
```

**درجة النضج:** PROFESSIONAL ENGINEER (يعمل في فريق، يتحمّل مسؤولية الإنتاج).

> حتى الآن عملت وحدك. الهندسة الحقيقية **نشاط جماعي**: كودك يقرؤه غيرك، قراراتك يراجعها غيرك، ونظامك يوقظك في الليل.

---

## 🎯 ماذا يجب أن أعرف الآن؟

**قبل هذا المستوى:**
- Level 4 (SDLC, requirements, testing, refactoring), Level 5 (Project 6 يعمل في Docker مع CI).

**بعد هذا المستوى** يجب أن تستطيع:
- العمل بتذاكر وissues وPRs بشكل احترافي: وصف واضح، scope محدد، commits منظمة.
- **مراجعة كود** بمنهجية: Correctness, Security, Performance, Architecture, Tests, Maintainability — وكتابة تعليقات مفيدة.
- المشاركة في **design review** وكتابة **RFC** و**ADR** بلغة المقايضات.
- التواصل بصيغ هندسية: *"Assumption / Constraint / Tradeoff / Risk / Alternative / Recommendation based on context"*.
- كتابة **توثيق** يُستخدم فعلًا: README, architecture docs, runbooks.
- بناء **observability**: structured logs, metrics (RED/USE), traces، والإجابة على "ماذا يفعل الإنتاج الآن؟".
- قيادة **استجابة لحادثة**: detect → investigate → mitigate → recover → learn، وكتابة postmortem بلا لوم.
- التفكير **بمنطق المنتج**: Feature ≠ Requirement؛ User / Problem / Business Goal / Constraint / Success Criteria.
- مقارنة **أنماط المعمارية** (layered, feature-based, modular monolith, microservices) واختيار الأبسط الكافي.

---

## 📚 الوحدات

| # | الوحدة | المفاهيم | الحالة |
|---|---|---|---|
| 6.1 | Working in a Team | tickets/issues, scoping, branching strategies, PR hygiene, commit messages, definition of done, async communication | 📋 |
| 6.2 | Code Review | reviewer mindset, checklist (correctness/security/perf/architecture/tests/maintainability), comment tone, author's side, **flawed-code challenges + senior review** | 📋 |
| 6.3 | Design Review, RFCs, ADRs | when to write, template, alternatives considered, reversibility, decision records as team memory | 📋 |
| 6.4 | Engineering Communication | "Assumption: / Constraint: / Tradeoff: / Risk: / Alternative: / Recommendation based on context:"; disagreeing well; escalation | 📋 |
| 6.5 | Documentation | README that works, architecture docs (C4-lite), runbooks, API docs, keeping docs alive | 📋 |
| 6.6 | Observability | logs (structured, levels, correlation ids), metrics (RED/USE, percentiles), traces (spans, distributed), dashboards, alerts that matter | 📋 |
| 6.7 | Incident Response | severity, on-call, detect → investigate → mitigate → recover → learn; communication during incidents; blameless postmortems | 📋 |
| 6.8 | Product Thinking | feature ≠ requirement; user, problem, business goal, constraint, success criteria; saying no; measuring outcomes | 📋 |
| 6.9 | Software Architecture Styles | layered, feature-based (vertical slices), **modular monolith** (why it's often best), microservices (why/when/cost), evolutionary architecture | 📋 |
| ✔ | Checkpoint 6 | | 📋 |

---

## 🧠 النماذج الذهنية لهذا المستوى

```
Review:   Correctness → Security → Performance → Architecture → Tests → Maintainability

Incident: detect → investigate → mitigate → recover → learn

Observability: Logs (what happened) + Metrics (how much/how fast) + Traces (where)

Architecture: start simplest → modular monolith → microservices only when forced
```

---

## ➡️ ما التالي؟

بعد Checkpoint 6 → **LEVEL 7 — Advanced Systems**: الأنظمة الموزعة من خادم واحد إلى عشرة، الفشل الجزئي، CAP بشكل صحيح، الموثوقية، وعملية system design القابلة للتكرار.
