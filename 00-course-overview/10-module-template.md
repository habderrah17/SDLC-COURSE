# قالب الوحدة الدراسية — Module Template

> كل وحدة في الكورس تتبع هذا القالب ذا الـ**19 قسمًا**. إذا رأيت وحدة تخالفه، فهي غير مكتملة.

---

```markdown
# Module X.Y — العنوان بالعربية
## English Title

> **المستوى:** Level X — ...
> **الموقع:** أنت في [X من Y] في هذا المستوى
> **السابق:** ... | **التالي:** ...

---

## 1. المتطلبات (Prerequisites)
> **قبل أن تتعلم هذا، يجب أن تفهم:**
- [ ] مفهوم A — من Module ...
- [ ] مفهوم B — من Module ...
> إن لم تفهم أحدها، ارجع إليه أولًا.

## 2. أهداف التعلّم (Learning Objectives)
بعد هذه الوحدة ستستطيع:
- ...

## 3. شرح للمبتدئ (Beginner Explanation)
بلغة بسيطة، بتشبيه من الحياة اليومية، بدون مصطلحات غير مشروحة.

## 4. النموذج الذهني (Mental Model)
الصورة التي يجب أن تبقى في رأسك.

## 5. الرسم التوضيحي (Visual Diagram)
Mermaid / ASCII / sequence diagram.

## 6. مثال بسيط (Simple Example)
بدون كود أو بكود من 3–5 أسطر.

## 7. مثال كود (Code Example)
TypeScript/JavaScript (أو لغة أخرى مع تبرير).

## 8. مثال من العالم الحقيقي (Real-World Example)
أين تراه في برمجيات تستخدمها يوميًا؟

## 9. مثال من الإنتاج (Production Example)
كيف يظهر في نظام حقيقي يخدم مستخدمين؟ ما المشكلة التي يسببها غيابه؟

## 10. مفاهيم خاطئة شائعة (Common Misconceptions)
"الناس يظنون X، لكن الحقيقة Y."

## 11. أخطاء شائعة (Common Mistakes)
أخطاء في الكود أو القرار.

## 12. تمرين تصحيح (Debugging Exercise)
كود/نظام معطوب. الحل في النهاية مطويّ.

## 13. تمرين معماري (Architecture Exercise)
سؤال تصميمي بدون إجابة واحدة صحيحة.

## 14. الصلة بعصر الذكاء الاصطناعي (AI-Era Relevance)
كيف يغيّر AI هذا الموضوع؟ ما الذي يجب أن تتحقق منه في كود AI هنا؟

## 15. ما يجب إتقانه (Must Master) 🔴
## 16. ما يجب فهمه (Should Understand) 🟠
## 17. ما يمكن تأجيله (Can Defer) ⚪

## 18. الخلاصة (Summary)
5–7 نقاط.

## 19. مراجع رسمية (Official References)
روابط لوثائق رسمية فقط (MDN, Node.js docs, PostgreSQL docs, RFCs, ...).

---
## المصطلحات في هذه الوحدة (Terminology)
| العربية | English |
|---|---|
```

---

## لماذا هذا القالب؟

| القسم | السبب |
|---|---|
| Prerequisites | منع القفز فوق حلقة ناقصة |
| Beginner → Mental Model → Visual | ثلاث طرق مختلفة لنفس الفكرة (نص، تجريد، صورة) |
| Simple → Code → Real-World → Production | تدرّج من المجرد إلى الملموس إلى المسؤولية |
| Misconceptions + Mistakes | ما يعرفه الخبير ولا يُكتب في الكتب |
| Debugging + Architecture Exercises | المهارتان اللتان تميّزان المهندس |
| AI-Era Relevance | ربط كل مفهوم بـ "ما الذي أتحقق منه في كود AI؟" |
| Master / Understand / Defer | منع الإرهاق المعرفي |
| Official References | تعويد على قراءة المصدر لا الملخصات |
