# Module 0.4 — الملفات، المجلدات، المسارات، الطرفية، الـ Shell، متغيرات البيئة
## Files, Folders, Paths, Terminal, Shell, Environment Variables

> **المستوى:** Level 0 — Absolute Foundations
> **الموقع:** أنت في [5 من 8] في هذا المستوى
> **السابق:** [Module 0.3 — Running a Program](module-03-running-a-program.md) | **التالي:** [Module 0.5 — Processes, Ports, localhost](module-05-processes-ports-localhost.md)
> **⚠️ وحدة عملية:** افتح الطرفية ونفّذ كل أمر بيدك.

---

## 1. المتطلبات (Prerequisites)

> **قبل أن تتعلم هذا، يجب أن تفهم:**
- [ ] Storage يحفظ الملفات دائمًا؛ RAM مؤقتة — [Module 0.1](module-01-what-is-a-computer.md)
- [ ] نظام التشغيل يدير الملفات والعمليات؛ العملية لها stdin/stdout/stderr وexit code — [Module 0.3](module-03-running-a-program.md)

---

## 2. أهداف التعلّم (Learning Objectives)

بعد هذه الوحدة ستستطيع:

- شرح ما هو **الملف** فعلًا (تسلسل بايتات + اسم + بيانات وصفية) ولماذا الامتداد "مجرد اسم".
- التنقل في **نظام الملفات** بالطرفية، وفهم الفرق بين **المسار المطلق** و**المسار النسبي**.
- شرح الفرق بين **Terminal** و**Shell**، ولماذا الأوامر هي في الحقيقة **برامج**.
- استخدام **الأنابيب** (pipes) و**إعادة التوجيه** (redirection) لربط البرامج.
- فهم **متغيرات البيئة** (environment variables): ما هي، كيف تصل إلى عمليتك، ولماذا توضع فيها الأسرار.
- قراءة **صلاحيات الملفات** الأساسية.

---

## 3. شرح للمبتدئ (Beginner Explanation)

### الملف: ما هو فعلًا؟

في Module 0.3 قلنا إن الملف **تسلسل من البايتات** على التخزين. لنوضّح:

- **بايت** (**Byte**) = أصغر وحدة تخزين عملية = رقم من 0 إلى 255. (سنفصّل في Level 2.)
- الملف = قائمة طويلة من هذه الأرقام + **اسم** + **بيانات وصفية** (metadata): الحجم، تاريخ التعديل، المالك، الصلاحيات.

**نظام التشغيل لا يعرف ما "يعني" الملف.** ملف `photo.png` وملف `script.js` وملف `data.db` كلها بالنسبة له: بايتات. **البرامج** هي التي تفسّر:
- عارض الصور يقرأ `photo.png` ويعرف من أول بايتات أنها PNG ويرسمها.
- Node يقرأ `script.js` ويفسّره ككود.

**الامتداد** (`.png`, `.js`) **مجرد جزء من الاسم** — تلميح للبشر والبرامج. غيّر اسم `photo.png` إلى `photo.txt` والبايتات لا تتغير؛ فقط برامج أخرى ستحاول فتحه.

### المجلدات والمسارات

**المجلد** (**Folder / Directory**) حاوية تحتوي ملفات ومجلدات أخرى. النتيجة **شجرة**:

```
/                          ← الجذر (root) — أعلى الشجرة
├── home/
│   └── user/              ← مجلدك الشخصي (~)
│       ├── projects/
│       │   └── shop/
│       │       ├── app.js
│       │       └── data/
│       │           └── orders.json
│       └── notes.txt
├── etc/                   ← إعدادات النظام
├── usr/
│   └── bin/               ← برامج مثبتة (node, git, ...)
│       └── node
└── tmp/                   ← ملفات مؤقتة
```

> على Windows الجذر هو `C:\` والفاصل `\`. على Linux/macOS الجذر `/` والفاصل `/`. المفاهيم واحدة. سنستخدم صيغة Linux/macOS لأن **الخوادم في العالم كله تقريبًا Linux**.

**المسار** (**Path**) = عنوان ملف في الشجرة. نوعان:

| النوع | يبدأ بـ | مثال | المعنى |
|---|---|---|---|
| **مطلق** (**Absolute**) | `/` | `/home/user/projects/shop/app.js` | من الجذر. **لا يعتمد على مكانك.** |
| **نسبي** (**Relative**) | أي شيء آخر | `shop/app.js` أو `./app.js` أو `../notes.txt` | **من مكانك الحالي.** |

**رموز خاصة:**
- `.` = المجلد الحالي.
- `..` = المجلد الأب (مستوى للأعلى).
- `~` = مجلدك الشخصي (`/home/user`).

**"مكانك الحالي"** يسمى **مجلد العمل** (**Working Directory** أو **cwd**). **كل عملية لها مجلد عمل.** (تذكّر `process.cwd()` في Module 0.3.) المسارات النسبية تُحلّ بالنسبة له.

> **هذا مصدر bug كلاسيكي:** `fs.readFile("./config.json")` يعمل عندما تشغّل من مجلد المشروع، ويفشل عندما تشغّله من مكان آخر (مثل cron أو Docker) لأن cwd مختلف. الحل: ابنِ مسارًا مطلقًا من موقع الملف نفسه (`__dirname`).

### الطرفية مقابل الـ Shell

كلمتان تُستخدمان كمترادفين لكنهما مختلفتان:

- **الطرفية** (**Terminal**): **النافذة**. برنامج يعرض نصًا ويستقبل ضغطات المفاتيح. (Terminal.app, Windows Terminal, iTerm.)
- **الـ Shell**: **البرنامج الذي يعمل داخل النافذة**، يقرأ ما تكتبه، يفسّره، ويشغّل برامج أخرى. (bash, zsh, PowerShell.)

```
┌─ Terminal (النافذة) ─────────────────────┐
│                                          │
│  ┌─ Shell (bash/zsh) — عملية ──────────┐ │
│  │ $ ls                                │ │
│  │   ↓ الـ shell ينشئ عملية ابنة: ls   │ │
│  │   app.js  data/                     │ │
│  │ $ node app.js                       │ │
│  │   ↓ الـ shell ينشئ عملية ابنة: node │ │
│  │   Hello                             │ │
│  │ $ _                                 │ │
│  └─────────────────────────────────────┘ │
└──────────────────────────────────────────┘
```

**الفكرة المحورية:** عندما تكتب `ls`، الـ shell **لا يعرف** ما هو `ls`. يبحث عن **برنامج** اسمه `ls` في مجلدات معينة، ينشئ **عملية** له، ينتظر انتهاءها، ويعرض مخرجاتها. **كل أمر = برنامج = عملية.** (ماعدا قلّة مدمجة في الـ shell مثل `cd`.)

أين يبحث؟ في المجلدات المذكورة في **متغير بيئة** اسمه `PATH`. لهذا عندما تثبّت Node ولا تعمل `node` في الطرفية، المشكلة غالبًا: مجلد Node ليس في `PATH`.

### الأوامر الأساسية

```bash
pwd                 # print working directory — أين أنا؟
ls                  # list — ماذا هنا؟
ls -la              # مع التفاصيل والملفات المخفية
cd projects/shop    # change directory — انتقل
cd ..               # للأعلى
cd ~                # للمجلد الشخصي
cd /                # للجذر

mkdir data          # make directory
touch notes.txt     # أنشئ ملفًا فارغًا (أو حدّث وقته)
cat notes.txt       # اعرض المحتوى
cp a.txt b.txt      # copy
mv a.txt c.txt      # move / rename
rm c.txt            # remove — لا سلة محذوفات!
rm -r data          # remove recursive (مجلد ومحتوياته) — خطير

echo "hello"        # اطبع نصًا
which node          # أين برنامج node؟
man ls              # manual — دليل الأمر (q للخروج)
```

### الأنابيب وإعادة التوجيه — قوة الـ shell الحقيقية

تذكّر من Module 0.3: كل عملية لها **stdin, stdout, stderr**. الـ shell يتيح لك **توصيلها**:

```bash
# إعادة التوجيه (Redirection): stdout → ملف
node app.js > output.txt        # اكتب (يستبدل)
node app.js >> output.txt       # أضف في النهاية
node app.js 2> errors.txt       # stderr فقط → ملف
node app.js > out.txt 2>&1      # الاثنان → نفس الملف

# من ملف → stdin
node app.js < input.txt

# الأنبوب (Pipe): stdout لبرنامج → stdin لبرنامج آخر
cat access.log | grep "ERROR" | wc -l
#   ↑ اقرأ الملف   ↑ صفِّ الأسطر  ↑ عدّ الأسطر
#  = "كم سطر خطأ في السجل؟"
```

هذه **فلسفة Unix**: برامج صغيرة، كل واحد يفعل شيئًا واحدًا جيدًا، وتُركَّب بالأنابيب. ستستخدمها يوميًا لتحليل السجلات (logs) في الإنتاج.

### متغيرات البيئة (Environment Variables)

في Module 0.3 قلنا إن OS ينسخ **متغيرات البيئة** إلى كل عملية جديدة. ما هي؟

**متغير البيئة** (**Environment Variable**) = زوج `NAME=value` نصي، **يعيش خارج كودك**، تنسخه كل عملية من أمّها عند الإنشاء.

```bash
echo $HOME          # /home/user
echo $PATH          # /usr/local/bin:/usr/bin:/bin   ← أين يبحث الـ shell عن البرامج
echo $USER          # user
env                 # اعرض كلها
```

**لماذا هي مهمة جدًا للمهندس؟** لأنها الطريقة القياسية لإعطاء البرنامج **إعدادات تختلف حسب المكان** دون تغيير الكود:

| الإعداد | على جهازك | على الخادم |
|---|---|---|
| `DATABASE_URL` | `postgres://localhost/shop_dev` | `postgres://db.prod.internal/shop` |
| `PORT` | `3000` | `8080` |
| `API_KEY` | مفتاح تجريبي | **المفتاح الحقيقي السري** |
| `NODE_ENV` | `development` | `production` |

**نفس الكود، بيئتان.** و**الأسرار** (كلمات مرور، مفاتيح API) **لا تُكتب في الكود أبدًا** — لأن الكود يُحفظ في Git ويراه الجميع. تُوضع في متغيرات البيئة على الخادم فقط.

```bash
# تعيين لعملية واحدة فقط:
PORT=4000 node server.js

# تعيين لجلسة الـ shell الحالية (والعمليات التي تنشئها بعد ذلك):
export PORT=4000
node server.js
```

**نقطة دقيقة:** `export` يؤثر على **هذه الجلسة** وأبنائها فقط. افتح طرفية جديدة → اختفى. لجعله دائمًا، يُضاف لملف إعداد الـ shell (`~/.bashrc`, `~/.zshrc`). في المشاريع، نستخدم ملف `.env` (**لا يُرفع إلى Git**) تقرؤه مكتبة عند البدء.

### الصلاحيات (Permissions) — نظرة أولى

```bash
ls -la
# -rw-r--r--  1 user staff  1024 Jan 10 10:00 app.js
# drwxr-xr-x  3 user staff    96 Jan 10 10:00 data
# ↑↑↑↑↑↑↑↑↑↑
# │└┬┘└┬┘└┬┘
# │ │  │  └── others: r-- (قراءة فقط)
# │ │  └───── group:  r-- (قراءة فقط)
# │ └──────── owner:  rw- (قراءة وكتابة)
# └────────── نوع: - ملف، d مجلد
```

`r` = read، `w` = write، `x` = execute (تشغيل كبرنامج، أو دخول للمجلد). ثلاث مجموعات: المالك، المجموعة، الآخرون.

```bash
chmod +x script.sh      # اجعله قابلًا للتنفيذ
chmod 600 secret.key    # المالك فقط يقرأ ويكتب (rw-------)
```

> عندما ترى `EACCES: permission denied` — هذه هي. نظام التشغيل يرفض لأن عمليتك (بهوية مستخدمها) لا تملك الصلاحية.

---

## 4. النموذج الذهني (Mental Model)

```
     ┌──────────────────────────────────────────────────────────────┐
     │  Shell = مترجم أوامر + مُنشئ عمليات + موصّل أنابيب              │
     │                                                              │
     │   "cat log | grep ERR > out.txt"                             │
     │          │        │        │                                 │
     │          ▼        ▼        ▼                                 │
     │    [process cat]─▶[process grep]─▶ file out.txt              │
     │     stdout→stdin    stdout→file                              │
     │                                                              │
     │   كل عملية ترث: cwd, env vars, stdin/stdout/stderr            │
     └──────────────────────────────────────────────────────────────┘

     ┌──────────────────────────────────────────────────────────────┐
     │  File System = شجرة. Path = عنوان في الشجرة.                   │
     │  Absolute: من الجذر /   —   Relative: من cwd                  │
     └──────────────────────────────────────────────────────────────┘

     ┌──────────────────────────────────────────────────────────────┐
     │  Environment Variables = إعدادات تعيش خارج الكود               │
     │  نفس الكود + بيئة مختلفة = سلوك مختلف                          │
     │  الأسرار هنا، لا في الكود                                      │
     └──────────────────────────────────────────────────────────────┘
```

---

## 5. الرسم التوضيحي (Visual Diagram)

### وراثة البيئة ومجلد العمل

```mermaid
flowchart TD
    T["🖥️ Terminal window"]
    S["🐚 Shell (zsh) — PID 500<br/>cwd: /home/user/shop<br/>env: PATH, HOME, PORT=4000"]
    N["⚙️ node server.js — PID 501<br/>cwd: /home/user/shop (موروث)<br/>env: PATH, HOME, PORT=4000 (منسوخ)"]
    C["⚙️ child: git — PID 502<br/>cwd + env (منسوخ من node)"]

    T --> S
    S -->|"creates (fork+exec)"| N
    N -->|"spawn"| C

    S -.->|"export X=1 بعد تشغيل node"| NOTE["❌ node لا يرى X<br/>النسخ حدث عند الإنشاء"]
```

### المسارات

```mermaid
flowchart TD
    R["/"]
    R --> H["home/"]
    R --> U["usr/"]
    H --> US["user/  (= ~)"]
    US --> P["projects/"]
    US --> NT["notes.txt"]
    P --> SH["shop/  ← cwd"]
    SH --> APP["app.js"]
    SH --> D["data/"]
    D --> O["orders.json"]
    U --> B["bin/"]
    B --> NODE["node"]

    style SH fill:#ffd700
```

| من cwd = `/home/user/projects/shop` | يشير إلى |
|---|---|
| `app.js` أو `./app.js` | `/home/user/projects/shop/app.js` |
| `data/orders.json` | `/home/user/projects/shop/data/orders.json` |
| `../` | `/home/user/projects/` |
| `../../notes.txt` | `/home/user/notes.txt` |
| `~/notes.txt` | `/home/user/notes.txt` |
| `/usr/bin/node` | نفسه (مطلق، لا يعتمد على cwd) |

---

## 6. مثال بسيط (Simple Example)

**نفّذ هذا بيدك الآن:**

```bash
cd ~                                   # اذهب للمجلد الشخصي
mkdir -p sdlc-practice/level0          # أنشئ مجلدين (-p: ينشئ الأب إن لم يوجد)
cd sdlc-practice/level0
pwd                                    # /home/<you>/sdlc-practice/level0

echo "first line" > notes.txt          # أنشئ ملفًا بمحتوى
echo "second line" >> notes.txt        # أضف سطرًا
cat notes.txt                          # اعرض

ls -la                                 # لاحظ الصلاحيات والحجم
cp notes.txt backup.txt
mv backup.txt notes-backup.txt
ls

cat notes.txt | grep second            # صفِّ: فقط الأسطر التي فيها "second"
wc -l notes.txt                        # عدّ الأسطر: 2

cd ..                                  # للأعلى
ls level0                              # اعرض محتوى level0 من الخارج (مسار نسبي)
ls ~/sdlc-practice/level0              # نفسه بمسار مطلق
```

---

## 7. مثال كود (Code Example)

### مثال 1: الـ bug الكلاسيكي — المسار النسبي وcwd

```javascript
// ~/sdlc-practice/level0/app/read-config.js
const fs = require("node:fs");

// ❌ هش: يعتمد على cwd
const config = JSON.parse(fs.readFileSync("./config.json", "utf8"));
console.log(config);
```

```bash
cd ~/sdlc-practice/level0/app
echo '{"port": 3000}' > config.json
node read-config.js                 # ✅ { port: 3000 }

cd ~
node sdlc-practice/level0/app/read-config.js
# ❌ Error: ENOENT: no such file or directory, open './config.json'
#    لأن cwd الآن = /home/user، و ./config.json = /home/user/config.json
```

**الإصلاح:** ابنِ المسار من **موقع الملف نفسه**، لا من cwd:

```javascript
const fs = require("node:fs");
const path = require("node:path");

// ✅ __dirname = المجلد الذي فيه هذا الملف، دائمًا، بغض النظر عن cwd
const configPath = path.join(__dirname, "config.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
console.log(config);
```

> `path.join` يستخدم الفاصل الصحيح للنظام (`/` أو `\`). لا تلصق المسارات بالنصوص يدويًا.

### مثال 2: متغيرات البيئة في Node

```javascript
// server-config.js
const port = process.env.PORT ?? 3000;              // من البيئة، أو افتراضي
const dbUrl = process.env.DATABASE_URL;
const env = process.env.NODE_ENV ?? "development";

if (!dbUrl) {
  console.error("FATAL: DATABASE_URL is not set");  // stderr
  process.exit(1);                                   // فشل صريح (Module 0.3)
}

console.log(`env=${env} port=${port}`);
console.log(`db host=${new URL(dbUrl).host}`);       // لا تطبع الـ URL كاملًا (فيه كلمة مرور!)
```

```bash
node server-config.js
# FATAL: DATABASE_URL is not set
echo $?   # 1

DATABASE_URL=postgres://u:secret@localhost:5432/shop node server-config.js
# env=development port=3000
# db host=localhost:5432

export PORT=8080
export NODE_ENV=production
DATABASE_URL=postgres://u:secret@db.internal/shop node server-config.js
# env=production port=8080
# db host=db.internal
```

> لاحظ: **نفس الملف**، سلوك مختلف بالكامل حسب البيئة. و**لم نكتب السر في الكود.**

### مثال 3: ملف `.env` (الممارسة الشائعة في المشاريع)

```bash
# .env  ← في جذر المشروع، ويُضاف إلى .gitignore
PORT=3000
DATABASE_URL=postgres://u:secret@localhost:5432/shop
```

```javascript
// Node 20.6+ يدعم --env-file مباشرة بدون مكتبات:
// node --env-file=.env server-config.js
```

```gitignore
# .gitignore
.env
```

> **قاعدة لا تُكسر:** `.env` **لا يُرفع إلى Git أبدًا.** ارفع `.env.example` بقيم وهمية ليعرف زملاؤك المتغيرات المطلوبة.

### مثال 4: سكربت shell صغير — الأوامر برامج

```bash
#!/usr/bin/env bash
# count-errors.sh — كم خطأ في كل ملف سجل؟
# الاستخدام: ./count-errors.sh logs/

set -euo pipefail        # اخرج عند أول خطأ، متغيرات غير معرّفة = خطأ، أنابيب تفشل بصدق

dir="${1:?Usage: $0 <log-dir>}"     # معامل إلزامي

for f in "$dir"/*.log; do
  count=$(grep -c "ERROR" "$f" || true)   # grep يخرج بـ 1 إن لم يجد — لا نعتبره فشلًا
  echo "$(basename "$f"): $count errors"
done
```

```bash
chmod +x count-errors.sh       # اجعله قابلًا للتنفيذ (الصلاحية x)
mkdir -p logs
printf "INFO ok\nERROR bad\nERROR worse\n" > logs/app.log
printf "INFO ok\n" > logs/worker.log
./count-errors.sh logs
# app.log: 2 errors
# worker.log: 0 errors
```

> **لماذا Bash هنا؟** لأن هذه اللغة الأصلية للـ shell، وستقرأ/تكتب سكربتات مثلها في CI/CD وDocker وأدوات النشر. السطر الأول `#!/usr/bin/env bash` (**shebang**) يخبر OS أي برنامج يفسّر هذا الملف.

---

## 8. مثال من العالم الحقيقي (Real-World Example)

### "ثبّت Node لكن `node` لا يعمل في الطرفية"

```bash
node --version
# command not found: node
```

**ما يحدث:** الـ shell يبحث عن برنامج اسمه `node` في مجلدات `$PATH`. المثبّت وضعه في مجلد غير مذكور هناك.

```bash
echo $PATH
# /usr/bin:/bin
ls /usr/local/bin/node     # موجود هنا! لكن /usr/local/bin ليس في PATH
export PATH="/usr/local/bin:$PATH"   # أضفه (لهذه الجلسة)
node --version             # v20.11.0 ✅
```

لتثبيته دائمًا: أضف سطر `export` إلى `~/.zshrc` أو `~/.bashrc`.

**الدرس:** "command not found" ≠ "غير مثبّت". يعني "ليس في PATH". المهندس يعرف الفرق.

### كيف تعمل أدوات مثل `nvm` و Docker و CI؟

كلها تتلاعب بنفس المفاهيم: تغيّر `PATH` لتشير لإصدار Node معين، تحقن متغيرات بيئة، تحدد cwd، توصّل stdout إلى سجلات. **لا سحر.**

---

## 9. مثال من الإنتاج (Production Example)

### الحادثة: تسريب مفتاح API على GitHub

مطور وضع مفتاح خدمة الدفع في الكود:
```javascript
const stripe = new Stripe("sk_live_51H...");  // ❌
```
رفعه إلى مستودع عام. خلال **دقائق**، bots تمسح GitHub باستمرار وجدت المفتاح. تمت عمليات احتيالية بآلاف الدولارات قبل إلغائه.

**لماذا حدث؟** خلط بين **الكود** (ثابت، مشترك، في Git) و**الإعدادات السرية** (تختلف بالبيئة، لا تُشارك).

**الممارسة الصحيحة:**
1. المفتاح في متغير بيئة: `STRIPE_SECRET_KEY`.
2. محليًا: في `.env` المضاف إلى `.gitignore`.
3. على الخادم: يُحقن من **مدير أسرار** (secrets manager — Level 5) إلى بيئة العملية.
4. الكود: `process.env.STRIPE_SECRET_KEY` + فشل صريح إن غاب.
5. حتى لو تسرّب الكود، **لا سر فيه**.

### الحادثة: cron job يفشل بصمت بسبب cwd

سكربت يعمل يدويًا بنجاح. مجدول بـ cron. يفشل كل ليلة. السبب: cron يشغّل العملية بـ cwd = `/` وبـ `PATH` مختصر جدًا. المسارات النسبية تنكسر و`node` نفسه لا يُعثر عليه.

**الإصلاح:** مسارات مطلقة في كل مكان (`/usr/local/bin/node /home/app/backup.js`)، وتحديد `PATH` و cwd صراحةً في السكربت.

> **القاعدة:** **لا تفترض cwd ولا PATH ولا env في أي بيئة غير طرفيتك.** كل بيئة تشغيل (cron, Docker, CI, systemd) تبدأ من حالة مختلفة.

---

## 10. مفاهيم خاطئة شائعة (Common Misconceptions)

| ❌ المفهوم الخاطئ | ✅ الحقيقة |
|---|---|
| "الامتداد يحدد نوع الملف" | الامتداد جزء من الاسم. البايتات تحدد المحتوى. البرامج تستخدم الامتداد كتلميح فقط (وبعضها يقرأ أول بايتات — "magic bytes"). |
| "Terminal و Shell نفس الشيء" | Terminal النافذة. Shell البرنامج داخلها الذي يفسّر الأوامر. |
| "`ls` أمر من نظام التشغيل" | `ls` **برنامج** في `/bin/ls`. الـ shell يشغّله كعملية. `which ls` يريك مكانه. |
| "متغيرات البيئة عامة لكل الجهاز" | تُنسخ **لكل عملية عند إنشائها** من أمّها. تغييرها بعد الإنشاء لا يؤثر على العمليات القائمة. |
| "`./file` و `file` مختلفان" | في المسارات، متطابقان. (الفرق فقط عند **تشغيل** برنامج: `./script.sh` يعني "من هنا"، بينما `script.sh` يبحث في PATH.) |
| "حذف ملف يمسحه من القرص" | `rm` يحذف **الاسم** من نظام الملفات؛ البايتات تبقى حتى تُكتب فوقها. (لهذا توجد أدوات استرجاع، ولهذا الأسرار المحذوفة ليست آمنة.) |
| "`.env` طريقة آمنة للأسرار" | آمنة **محليًا** فقط إن لم تُرفع. في الإنتاج، تُستخدم مدراء أسرار مع صلاحيات وتدوير. |

---

## 11. أخطاء شائعة (Common Mistakes)

1. **مسارات نسبية في كود يعمل من أماكن مختلفة** (cron, Docker, tests) → `ENOENT`. استخدم `__dirname` / `path.join`.
2. **رفع `.env` إلى Git.** أضفه إلى `.gitignore` **قبل** أول commit. (إن رُفع سر مرة واحدة، اعتبره مسرّبًا وبدّله — حذفه من التاريخ لا يكفي.)
3. **لصق المسارات كنصوص:** `dir + "/" + file` ينكسر على Windows. استخدم `path.join`.
4. **`rm -rf` بمتغير فارغ:** `rm -rf $DIR/` عندما `DIR` غير معرّف = `rm -rf /`. استخدم `set -u` و`"${DIR:?}"`.
5. **طباعة متغيرات البيئة كاملة في السجلات** (`console.log(process.env)`) → الأسرار في الـ logs.
6. **افتراض أن الـ shell على الخادم هو نفسه على جهازك** (zsh vs bash vs sh) → سكربتات تنكسر. اكتب `#!/usr/bin/env bash` صراحةً.

---

## 12. تمرين تصحيح (Debugging Exercise)

### السيناريو

مشروع بهذه البنية:
```
~/projects/report-tool/
├── src/
│   └── generate.js
├── templates/
│   └── report.html
└── package.json   ← فيه: "scripts": { "report": "node src/generate.js" }
```

**`src/generate.js`:**
```javascript
const fs = require("node:fs");
const template = fs.readFileSync("templates/report.html", "utf8");
const out = template.replace("{{DATE}}", new Date().toISOString());
fs.writeFileSync("out/report.html", out);
console.log("Report written");
```

**الملاحظات:**
- `cd ~/projects/report-tool && npm run report` → يفشل بـ `ENOENT: no such file or directory, open 'out/report.html'`.
- بعد أن أنشأ الزميل مجلد `out/` يدويًا، يعمل.
- لكن عند تشغيله من cron: `node /home/user/projects/report-tool/src/generate.js` → يفشل بـ `ENOENT ... 'templates/report.html'`.

### الأسئلة

1. لماذا فشل أول مرة رغم أن `templates/report.html` موجود؟
2. لماذا نجح بعد إنشاء `out/` من المجلد الرئيسي، لكنه فشل من cron على ملف **مختلف** (`templates/...`)؟ ما cwd في كل حالة؟
3. أعد كتابة السكربت ليعمل من **أي** cwd.

<details>
<summary>💡 الحل</summary>

1. الفشل الأول **ليس** في القراءة بل في **الكتابة**: `out/` غير موجود. `writeFileSync` لا ينشئ المجلدات تلقائيًا. (اقرأ رسالة الخطأ بدقة: `open 'out/report.html'`.)

2. **cwd مختلف:**
   - `npm run report` يضبط cwd = مجلد المشروع (حيث `package.json`). فالمسار النسبي `templates/report.html` يُحلّ إلى `~/projects/report-tool/templates/report.html` ✅.
   - cron يشغّل بـ cwd = `/` (أو مجلد المستخدم). `templates/report.html` يُحلّ إلى `/templates/report.html` ❌.

3. **الإصلاح:**
```javascript
const fs = require("node:fs");
const path = require("node:path");

// جذر المشروع = مجلد هذا الملف + مستوى للأعلى (src/ → root)
const ROOT = path.resolve(__dirname, "..");
const templatePath = path.join(ROOT, "templates", "report.html");
const outDir = path.join(ROOT, "out");
const outPath = path.join(outDir, "report.html");

try {
  const template = fs.readFileSync(templatePath, "utf8");
  const out = template.replace("{{DATE}}", new Date().toISOString());
  fs.mkdirSync(outDir, { recursive: true });        // أنشئ المجلد إن لم يوجد
  fs.writeFileSync(outPath, out);
  console.log(`Report written to ${outPath}`);
} catch (err) {
  console.error(`Failed: ${err.message}`);           // stderr
  process.exit(1);                                    // exit code صحيح (Module 0.3)
}
```

**المنهجية:** Observe (يفشل من مكان، ينجح من آخر) → Evidence (رسالة ENOENT تذكر المسار **النسبي** الذي حاول فتحه) → Hypothesis (cwd مختلف) → Experiment (`console.log(process.cwd())` في بداية السكربت في الحالتين) → Fix (مسارات مبنية من `__dirname`).

</details>

---

## 13. تمرين معماري (Architecture Exercise)

### السيناريو

تطبيقك يحتاج هذه الإعدادات: `PORT`, `DATABASE_URL`, `STRIPE_SECRET_KEY`, `LOG_LEVEL`, `FEATURE_NEW_CHECKOUT` (تفعيل/تعطيل ميزة).

ويعمل في 4 بيئات: جهاز المطور، CI (اختبارات آلية)، staging (نسخة تجريبية)، production.

### الأسئلة

1. أيٌّ من هذه الإعدادات **سر** وأيٌّ ليس سرًا؟ هل يختلف تعاملك معها؟
2. أين تعيش كل قيمة في كل بيئة؟ (كود؟ ملف في Git؟ `.env` محلي؟ إعدادات منصة CI؟ مدير أسرار؟)
3. ماذا يجب أن يفعل التطبيق عند بدء التشغيل إذا كان `DATABASE_URL` مفقودًا؟ وإذا كان `FEATURE_NEW_CHECKOUT` مفقودًا؟ لماذا الجواب مختلف؟

<details>
<summary>💡 إجابة نموذجية</summary>

1. **أسرار:** `DATABASE_URL` (فيه كلمة مرور)، `STRIPE_SECRET_KEY`. **غير سرية:** `PORT`, `LOG_LEVEL`, `FEATURE_NEW_CHECKOUT`. الفرق: غير السرية يمكن أن تكون في ملف إعدادات مرفوع إلى Git (مثل `config/staging.json`)؛ الأسرار **أبدًا**.

2. | الإعداد | Dev | CI | Staging | Production |
   |---|---|---|---|---|
   | `PORT` | `.env` أو افتراضي في الكود | افتراضي | إعدادات المنصة | إعدادات المنصة |
   | `LOG_LEVEL` | `.env` (`debug`) | `info` | ملف إعدادات في Git | ملف إعدادات في Git (`warn`) |
   | `FEATURE_NEW_CHECKOUT` | `.env` | `true` (لاختبارها) | ملف إعدادات | ملف إعدادات / نظام feature flags |
   | `DATABASE_URL` | `.env` (DB محلية) | secret في CI (DB مؤقتة) | مدير أسرار | مدير أسرار |
   | `STRIPE_SECRET_KEY` | `.env` (مفتاح test) | secret في CI (test) | مدير أسرار (test) | مدير أسرار (**live**) |

3. **`DATABASE_URL` مفقود → فشل فوري بـ exit 1** (fail fast). التطبيق بلا قاعدة بيانات عديم الفائدة، والفشل المبكر الواضح أفضل من فشل غامض لاحقًا عند أول طلب.
   **`FEATURE_NEW_CHECKOUT` مفقود → افتراضي آمن (`false`) + تحذير في السجل.** غيابه لا يمنع التطبيق من العمل؛ الافتراضي الأكثر تحفظًا هو الصحيح.

   **المبدأ:** لكل إعداد اسأل: "هل يستطيع التطبيق العمل بشكل صحيح بدونه؟" إن لا → إلزامي وفشل سريع. إن نعم → افتراضي آمن موثّق.

</details>

---

## 14. الصلة بعصر الذكاء الاصطناعي (AI-Era Relevance)

### مخاطر خاصة بـ AI agents في هذه الوحدة

AI agents **تنفّذ أوامر shell** في مستودعك. المفاهيم هنا هي **سطح الخطر** مباشرة:

| الخطر | مثال |
|---|---|
| **أوامر مدمّرة** | `rm -rf` على مسار خاطئ، `git push --force`, `DROP TABLE` |
| **تسريب أسرار** | AI يطبع `process.env` في log، أو يضع مفتاحًا في الكود "مؤقتًا"، أو يرفع `.env` |
| **افتراض cwd/PATH** | كود يعمل في بيئة AI ويفشل في بيئتك |
| **تعديل ملفات خارج المشروع** | مسار نسبي خاطئ `../../` يلمس ملفات أخرى |

**ما تتحقق منه في كود/أوامر AI:**
```
□ هل أي أمر shell مدمّر (rm, mv فوق ملف موجود, force)؟ هل المسار صحيح ومؤكد؟
□ هل توجد أسرار في الكود أو السجلات؟ هل .env في .gitignore؟
□ هل المسارات مبنية من __dirname أم تعتمد على cwd؟
□ هل يفترض وجود أدوات في PATH (python, docker) غير موجودة في بيئتك؟
```

**مبدأ Level 8 المبكّر:** أعطِ AI agent **أقل صلاحيات ممكنة** (least privilege). لا يحتاج صلاحية حذف إن كانت مهمته القراءة.

---

## 15. ما يجب إتقانه (Must Master) 🔴

- الملف = بايتات + اسم + metadata. الامتداد تلميح.
- **Absolute vs Relative path**، و**cwd** لكل عملية، و`__dirname` لمسارات مستقلة عن cwd.
- Terminal (نافذة) vs Shell (مفسّر أوامر). **كل أمر = برنامج = عملية.** `PATH` يحدد أين يُبحث.
- الأنابيب `|` وإعادة التوجيه `> >> 2> <`.
- **متغيرات البيئة**: تُنسخ عند إنشاء العملية؛ الإعدادات والأسرار فيها لا في الكود؛ `.env` لا يُرفع.
- قراءة `rwx` الأساسية و`EACCES`.

## 16. ما يجب فهمه (Should Understand) 🟠

- فلسفة Unix (برامج صغيرة مركّبة).
- `export` يؤثر على الجلسة وأبنائها فقط.
- لماذا cron/Docker/CI تبدأ ببيئة مختلفة.
- `set -euo pipefail` في سكربتات bash.
- Fail fast للإعدادات الإلزامية، افتراضي آمن للاختيارية.

## 17. ما يمكن تأجيله (Can Defer) ⚪

- inodes، hard/soft links، أنظمة ملفات مختلفة (ext4, APFS, NTFS).
- Bash المتقدم (arrays, traps, process substitution).
- `sudo`, users/groups بعمق — Level 5 عند الحاجة.
- مدراء الأسرار الفعليون — Level 5.

---

## 18. الخلاصة (Summary)

1. **الملف بايتات** باسم ومسار وmetadata. نظام التشغيل لا يفهم المحتوى؛ البرامج تفعل.
2. **المسار المطلق** من `/`؛ **النسبي** من **cwd** العملية. اعتماد الكود على cwd = bug ينتظر بيئة مختلفة. استخدم `__dirname` + `path.join`.
3. **Terminal** نافذة، **Shell** مفسّر. **كل أمر برنامج** يُبحث عنه في `PATH` ويُشغَّل كعملية.
4. **الأنابيب وإعادة التوجيه** توصّل stdout/stdin/stderr بين العمليات والملفات — قوة حقيقية لتحليل السجلات.
5. **متغيرات البيئة** تُنسخ لكل عملية عند إنشائها. نفس الكود + بيئة مختلفة = سلوك مختلف. **الأسرار فيها، لا في الكود.** `.env` في `.gitignore`.
6. **الصلاحيات** `rwx` لمالك/مجموعة/آخرين. `EACCES` = OS رفض.
7. **لا تفترض cwd أو PATH أو env** في cron/Docker/CI. حدّدها صراحةً.

---

## 19. مراجع رسمية (Official References)

- **Node.js `path` module:** https://nodejs.org/api/path.html
- **Node.js `process.env`:** https://nodejs.org/api/process.html#processenv
- **Node.js `--env-file`:** https://nodejs.org/api/cli.html#--env-fileconfig
- **GNU Bash Manual:** https://www.gnu.org/software/bash/manual/
- **The Linux Command Line (free book, William Shotts):** https://linuxcommand.org/tlcl.php
- **Filesystem Hierarchy Standard (ما معنى /etc, /usr, /var):** https://refspecs.linuxfoundation.org/FHS_3.0/fhs/index.html
- **The Twelve-Factor App — III. Config (لماذا الإعدادات في البيئة):** https://12factor.net/config

---

## المصطلحات في هذه الوحدة (Terminology)

| العربية | English |
|---|---|
| ملف | File |
| مجلد | Folder / Directory |
| نظام الملفات | File System |
| الجذر | Root (`/`) |
| مسار | Path |
| مسار مطلق | Absolute Path |
| مسار نسبي | Relative Path |
| مجلد العمل الحالي | Current Working Directory (cwd) |
| الطرفية | Terminal |
| مفسّر الأوامر | Shell (bash, zsh) |
| أمر | Command |
| معامل / وسيط | Argument |
| أنبوب | Pipe (`\|`) |
| إعادة توجيه | Redirection (`>`, `>>`, `<`, `2>`) |
| متغير بيئة | Environment Variable |
| مسار البحث عن البرامج | `PATH` |
| تصدير (متغير) | `export` |
| صلاحيات | Permissions |
| قراءة / كتابة / تنفيذ | read / write / execute (`rwx`) |
| المالك / المجموعة / الآخرون | owner / group / others |
| سطر التعريف (أول سطر في سكربت) | Shebang (`#!`) |
| بيانات وصفية | Metadata |
| امتداد الملف | File Extension |
| سر | Secret |
| مدير أسرار | Secrets Manager |
| الفشل المبكر | Fail Fast |
| أقل صلاحية | Least Privilege |

---

> **التالي:** [Module 0.5 — Processes, Ports, localhost, IP Address](module-05-processes-ports-localhost.md) — سنشغّل أول خادم على جهازك ونفهم ما هو "port 3000".
