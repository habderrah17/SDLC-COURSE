# Checkpoint 1 — نقطة التفتيش: البرمجة والتفكير الحاسوبي
## Checkpoint 1 — Programming + Computational Thinking

> **لا تنتقل إلى Level 2 قبل اجتياز الأقسام الأربعة** وتسليم Project 1 و Project 2.
> اجتياز = تجيب **بكلماتك، بدون الرجوع للوحدات**، وتستطيع شرحها لشخص آخر، **وتكتب الكود المطلوب بيدك**.
> إن فشلت في سؤال، الرابط بجانبه يعيدك للوحدة.

---

## القسم 1: الفحص المفاهيمي (Conceptual Check)

### الإعداد والأنواع
1. ما الفرق بين `tsx` و`tsc --noEmit`؟ لماذا نحتاج الاثنين؟ ولماذا يُكتب `.js` في استيراد ملف `.ts`؟ — [M1.0](module-1.0-setup.md)
2. لماذا `npm ci` في CI وليس `npm install`؟ ما دور `package-lock.json`؟ — [M1.0](module-1.0-setup.md)
3. لماذا `0.1 + 0.2 !== 0.3`؟ ما النتيجة العملية على تمثيل المال؟ — [M1.1](module-1.1-values-variables-types.md)
4. `undefined` vs `null`: متى يظهر كلٌّ منهما؟ لماذا `process.argv[2]` نوعه `string | undefined`؟ — [M1.1](module-1.1-values-variables-types.md)
5. "الأنواع تُمحى وقت التشغيل" — ما النتيجة على البيانات القادمة من ملف أو شبكة؟ — [M1.1](module-1.1-values-variables-types.md), [M1.15](module-1.15-typescript-types.md)

### التحكم بالتدفق
6. ما الفرق بين تعبير وجملة؟ أعطِ مثالين لكل. — [M1.2](module-1.2-expressions-conditions.md)
7. اذكر القيم الـ falsy الست. لماذا `discount || 10` خطأ و`discount ?? 10` صحيح؟ — [M1.2](module-1.2-expressions-conditions.md)
8. ما شرط الحراسة؟ كيف يقلّل التعشيش؟ — [M1.2](module-1.2-expressions-conditions.md)
9. ما الخطأ بواحد؟ لماذا `for...of` أأمن من `for (i…)`؟ ما شرط كل حلقة `while` سليمة؟ — [M1.3](module-1.3-loops.md)
10. حلقة داخل حلقة على 100,000 عنصر — كم عملية تقريبًا؟ ماذا يعني هذا؟ — [M1.3](module-1.3-loops.md)

### الدوال والنطاق
11. parameter vs argument؛ ما التوقيع ولماذا هو "عقد"؟ — [M1.4](module-1.4-functions-scope-closures.md)
12. اشرح قاعدة النطاق "الداخل يرى الخارج". لماذا `let` في الحلقة يُصلح bug الـ `setTimeout`؟ — [M1.4](module-1.4-functions-scope-closures.md)
13. ما الإغلاق؟ لماذا يبقى `count` حيًا بعد انتهاء `makeCounter()`؟ أين يعيش؟ — [M1.4](module-1.4-functions-scope-closures.md)
14. كيف تقرأ stack trace؟ ما أول سطر تنظر إليه ولماذا؟ — [M1.4](module-1.4-functions-scope-closures.md), [M1.12](module-1.12-debugging.md)
15. عرّف الدالة النقية بشرطيها. لماذا نفضّلها؟ — [M1.4](module-1.4-functions-scope-closures.md)

### البيانات
16. صنّف: `push`, `map`, `sort`, `toSorted`, `filter`, `splice`, `slice` — أيها يعدّل الأصل؟ — [M1.5](module-1.5-arrays.md)
17. لماذا `[10, 9, 1].sort()` يعيد `[1, 10, 9]`؟ — [M1.5](module-1.5-arrays.md)
18. ماذا يحدث لـ `reduce` بلا قيمة أولية على مصفوفة فارغة؟ — [M1.5](module-1.5-arrays.md)
19. **القيمة vs المرجع**: اشرح بـ `let b = a` لرقم ولكائن. لماذا `const o = {}` قابل للتعديل؟ — [M1.6](module-1.6-objects-references.md)
20. `{...o}` vs `structuredClone(o)` — ما الفرق ومتى يخدعك الأول؟ — [M1.6](module-1.6-objects-references.md)
21. لماذا `{x:1} === {x:1}` false؟ وما الذي يقارنه `includes` مع كائنات؟ — [M1.6](module-1.6-objects-references.md)
22. اذكر 4 حدود لـ JSON. ما نوع ما يعيده `JSON.parse` فعلًا وما يجب أن تعامله كـ؟ — [M1.6](module-1.6-objects-references.md)

### الحالة والهيكل
23. ما الحالة؟ لماذا هي المصدر الأول للتعقيد؟ ما أخطر تركيبة في البرمجة؟ — [M1.7](module-1.7-state-side-effects-immutability.md)
24. صنّف 4 أنواع من الآثار الجانبية. ما الهدف: إلغاؤها أم حصرها؟ أين؟ — [M1.7](module-1.7-state-side-effects-immutability.md)
25. اشرح "نواة نقية + قشرة بآثار" وارسمها. كيف تجعل الاختبار سهلًا؟ — [M1.7](module-1.7-state-side-effects-immutability.md)
26. `readonly` vs `Object.freeze` — متى يعمل كلٌّ منهما؟ — [M1.7](module-1.7-state-side-effects-immutability.md)
27. "الوحدة تُقيَّم مرة واحدة" — ما الفائدة وما الخطر؟ — [M1.8](module-1.8-modules.md)
28. ما اتجاه الاعتماد الصحيح بين `main`/`io`/`core`؟ لماذا الاعتماد الدائري رائحة؟ — [M1.8](module-1.8-modules.md)

### الأخطاء والـ I/O
29. خطأ متوقع vs bug: مثالان لكل، وكيف تعامل كلًّا منهما؟ — [M1.9](module-1.9-errors.md)
30. لماذا `catch (e)` يعطي `unknown`؟ ما الذي تفعله قبل استخدام `e.message`؟ — [M1.9](module-1.9-errors.md)
31. Result vs استثناء: متى تختار كلًّا منهما في هذا الكورس؟ — [M1.9](module-1.9-errors.md)
32. ما "ابتلاع الخطأ"؟ أعطِ شكلين له. — [M1.9](module-1.9-errors.md)
33. `import.meta.dirname` vs `process.cwd()` — ما الفرق ومتى يسبب الخلط bug؟ — [M1.10](module-1.10-io.md)
34. لماذا `line.split(",")` لا يحلّل CSV؟ اذكر 3 مصائد أخرى في ملفات CSV الحقيقية. — [M1.10](module-1.10-io.md)
35. ما الكتابة الذرّية ولماذا؟ — [M1.10](module-1.10-io.md)
36. لماذا النتيجة على stdout والتشخيص على stderr؟ أعطِ أمر shell يكسره العكس. — [M1.10](module-1.10-io.md)

### اللاتزامن
37. لماذا يوجد اللاتزامن أصلًا؟ (ابدأ من جدول الكمون.) — [M1.11](module-1.11-async-event-loop.md)
38. ارسم نموذج حلقة الأحداث (مكدس/طابور/خارج). أين يحدث "الانتظار"؟ — [M1.11](module-1.11-async-event-loop.md)
39. ما الذي يطبعه: `console.log("A"); setTimeout(()=>console.log("B"),0); (async()=>{console.log("C"); await null; console.log("D")})(); console.log("E");` — ولماذا؟ — [M1.11](module-1.11-async-event-loop.md)
40. `await` يجمّد ماذا بالضبط؟ ما الفرق بين 3 `await` متتالية و`Promise.all`؟ متى **لا** تستخدم `Promise.all` على 10,000 عنصر؟ — [M1.11](module-1.11-async-event-loop.md)
41. ماذا يحدث لـ Promise مرفوضة بلا `await`/`catch` في Node 22؟ — [M1.11](module-1.11-async-event-loop.md)
42. ما "حجب حلقة الأحداث"؟ أعطِ 3 أسباب شائعة. لماذا 4 ثوانٍ كارثة في خادم؟ — [M1.11](module-1.11-async-event-loop.md)
43. "الكود بين `await`ين يعمل دون انقطاع" — ما الذي يعنيه هذا للحالة المشتركة؟ — [M1.11](module-1.11-async-event-loop.md)

### التصحيح وGit
44. ما الأسئلة الثلاثة قبل أي تصحيح؟ ما قاعدة "تغيير واحد"؟ — [M1.12](module-1.12-debugging.md)
45. متى تستخدم breakpoint شرطيًا؟ logpoint؟ Step Into vs Over؟ — [M1.12](module-1.12-debugging.md)
46. ما التنصيف؟ طبّقه على: كود، بيانات، تاريخ Git. — [M1.12](module-1.12-debugging.md), [M1.14](module-1.14-git-2.md)
47. ماذا يخزّن Git في كل commit؟ لماذا لا يمكن تعديل commit قديم بصمت؟ — [M1.13](module-1.13-git-1.md)
48. المناطق الثلاث وأوامر الانتقال بينها. لماذا `add -p`؟ — [M1.13](module-1.13-git-1.md)
49. `restore` vs `revert` vs `--amend` vs `reflog` — حالة لكل واحد. — [M1.13](module-1.13-git-1.md)
50. لماذا يُرفض `push`؟ ماذا تفعل؟ لماذا `--force` على فرع مشترك جريمة؟ — [M1.14](module-1.14-git-2.md)
51. merge vs rebase: ما الذي يعيد كتابته rebase وما القاعدة الحديدية؟ — [M1.14](module-1.14-git-2.md)
52. منهج حل التعارض في 5 خطوات. لماذا "Accept Both" ليس حلًا؟ — [M1.14](module-1.14-git-2.md)

### الأنواع
53. "النوع مجموعة قيم" — رتّب: `never`, `"GET"`, `string`, `unknown`, `"GET" | "POST"` من الأضيق للأوسع. — [M1.15](module-1.15-typescript-types.md)
54. ما الاتحاد المميَّز؟ لماذا أفضل من حقول اختيارية؟ أعطِ مثالًا من مشروعك. — [M1.15](module-1.15-typescript-types.md)
55. كيف يضمن `never` في `default` الشمولية؟ — [M1.15](module-1.15-typescript-types.md)
56. `unknown` vs `any` vs `as` — جملة لكل واحد ومتى يُقبل. — [M1.15](module-1.15-typescript-types.md)
57. لماذا نحتاج محقّقًا وقت التشغيل رغم TypeScript؟ أين يعيش؟ — [M1.15](module-1.15-typescript-types.md)

### الربط (عبر المستويات)
58. اربط: **الكمون** (L0-M0.1) → **اللاتزامن** (M1.11) → لماذا `readFileSync` مقبول في سكربت ومرفوض في خادم؟
59. اربط: **ذاكرة العملية المعزولة** (L0-M0.3) → **المرجع** (M1.6) → لماذا لا تستطيع "مشاركة كائن" بين عمليتين؟
60. اربط: **الثقة على الحدود** (L0-M0.7) → **`unknown` + محقّق** (M1.15) → **Result** (M1.9) → **exit code** (L0-M0.3): ارسم رحلة مدخل خاطئ من `argv` إلى `$?`.
61. اربط: **read-modify-write** (L0-M0.7) → **"العالم يتغير عبر `await`"** (M1.11) → **الحالة المشتركة القابلة للتغيير** (M1.7): لماذا هي نفس المشكلة؟
62. اربط: **اللقطات الثابتة** (M1.7) → **Git commits** (M1.13): ما الذي يجعل التراجع (undo) "مجانيًا" في الحالتين؟

---

## القسم 2: الفحص البرمجي (Coding Check)

> بيدك. بلا AI. `strict` + `noUncheckedIndexedAccess`. لا `any`/`as`/`!`. كل مهمة ≤ 60 سطرًا.

### مهمة 2.1 — نواة نقية بأنواع محكمة
اكتب `inventory.ts`: نوع `Event = {kind:"received"; sku; qty} | {kind:"sold"; sku; qty} | {kind:"adjusted"; sku; delta}` ودالة `apply(stock: ReadonlyMap<string, number>, e: Event): Result<ReadonlyMap<string, number>>` تعيد مخزونًا **جديدًا** (لا تعديل) وترفض البيع فوق المتاح برسالة واضحة. `switch` مع `never`. 6 اختبارات بـ `node:test` تشمل الحالات الحدية (sku جديد، بيع كل الكمية، delta سالب يهبط تحت الصفر).

### مهمة 2.2 — الحدود
اكتب `parse-env.ts`: دالة `loadConfig(env: NodeJS.ProcessEnv): Result<{port:number; mode:"dev"|"prod"; origins: string[]}>` تحوّل وتتحقق (`PORT` عدد صحيح 1..65535، `MODE` من الاتحاد، `ORIGINS` قائمة مفصولة بفواصل وغير فارغة إن `prod`). `main` يطبع الإعدادات أو يفشل على stderr بـ exit 1. جرّب 5 حالات فشل بـ `MODE=x PORT=99999 npx tsx ...`.

### مهمة 2.3 — I/O + async بتزامن محدود
اكتب `head-urls.ts <file>`: يقرأ ملفًا فيه URL لكل سطر (تجاهل الفارغ و`#`)، يرسل طلب `HEAD` لكل واحد **بحد تزامن 4** و**مهلة 3 ثوانٍ**، ويطبع جدولًا `status  ms  url` على stdout مرتبًا بالزمن، والفاشلة (timeout/refused/non-2xx) على stderr. exit 0 إن نجح الكل، 3 جزئي، 1 لا شيء نجح. تأكد أن `| wc -l` يعدّ الناجحة فقط.

### مهمة 2.4 — التحويلات
اكتب `group.ts`: دالة generic `groupBy<T, K extends string>(xs: readonly T[], key: (x: T) => K): Readonly<Record<K, readonly T[]>>` و`topN<T>(xs, n, score: (x:T)=>number): T[]` (بلا تعديل المدخل، مع مقارن صحيح). اختبرها على بيانات Project 2 لتحسب `topProducts` بدل الكود المخصص.

### مهمة 2.5 — Git
في مستودع Project 2: أنشئ فرع `exercise/conflict`، غيّر سطر رسالة خطأ؛ على `main` غيّر **نفس السطر** بشكل مختلف؛ ادمج، حُلّ التعارض بـ **مزيج** صحيح، شغّل الاختبارات، التزم برسالة تشرح القرار. ثم `git log --oneline --graph` والصق الناتج في `CHECKPOINT.md` مع شرح سطرين.

---

## القسم 3: فحص التصحيح (Debugging Check)

> لكل سيناريو اكتب: المتوقع، الفعلي، الفرضية، التجربة (بالمصحّح/أمر)، السبب الجذري، "أين أيضًا؟" — **قبل** فتح الحل.

### 3.1
```typescript
const prices = [19.99, 5.01, 0.1, 0.2];
const total = prices.reduce((s, p) => s + p, 0);
if (total === 25.3) console.log("ok"); else console.log("mismatch", total);
// mismatch 25.299999999999997
```
<details><summary>الحل</summary>
الطبقة: تمثيل الأعداد (M1.1). float ثنائي لا يمثل 0.1 بدقة؛ تراكم الأخطاء. السبب الجذري: المال كعشري. الإصلاح: سنتات صحيحة `[1999, 501, 10, 20]` → 2530. "أين أيضًا؟" كل مقارنة `===` بين عشريين محسوبين، وكل `toFixed` قبل الحساب.
</details>

### 3.2
```typescript
const DEFAULTS = { retries: 3, headers: { "x-app": "shop" } };
function makeOpts(token: string) { const o = { ...DEFAULTS }; o.headers["authorization"] = token; return o; }
makeOpts("A"); const b = makeOpts("B");
// لاحقًا: طلب المستخدم A أُرسل بتوكن B
```
<details><summary>الحل</summary>
الطبقة: المراجع (M1.6). spread سطحي؛ `headers` **مشترك** بين كل الاستدعاءات ومع `DEFAULTS` نفسه. التجربة: breakpoint بعد الاستدعاء الأول وراقب `DEFAULTS.headers`. الإصلاح: ابنِ جديدًا `{...DEFAULTS, headers: {...DEFAULTS.headers, authorization: token}}` + `Object.freeze` على `DEFAULTS`. "أين أيضًا؟" كل `{...x}` لكائن متداخل؛ كل كائن مُصدَّر من وحدة (M1.8) يُعدَّل.
</details>

### 3.3
```typescript
async function loadAll(ids: number[]) {
  const out: User[] = [];
  ids.forEach(async id => { out.push(await fetchUser(id)); });
  return out;
}
console.log((await loadAll([1, 2, 3])).length);   // 0
```
<details><summary>الحل</summary>
الطبقة: async (M1.11). `forEach` لا ينتظر؛ `return out` يحدث قبل أي `push`. الفرضية تُثبت بـ logpoint على `push` (يظهر بعد الطباعة). الإصلاح: `return Promise.all(ids.map(fetchUser))`. "أين أيضًا؟" كل `forEach(async`؛ كل Promise بلا `await`.
</details>

### 3.4
```
$ npx tsx src/main.ts list
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/app/src/core/todo' imported from /app/src/main.ts
```
لكن `npm run dev` كان يعمل أمس، و`src/core/todo.ts` موجود.
<details><summary>الحل</summary>
الطبقة: الوحدات/ESM (M1.0, M1.8). الاستيراد بلا `.js`. "كان يعمل" لأن إعدادًا أقدم/أداة أخرى كانت تتسامح. الدليل: المسار في الرسالة بلا امتداد. الإصلاح: `./core/todo.js`. "أين أيضًا؟" `grep -rn "from \"\./" src | grep -v "\.js\""`. ثم `git bisect` إن أردت معرفة أي commit غيّر الإعداد.
</details>

### 3.5
```typescript
function findUser(users: User[], id: number) {
  for (let i = 0; i <= users.length; i++) if (users[i].id === id) return users[i];
  return null;
}
// TypeError: Cannot read properties of undefined (reading 'id') — فقط عندما لا يوجد المستخدم
```
<details><summary>الحل</summary>
الطبقة: الحلقات (M1.3). `<=` off-by-one؛ عند عدم العثور تصل الحلقة إلى `users[length]` = `undefined`. مع `noUncheckedIndexedAccess` كان المترجم سيحذّر — راجع الإعداد. الإصلاح: `users.find(u => u.id === id)` (يعيد `undefined`، أوضح من `null`). "أين أيضًا؟" كل `<= .length`.
</details>

### 3.6
خادم CLI طويل التشغيل (`watch` يعالج ملفات تصل لمجلد). بعد ساعات: `FATAL ERROR: heap out of memory`. الملفات صغيرة.
<details><summary>الحل</summary>
الطبقة: الحالة والإغلاقات (M1.4, M1.7). غالبًا مصفوفة/خريطة على مستوى الوحدة تنمو بلا حدود (`processed.push(...)` "للسجل")، أو مستمعو أحداث يُضافون في كل ملف دون إزالة، أو إغلاقات تلتقط buffers كبيرة. التجربة: `process.memoryUsage().heapUsed` كل دقيقة على stderr؛ ثم heap snapshot (L7). الإصلاح: حدود (آخر N فقط)، إزالة المستمعين، لا حالة عالمية تنمو.
</details>

### 3.7
```
$ git push
 ! [rejected]        main -> main (non-fast-forward)
$ git push --force
```
بعد دقيقة، زميلك: "اختفى commit-ي من main!"
<details><summary>الحل</summary>
الطبقة: Git (M1.14). الرفض كان حماية؛ `--force` استبدل تاريخ `main` البعيد بتاريخك المتأخر فمحا commit الزميل من الفرع (لا من مستودعه المحلي). الإنقاذ: الزميل يدفع مجددًا من نسخته، أو `git reflog` على الخادم/محليًا لاستعادة الـ hash ثم `git push`. الوقاية: branch protection + `--force-with-lease` على الفروع الشخصية فقط، والقاعدة: `pull` ثم `push`.
</details>

---

## القسم 4: الفحص المعماري (Architecture Check)

> أجب بصيغة **Assumption / Constraint / Tradeoff / Risk / Recommendation**. نصف صفحة لكل سؤال. لا كود.

### 4.1 — من CLI إلى خادم بنفس النواة
Project 1 يجب أن يُخدم أيضًا عبر HTTP في Level 2. ارسم رسم اعتماديات الوحدات المستهدف. ما الذي يعرفه `core/`؟ أين تعيش "404"؟ أين تعيش رسائل الأخطاء الموجهة للبشر؟ ما الذي يجب أن يتغير في `Result` ليخدم الواجهتين؟

### 4.2 — من ملف واحد إلى مستخدمين كثر
Project 1 يُستخدم الآن من 50 شخصًا يشاركون ملف `todos.json` واحد على قرص مشترك. اشرح بالضبط كيف تحدث خسارة بيانات (تسلسل زمني لعمليتين). ما الحلول المرحلية (قفل ملف؟ ملف لكل مستخدم؟ عملية خادم واحدة تملك الملف؟ قاعدة بيانات؟) وما تكلفة كل واحد؟ أيها توصي به **الآن** ولماذا؟

### 4.3 — من 10k إلى 10M صف
Project 2 مع ملف 10M صف على جهاز 8GB. حدّد ما يجب أن يكون streaming وما يبقى في الذاكرة. كيف تعالج اقتباسًا يمتد على سطرين في وضع streaming؟ ما الذي تقيسه قبل/بعد وكيف؟ ما الذي تتخلى عنه (مثلًا `rejections` الكاملة)؟

### 4.4 — تصميم الأخطاء كواجهة
خدمة ستُستهلك من CLI وHTTP ومهمة مجدولة. صمّم "عقد الأخطاء": أنواع (`NotFound`, `Validation`, `Conflict`, `Unavailable`...), هل Result أم استثناءات عبر الطبقات، ما يُسجَّل vs ما يُعاد للمستخدم، ما يُعاد المحاولة فيه (مع idempotency من L0-M0.6). كيف يترجم كل واجهة (exit code / HTTP status / إعادة جدولة) نفس النوع؟

### 4.5 — اتفاقية الفريق
فريق من 4 يبدأ Project 3. اكتب صفحة اتفاقية: هيكل المجلدات (core/io/main)، قواعد الأنواع (لا any/as/!، اتحادات مميَّزة، محقّق على كل حد)، قواعد Git (أسماء الفروع، حجم PR، قالب الرسالة، حماية `main`)، تعريف "جاهز للدمج" (typecheck + tests + مراجعة). ما الذي يُفرض آليًا وما يُترك للمراجعة؟

---

## بطاقة الاجتياز (Pass Card)

| القسم | المعيار | ✅ |
|---|---|---|
| 1 | 55/62 سؤالًا بإجابة صحيحة **بكلماتك** (الأسئلة 58–62 إلزامية) | |
| 2 | المهام الخمس تمرّ typecheck + تعمل + اختبارات 2.1 و2.4 خضراء | |
| 3 | 6/7 سيناريوهات بمنهج مكتوب **قبل** فتح الحل، مع "أين أيضًا؟" | |
| 4 | 5 صفحات ACTRR، كل واحدة تذكر tradeoff حقيقيًا ومخاطرة محددة | |
| 🛠 | Project 1 و Project 2 مسلّمان بكل المخرجات، مع CHALLENGES.md | |

**درجة النضج بعد الاجتياز:** تستطيع كتابة برامج TypeScript صغيرة **كاملة ومنظمة** من الصفر — تقرأ مدخلات، تتحقق منها، تحوّلها بنواة نقية، تتعامل مع الفشل بوضوح، تحفظ وتخرج بشكل صحيح — وتصحّحها بالمنهج، وتديرها بـ Git بثقة. **لا تعرف بعد** كيف يعمل كل هذا تحت الغطاء (الذاكرة، الخيوط، TCP، HTTP) — وهذا بالضبط ما يفتحه **Level 2**.

> **التالي:** [Level 2 — Computer Systems](../level-2-computer-systems/README.md)
