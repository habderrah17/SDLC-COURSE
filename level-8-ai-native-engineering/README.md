# LEVEL 8 — هندسة البرمجيات في عصر الذكاء الاصطناعي
## AI-Native Software Engineering

---

## 📍 أين أنا؟

```
✅ LEVEL 0–7
▶ LEVEL 8  AI-Native Software Engineering          ← أنت هنا
  LEVEL 9  Professional Capstone
```

**درجة النضج:** SENIOR-LEVEL THINKING → **AI-NATIVE ENGINEER** (يوجّه AI مع الاحتفاظ بالملكية الهندسية).

---

## ❓ لماذا الآن وليس من البداية؟

```
بدون Levels 0–7:                      مع Levels 0–7:
AI يكتب → "يعمل" → تنشر → يفشل        AI يكتب → تتحقق (8 خطوات) → تصلح → تنشر → تراقب → تتعلم
         ↑                                      ↑
   لا تستطيع التحقق                    تستطيع، لأنك تفهم كل طبقة
```

> **AI يضاعف قدرة من يفهم، ويضاعف أخطاء من لا يفهم.**

---

## 🎯 ماذا يجب أن أعرف الآن؟

**قبل هذا المستوى:** كل ما سبق. خصوصًا: requirements (L4), testing (L4), security (L5), code review (L6), failure modes (L7).

**بعد هذا المستوى** يجب أن تستطيع:
- شرح **ما يتغير وما لا يتغير** عندما يستطيع AI توليد الكود.
- التفريق بين **vibe coding** والهندسة، وتحديد أين تنتهي المسؤولية في كلٍّ.
- **رسم AI على كل مرحلة من SDLC** مع إبقاء الحكم البشري مسؤولًا.
- شرح **AI agents**: agent, tools, context, planning, execution, feedback, verification.
- **هندسة السياق** (context engineering): جعل AI يفهم مستودعك ومعماريتك وقواعدك.
- **التفويض المنظّم**: تحويل "ابنِ authentication" إلى مهمة بمتطلبات وقيود ومعايير قبول واختبارات.
- تطبيق **سلسلة التحقق الإلزامية**: Compile → Typecheck → Tests → Behavior → Security → Performance → Architecture → Human Review.
- التعرف على **أنماط فشل AI**: hallucinated/outdated APIs, wrong assumptions, vulnerabilities, missing edge cases, over-abstraction, duplication, inconsistent architecture.
- فهم **أمان AI**: prompt injection, repo instruction poisoning, malicious files/comments, tool permissions, secret exposure, destructive commands.
- تحديد **حدود Human-in-the-Loop** الصلبة.
- ممارسة **الحلقة**: UNDERSTAND → SPECIFY → DESIGN → DELEGATE → VERIFY → REVIEW → INTEGRATE → DEPLOY → OBSERVE → LEARN.

---

## 📚 الوحدات

| # | الوحدة | المفاهيم | الحالة |
|---|---|---|---|
| 8.1 | What Changes When AI Can Generate Code? | cost of writing ↓, cost of verifying ↑, specification as the core skill; what stays the same | 📋 |
| 8.2 | Vibe Coding vs Engineering | Prompt → Code → "Looks good" ≠ engineering; Understand → Specify → Design → Delegate → Implement → Verify → Review → Deploy → Observe | 📋 |
| 8.3 | AI-Assisted SDLC | per phase: what AI helps with / what humans own; Discovery, Requirements, Design, Implementation, Testing, Review, Documentation, Operations | 📋 |
| 8.4 | AI Agents | agent loop, tools, context window, planning, execution, feedback, verification; autonomy levels | 📋 |
| 8.5 | Context Engineering | repository context, architecture docs, conventions files, requirements, tests as spec, constraints; what to include/exclude | 📋 |
| 8.6 | AI Delegation | BAD: "Build authentication." GOOD: requirements + constraints + architecture + acceptance criteria + security requirements + tests + out-of-scope | 📋 |
| 8.7 | AI Verification | the 8-step chain; tests that actually test; reviewing AI code as a stranger's code; verification log | 📋 |
| 8.8 | AI Failure Modes | hallucinated APIs, outdated APIs, wrong assumptions, security vulnerabilities, incomplete edge cases, excessive abstraction, duplicated logic, inconsistent architecture — with real examples | 📋 |
| 8.9 | AI Security | prompt injection, repository instruction poisoning, malicious files/comments, tool permissions & sandboxing, secret exposure, destructive commands, supply chain | 📋 |
| 8.10 | Human-in-the-Loop | hard gates: DB migrations, auth, payments, security, production deploy, destructive ops, infra changes; approval workflows | 📋 |
| 8.11 | The AI-Era Engineering Loop | UNDERSTAND → SPECIFY → DESIGN → DELEGATE → VERIFY → REVIEW → INTEGRATE → DEPLOY → OBSERVE → LEARN as daily practice | 📋 |
| 🛠 | [Project 8: AI-assisted Engineering Project](../projects/README.md#project-8) | | 📋 |
| ✔ | Checkpoint 8 | | 📋 |

---

## 🧠 النماذج الذهنية لهذا المستوى

```
UNDERSTAND → SPECIFY → DESIGN → DELEGATE → VERIFY
→ REVIEW → INTEGRATE → DEPLOY → OBSERVE → LEARN

Verify: Compile → Typecheck → Tests → Behavior → Security → Performance → Architecture → Human Review

Never ask AI: "Explain everything." / "Write the solution."
Ask AI:       "What evidence supports this?" / "Which assumption is wrong?"
              "What edge cases are missing?" / "How can I test this?" / "What security issue could exist?"
```

---

## 🛑 ما لا يُفوَّض أبدًا بدون مراجعة بشرية صريحة

```
Database migrations · Authentication · Payments · Security-sensitive code
Production deployment · Destructive operations · Infrastructure changes
```

---

## ➡️ ما التالي؟

بعد Checkpoint 8 → **LEVEL 9 — Professional Capstone**: تطبيق SaaS كامل بـ SDLC كاملة، مرتين: بقيادة بشرية، وبمساعدة AI.
