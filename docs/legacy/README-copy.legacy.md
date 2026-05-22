# Marathon Ideas — ماراثون الأفكار
## نظام المسابقات التفاعلية للأفكار الريادية

---

## نظرة عامة

نظام مسابقات حي يتيح لمجموعات من الفرق تقديم أفكار مشاريعها في نزالات إقصائية (مثل كأس العالم).
يتضمن ثلاث شاشات تعمل في وقت واحد وتتزامن لحظياً عبر Socket.IO.

---

## الشاشات الثلاث

| الشاشة | الرابط | المستخدم | الوظيفة |
|--------|--------|----------|---------|
| شاشة العرض | `/display` | شاشة العرض الكبيرة | شجرة الإقصاء + مؤقت + QR + النتائج |
| لوحة الإدارة | `/admin` | منظم الحدث | التحكم الكامل في المؤقت والمراحل والتصويت |
| صفحة التصويت | `/vote/[matchId]` | الجمهور (هواتف) | التصويت عبر QR code |

---

## مراحل النزال الواحد

```
WAITING → PRESENTING → VOTING → RESULT → (next match)
                         ↑
              (3 دقائق تصويت بالحد الأقصى)
```

---

## معادلة النتيجة

```
النتيجة النهائية = (نسبة لجنة التحكيم × 60%) + (نسبة الجمهور × 40%)
```

---

## منطق شجرة الإقصاء

```
8 فرق → 4 مباريات (الدور الأول) → 2 مباريات (نصف النهائي) → 1 مباراة (النهائي)

الانتقال:
  nextRound    = currentRound + 1
  nextPosition = Math.floor(currentPosition / 2)
  slot         = currentPosition % 2 === 0 ? 'team1' : 'team2'
```

---

## المتطلبات

- Node.js 18+
- MySQL 8.0+
- npm أو pnpm

---

## التثبيت والتشغيل

### 1. استنساخ المشروع وتثبيت الاعتماديات
```bash
git clone <repo-url> marathon-ideas
cd marathon-ideas
npm install
```

### 2. إعداد قاعدة البيانات
```bash
# أنشئ قاعدة بيانات MySQL
mysql -u root -p
CREATE DATABASE marathon_ideas CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

### 3. إعداد متغيرات البيئة
```bash
cp .env.example .env.local
# عدّل .env.local بمعلومات MySQL الخاصة بك
```

### 4. تشغيل الـ migrations والـ seed
```bash
npm run db:migrate
npm run db:seed
```

### 5. تشغيل المشروع
```bash
npm run dev
```

### 6. فتح الشاشات
- شاشة العرض: http://localhost:3000/display
- لوحة الإدارة: http://localhost:3000/admin
- صفحة التصويت تُفتح عبر QR code

---

## بناء المشروع بالـ AI Agents

### الترتيب الصحيح:

```
Session 1 (Foundation)    → اختبر → Session 2 (Backend)
Session 2 (Backend)       → اختبر → Session 3 (UI)
Session 3 (UI)            → اختبر → Session 4 (Animations)
```

### الملفات المطلوبة لكل session:

| Session | الملف | المحتوى |
|---------|-------|---------|
| الكل | `CONTEXT.md` | المرجع الثابت — أرفقه دائماً |
| Session 1 | `SESSION_1_PROMPT.md` | Foundation & Database |
| Session 2 | `SESSION_2_PROMPT.md` | API Routes & Socket |
| Session 3 | `SESSION_3_PROMPT.md` | Three Screens UI |
| Session 4 | `SESSION_4_PROMPT.md` | Animations & Polish |
| عند الأخطاء | `ERROR_CORRECTION_TEMPLATES.md` | قوالب تصحيح الأخطاء |

### مع Codex:
1. افتح workspace في مجلد المشروع
2. أرفق `CONTEXT.md`
3. الصق محتوى SESSION_N_PROMPT.md في chat
4. اطلب منه تشغيل الأوامر والتحقق

### مع GitHub Copilot Agent:
1. افتح workspace مع الملفات الموجودة
2. في Copilot Chat: `@workspace [محتوى SESSION_N_PROMPT.md]`
3. سيقرأ CONTEXT.md تلقائياً من workspace

---

## هيكل قاعدة البيانات

```sql
Event     ─── has many ──→ Team
Event     ─── has many ──→ Match
Match     ─── has ──────→ Team (team1, team2, winner)
Match     ─── has many ──→ Vote
Match     ─── has one  ──→ JuryVote
Vote      ─── UNIQUE(matchId, voterToken)  ← يمنع التصويت المتكرر
```

---

## Socket Events

### من الـ Server إلى كل الـ Clients:
```
match:update      → حالة النزال (phase, timer, status)
vote:update       → نتائج التصويت اللحظية
winner:declared   → إعلان الفائز مع النتائج
bracket:advance   → انتقال الفائز في شجرة الإقصاء
timer:tick        → نبضة المؤقت (كل ثانية)
```

### من الـ Admin Client إلى الـ Server:
```
admin:setPhase      → تغيير مرحلة النزال
admin:timerControl  → تحكم في المؤقت
admin:declareWinner → إعلان الفائز
admin:addJuryVote   → إضافة تصويت اللجنة يدوياً
```

---

## الـ Animations (Session 4)

| الحدث | الأنيميشن |
|-------|-----------|
| فوز فريق | scale pulse + تحول للأخضر + confetti |
| انتقال في الـ Bracket | FLIP animation عبر Framer Motion layoutId |
| أشرطة التصويت | useSpring لحركة سلسة |
| تغيير المرحلة | AnimatePresence fade+slide |
| المؤقت <60s | نبض أصفر |
| المؤقت <15s | نبض أحمر + اهتزاز |

---

## معايير الجودة

- TypeScript strict mode: zero `any`
- كل دالة: أقل من 30 سطر
- كل ملف: أقل من 200 سطر
- لا business logic في route handlers
- Zod validation على كل API input
- Prisma `select` دائماً (لا over-fetching)
- Socket.IO لكل real-time updates (لا polling)
- Pino logger (لا console.log في الإنتاج)

---

## الـ Stack

| الطبقة | التقنية |
|--------|---------|
| Framework | Next.js 14 App Router |
| Language | TypeScript strict |
| Database | MySQL 8 |
| ORM | Prisma 5 |
| Real-time | Socket.IO 4 |
| Styling | Tailwind CSS 3 |
| Animation | Framer Motion 11 |
| State | Zustand 4 |
| Auth | NextAuth.js 4 |
| Validation | Zod 3 |
| Testing | Jest |
| Logging | Pino |
