# المشاريع — Projects

> كل مشروع يُعرَّف بـ: الهدف، المفاهيم المطبّقة، معايير القبول (Given/When/Then)، تحديات مدمجة، وما يُسلَّم.
> التفاصيل المعمارية لكل مشروع تُكتب في مجلده عند الوصول إليه في المنهج.

| # | المشروع | المستوى | المجلد | الحالة |
|---|---|---|---|---|
| 1 | <a id="project-1"></a>[CLI Application (todo manager)](project-1-cli/README.md) | L1 | `project-1-cli/` | ✅ |
| 2 | <a id="project-2"></a>[Data-Processing Program (CSV → report)](project-2-data-processing/README.md) | L1 | `project-2-data-processing/` | ✅ |
| 3 | <a id="project-3"></a>[HTTP Server from scratch (raw TCP → HTTP → node:http)](project-3-http-server/README.md) | L2 | `project-3-http-server/` | ✅ |
| 4 | <a id="project-4"></a>[Database-backed API (PostgreSQL, raw SQL)](project-4-db-api/README.md) | L3 | `project-4-db-api/` | ✅ |
| 5 | <a id="project-5"></a>Authenticated Application | L5 | `project-5-auth-app/` | 📋 |
| 6 | <a id="project-6"></a>Production-style Backend (cache, queue, worker, Docker, CI/CD, observability) | L5 | `project-6-production-backend/` | 📋 |
| 7 | <a id="project-7"></a>Distributed System Exercise (3 services + injected failures) | L7 | `project-7-distributed/` | 📋 |
| 8 | <a id="project-8"></a>AI-assisted Engineering Project | L8 | `project-8-ai-assisted/` | 📋 |
| C | Capstone SaaS (Mode A + Mode B) | L9 | `capstone/` | 📋 |

النظرة العامة والتدرّج: [`../00-course-overview/06-project-progression.md`](../00-course-overview/06-project-progression.md)

---

## قالب كل مشروع (Project Template)

```markdown
# Project N — العنوان

## 1. المشكلة (Problem)
من المستخدم؟ ما مشكلته؟ (ليس "ماذا نبني" بل "لماذا")

## 2. المتطلبات (Requirements)
### Functional
### Non-Functional
### Constraints
### Assumptions
### Out of scope

## 3. معايير القبول (Acceptance Criteria)
Given / When / Then لكل متطلب وظيفي

## 4. المفاهيم المطبّقة (Concepts Applied)
جدول: المفهوم → الوحدة → أين يظهر في المشروع

## 5. التصميم (Design)
رسم + قرارات + بدائل مرفوضة (من Project 4 فصاعدًا)

## 6. خطة التنفيذ (Implementation Plan)
خطوات صغيرة، كل واحدة قابلة للاختبار

## 7. التحديات المدمجة (Built-in Challenges)
- Debugging: نسخة معطوبة
- Architecture: "ماذا لو ×100؟"
- Security / Failure / Performance (حسب المستوى)

## 8. المخرجات (Deliverables)
كود + اختبارات + README + (docs/ من Project 4)

## 9. قائمة المراجعة الذاتية (Self-Review Checklist)
```
