

# خطة: إرسال الرسائل من حساب المستخدم الشخصي

## الفرق بين الطريقتين

```text
┌─────────────────────────────────────────────────────────────┐
│  الطريقة الحالية (Bot API)     │   الطريقة المطلوبة (User API)│
├────────────────────────────────┼────────────────────────────────┤
│  الرسائل تظهر باسم البوت       │   الرسائل تظهر باسمك أنت     │
│  تظهر على اليسار               │   تظهر على اليمين            │
│  تحتاج Bot Token فقط          │   تحتاج API ID + Session     │
└────────────────────────────────┴────────────────────────────────┘
```

## ما ستحتاجه

### 1. الحصول على API ID و API Hash (مرة واحدة)
- ادخل إلى [my.telegram.org](https://my.telegram.org)
- سجل الدخول برقم هاتفك
- اذهب إلى "API Development Tools"
- ستحصل على **API ID** (رقم) و **API Hash** (نص)

### 2. توليد Session String (مرة واحدة)
شغّل هذا الأمر على جهازك:
```bash
deno -A jsr:@mtkruto/auth-string
```
سيُطلب منك:
- رقم هاتفك
- كود التحقق من تلجرام
- ستحصل على نص طويل (Session String)

## التغييرات التقنية

### 1. تحديث قاعدة البيانات
إضافة أعمدة جديدة لجدول `telegram_settings`:
- `api_id` - رقم الـ API
- `api_hash` - نص الـ API Hash
- `session_string` - جلسة تسجيل الدخول

### 2. تحديث واجهة الإعدادات
تعديل `TelegramSettings.tsx`:
- إزالة حقل Bot Token
- إضافة حقول API ID، API Hash، Session String
- إضافة تعليمات للمستخدم

### 3. تحديث وظائف الإرسال
تعديل Edge Functions لاستخدام مكتبة **MTKruto**:

```typescript
import { Client, MemoryStorage } from "jsr:@mtkruto/mtkruto";

const client = new Client({
  apiId: Number(settings.api_id),
  apiHash: settings.api_hash,
  storage: new MemoryStorage(),
});

await client.importAuthString(settings.session_string);
await client.start();
await client.sendMessage(settings.chat_id, message);
```

### 4. الملفات التي ستتغير
- `supabase/migrations/` - إضافة الأعمدة الجديدة
- `src/components/TelegramSettings.tsx` - واجهة الإعدادات الجديدة
- `supabase/functions/send-telegram/index.ts` - استخدام MTKruto
- `supabase/functions/daily-send/index.ts` - استخدام MTKruto
- `supabase/functions/test-telegram/index.ts` - اختبار الاتصال الجديد

## النتيجة
الرسائل ستظهر في تلجرام **باسمك وصورتك الشخصية** على الجانب الأيمن، تماماً كما لو كتبتها بنفسك.

## ⚠️ تنبيه مهم
استخدام حسابك الشخصي للإرسال التلقائي المكثف قد يُعرّض حسابك للقيود من تلجرام. يُفضل ترك فواصل زمنية معقولة بين الرسائل.

