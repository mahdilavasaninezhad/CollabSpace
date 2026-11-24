# راه‌اندازی CollabSpace با Supabase

## ۱. ساخت پروژه

در https://supabase.com/dashboard یک پروژه جدید با نام CollabSpace بساز. برای کاهش ریسک، فایل SQL را روی دیتابیس مربوط به پروژه‌های دیگر اجرا نکن.

## ۲. راه‌اندازی جداول و امنیت

از SQL Editor یک Query جدید باز کن، محتوای فایل `supabase/schema.sql` را وارد کن و یک‌بار اجرا کن. این فایل جداول، توابع و Row Level Security را ایجاد می‌کند. پس از اجرا در Database و Storage بررسی کن که جداول و باکت `collabspace-attachments` ساخته شده باشند.

## ۳. تنظیم Authentication

از Authentication → Providers ورود با Email را فعال کن. برای انتشار عمومی تأیید ایمیل را روشن نگه دار.

در Authentication → URL Configuration:

Site URL:

```text
https://mahdilavasaninezhad.github.io/CollabSpace/
```

Redirect URLs:

```text
http://localhost:5173/**
https://mahdilavasaninezhad.github.io/CollabSpace/**
```

## ۴. دریافت اطلاعات اتصال

از قسمت Project Settings → API Keys یا Connect در داشبورد، Project URL و Publishable key یا anon key را بردار. از کلیدهای Secret و service_role استفاده نکن.

فایل `.env.example` را با نام `.env.local` کپی کن و مقدارها را جایگزین کن:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_OR_ANON_KEY
```

فایل `.env.local` نباید به GitHub ارسال شود.

## ۵. اجرای برنامه

```bash
npm install
npm run dev
```

داخل Preferences گزینه Try live collaboration را انتخاب کن. با ایمیل اول ثبت‌نام کن و پس از تأیید، یک Workspace بساز. سپس با ایمیل دوم در مرورگر دیگر حساب بساز و با کد دعوت به Workspace بپیوند.

## ۶. تست‌های ضروری

- ارسال پیام از یک مرورگر و نمایش آن در مرورگر دیگر
- ایجاد کانال، جست‌وجوی پیام و تغییر محتوا
- گفتگوی خصوصی و اطمینان از عدم دسترسی حساب سوم به آن
- واکنش ایموجی، ارسال پیوست و دسترسی به فایل
- بررسی نمایش فارسی و انگلیسی و تم روشن و تاریک در موبایل
- بررسی خطاهای Console و Network

در Realtime → Settings تنظیم Allow public access را برای کانال‌ها غیرفعال کن تا Broadcast و Presence نیازمند مجوز باشند. سیاست مربوط به Presence خصوصی در SQL همراه پروژه قرار دارد.

## ۷. انتشار در GitHub Pages

اگر مخزن GitHub با نام `CollabSpace` ساخته شد، زیر Settings → Pages گزینه Source را روی GitHub Actions قرار بده.

در Repository Settings → Secrets and variables → Actions → Variables مقدارهای زیر را ثبت کن:

`VITE_SUPABASE_URL`

`VITE_SUPABASE_ANON_KEY`

سپس Workflow انتشار را اجرا کن. این دو مقدار عمومی‌اند و در مرورگر قابل مشاهده خواهند بود؛ امنیت داده‌ها باید با RLS برقرار شود.

آدرس مورد انتظار:

`https://mahdilavasaninezhad.github.io/CollabSpace/`

## وضعیت تست

ساختار کد و CSS به‌صورت استاتیک بررسی شده است. نصب پکیج‌ها و Build واقعی در محیط تهیه فایل به علت دسترسی نداشتن به رجیستری npm قابل اجرا نبود. ارتباط چندکاربره واقعی فقط پس از اتصال به پروژه Supabase خودت قابل بررسی است.

## اصلاح بازگشت تأیید ایمیل

در Authentication → URL Configuration آدرس اصلی سایت را در Site URL ذخیره کن و هر دو آدرس توسعه و انتشار را در Redirect URLs قرار بده.

```text
https://mahdilavasaninezhad.github.io/CollabSpace/
```

```text
http://localhost:5173/**
https://mahdilavasaninezhad.github.io/CollabSpace/**
```

از نسخه اصلاح‌شده پروژه درخواست ثبت‌نام یا ارسال مجدد ایمیل بفرست. لینک‌های قدیمی ممکن است همچنان نشانی قبلی را داشته باشند. داخل Authentication → Email Templates → Confirm signup بررسی کن که لینک پیش‌فرض `{{ .ConfirmationURL }}` باشد. اگر لینک سفارشی با `{{ .SiteURL }}` ساخته‌ای، لازم است آن را با روش صحیح RedirectTo یا ConfirmationURL هماهنگ کنی.

اگر ایمیل را روی موبایل باز کنی و نشانی به localhost اشاره کند، localhost یعنی خود گوشی و به سرور توسعه کامپیوتر وصل نمی‌شود. برای آزمایش بین دستگاه‌ها از نسخه منتشرشده سایت استفاده کن.

اگر هنگام توسعه محلی می‌خواهی لینک تأیید بعد از کلیک به نسخه آنلاین برود، در `.env.local` این مقدار را هم اضافه کن و سرور Vite را دوباره اجرا کن:

```env
VITE_AUTH_REDIRECT_URL=https://mahdilavasaninezhad.github.io/CollabSpace/
```

برای اینکه ایمیل دوباره به localhost برگردد، مقدار بالا را حذف کن. اگر نسخه آنلاین هنوز منتشر نشده، ابتدا آن را منتشر کن؛ لینک تأیید نمی‌تواند به سایتی که وجود ندارد وارد شود.
