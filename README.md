# GIN Learning Portal

پورتال آموزشی GIN با Next.js، PostgreSQL و فضای ذخیره‌سازی S3 سازگار Liara.

## هویت بصری GIN

نشان اختصاصی GIN با نماد کره زمین و گره‌های ارتباطی، به رنگ سرمه‌ای و طلایی طراحی شده است. فایل‌های برداری اصلی در `public/gin/` قرار دارند: `gin-logo.svg` برای زمینه روشن، `gin-logo-light.svg` برای زمینه تیره و `gin-mark.svg` برای نشان مستقل. تصویر اشتراک‌گذاری اجتماعی در `gin-social-card.svg` و نسخه PNG آن قرار دارد. آیکن مرورگر از `src/app/icon.svg`، آیکن Apple از `public/apple-touch-icon.png` و اطلاعات نصب برنامه از `src/app/manifest.ts` تأمین می‌شود. هدر و فوتر عمومی، ورود، ثبت‌نام، گواهی‌ها، سربرگ پنل‌های نقش‌محور و حالت‌های بارگذاری/خطا از اجزای برند مشترک استفاده می‌کنند؛ سربرگ پنل‌ها در نمایشگر کوچک به نشان فشرده تغییر می‌کند.

## قابلیت‌ها

- وب‌سایت عمومی فارسی و واکنش‌گرا با صفحه اصلی تصویری، معرفی شبکه، حوزه‌های آموزشی، مزایای عضویت، رویدادها، سفرها، پرسش‌های متداول و مسیرهای ثبت‌نام/ورود.
- مسیرهای قدیمی سایت مرجع به مسیرهای معادل پورتال هدایت می‌شوند تا لینک‌های ذخیره‌شده خطای 404 ندهند.
- LMS شامل دوره، دسته‌بندی، بخش، درس متنی/ویدیویی، منابع، ثبت‌نام، پیش‌نمایش، پیگیری پیشرفت و تکمیل دوره.
- آزمون‌های زمان‌دار با انواع سؤال، تصحیح سمت سرور، محدودیت تلاش و صدور گواهی قابل استعلام.
- عضویت با پلن‌های چندسطحی، درخواست و تأیید مدیر، زمان شروع/پایان، ارتقا، لغو و اعمال/لغو دسترسی دوره‌ها.
- رویدادها با ظرفیت، ثبت‌نام، فهرست انتظار، ارتقای خودکار نفر بعدی و اعلان‌ها.
- نقش‌های جداگانه مدیر، مدرس، پشتیبانی، مالی، مدیر همکاری در فروش و مدیر رویداد؛ دسترسی مدرس به دوره‌های اختصاص‌یافته محدود است.
- همکاری در فروش با کد ارجاع، ثبت بازدید، انتساب عضو، قواعد کمیسیون، کیف پول، درخواست تسویه و تأیید/پرداخت دو مرحله‌ای.
- مدیریت اعضا، پروفایل، پشتیبانی، گزارش مالی و عملیات در پنل‌های متناسب با نقش.
- ثبت‌نام با نام کاربری یکتا و رمز عبور هش‌شده با bcrypt؛ حساب تازه تا تأیید مدیر در وضعیت `pending` می‌ماند.
- نشست امضاشده و کوکی `HttpOnly`، `SameSite=Lax` و `Secure` در محیط production؛ تغییر رمز با تأیید رمز فعلی، محدودیت تلاش و ابطال نشست‌های قبلی.
- ثبت رویدادهای حساس در audit log و کنترل درخواست‌های تغییردهنده در برابر CSRF.
- بارگذاری مستقیم و کوتاه‌عمر فایل در Object Storage سازگار با S3؛ فایل از سرور برنامه عبور نمی‌کند.
- ثبت سفارش/تراکنش و منطق تطبیق بازپرداخت و دسترسی‌ها آماده است؛ ایجاد سفارش و پرداخت واقعی تا نصب و پیکربندی آداپتر درگاه معتبر غیرفعال می‌ماند.

## اجرای محلی

نیازمندی‌ها: Node.js 22 و PostgreSQL.

```powershell
npm.cmd ci
Copy-Item .env.example .env.local
# مقادیر اتصال PostgreSQL و SESSION_SECRET را در .env.local تنظیم کنید.
npm.cmd run dev
```

برنامه در `http://localhost:3000` در دسترس است. جداول با اولین درخواست API به شکل idempotent ساخته می‌شوند.

## ساخت حساب مدیر اولیه

روش پیشنهادی در Liara این است که پیش از اولین درخواست به برنامه، دو متغیر زیر را در Environment Variables اپ تنظیم کنید. با اولین اتصال موفق برنامه به PostgreSQL، مدیر اولیه فقط در صورتی ساخته می‌شود که هنوز هیچ مدیر دیگری در دیتابیس وجود نداشته باشد:

| متغیر | مقدار |
|---|---|
| `BOOTSTRAP_ADMIN_USERNAME` | نام کاربری ۳ تا ۳۲ نویسه مجاز |
| `BOOTSTRAP_ADMIN_PASSWORD` | رمز عبور منحصربه‌فرد با حداقل ۱۴ نویسه |

پس از ورود موفق به `/admin`، این دو متغیر را از تنظیمات اپ حذف کنید. باقی ماندن آن‌ها باعث تغییر رمز مدیر موجود نمی‌شود و فقط bootstrap اولیه را بررسی می‌کند.

برای اجرای دستی از محیطی که به دیتابیس دسترسی شبکه‌ای دارد، این فرمان نیز در دسترس است:

```powershell
$env:ADMIN_USERNAME = "your-admin"
$env:ADMIN_PASSWORD = "use-a-unique-password-of-at-least-14-characters"
npm.cmd run db:admin
Remove-Item Env:ADMIN_USERNAME
Remove-Item Env:ADMIN_PASSWORD
```

این فرمان حساب مدیر را ایجاد می‌کند و اگر نام کاربری از قبل وجود داشته باشد، به‌علت یکتا بودن نام کاربری متوقف می‌شود؛ ثبت‌نام عمومی هرگز نقش مدیر ایجاد نمی‌کند.

## استقرار روی Liara

### ۱. ساخت سرویس‌ها

در پنل Liara سه سرویس ایجاد کنید:

1. **App:** پلتفرم Next.js (یا Node.js)، نسخه Node 22، منابع انتخاب‌شده شما: ۵۱۲ مگابایت RAM، نیم Core و دیسک ۵ گیگابایت.
2. **Database:** PostgreSQL با ۵۱۲ مگابایت RAM، نیم Core و فضای ۵ گیگابایت. برنامه و دیتابیس را در یک Private Network قرار دهید و آدرس اتصال داخلی دیتابیس را بردارید.
3. **Object Storage:** یک Bucket با ظرفیت موردنیاز ۴۰ گیگابایت بسازید و S3 Access Key و Secret Key بسازید. Endpoint و Region دقیق را از صفحه همان Bucket بردارید.

### ۲. متغیرهای محیطی برنامه

در بخش Environment Variables اپ این مقادیر را تعریف کنید:

| متغیر | مقدار |
|---|---|
| `DATABASE_URL` | Connection string داخلی PostgreSQL در Private Network |
| `SESSION_SECRET` | حداقل ۳۲ بایت تصادفی؛ برای نمونه خروجی `openssl rand -base64 48` |
| `APP_URL` | دامنه نهایی HTTPS برنامه |
| `S3_ENDPOINT` | Endpoint برای S3-compatible؛ در AWS خالی بماند |
| `S3_REGION` | Region برای S3-compatible؛ در AWS از `AWS_REGION` استفاده می‌شود |
| `S3_BUCKET` | نام Bucket در تنظیمات S3-compatible؛ در AWS از `S3_BUCKET_NAME` استفاده می‌شود |
| `S3_ACCESS_KEY_ID` | کلید ثابت S3-compatible؛ در Vercel AWS OIDC لازم نیست |
| `S3_SECRET_ACCESS_KEY` | کلید محرمانه ثابت S3-compatible؛ در Vercel AWS OIDC لازم نیست |
| `S3_PUBLIC_URL` | اختیاری؛ دامنه عمومی/CDN فایل‌ها، بدون اسلش انتهایی |
| `AWS_ROLE_ARN` | نقش IAM برای اتصال OIDC در Vercel |
| `AWS_REGION` | Region مربوط به Bucket در AWS |
| `S3_BUCKET_NAME` | نام Bucket ساخته‌شده توسط AWS Integration در Vercel |

مقادیر واقعی و کلیدها را در Git یا فایل‌های قابل انتشار قرار ندهید. اتصال PostgreSQL با بررسی گواهی TLS انجام می‌شود؛ اگر سرویس‌دهنده از CA خصوصی استفاده می‌کند، مسیر گواهی را با پارامتر `sslrootcert` در connection string تنظیم کنید. مقدار قدیمی `sslmode=require` نیز هنگام ساخت Pool به `sslmode=verify-full` تبدیل می‌شود.

برای Vercel دو روش ذخیره‌سازی پشتیبانی می‌شود: اتصال S3-compatible با چهار متغیر `S3_ENDPOINT`، `S3_BUCKET`، `S3_ACCESS_KEY_ID` و `S3_SECRET_ACCESS_KEY`؛ یا AWS Integration با `AWS_ROLE_ARN`، `AWS_REGION` و `S3_BUCKET_NAME`. در روش دوم، برنامه از OIDC و اعتبارنامه‌های کوتاه‌مدت AWS استفاده می‌کند و به Access Key و Secret Key دائمی نیاز ندارد. اگر AWS Integration متصل است، نام متغیرهای آن را تغییر ندهید.

برای AWS OIDC، نقش IAM باید فقط به هویت Vercel همین Team/Project/Environment اعتماد کند. شناسه Team در این پروژه `mohammad37496` و نام پروژه Vercel `globalinformationnetwork.liara` است؛ در حالت Team issuer، Provider URL برابر `https://oidc.vercel.com/mohammad37496`، مقدار audience برابر `https://vercel.com/mohammad37496` و Subject محیط Production برابر `owner:mohammad37496:project:globalinformationnetwork.liara:environment:production` است. همین شرط را برای Preview با `environment:preview` جداگانه تعریف کنید اگر Preview نیز باید به AWS دسترسی داشته باشد. از wildcard برای `sub` یا `aud` استفاده نکنید. شناسه حساب AWS و ARN واقعی نقش را از تنظیمات AWS Integration خود بردارید؛ هیچ مقدار نمونه‌ای را به‌عنوان شناسه واقعی جایگزین نکنید. مستندات رسمی: [Vercel AWS OIDC](https://vercel.com/docs/oidc/aws) و [OIDC reference](https://vercel.com/docs/oidc/reference).

سیاست دسترسی S3 نقش باید به همان Bucket محدود شود و با عملیات فعلی برنامه سازگار باشد: `s3:PutObject` برای آپلود/کپی، `s3:GetObject` برای HEAD و خواندن منبع Copy، و `s3:DeleteObject` برای حذف آبجکت staging و فایل‌های پاک‌سازی‌شده، فقط روی Prefixهای `uploads/*` و `assets/*`. در این پروژه `ListBucket` برای مسیر Upload لازم نیست. اگر Bucket از کلید KMS اختصاصی استفاده می‌کند، مجوزهای KMS و Key Policy نیز باید جداگانه و حداقلی تنظیم شوند. وجود متغیرهای Vercel به‌تنهایی اثبات نمی‌کند Trust Policy، مجوزهای Bucket یا Upload واقعی صحیح‌اند.

### ۳. استقرار کد

در پنل Liara پلتفرم برنامه را روی **Next.js** قرار دهید. از ریشه مخزن و با Liara CLI وارد حساب شوید و برنامه ساخته‌شده را انتخاب کنید. سپس:

```powershell
liara deploy
```

فرمان‌های build و start در `package.json` تعریف شده‌اند. `liara.json` پورت ۳۰۰۰ و Node 22 را مشخص می‌کند. مستندات Liara برای استقرار برنامه‌های Node اجرای خودکار install، build و start را بر اساس `package.json` شرح می‌دهد؛ پلتفرم Next.js را هنگام ساخت اپ انتخاب کنید.

### استقرار روی Vercel

مخزن `mohammad37496/GIN` را به پروژه Vercel متصل کنید و Root Directory را روی ریشه مخزن نگه دارید. Vercel با `npm ci` و `npm run build` برنامه Next.js را می‌سازد. در محیط‌های Preview و Production، `DATABASE_URL` و `SESSION_SECRET` باید تنظیم شوند؛ اگر دامنه سفارشی دارید، `APP_URL` را برابر همان دامنه قرار دهید. دامنه پیش‌فرض Vercel به‌صورت خودکار در کد تنظیم شده است. برای فضای ذخیره‌سازی AWS، AWS Integration را متصل کنید تا `AWS_ROLE_ARN`، `AWS_REGION` و `S3_BUCKET_NAME` در اختیار برنامه قرار بگیرند. برای ساخت مدیر اولیه می‌توانید `BOOTSTRAP_ADMIN_USERNAME` و `BOOTSTRAP_ADMIN_PASSWORD` را نیز در محیط Production تعریف کنید. آزمون مرورگر با `npm run test:e2e` در CI اجرا می‌شود.

**الزامات عملیاتی PostgreSQL و نشست در Vercel:**

- `DATABASE_URL` باید یک connection string واقعی PostgreSQL با دسترسی شبکه‌ای از Functionهای Vercel باشد؛ آن را در Production و Preview جداگانه تنظیم کنید. در صورت الزام ارائه‌دهنده، پارامتر TLS مانند `sslmode=require` را در connection string قرار دهید.
- `SESSION_SECRET` باید حداقل ۳۲ بایت تصادفی و در تمام Functionهای همان محیط یکسان باشد. آن را در Git یا log قرار ندهید. تعویض آن تمام کوکی‌های نشست قبلی را نامعتبر می‌کند.
- در تنظیمات امنیتی Bunny Stream، دامنه Vercel یعنی `globalinformationnetworkliara.vercel.app` و هر دامنه سفارشی نهایی را به فهرست دامنه‌های مجاز Embed اضافه کنید؛ محدودیت Referrer را به‌طور عمومی غیرفعال نکنید. دامنه رسمی مرجع در آزمون مرورگر پاسخ `200` می‌گیرد، اما پیش‌نمایش محلی بدون Referrer مجاز `403` می‌گیرد.
- پیش از اولین ترافیک عملیاتی، از دیتابیس نسخه پشتیبان بگیرید و مهاجرت‌ها را با `npm run db:migrate` از محیط امن دارای دسترسی به همان دیتابیس اجرا کنید؛ برنامه نیز در اولین نیاز به Schema، مهاجرت‌های شماره‌گذاری‌شده را با قفل advisory و checksum بررسی می‌کند.
- Rate Limit مبتنی بر PostgreSQL است و در نبود دیتابیس fail-closed می‌شود: درخواست‌های حساس به‌جای عبور بدون محدودیت، پاسخ `503` می‌گیرند. اختلال دیتابیس نباید به ورود، ثبت‌نام، بارگذاری یا تأیید پرداخت موفق تعبیر شود.
- Middleware نیز وقتی `DATABASE_URL` اصلاً تنظیم نشده باشد، APIهای دیتابیس‌محور را پیش از اجرای Handler با `503` متوقف می‌کند؛ مسیر Logout مستثناست تا بتواند کوکی نشستِ بدون توکن را پاک کند. اگر توکن وجود داشته باشد، ابطال سمت سرور باید موفق شود و در نبود دیتابیس کوکی حفظ می‌شود.
- پیش از تغییر `DATABASE_URL` در Production، اتصال، TLS، مجوز اجرای DDL مهاجرت‌ها، ظرفیت Connection Pool و بازیابی Backup را در Preview یا محیط staging بررسی کنید.

### ۴. ایجاد مدیر اولیه روی PostgreSQL

روش ساده‌تر، تنظیم `BOOTSTRAP_ADMIN_USERNAME` و `BOOTSTRAP_ADMIN_PASSWORD` در محیط اپ پیش از اولین درخواست است؛ برنامه مدیر اولیه را خودکار می‌سازد. اگر دیتابیس قبلاً راه‌اندازی شده، می‌توانید از یک محیط امن دارای دسترسی شبکه‌ای به دیتابیس، فرمان دستی زیر را اجرا کنید:

```powershell
$env:DATABASE_URL = "<PostgreSQL connection string>"
$env:SESSION_SECRET = "<same session secret configured for the app>"
$env:ADMIN_USERNAME = "your-admin"
$env:ADMIN_PASSWORD = "<unique password with at least 14 characters>"
npm.cmd ci
npm.cmd run db:admin
```

پس از موفقیت، متغیرهای موقت را از ترمینال حذف کنید. سپس با حساب مدیر وارد `/admin` شوید و درخواست کاربران را تأیید کنید.

## مسیر بارگذاری فایل

`POST /api/storage/presign` فقط برای کاربر دارای نشست معتبر فعال است. نوع فایل به تصویرهای JPEG/PNG/WebP/GIF، PDF و MP4 و اندازه هر فایل به ۲۵ مگابایت محدود شده است. API یک URL امضاشده پنج‌دقیقه‌ای و کلید تصادفی با پیشوند شناسه کاربر برمی‌گرداند؛ کلاینت باید فایل را با درخواست `PUT` و همان `Content-Type` مستقیماً به `uploadUrl` بفرستد. برای بارگذاری از مرورگر، CORS با دامنه سایت و متد `PUT` و هدر `Content-Type` را در تنظیمات Bucket مجاز کنید. در صورت نیاز به فایل عمومی، Bucket/CDN را جداگانه با سیاست دسترسی مناسب پیکربندی کنید.

## آزمون و وضعیت عملیاتی

```powershell
npm.cmd test                 # آزمون‌های واحد دامنه
npm.cmd run typecheck        # بررسی TypeScript
npm.cmd run lint             # ESLint
npm.cmd run build            # build تولیدی Next.js
npm.cmd run test:integration # آزمون انتهابه‌انتها با PostgreSQL سازگار PGlite
npm.cmd run test:e2e         # آزمون مرورگر Playwright
```

آزمون یکپارچه مسیرهای اصلی زیر را با دیتابیس موقت اجرا می‌کند: bootstrap مدیر، ورود و تأیید عضو، مدیریت و انتشار دوره، آزمون و گواهی، عضویت و مجوز دوره، چرخه عمر عضویت، رویداد و فهرست انتظار، پشتیبانی، نقش مدرس، تفکیک مجوز مالی و همکاری در فروش، انتساب ارجاع، تسویه دو مرحله‌ای، بازپرداخت و برگشت کمیسیون، اعلان‌ها و محافظت CSRF.

۲۰ مهاجرت SQL شماره‌گذاری‌شده در شروع برنامه به‌صورت idempotent اجرا می‌شوند. checksum مهاجرت‌ها پس از یکسان‌سازی پایان‌خط به LF محاسبه می‌شود تا اجرای `db:migrate` در Windows و اجرای برنامه در Linux checksum متفاوت نسازد؛ checksumهای قدیمی CRLF نیز در همان تراکنش به مقدار canonical تبدیل می‌شوند. برای اجرای عملیاتی، PostgreSQL و Object Storage باید در Liara یا Vercel متصل و متغیرهای محیطی مطابق بخش استقرار تنظیم شده باشند.

**موارد نیازمند اطلاعات/حساب بیرونی:**

- درگاه پرداخت هنوز به ارائه‌دهنده مشخصی متصل نشده است. آداپتر باید بر اساس ارائه‌دهنده منتخب و کلید/شناسه پذیرنده واقعی فعال شود؛ تا آن زمان checkout با پاسخ صریح `503` متوقف می‌شود و سفارش یا تراکنش ساختگی ایجاد نمی‌کند.
- قرارداد مشترک در `src/lib/payments/provider.ts` شامل `createCheckout` با کلید Idempotency و `verifyWebhook` با بدنه خام درخواست است. هر آداپتر آینده باید امضای Webhook را پیش از پردازش تأیید کند و شناسه رویداد، مرجع تراکنش، مبلغ و ارز را به قرارداد مشترک تبدیل کند. ثبت رویداد، تغییر وضعیت سفارش/تراکنش، دسترسی عضویت/دوره/رویداد، کمیسیون و Invoice باید در تراکنش دیتابیس اتمیک بمانند. هیچ Provider تا انتخاب مالک و ارائه اعتبارنامه واقعی فعال نمی‌شود.
- صفحات اطلاعاتی سفر و معرفی، محتوای پایه هستند. انتشار رویداد، مزیت، مکان، تخفیف یا رزرو واقعی نیازمند داده و تأیید برگزارکننده/ارائه‌دهنده است.
- دامنه سفارشی باید متعلق به مالک پروژه باشد و پس از ارائه نام دامنه، DNS و دامنه Vercel یا Liara تنظیم شوند.

مسیرهای عمومی شامل `/who-we-are`، `/why-join`، `/about`، `/what-we-offer`، `/member-benefits`، `/success-system`، `/events`، `/hotels`، `/clubhouses`، `/cruise`، `/membership`، `/faq` و `/contact` است. مسیرهای آموزشی `/courses`، `/courses/[slug]` و `/courses/[slug]/lessons/[lessonId]` هستند. پنل‌های عضو، مدیر، مدرس، مالی، پشتیبانی، رویداد و همکاری در فروش از مسیرهای اختصاصی خود در دسترس‌اند.
