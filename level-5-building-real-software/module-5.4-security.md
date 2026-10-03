# Module 5.4 — الأمان من المبتدئ إلى المحترف
## Security: threat/attacker/asset/trust boundary, least privilege, validation & encoding, secrets, crypto at rest/in transit, XSS, CSRF, SQLi, SSRF, uploads, dependencies

> **المستوى:** Level 5 | **الموقع:** [4 من 13]
> **السابق:** [M5.3 — Authorization](module-5.3-authorization.md) | **التالي:** [M5.5 — Threat Modeling](module-5.5-threat-modeling.md)

---

## 1. المتطلبات
> **قبل أن تتعلم هذا، يجب أن تفهم:**
- [ ] Trust Boundary، Frontend غير موثوق، حادثة "السعر المجاني" — [L2-M2.13](../level-2-computer-systems/module-2.13-web-app-architecture.md)
- [ ] TLS: ماذا يحمي وما لا يحمي — [L2-M2.11](../level-2-computer-systems/module-2.11-tls.md)
- [ ] الاستعلامات المُعلمَّة (`$1`) في `pg` — [L3-M3.11](../level-3-core-computer-science/module-3.11-sql-from-zero.md)
- [ ] المصادقة والكوكي والـ SameSite؛ التفويض وIDOR — [M5.2](module-5.2-authentication.md), [M5.3](module-5.3-authorization.md)
- [ ] متغيرات البيئة والأسرار وfail-fast — [L0-M0.4](../level-0-absolute-foundations/module-04-files-terminal-shell.md)
- [ ] DNS وIP الخاصة (10/8, 172.16/12, 192.168/16, 127/8, 169.254/16) — [L2-M2.8](../level-2-computer-systems/module-2.8-networking-from-zero.md), [L2-M2.10](../level-2-computer-systems/module-2.10-dns.md)

## 2. أهداف التعلّم
- التفكير بمفردات الأمان: **أصل** (asset) يستحق الحماية، **مهاجم** بقدرات ودوافع، **تهديد**، **ثغرة**، **حدود الثقة**، **سطح الهجوم** — والمبادئ: least privilege، defense in depth، fail securely، secure by default، لا أمن بالغموض.
- تطبيق القاعدة الأم: **كل مدخل يعبر حدّ ثقة غير موثوق** — تحقق عند الدخول (validation بقائمة بيضاء)، و**ترميز عند الخروج** بحسب السياق (output encoding) — ولماذا الاثنان لا واحد.
- شرح ومنع الهجمات الكلاسيكية بآليتها لا بأسمائها: **XSS** (المخزّن/المنعكس/DOM) + CSP، **CSRF** + SameSite/Origin/token، **SQL injection** + parameters، **SSRF** + allow-list وحلّ DNS، **IDOR** (M5.3)، رفع الملفات، path traversal، command injection، open redirect، تسريب المعلومات.
- إدارة **الأسرار** (مصدر، تدوير، لا تسجيل، لا Git)، و**التشفير** أثناء النقل (TLS فقط، HSTS) وفي السكون (قرص/عمود، إدارة المفاتيح، hashing ≠ تشفير)، ومتى تحتاج تشفير مستوى التطبيق.
- إدارة مخاطر **التبعيات** (lockfile، audit، typosquatting، نطاق صلاحيات CI) ورؤوس الأمان، والاستجابة الأولية لثغرة مُبلَّغة.

---

## 3. شرح للمبتدئ

### مفردات التفكير الأمني
- **الأصل (Asset):** ما يُؤذي فقدانه/تسريبه/تعديله: بيانات المستخدمين، المال، الجلسات، الأسرار، السمعة، التوافر نفسه.
- **المهاجم (Attacker):** ليس "هاكر في فيلم"؛ بل: سكربت آلي يمسح الإنترنت، مستخدم فضولي يعدّل URL، موظف سابق، منافس، مُبتزّ، وأحيانًا مطوّر داخلي بخطأ. لكلٍّ **قدرات** (يستطيع إرسال أي طلب HTTP؛ لا يستطيع كسر TLS) و**دوافع**.
- **التهديد (Threat):** ما قد يفعله المهاجم بالأصل. **الثغرة (Vulnerability):** ضعف يُمكّن التهديد. **المخاطرة** = احتمال × أثر — ما يحدّد أين تُنفق الجهد (M5.5).
- **حدّ الثقة (Trust Boundary):** الخط الذي تتغيّر عنده الثقة: المتصفح→الخادم، الخادم→DB، خدمتك→API خارجي، المستخدم→admin، **الطابور→worker**، الملف المرفوع→المعالج. **كل ما يعبر الحدّ قادمًا من الجهة الأقل ثقة هو مدخل غير موثوق** — حتى لو كان "من خدمتنا الأخرى" أو "من DB" (قد يكون خُزّن ملوّثًا).
- **سطح الهجوم:** مجموع نقاط الدخول (endpoints، رؤوس، كوكيز، ملفات، webhooks، معاملات URL، رسائل الطابور). قلّله: ما لا يوجد لا يُخترق.

### المبادئ
**Least privilege:** كل مكوّن بأقل صلاحية تلزمه (دور DB للتطبيق بلا `DROP`/`SUPERUSER`، مفتاح API بنطاق قراءة، حاوية بلا root — M5.11). **Defense in depth:** طبقات تتكرّر (M5.3). **Fail securely:** عند الخطأ ارفض (استثناء في فحص التفويض = 500 لا 200). **Secure by default:** الإعداد الافتراضي آمن والتخفيف صريح. **Keep it simple:** التعقيد عدو التدقيق. **لا تخترع تشفيرًا:** مكتبات قياسية بإعدادات افتراضية حديثة. **افترض الاختراق:** سجّل، راقب، حدّد نصف قطر الانفجار (blast radius).

### القاعدة الأم: تحقق عند الدخول، رمّز عند الخروج
**Validation (الدخول):** قائمة **بيضاء** لما هو مسموح (نوع، طول، نمط، نطاق، قيمة من مجموعة) على الحدود (M5.1 `parse*`)، ارفض الباقي. ليست دفاعًا ضد الحقن وحده (لا يمكن "تنظيف" اسم `O'Brien`)، بل تقليل سطح الهجوم وضمان سلامة البيانات. **Encoding (الخروج):** عند وضع بيانات داخل **لغة أخرى** (HTML, JavaScript, URL, SQL, Shell, CSV، LDAP) تُرمَّز بحسب قواعد **تلك اللغة** في **ذلك السياق** — لأن الحقن هو دائمًا: **بيانات فُسِّرت كأوامر**. SQL: parameters (البيانات تسافر منفصلة عن النص). HTML: `&lt;`؛ داخل سمة: `&quot;` + علامات اقتباس؛ داخل JS: JSON.stringify + `<\/script>`؛ URL: `encodeURIComponent`؛ Shell: **لا تستخدم shell** (`execFile` بمصفوفة وسائط). القاعدة: الترميز مسؤولية مَن يبني النص النهائي، في اللحظة الأخيرة، بحسب السياق.

### XSS — Cross-Site Scripting
المهاجم يُدخل HTML/JS في صفحة يراها ضحية: **مخزّن** (تعليق محفوظ)، **منعكس** (معامل بحث يُطبع)، **DOM-based** (`element.innerHTML = location.hash`). النتيجة: سكربت المهاجم يعمل **بهوية الضحية** في نطاقك: يقرأ الصفحة، يرسل طلبات بجلستها، يسرق ما يصل إليه JS (لذلك `HttpOnly`). الدفاع: (1) **ترميز HTML عند الخروج** افتراضيًا (أطر الواجهة الحديثة تفعل؛ الخطر في `dangerouslySetInnerHTML`/`innerHTML`/`v-html`/قوالب يدوية)؛ (2) **CSP** (`Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-…'; object-src 'none'; base-uri 'none'`) تجعل السكربت المحقون لا يعمل حتى لو مرّ؛ (3) تنقية HTML الغني بمكتبة (DOMPurify) إن سمحت به؛ (4) `HttpOnly` يحدّ الضرر؛ (5) `Content-Type` صحيح و`X-Content-Type-Options: nosniff` حتى لا يفسّر المتصفح JSON/صورة كـ HTML.

### CSRF — Cross-Site Request Forgery
موقع المهاجم يجعل متصفح الضحية يرسل طلبًا إلى موقعك **بكوكي الضحية** (نموذج مخفي يُرسل `POST /transfer`). الدفاع الحديث: **`SameSite=Lax`** على الكوكي (المتصفح لا يرسلها مع POST عبر المواقع) — يكفي لمعظم الحالات؛ + **فحص `Origin`/`Referer`** للطلبات المُغيِّرة (ارفض إن كان الأصل غير أصلك)؛ + **رمز CSRF** (synchronizer أو double-submit cookie موقّع) حين تحتاج `SameSite=None` أو دعمًا لمتصفحات قديمة؛ + لا أفعال مُغيِّرة عبر GET (M5.1). الـ APIs التي تُصادَق بـ `Authorization: Bearer` (لا كوكي) ليست عرضة لـ CSRF — لكنها عرضة لسرقة الرمز عبر XSS.

### SQL Injection
`"SELECT * FROM users WHERE email = '" + email + "'"` مع `' OR 1=1 --` → كل المستخدمين؛ `'; DROP TABLE…`؛ أو استخراج بطيء بـ `pg_sleep` (blind). الدفاع الوحيد الصحيح: **parameters** (`$1`) دائمًا — المحرّك يستقبل النص والقيم منفصلين فلا تُفسَّر القيمة أبدًا. ما **لا** يمكن تمريره كمعامل (أسماء جداول/أعمدة، اتجاه الفرز) → **قائمة بيضاء** وربط بثوابت. ORMs وquery builders تساعد لكن `raw()`/`sequelize.literal` تعيد الخطر. و**least privilege لدور DB** يحدّ الضرر إن حدث.

### SSRF — Server-Side Request Forgery
ميزة "جلب صورة من URL" أو webhook: المهاجم يعطي `http://169.254.169.254/latest/meta-data/` (بيانات السحابة وأسرارها!) أو `http://localhost:5432` أو `http://10.0.0.5/admin` — خادمك يطلبها **من داخل شبكتك الموثوقة**. الدفاع: قائمة بيضاء للمضيفين إن أمكن؛ وإلا: ارفض المخططات غير http(s)، **حلّ DNS وتحقّق من أن كل عنوان IP عام** (ليس خاصًا/loopback/link-local/metadata) **ثم اتصل بذلك العنوان نفسه** (ضد DNS rebinding)، لا تتبع إعادة التوجيه تلقائيًا (أو أعد الفحص لكل قفزة)، مهلة وحدّ حجم، وشبكة معزولة للـ fetcher (M5.13: egress rules). وعطّل IMDSv1 في السحابة (IMDSv2 يتطلّب رأس PUT).

### أخرى يجب أن تعرف آليتها
- **Path traversal:** `GET /files/../../etc/passwd` → `path.resolve(base, name)` ثم تأكّد أن الناتج يبدأ بـ `base + sep`؛ أو أفضل: معرّفات مُعتِمة تُترجم لمسارات، لا مسارات من المستخدم.
- **Command injection:** `exec("convert " + filename)` → `execFile("convert", [filename])` بلا shell؛ أو مكتبة بدل الأمر.
- **رفع الملفات:** حدّ الحجم، تحقّق من **النوع بالمحتوى** (magic bytes) لا الامتداد/`Content-Type`، اسم عشوائي، تخزين خارج جذر الويب/في object storage، لا تنفيذ أبدًا، معالجة الصور في عملية معزولة (ImageMagick له تاريخ)، فحص فيروسات حسب الحاجة، تقديم بـ `Content-Disposition: attachment` + `nosniff`.
- **Open redirect:** `?next=https://evil.com` بعد الدخول → اسمح بمسارات نسبية داخلية فقط.
- **تسريب المعلومات:** stack traces، رسائل DB، رؤوس `X-Powered-By`، `/.git/`، `/.env`، سجلات بأسرار، رسائل خطأ تفصيلية في المصادقة (M5.2).
- **Deserialization/Prototype pollution:** `JSON.parse` آمن، لكن الدمج العميق لكائن من المستخدم (`__proto__`) يلوّث كل الكائنات — استخدم `Object.create(null)`/مكتبات محصّنة، ولا `eval`/`Function`/`vm` على مدخلات.
- **ReDoS:** L3-M3.8 — regex خطّي أو حدود طول.

### الأسرار والتشفير
**الأسرار** (كلمات مرور DB، مفاتيح API، مفاتيح توقيع): من مدير أسرار/متغيرات بيئة محقونة وقت التشغيل، **أبدًا في Git** (حتى الخاص؛ افترض أن ما دخل Git مسرّب للأبد → دوّره)، لا في السجلات (L4-M4.12 تنقيح) ولا في URLs ولا في رسائل الخطأ، **تدوير** دوري وفوري عند الشك، نطاق ضيّق لكل سرّ، `.env` محلي فقط و`.gitignore` + `git-secrets`/`gitleaks` في CI. **أثناء النقل:** TLS لكل شيء بما فيه الداخلي حين يعبر شبكة غير موثوقة، `HSTS`، لا HTTP احتياطي، شهادات مُدارة (Let's Encrypt/ALB). **في السكون:** تشفير القرص/قاعدة البيانات المُدارة (يحمي من سرقة القرص لا من استعلام مخوَّل)؛ **تشفير مستوى التطبيق** لحقول حسّاسة جدًا (أرقام هوية، رموز مزوّد) بـ AES-256-GCM بمفتاح من KMS مع تدوير — لا تُفهرس العمود المشفّر مباشرة (HMAC للبحث بالمساواة). **hashing ≠ encryption**: كلمات المرور تُجزّأ (M5.2)، البطاقات لا تُخزَّن أصلًا (PCI: مزوّد الدفع يعطيك token).

### التبعيات وCI
`package-lock.json` ملتزَم + `npm ci`؛ `npm audit`/Dependabot/Renovate مع مراجعة لا دمج أعمى؛ احذر typosquatting (`lodahs`) وحزمًا جديدة بلا تاريخ؛ قلّل العدد (كل حزمة = كود يعمل بصلاحياتك + سكربتات `postinstall` — `--ignore-scripts` حيث أمكن)؛ ثبّت إصدارات GitHub Actions بـ SHA؛ أسرار CI بنطاق الفرع المحمي؛ لا `secrets` في PRs من forks. ورؤوس الأمان للواجهة: `Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`/`frame-ancestors`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`؛ CORS: قائمة بيضاء للأصول، لا `*` مع credentials.

---

## 4. النموذج الذهني

```
   أصل ← تهديد ← ثغرة ← مهاجم بقدرات   |   حدّ ثقة: كل ما يعبره من الجهة الأقل ثقة = غير موثوق
   الدخول: تحقّق بقائمة بيضاء   |   الخروج: رمّز بحسب لغة السياق   |   الحقن = بيانات فُسِّرت كأوامر
   XSS → encode + CSP + HttpOnly   CSRF → SameSite + Origin + token   SQLi → $1 دائمًا   SSRF → allow-list + IP عام + لا redirects
   أقل صلاحية، دفاع متعدّد، افشل بأمان، لا أسرار في Git/السجلات/URL، TLS في النقل، KMS في السكون، lockfile وتدقيق التبعيات
```

---

## 5. الرسم التوضيحي

```mermaid
flowchart LR
  subgraph untrusted["Untrusted"]
    U[Browser / Attacker]
    W[Webhook sender]
    F[Uploaded file]
  end
  subgraph trusted["Trusted zone"]
    API[API: validate at entry, encode at exit]
    Q[(Queue)]
    WK[Worker]
    DB[(DB: parameters, least-privilege role, RLS)]
    META[Cloud metadata 169.254.169.254]
  end
  U -->|TB1 cookies, body, headers| API
  W -->|TB2 signed? replayed?| API
  F -->|TB3 magic bytes, size, sandbox| WK
  API -->|TB4 tenant_id, params| DB
  API -->|TB5 actor + tenant in message| Q --> WK
  API -. SSRF: must never reach .-> META
```

```
   الحقن في سياقات مختلفة — نفس المبدأ، ترميز مختلف:
   SQL   : WHERE email = $1                      ← القيمة لا تدخل النص أصلًا
   HTML  : &lt;script&gt;                          ← داخل نص؛ داخل سمة: &quot; + اقتباسات
   JS    : JSON.stringify(x).replace(/</g,"\\u003c") ← داخل <script>
   URL   : ?q=encodeURIComponent(x)
   Shell : execFile("cmd", [x])                  ← لا shell، لا تسلسل نصي
```

---

## 6. مثال بسيط

```typescript
// src/encode.ts — الترميز بحسب السياق (ما تفعله أطر القوالب خلف الكواليس) + CSP بـ nonce
import { randomBytes } from "node:crypto";
const HTML: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#x27;" };
export const escapeHtml = (s: string) => s.replace(/[&<>"']/g, c => HTML[c]!);                       // داخل نص HTML أو داخل سمة مقتبسة بـ "
export const jsonForScript = (v: unknown) => JSON.stringify(v).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");   // داخل <script>: يمنع </script> المبكر
export const safeHref = (url: string) => { try { const u = new URL(url, "https://app.example.com"); return ["http:", "https:"].includes(u.protocol) ? escapeHtml(u.href) : "#"; } catch { return "#"; } };   // javascript: ممنوع
export const cspNonce = () => randomBytes(16).toString("base64");
export const cspHeader = (nonce: string) => `default-src 'self'; script-src 'self' 'nonce-${nonce}'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'`;

export function renderComment(c: { author: string; body: string; site?: string }, nonce: string, state: unknown) {   // قالب يدوي "صحيح" — لتفهم ما يحميه إطارك
  return `<article><h4>${escapeHtml(c.author)}</h4><p>${escapeHtml(c.body)}</p>${c.site ? `<a href="${safeHref(c.site)}" rel="noopener noreferrer">site</a>` : ""}</article>
<script nonce="${nonce}">window.__STATE__ = ${jsonForScript(state)};</script>`;
}
// escapeHtml('<img src=x onerror=alert(1)>') → &lt;img src=x onerror=alert(1)&gt;   يُعرض كنص، لا يُنفَّذ
```

---

## 7. مثال كود

```typescript
// src/csrf.ts — ثلاث طبقات: SameSite (M5.2) + فحص Origin + رمز موقّع (double-submit) حين تحتاجه
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto"; import type { IncomingMessage } from "node:http";
export function originAllowed(req: IncomingMessage, allowed: ReadonlySet<string>): boolean {        // للطلبات المُغيِّرة (POST/PUT/PATCH/DELETE)
  const origin = req.headers.origin ?? (req.headers.referer ? new URL(req.headers.referer).origin : undefined);
  return origin !== undefined && allowed.has(origin);                                                  // لا Origin ولا Referer على طلب مُغيِّر؟ ارفض (fail securely)
}
export function makeCsrfTokens(secret: string) {                                                       // token = sid-bound: HMAC(secret, sessionId . nonce) — لا يفيد المهاجم بلا جلسة الضحية
  const sign = (sid: string, nonce: string) => createHmac("sha256", secret).update(`${sid}.${nonce}`).digest("base64url");
  return {
    issue(sid: string) { const nonce = randomBytes(16).toString("base64url"); return `${nonce}.${sign(sid, nonce)}`; },        // يُوضع في <meta> أو في جسم الصفحة؛ يُرسل في رأس X-CSRF-Token
    verify(sid: string, token: string | undefined): boolean {
      if (!token) return false; const [nonce, mac] = token.split("."); if (!nonce || !mac) return false;
      const expected = Buffer.from(sign(sid, nonce)), got = Buffer.from(mac); return expected.length === got.length && timingSafeEqual(expected, got);
    },
  };
}
```

```typescript
// src/ssrf-guard.ts — جلب URL من المستخدم بأمان: مخطط، قائمة بيضاء اختيارية، حلّ DNS → IP عام فقط → الاتصال بذلك IP نفسه، لا redirects، مهلة وحجم
import { lookup } from "node:dns/promises"; import { isIP } from "node:net"; import { request as httpsRequest } from "node:https"; import { request as httpRequest } from "node:http";
export function isPublicIp(ip: string): boolean {
  if (isIP(ip) === 4) { const [a, b] = ip.split(".").map(Number) as [number, number]; return !(a === 10 || a === 127 || a === 0 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 169 && b === 254) || (a === 100 && b >= 64 && b <= 127) || a >= 224); }
  const v6 = ip.toLowerCase(); if (v6 === "::1" || v6 === "::" || v6.startsWith("fe80") || v6.startsWith("fc") || v6.startsWith("fd")) return false;
  if (v6.startsWith("::ffff:")) return isPublicIp(v6.slice(7));                                        // IPv4-mapped
  return true;
}
export async function resolvePublic(url: URL, allowHosts?: ReadonlySet<string>): Promise<string> {
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("scheme not allowed");
  if (url.username || url.password) throw new Error("credentials in url not allowed");
  if (allowHosts && !allowHosts.has(url.hostname)) throw new Error("host not in allow-list");
  if (isIP(url.hostname)) { if (!isPublicIp(url.hostname)) throw new Error("private address"); return url.hostname; }
  const addrs = await lookup(url.hostname, { all: true });                                             // كل العناوين، لا الأول فقط
  if (addrs.length === 0 || !addrs.every(a => isPublicIp(a.address))) throw new Error("resolves to private address");
  return addrs[0]!.address;
}
export async function safeFetch(rawUrl: string, opts: { allowHosts?: ReadonlySet<string>; timeoutMs?: number; maxBytes?: number } = {}): Promise<{ status: number; body: Buffer }> {
  const url = new URL(rawUrl); const ip = await resolvePublic(url, opts.allowHosts);
  return new Promise((resolve, reject) => {                                                            // نتصل بالـ IP المفحوص (ضد rebinding) ونرسل Host/SNI الأصلي
    const req = (url.protocol === "https:" ? httpsRequest : httpRequest)({ host: ip, servername: url.hostname, port: url.port || (url.protocol === "https:" ? 443 : 80), path: url.pathname + url.search, method: "GET", headers: { host: url.host, "user-agent": "safe-fetcher" }, timeout: opts.timeoutMs ?? 5000 }, res => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400) { res.resume(); return reject(new Error("redirects not followed")); }   // أو أعد الفحص لكل قفزة
      const chunks: Buffer[] = []; let n = 0; const max = opts.maxBytes ?? 5 * 1024 * 1024;
      res.on("data", c => { n += c.length; if (n > max) { req.destroy(new Error("too large")); } else chunks.push(c); });
      res.on("end", () => resolve({ status: res.statusCode ?? 0, body: Buffer.concat(chunks) })); res.on("error", reject);
    });
    req.on("timeout", () => req.destroy(new Error("timeout"))); req.on("error", reject); req.end();
  });
}
```

```typescript
// src/upload.ts — رفع ملف: الحجم، النوع بالمحتوى (magic bytes)، اسم عشوائي، مسار محصور، لا تنفيذ
import { randomUUID } from "node:crypto"; import { resolve, sep } from "node:path";
const MAGIC: Array<{ type: "image/png" | "image/jpeg" | "application/pdf"; bytes: number[]; ext: string }> = [
  { type: "image/png", bytes: [0x89, 0x50, 0x4e, 0x47], ext: "png" }, { type: "image/jpeg", bytes: [0xff, 0xd8, 0xff], ext: "jpg" }, { type: "application/pdf", bytes: [0x25, 0x50, 0x44, 0x46], ext: "pdf" },
];
export function sniff(buf: Buffer) { return MAGIC.find(m => m.bytes.every((b, i) => buf[i] === b)) ?? null; }      // لا تثق بـ Content-Type ولا بالامتداد
export function planUpload(buf: Buffer, declaredName: string, baseDir: string, maxBytes = 5 * 1024 * 1024) {
  if (buf.length === 0 || buf.length > maxBytes) return { ok: false as const, reason: "size" };
  const kind = sniff(buf); if (!kind) return { ok: false as const, reason: "type" };
  const stored = `${randomUUID()}.${kind.ext}`;                                                           // الاسم الأصلي يُحفظ في DB كـ metadata (مُرمَّزًا عند العرض)، لا كمسار
  const path = resolve(baseDir, stored); if (!path.startsWith(resolve(baseDir) + sep)) return { ok: false as const, reason: "path" };   // path traversal (لا يحدث هنا لأن الاسم عشوائي — لكن القاعدة عامة)
  return { ok: true as const, path, contentType: kind.type, originalName: declaredName.slice(0, 255), headersWhenServing: { "content-type": kind.type, "x-content-type-options": "nosniff", "content-disposition": "attachment" } };
}
```

```typescript
// src/sqli.int.test.ts — الحقن حقيقيًا على PostgreSQL: التسلسل النصي يُخترق، $1 لا
import { test, before, after } from "node:test"; import assert from "node:assert/strict"; import pg from "pg";
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL ?? "postgres://app:app@127.0.0.1:5432/store", max: 2 });
before(async () => { await pool.query("DROP TABLE IF EXISTS sqli_users; CREATE TABLE sqli_users(id serial PRIMARY KEY, email text, secret text); INSERT INTO sqli_users(email, secret) VALUES ('ana@example.com','s1'),('bob@example.com','s2')"); });
after(async () => { await pool.query("DROP TABLE sqli_users"); await pool.end(); });
const injected = `' OR 1=1 --`;
test("✗ string concatenation: the attacker's input becomes part of the query", async () => {
  const r = await pool.query(`SELECT email FROM sqli_users WHERE email = '${injected}'`);                 // لا تكتب هذا أبدًا
  assert.equal(r.rowCount, 2);                                                                             // كل المستخدمين
});
test("✓ parameters: the same input is just a value that matches nothing", async () => {
  const r = await pool.query("SELECT email FROM sqli_users WHERE email = $1", [injected]); assert.equal(r.rowCount, 0);
});
test("identifiers cannot be parameters → allow-list + constant mapping", async () => {
  const SORT: Record<string, string> = { email: "email", id: "id" }; const col = SORT[(("email; DROP TABLE sqli_users" as string).split(";")[0] ?? "")] ?? "id";   // أي شيء خارج القائمة → الافتراضي
  const r = await pool.query(`SELECT id FROM sqli_users ORDER BY ${col} ASC`); assert.equal(r.rowCount, 2);
});
```

```typescript
// src/security.test.ts — وحدات: ترميز، CSRF، SSRF guard، رفع
import { test } from "node:test"; import assert from "node:assert/strict";
import { escapeHtml, jsonForScript, safeHref, renderComment } from "./encode.js"; import { makeCsrfTokens, originAllowed } from "./csrf.js"; import { isPublicIp, resolvePublic } from "./ssrf-guard.js"; import { sniff, planUpload } from "./upload.js";
import type { IncomingMessage } from "node:http";
test("XSS payloads render as text; script state cannot break out; javascript: links neutralized", () => {
  const html = renderComment({ author: `<img src=x onerror=alert(1)>`, body: `"><script>steal()</script>`, site: "javascript:alert(1)" }, "n0nce", { q: "</script><script>alert(2)</script>" });
  assert.ok(!html.includes("<img")); assert.ok(!html.includes("<script>steal")); assert.ok(html.includes('href="#"')); assert.ok(!html.includes("</script><script>alert(2)")); assert.ok(html.includes("\\u003c/script"));
  assert.equal(escapeHtml(`O'Brien & <b>`), "O&#x27;Brien &amp; &lt;b&gt;"); assert.equal(safeHref("https://ok.example/a?b=1"), "https://ok.example/a?b=1"); assert.ok(jsonForScript("\u2028").includes("\\u2028"));
});
test("CSRF: token bound to session; wrong session or tampered token fails; cross-origin POST rejected", () => {
  const t = makeCsrfTokens("secret-k"); const tok = t.issue("sid-A");
  assert.equal(t.verify("sid-A", tok), true); assert.equal(t.verify("sid-B", tok), false); assert.equal(t.verify("sid-A", tok.slice(0, -2) + "xx"), false); assert.equal(t.verify("sid-A", undefined), false);
  const allowed = new Set(["https://app.example.com"]); const req = (h: Record<string, string>) => ({ headers: h } as unknown as IncomingMessage);
  assert.equal(originAllowed(req({ origin: "https://app.example.com" }), allowed), true); assert.equal(originAllowed(req({ origin: "https://evil.example" }), allowed), false); assert.equal(originAllowed(req({}), allowed), false);
});
test("SSRF: private/metadata/loopback/mapped addresses and bad schemes are rejected", async () => {
  for (const ip of ["127.0.0.1", "10.1.2.3", "172.16.0.9", "192.168.1.1", "169.254.169.254", "0.0.0.0", "::1", "fd00::1", "::ffff:10.0.0.1", "100.64.0.1"]) assert.equal(isPublicIp(ip), false, ip);
  for (const ip of ["8.8.8.8", "1.1.1.1", "2606:4700::1111"]) assert.equal(isPublicIp(ip), true, ip);
  await assert.rejects(resolvePublic(new URL("file:///etc/passwd")), /scheme/); await assert.rejects(resolvePublic(new URL("http://169.254.169.254/latest/meta-data/")), /private/);
  await assert.rejects(resolvePublic(new URL("http://user:pw@example.com/")), /credentials/); await assert.rejects(resolvePublic(new URL("https://api.other.com/x"), new Set(["api.partner.com"])), /allow-list/);
  await assert.rejects(resolvePublic(new URL("http://localhost:5432/")), /private/);
});
test("uploads: type by magic bytes, not by name; random stored name; serving headers prevent execution", () => {
  const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]), Buffer.alloc(10)]); const fakePng = Buffer.from("<?php system($_GET['c']); ?>");
  assert.equal(sniff(png)?.type, "image/png"); assert.equal(sniff(fakePng), null);
  const plan = planUpload(png, "../../etc/cron.d/evil.php", "/srv/uploads"); assert.ok(plan.ok && plan.path.startsWith("/srv/uploads/") && plan.path.endsWith(".png") && plan.headersWhenServing["content-disposition"] === "attachment");
  assert.deepEqual(planUpload(fakePng, "avatar.png", "/srv/uploads"), { ok: false, reason: "type" }); assert.equal(planUpload(Buffer.alloc(6 * 1024 * 1024, 1), "big.png", "/srv/uploads").ok, false);
});
```

```bash
node --import tsx --test src/security.test.ts                                                   # 4 pass
DATABASE_URL=postgres://app:app@127.0.0.1:5432/store node --import tsx --test src/sqli.int.test.ts   # 3 pass — شاهد الحقن ينجح على التسلسل النصي
# أدوات: gitleaks (أسرار في Git)، npm audit / osv-scanner، eslint-plugin-security، OWASP ZAP (فحص ديناميكي لـ P5)، securityheaders.com، Mozilla Observatory
```

---

## 8. مثال من العالم الحقيقي
منصة تعليمية بميزة "استيراد صورة الملف الشخصي من رابط". باحث أدخل `http://169.254.169.254/latest/meta-data/iam/security-credentials/` فأعاد الخادم بيانات اعتماد AWS للدور المرفق بالخادم — بصلاحية `s3:*`. منها قرأ كل ملفات المستخدمين. ثلاثة أخطاء مركّبة: SSRF بلا فحص IP، IMDSv1 مفعّل، ودور بصلاحية واسعة (least privilege). الإصلاح الثلاثي: `safeFetch` بقائمة بيضاء + IMDSv2 إلزامي + دور بنطاق bucket واحد وقراءة فقط. أي واحد منها وحده كان سيحدّ الضرر — **الدفاع في العمق ليس شعارًا**.

## 9. مثال من الإنتاج
شركة اكتشفت بعد 9 أشهر أن مفتاح Stripe الحي كان في commit قديم في مستودع **خاص** — ثم صار المستودع عامًا عند نقل جزء منه إلى open source. بوت يمسح GitHub التقطه خلال 4 دقائق من العلنية؛ 11k$ من عمليات احتيال قبل أن تنبّه Stripe. بعدها: `gitleaks` في pre-commit وCI (يفشل البناء)، تدوير كل الأسرار كل 90 يومًا وفورًا عند أي شك، أسرار من مدير أسرار بصلاحيات لكل خدمة، وتنبيه على إنشاء مفتاح جديد. القاعدة: **ما دخل Git مسرّب؛ `git rm` لا يُرجعه.**

---

## 10. مفاهيم خاطئة شائعة
1. **"HTTPS يجعل الموقع آمنًا."** يحمي النقل فقط؛ XSS/SQLi/IDOR/CSRF كلها تعمل فوق HTTPS.
2. **"تنظيف المدخلات (sanitize) يمنع الحقن."** الحقن يُمنع بالترميز/الفصل عند **الخروج** بحسب السياق؛ التحقق عند الدخول يقلّل السطح لا أكثر (`O'Brien` اسم صالح).
3. **"ORM يمنع SQLi تمامًا."** حتى أول `raw`/`literal`/فرز بأسماء أعمدة من المستخدم.
4. **"الشبكة الداخلية موثوقة."** SSRF والـ pivoting يصلان إليها؛ صادق وفوّض داخليًا أيضًا (zero trust كمبدأ).
5. **"المستودع خاص فالأسرار فيه آمنة."** لا: نسخ محلية، أعضاء سابقون، تسريبات، تحوّل للعلنية.
6. **"الأمن قسم آخر/مرحلة قبل الإصدار."** قرارات M5.1–5.3 أمنية؛ الأرخص في التصميم (M5.5) وأغلاه بعد الحادث.

## 11. أخطاء شائعة
1. `innerHTML`/`dangerouslySetInnerHTML` ببيانات مستخدم؛ CSP غائبة أو `unsafe-inline`.
2. تسلسل SQL لـ"أسماء أعمدة فقط" من query string؛ `ORDER BY ${req.query.sort}`.
3. `fetch(userUrl)` بلا فحص؛ اتباع redirects؛ فحص الـ hostname نصيًا (`!url.includes("169.254")`) بدل IP بعد الحلّ (تجاوز بـ `0xA9FEA9FE`, `2130706433`, DNS rebinding).
4. رفع ملف بالامتداد/`Content-Type` من العميل؛ تخزينه في مجلد قابل للتقديم بامتداده الأصلي.
5. `exec(\`cmd ${input}\`)`؛ `child_process` بـ shell.
6. `.env` ملتزَم؛ أسرار في Dockerfile/صورة؛ `console.log(config)`.
7. CORS `Access-Control-Allow-Origin: *` مع كوكيز؛ أو عكس `Origin` الوارد بلا قائمة.
8. رسائل خطأ تفصيلية وstack traces في الإنتاج؛ `X-Powered-By`.
9. تجاهل `npm audit` بـ"critical في dev dependency" بلا قراءة (قد يعمل في CI بصلاحيات النشر).
10. `JSON.parse` ثم دمج عميق للكائن في الإعدادات (prototype pollution).

## 12. تمرين تصحيح
تقرير مكافأة: "XSS مخزّن في اسم المنتج يسرق جلسات المشرفين" — رغم أن الواجهة React (ترميز افتراضي).
1. **دليل:** الحمولة `<img src=x onerror=…>` في `product.name`؛ صفحة المنتج في React آمنة؛ لكن **لوحة الإدارة** تعرض "آخر الطلبات" عبر قالب بريد HTML يُولَّد في الخادم بـ `${order.productName}` ويُعرض أيضًا داخل iframe في اللوحة (`srcdoc`)؛ ولا CSP.
2. **فرضية:** مسار خروج ثانٍ غير مُرمَّز (قالب يدوي) — الـ XSS لا يهتم أين دخل، بل أين خرج بلا ترميز.
3. **تجربة:** إنشاء منتج بالحمولة → فتح اللوحة كمشرف → `onerror` يعمل ويصل إلى `document.cookie`؟ الكوكي `HttpOnly` → لا، لكنه يرسل طلبات بجلسة المشرف (CSRF داخلي بنطاقنا): `POST /admin/users/x/role`. **التفويض** (M5.3) ينفّذها لأن المشرف مخوَّل.
4. **الإصلاح:** `escapeHtml` في القالب (كل سياقات الخروج تُجرد: grep لـ `${` في ملفات القوالب)، CSP بـ nonce على اللوحة، `sandbox` على iframe، إعادة مصادقة/MFA للأفعال الإدارية الحسّاسة (step-up auth)، واختبار يحقن حمولة في كل حقل نصي ويفحص كل صفحة/قالب خروج.
5. **أين أيضًا؟** تصدير CSV (حقن صيغ: `=HYPERLINK(...)` → بادئة `'`)، PDF المولَّد، رسائل Slack/البريد، السجلات التي تُعرض في لوحة.

## 13. تمرين معماري
صمّم **أساس الأمان** لـ Project 5 كقائمة قابلة للفحص آليًا: (1) جرد حدود الثقة ونقاط الدخول (كل endpoint، webhook، رفع، وظيفة مجدولة) ومصدر البيانات لكل منها؛ (2) سياسة التحقق على الحدود (مخطط لكل مدخل، حدود حجم/طول/عمق) والترميز عند الخروج (أين تُبنى نصوص بلغات أخرى؟ HTML/SQL/Shell/CSV/URL)؛ (3) رؤوس الأمان وCSP وCORS كإعداد مركزي مع اختبار؛ (4) إدارة الأسرار: المصدر، التدوير، الفحص في CI، ما يُسجَّل؛ (5) أدوار DB بأقل صلاحية (تطبيق/migrations/قراءة للتقارير) وتشفير في السكون للحقول الحسّاسة مع خطة مفاتيح؛ (6) سياسة التبعيات (lockfile، audit، SHA للـ actions)؛ (7) خطة الاستجابة لتقرير ثغرة (security.txt، SLA، من يقرّر، كيف تُدوَّر الأسرار). ACTRR على CSP صارمة مقابل سرعة تطوير الواجهة.

## 14. الصلة بعصر AI
AI يولّد **الأنماط غير الآمنة بنفس ثقة الآمنة** لأنها شائعة في بيانات تدريبه: تسلسل SQL في "سكربت سريع"، `innerHTML`، `exec` بنص، `fetch(url)` بلا فحص، CORS `*`. القوائم في §11 هي ما تراجعه في كل كود مولَّد، وأدوات الفحص الآلي (eslint-plugin-security، semgrep، gitleaks، `npm audit`) هي شبكة الأمان في CI بغض النظر عن كاتب الكود. ومن الجهة الأخرى، AI مساعد ممتاز في **المراجعة الأمنية الموجّهة** ("راجع هذا الـ handler ضد OWASP ASVS V5 وV12") وفي شرح تقارير الثغرات. وتذكّر أن تطبيقات AI نفسها تفتح أسطح هجوم جديدة (prompt injection = حقن أيضًا: بيانات فُسِّرت كأوامر) — L8-M8.9 يبني على مفردات هذه الوحدة حرفيًا.

## 15. ما يجب إتقانه (Must Master) 🔴
- 🔴 المفردات (أصل/مهاجم/تهديد/ثغرة/حدّ ثقة/سطح هجوم) والمبادئ (least privilege، defense in depth، fail securely)؛ تحقّق بقائمة بيضاء عند الدخول وترميز بحسب السياق عند الخروج؛ آلية ودفاع XSS (encode+CSP+HttpOnly)، CSRF (SameSite+Origin+token)، SQLi (parameters+allow-list للمعرّفات)، SSRF (scheme+allow-list+IP عام بعد الحلّ+لا redirects)، path traversal، command injection، رفع الملفات بـ magic bytes؛ الأسرار خارج Git/السجلات/URL مع تدوير؛ TLS في النقل؛ lockfile وaudit؛ رؤوس الأمان وCORS.

## 16. ما يجب فهمه (Should Understand) 🟠
- 🟠 تشفير مستوى التطبيق بـ AES-GCM وKMS وHMAC للبحث؛ prototype pollution؛ IMDSv2؛ step-up auth؛ حقن CSV؛ CSP بالتفصيل (nonce/strict-dynamic/report-to)؛ semgrep/ZAP؛ الاستجابة لتقارير الثغرات.

## 17. ما يمكن تأجيله (Can Defer) ⚪
- ⚪ التشفير الرياضي، HSM، PCI-DSS تفصيلًا، اختبار الاختراق الاحترافي، WAF rules، أمن الـ kernel/الحاويات العميق (M5.11 الأساسيات).

## 18. الخلاصة
1. فكّر بالأصول والمهاجمين وحدود الثقة؛ كل ما يعبر الحدّ من الجهة الأقل ثقة مدخل غير موثوق — حتى من خدمتك الأخرى.
2. تحقّق بقائمة بيضاء عند الدخول، ورمّز بحسب لغة السياق عند الخروج: الحقن دائمًا "بيانات فُسِّرت كأوامر".
3. XSS/CSRF/SQLi/SSRF/رفع/traversal/command injection — لكلٍّ آلية ودفاع محدّد، وطبقات تتكرّر (least privilege يحدّ ما يمرّ).
4. الأسرار: خارج Git والسجلات وURL، بنطاق ضيّق وتدوير؛ TLS للنقل، KMS للسكون، hashing ≠ encryption.
5. التبعيات والـ CI جزء من سطح الهجوم؛ الأدوات الآلية تحرس، والمهندس يفكّر — وM5.5 يعلّمك أن تفكّر **قبل** البناء.

## 19. مراجع رسمية
- OWASP Top 10 (2021) & OWASP ASVS: https://owasp.org/Top10/ , https://owasp.org/www-project-application-security-verification-standard/
- OWASP Cheat Sheets — XSS Prevention, CSRF Prevention, SQL Injection Prevention, SSRF Prevention, File Upload, Secrets Management, Input Validation: https://cheatsheetseries.owasp.org/
- MDN — Content Security Policy; HTTP security headers; CORS: https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP , https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
- Node.js — Security best practices: https://nodejs.org/en/learn/getting-started/security-best-practices
- PostgreSQL — Client authentication & roles/privileges: https://www.postgresql.org/docs/current/user-manag.html
- AWS — IMDSv2 (SSRF mitigation): https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/configuring-instance-metadata-service.html
- gitleaks, osv-scanner, semgrep: https://github.com/gitleaks/gitleaks , https://google.github.io/osv-scanner/ , https://semgrep.dev/

## المصطلحات
| العربية | English |
|---|---|
| أصل / مهاجم / تهديد / ثغرة | Asset / Attacker / Threat / Vulnerability |
| حدّ الثقة | Trust boundary |
| سطح الهجوم | Attack surface |
| أقل صلاحية | Least privilege |
| الفشل بأمان | Fail securely |
| تحقق بقائمة بيضاء | Allow-list validation |
| ترميز المخرجات (بحسب السياق) | Output encoding (context-aware) |
| حقن | Injection |
| برمجة عبر المواقع | Cross-Site Scripting (XSS) |
| سياسة أمن المحتوى | Content Security Policy (CSP) |
| تزوير الطلب عبر المواقع | Cross-Site Request Forgery (CSRF) |
| حقن SQL / استعلام مُعلمَّ | SQL injection / Parameterized query |
| تزوير الطلب من جهة الخادم | Server-Side Request Forgery (SSRF) |
| إعادة ربط DNS | DNS rebinding |
| اجتياز المسار | Path traversal |
| حقن الأوامر | Command injection |
| بايتات التوقيع (نوع الملف) | Magic bytes |
| إعادة توجيه مفتوحة | Open redirect |
| تلويث النموذج الأولي | Prototype pollution |
| إدارة الأسرار / تدوير | Secrets management / Rotation |
| تشفير أثناء النقل / في السكون | Encryption in transit / at rest |
| إدارة المفاتيح | Key Management Service (KMS) |
| نصف قطر الانفجار | Blast radius |
| هجوم سلسلة التوريد | Supply-chain attack |
