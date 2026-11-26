"use client";

import React, { type ReactNode } from "react";

export type StaffLocale = "fa" | "en";

const translations: Record<string, string> = {
  "در انتظار بررسی":"Pending review", "تأیید شده":"Approved", "رد شده":"Rejected", "تعلیق شده":"Suspended", "مدرس":"Instructor", "پشتیبانی":"Support", "مدیر رویداد":"Event manager", "مالی":"Finance", "همکاری در فروش":"Affiliate manager",
  "خطا در دریافت کاربران":"Could not load users.", "ذخیره تغییرات ناموفق بود.":"Could not save changes.", "تغییر نقش انجام نشد.":"Could not update the role.", "کاربران سامانه":"Users", "حساب ثبت‌شده":"registered accounts", "بارگذاری مجدد":"Refresh", "در انتظار":"Pending", "تعلیق":"Suspended", "همه":"All", "در حال دریافت اطلاعات...":"Loading information…", "کاربری در این بخش وجود ندارد.":"No users in this section.", "ثبت‌نام:":"Joined:", "نقش‌ها:":"Roles:", "افزودن نقش":"Add role", "اعطای نقش":"Assign role", "حذف نقش":"Remove role", "تأیید عضویت":"Approve account", "رد درخواست":"Reject request", "تعلیق دسترسی":"Suspend access", "تأیید":"Approve", "فعال‌سازی":"Activate",
  "تغییر رمز عبور انجام نشد.":"Could not change the password.", "خطای غیرمنتظره رخ داد.":"An unexpected error occurred.", "امنیت حساب مدیر":"Administrator account security", "برای تغییر رمز، ابتدا رمز فعلی را تأیید کنید.":"Confirm your current password before changing it.", "رمز عبور فعلی":"Current password", "رمز عبور جدید":"New password", "حداقل ۱۴ نویسه؛ از رمز منحصربه‌فرد استفاده کنید.":"At least 14 characters. Use a unique password.", "تکرار رمز عبور جدید":"Confirm new password", "در حال ذخیره...":"Saving…", "تغییر رمز عبور":"Change password",
  "دریافت دوره‌ها ناموفق بود.":"Could not load courses.", "عملیات انجام نشد.":"The operation could not be completed.", "تغییرات ذخیره شد.":"Changes saved.", "خطا در ذخیره اطلاعات":"Could not save the information.", "مدیریت دوره‌های آموزشی":"Course management", "ساخت دوره، فصل‌بندی و انتشار درس‌ها":"Create courses, organize sections and publish lessons", "ساخت دوره جدید":"Create a course", "عنوان دوره":"Course title", "نشانی انگلیسی":"URL slug", "خلاصه دوره":"Course summary", "توضیح کوتاه برای کارت دوره":"Short description for the course card", "توضیحات کامل":"Full description", "ساخت پیش‌نویس دوره":"Create course draft", "در حال دریافت دوره‌ها...":"Loading courses…", "هنوز دوره‌ای ساخته نشده است.":"No courses have been created yet.", "منتشرشده":"Published", "بایگانی":"Archived", "پیش‌نویس":"Draft", "درس":"lessons", "انتشار":"Publish", "برداشتن از انتشار":"Unpublish", "انتخاب مدرس":"Select an instructor", "اختصاص مدرس":"Assign instructor", "عنوان بخش جدید":"New section title", "افزودن بخش":"Add section", "عنوان انگلیسی دوره":"English course title", "خلاصه انگلیسی دوره":"English course summary", "توضیحات انگلیسی دوره":"English course description", "افزودن درس":"Add lesson", "پیش‌نمایش":"Preview", "عضویت لازم":"Members only", "دقیقه":"min", "افزودن درس به":"Add lesson to", "خلاصه":"Summary", "متن درس":"Lesson content", "لینک ویدیو (HTTPS)":"Video URL (HTTPS)", "مدت (دقیقه)":"Duration (minutes)", "این درس پیش‌نمایش عمومی باشد":"Make this lesson publicly available as a preview", "افزودن و انتشار درس":"Add and publish lesson", "دسته‌بندی دوره‌ها":"Course categories", "فایل‌های تکمیلی درس‌ها":"Lesson resources",
  "دریافت رویدادها ناموفق بود.":"Could not load events.", "ساخت رویداد ناموفق بود.":"Could not create the event.", "تغییر وضعیت انجام نشد.":"Could not update the status.", "ذخیره ترجمه انگلیسی رویداد ناموفق بود.":"Could not save the English event translation.", "مدیریت رویدادها":"Event management", "ساخت رویداد، انتشار و کنترل ظرفیت ثبت‌نام":"Create events, publish them and manage registration capacity", "رویداد جدید":"New event", "عنوان":"Title", "محل برگزاری":"Location", "شروع":"Starts", "پایان":"Ends", "ظرفیت (خالی = نامحدود)":"Capacity (leave blank for unlimited)", "توضیحات":"Description", "ساخت پیش‌نویس":"Create draft", "ثبت‌نام":"registrations", "لغو رویداد":"Cancel event", "شرکت‌کنندگان":"Attendees",
  "دریافت اطلاعات عضویت انجام نشد.":"Could not load membership information.", "پلن عضویت ساخته شد.":"Membership plan created.", "ساخت پلن ناموفق بود.":"Could not create the plan.", "بررسی درخواست انجام نشد.":"Could not review the request.", "اعطای عضویت انجام نشد.":"Could not grant membership.", "تغییر وضعیت پلن انجام نشد.":"Could not update the plan status.", "ذخیره ترجمه انگلیسی پلن ناموفق بود.":"Could not save the English plan translation.", "عضویت و پلن‌ها":"Memberships and plans", "تعریف سطوح، اتصال دوره‌ها، بررسی درخواست‌ها و اعطای دستی":"Define tiers, assign courses, review requests and grant memberships", "ساخت پلن عضویت":"Create a membership plan", "کد انگلیسی":"English code", "نام پلن":"Plan name", "سطح":"Level", "مبلغ (واحد خرد)":"Amount (minor units)", "ارز":"Currency", "دوره پرداخت":"Billing interval", "ماهانه":"Monthly", "سالانه":"Yearly", "مزایا (هر مورد در یک خط)":"Benefits (one per line)", "ساخت پلن":"Create plan", "انتخاب عضو تأییدشده":"Select an approved member", "انتخاب پلن فعال":"Select an active plan", "اعطای دستی عضویت":"Grant membership manually", "پلن‌های عضویت":"Membership plans", "عضو فعال":"active members", "رایگان":"Free", "فعال":"Active", "غیرفعال":"Inactive", "غیرفعال‌سازی":"Deactivate", "درخواست‌های عضویت":"Membership requests", "بدون توضیح":"No details", "رد":"Reject", "سوابق عضویت":"Membership history", "بدون تاریخ انقضا":"No expiration date",
  "دریافت اطلاعات ارجاع انجام نشد.":"Could not load affiliate information.", "ساخت قانون ناموفق بود.":"Could not create the commission rule.", "همکاری در فروش و تسویه":"Affiliates and payouts", "تأیید معرف‌ها، قوانین کمیسیون و گردش کیف پول":"Approve affiliates, manage commission rules and review wallet activity", "قانون کمیسیون جدید":"New commission rule", "نوع فروش":"Sale type", "دوره":"Course", "عضویت":"Membership", "رویداد":"Event", "نرخ (basis points)":"Rate (basis points)", "مبلغ ثابت (واحد خرد)":"Fixed amount (minor units)", "ارز اختیاری":"Optional currency", "ثبت قانون":"Save rule", "حساب‌های معرف":"Affiliate accounts", "عضو معرفی‌شده":"referrals", "کمیسیون‌های در انتظار بررسی":"Commissions awaiting review", "کمیسیون":"Commission", "درخواست‌های تسویه":"Payout requests", "شماره حواله":"Transfer reference", "ثبت پرداخت":"Record payment", "قوانین کمیسیون":"Commission rules", "ارز سفارش":"order currency",
  "دریافت اطلاعات مالی ناموفق بود.":"Could not load financial information.", "سفارش‌ها و پرداخت‌ها":"Orders and payments", "گزارش مالی و وضعیت اتصال درگاه":"Financial report and payment provider status", "در حال بارگذاری...":"Loading…", "درگاه پرداخت فعال نیست":"Payment provider is inactive", "پرداخت پس از اتصال adapter امن قابل استفاده است.":"Payments will be available when a secure adapter is connected.", "هیچ پرداختی پذیرفته نمی‌شود و هیچ تراکنش موفقی به‌صورت دستی ثبت نمی‌شود.":"Payments are not accepted, and successful transactions cannot be recorded manually.", "سفارش‌های اخیر":"Recent orders", "بدون فاکتور":"No invoice", "تراکنش‌ها":"Transactions", "بدون مرجع درگاه":"No provider reference",
  "دریافت دسته‌بندی‌ها ناموفق بود.":"Could not load categories.", "ساخت دسته‌بندی ناموفق بود.":"Could not create the category.", "ساختار موضوعی کتابخانه آموزشی":"Learning library taxonomy", "دسته‌بندی جدید":"New category", "نام دسته‌بندی":"Category name", "افزودن دسته‌بندی":"Add category", "توضیح":"Description",
  "دریافت آزمون‌ها ناموفق بود.":"Could not load assessments.", "ساخت آزمون ناموفق بود.":"Could not create the assessment.", "افزودن سؤال انجام نشد.":"Could not add the question.", "انتشار آزمون انجام نشد.":"Could not publish the assessment.", "ارزیابی پاسخ انجام نشد.":"Could not grade the answer.", "ارزیابی مدرس":"Instructor assessment", "آزمون‌ها و ارزیابی‌ها":"Assessments and grading", "ساخت آزمون، بانک سؤال و ارزیابی پاسخ‌های تشریحی":"Create assessments, manage questions and grade written answers", "عنوان آزمون جدید":"New assessment title", "ساخت آزمون":"Create assessment", "سؤال":"questions", "تلاش":"attempts", "حدنصاب":"Pass mark", "درست / نادرست":"True / False", "تک‌گزینه‌ای":"Single choice", "چندگزینه‌ای":"Multiple choice", "تشریحی":"Written answer", "متن سؤال":"Question text", "گزینه‌ها؛ هر خط با قالب id|متن":"Options (one per line, format: id|text)", "گزینه اول":"First option", "گزینه دوم":"Second option", "پاسخ درست":"Correct answer", "امتیاز":"Points", "افزودن سؤال":"Add question", "پاسخ‌های تشریحی در انتظار ارزیابی":"Written answers awaiting grading", "نمره از":"Score out of", "ثبت ارزیابی":"Submit grade", "پاسخ تشریحی در انتظار ارزیابی وجود ندارد.":"No written answers are awaiting grading.",
  "دریافت پیام‌ها ناموفق بود.":"Could not load messages.", "ارسال پاسخ انجام نشد.":"Could not send the reply.", "مرکز پشتیبانی":"Support center", "گفت‌وگو با اعضا و پیگیری درخواست‌ها":"Member conversations and request follow-up", "پاسخ تیم پشتیبانی":"Support team reply", "ارسال پاسخ":"Send reply", "باز":"Open", "در حال بررسی":"In progress", "حل‌شده":"Resolved", "بسته":"Closed", "ذخیره وضعیت":"Save status", "عضو":"Member", "درخواست پشتیبانی جدیدی وجود ندارد.":"There are no new support requests.",
  "دریافت فرم‌های تماس انجام نشد.":"Could not load contact submissions.", "درخواست‌های تماس عمومی":"Public contact submissions", "اطلاعات تماس، پیام و رضایت‌های ثبت‌شده از فرم انگلیسی سایت.":"Contact details, messages and consents submitted through the English website form.", "بروزرسانی":"Refresh", "در حال دریافت درخواست‌ها…":"Loading submissions…", "جدید":"New", "پاسخ داده شد":"Responded", "بسته شده":"Closed", "وضعیت درخواست":"Submission status", "اطلاعات تکمیلی و رضایت‌ها":"Additional details and consents", "پیامک:":"SMS:", "رضایت ثبت شده":"Consent recorded", "خیر":"No", "بله":"Yes", "پذیرش حریم خصوصی و شرایط:":"Privacy and terms acceptance:", "هنوز درخواست تماسی ثبت نشده است.":"No contact submissions yet.", "ایمیل":"Email", "تماس تلفنی":"Phone call", "تلگرام":"Telegram", "واتساپ":"WhatsApp",
  "فایل با موفقیت به منابع درس اضافه شد.":"File added to lesson resources.", "بارگذاری فایل ناموفق بود.":"File upload failed.", "بارگذاری در فضای ذخیره‌سازی انجام نشد.":"Could not upload the file to storage.", "افزودن فایل آموزشی":"Add learning resource", "عنوان فایل (اختیاری)":"File title (optional)", "بارگذاری و پیوست":"Upload and attach", "حداکثر ۲۵ مگابایت؛ PDF، تصویر و MP4. فایل پس از بررسی سمت سرور قابل مشاهده می‌شود.":"Maximum 25 MB; PDF, images and MP4. The file becomes available after server-side verification.", "ذخیره دسته‌بندی‌ها ناموفق بود.":"Could not save categories.", "دسته‌بندی دوره":"Course categories", "هنوز دسته‌بندی فعالی ساخته نشده است.":"No active categories have been created yet.", "ذخیره دسته‌بندی":"Save categories", "دریافت دسترسی‌های پلن انجام نشد.":"Could not load plan access.", "ذخیره دسترسی‌ها انجام نشد.":"Could not save access settings.", "دوره‌های مشمول این پلن":"Courses included in this plan", "ذخیره دسترسی دوره‌ها":"Save course access",
  "فعال است":"is active", "فعال نیست":"is inactive", "درخواست شده":"Requested", "پرداخت‌شده":"Paid", "تأییدشده":"Approved", "ردشده":"Rejected", "لغوشده":"Canceled", "مثلاً مبانی توسعه فردی":"e.g. personal development fundamentals", "ساخت قانون انجام نشد.":"Could not create the rule.",
  "تکرار رمز عبور جدید مطابقت ندارد.":"The new password confirmation does not match.", "رمز عبور جدید باید با رمز فعلی متفاوت باشد.":"The new password must differ from the current password.", "رمز عبور با موفقیت تغییر کرد. نشست‌های قبلی شما باطل شدند.":"Password changed successfully. Your previous sessions have been revoked.", "فایل قبلاً تأیید شده است.":"The file has already been verified.", "فایل قبلاً کپی و تأیید شده است.":"The file has already been copied and verified.", "فایل با موفقیت کپی، بررسی و تأیید شد.":"The file was copied, checked and verified successfully.", "کمیسیون تأییدشده":"Approved commission", "کمیسیون در انتظار بررسی پیدا نشد.":"Pending commission not found.", "وضعیت کمیسیون ثبت شد.":"Commission status saved.", "بررسی کمیسیون انجام نشد.":"Could not review the commission.", "وضعیت درخواست پشتیبانی تغییر کرد":"Support request status changed", "وضعیت درخواست شما:":"Your request status:", "دسترسی پشتیبانی ندارید.":"You do not have support access.", "پیام پیدا نشد.":"Message not found.", "وضعیت پیام معتبر نیست.":"Invalid message status.", "مسئول انتخاب‌شده عضو تیم پشتیبانی نیست.":"The selected assignee is not a member of the support team.", "وضعیت درخواست پشتیبانی تغییر کرد.":"Support request status updated.", "تغییر وضعیت پیام انجام نشد.":"Could not update the message status.", "متن پاسخ معتبر نیست.":"Invalid reply text.", "پیام پیدا نشد یا بسته شده است.":"The message was not found or is closed.", "پاسخ جدید از پشتیبانی":"New support reply", "پاسخ پشتیبانی ارسال شد.":"Support reply sent.", "ارسال پاسخ پشتیبانی انجام نشد.":"Could not send the support reply.", "این تلاش آزمون برای ارزیابی دستی در دسترس نیست.":"This assessment attempt is not available for manual grading.", "دسترسی ارزیابی این دوره را ندارید.":"You do not have grading access for this course.", "نمره یکی از پاسخ‌ها نامعتبر است.":"One of the answer scores is invalid.", "ارزیابی دستی ثبت شد.":"Manual grading saved.", "وضعیت درخواست تسویه ثبت شد.":"Payout request status saved.", "وضعیت حساب همکاری تغییر کرد.":"Affiliate account status updated.", "ترجمه انگلیسی دسته‌بندی ذخیره شد.":"English category translation saved.", "دوره به‌صورت پیش‌نویس ساخته شد.":"Course draft created.", "آزمون به‌صورت پیش‌نویس ساخته شد.":"Assessment draft created.", "وضعیت آزمون به‌روزرسانی شد.":"Assessment status updated.", "برای انتشار آزمون دست‌کم یک سؤال لازم است.":"At least one question is required before publishing the assessment.", "وضعیت قانون تغییر کرد.":"Rule status updated.", "دسترسی غیرمجاز است.":"Access denied.", "اطلاعات دسته‌بندی معتبر نیست.":"Invalid category information.", "نشانی دسته‌بندی تکراری است.":"Category slug already exists.", "دسته‌بندی ایجاد شد.":"Category created.", "ساخت دسته‌بندی انجام نشد.":"Could not create the category.", "کاربر پیدا نشد.":"User not found.", "نقش انتخاب‌شده معتبر نیست.":"Invalid selected role.", "کاربر تأییدشده پیدا نشد.":"Approved user not found.", "نقش به کاربر اختصاص داده شد.":"Role assigned to user.", "اختصاص نقش انجام نشد.":"Could not assign the role.", "نقش از کاربر برداشته شد.":"Role removed from user.", "حذف نقش انجام نشد.":"Could not remove the role.", "وضعیت کاربر به‌روزرسانی شد.":"User status updated.", "ترجمه انگلیسی دوره ذخیره شد.":"English course translation saved.", "وضعیت دوره به‌روزرسانی شد.":"Course status updated.", "بخش دوره اضافه شد.":"Course section added.", "دوره پیدا نشد.":"Course not found.", "شناسه مدرس معتبر نیست.":"Invalid instructor ID.", "مدرس باید حساب تأییدشده داشته باشد.":"The instructor must have an approved account.", "مدرس به دوره اختصاص داده شد.":"Instructor assigned to course.", "مدرس از دوره برداشته شد.":"Instructor removed from course.", "حذف دسترسی مدرس انجام نشد.":"Could not remove instructor access.", "درخواست معتبر نیست.":"Invalid request.", "فهرست دسته‌بندی‌ها معتبر نیست.":"Invalid category list.", "دسترسی مدیریت دوره ندارید.":"You do not have permission to manage this course.", "یکی از دسته‌بندی‌ها فعال نیست.":"One of the categories is inactive.", "دسته‌بندی‌های دوره به‌روزرسانی شدند.":"Course categories updated.", "تنظیم دسته‌بندی دوره انجام نشد.":"Could not update course categories.", "درخواست عضویت بررسی شد.":"Membership request reviewed.", "وضعیت عضویت تغییر کرد و دسترسی‌های وابسته بازبینی شد.":"Membership status updated and related access reviewed.", "عضویت به‌صورت دستی و با ثبت حسابرسی اعطا شد.":"Membership granted manually and audit recorded.", "رویداد به‌صورت پیش‌نویس ساخته شد.":"Event draft created.", "نشانی این رویداد قبلاً استفاده شده است.":"This event slug is already in use.", "ساخت رویداد انجام نشد.":"Could not create the event.", "رویداد پیدا نشد.":"Event not found.", "رویداد گذشته را نمی‌توان منتشر کرد.":"Past events cannot be published.", "وضعیت رویداد تغییر کرد.":"Event status updated.", "ترجمه انگلیسی رویداد ذخیره شد.":"English event translation saved.", "تغییر رویداد انجام نشد.":"Could not update the event.", "کد این پلن قبلاً ثبت شده است.":"This plan code is already in use.", "ساخت پلن عضویت انجام نشد.":"Could not create the membership plan.", "پلن پیدا نشد.":"Plan not found.", "مبلغ، ارز و دوره پرداخت پلن با هم سازگار نیستند.":"The plan amount, currency and billing interval are inconsistent.", "قیمت پلن دارای عضویت فعال را نمی‌توان تغییر داد.":"The price of a plan with active memberships cannot be changed.", "پلن به‌روزرسانی شد.":"Plan updated.", "ویرایش پلن انجام نشد.":"Could not update the plan.", "دسترسی دوره‌های پلن به‌روزرسانی و برای اعضای فعال همگام شد.":"Plan course access updated and synchronized for active members.", "فهرست رویدادها معتبر نیست.":"Invalid event list.", "یکی از رویدادها پیدا نشد.":"One of the events was not found.", "دسترسی رویدادهای پلن به‌روزرسانی شد.":"Plan event access updated.", "به‌روزرسانی رویدادهای پلن انجام نشد.":"Could not update plan events.", "درس پیدا نشد.":"Lesson not found.", "شما مجاز به افزودن فایل به این درس نیستید.":"You are not allowed to add files to this lesson.", "فایل تأییدشده پیدا نشد.":"Verified file not found.", "فایل به منابع درس اضافه شد.":"File added to lesson resources.", "افزودن منبع آموزشی انجام نشد.":"Could not add the learning resource.",
  "درس به بخش اضافه شد.":"Lesson added to section.", "ترجمه انگلیسی بخش ذخیره شد.":"English section translation saved.", "ترجمه انگلیسی درس ذخیره شد.":"English lesson translation saved.", "سؤال به بانک آزمون اضافه شد.":"Question added to the assessment bank.", "قانون کمیسیون ایجاد شد.":"Commission rule created.", "وضعیت درخواست عضویت تغییر کرد.":"Membership request status updated.", "افزودن فایل به منابع درس انجام نشد.":"Could not add the file to lesson resources.",
};

const apiTranslations: Record<string, string> = {
  "دسترسی مالی یا همکاری در فروش ندارید.": "You do not have finance or affiliate-management access.",
  "کمیسیون پیدا نشد.": "Commission not found.",
  "وضعیت کمیسیون معتبر نیست.": "Invalid commission status.",
  "دسترسی مالی ندارید.": "You do not have finance access.",
  "درخواست تسویه پیدا نشد.": "Payout request not found.",
  "وضعیت تسویه معتبر نیست.": "Invalid payout status.",
  "برای ثبت تسویه پرداخت‌شده، شناسه حواله یا رسید لازم است.": "A transfer reference or receipt is required to mark a payout as paid.",
  "تغییر وضعیت تسویه با وضعیت فعلی سازگار نیست.": "The payout cannot move to that status from its current state.",
  "تأییدکننده درخواست نمی‌تواند خودش پرداخت نهایی را ثبت کند.": "The person who approved the payout cannot record its final payment.",
  "شناسه حواله قبلاً برای درخواست دیگری ثبت شده است.": "This transfer reference has already been used for another request.",
  "بررسی درخواست تسویه انجام نشد.": "Could not review the payout request.",
  "دریافت گزارش همکاری در فروش انجام نشد.": "Could not load the affiliate report.",
  "دسترسی مدیریت همکاری در فروش ندارید.": "You do not have affiliate-management access.",
  "حساب همکاری پیدا نشد.": "Affiliate account not found.",
  "وضعیت حساب معتبر نیست.": "Invalid account status.",
  "تغییر وضعیت حساب همکاری انجام نشد.": "Could not update the affiliate account status.",
  "دریافت قوانین کمیسیون انجام نشد.": "Could not load commission rules.",
  "اطلاعات قانون کمیسیون معتبر نیست.": "Invalid commission rule information.",
  "پایان اعتبار قانون باید بعد از شروع باشد.": "The rule end date must be after its start date.",
  "ساخت قانون کمیسیون انجام نشد.": "Could not create the commission rule.",
  "قانون پیدا نشد.": "Rule not found.",
  "وضعیت قانون معتبر نیست.": "Invalid rule status.",
  "تغییر قانون کمیسیون انجام نشد.": "Could not update the commission rule.",
  "دریافت پاسخ‌های نیازمند ارزیابی انجام نشد.": "Could not load answers awaiting grading.",
  "تلاش آزمون پیدا نشد.": "Assessment attempt not found.",
  "نمره‌های ارسالی معتبر نیستند.": "Submitted scores are invalid.",
  "ثبت ارزیابی دستی انجام نشد.": "Could not save the manual assessment.",
  "آزمون پیدا نشد.": "Assessment not found.",
  "وضعیت آزمون معتبر نیست.": "Invalid assessment status.",
  "تغییر وضعیت آزمون انجام نشد.": "Could not update the assessment status.",
  "اطلاعات سؤال معتبر نیست.": "Invalid question information.",
  "سؤال تک‌گزینه‌ای باید گزینه درست معتبر داشته باشد.": "A single-choice question must have a valid correct option.",
  "پاسخ سؤال چندگزینه‌ای معتبر نیست.": "The multiple-choice answer is invalid.",
  "آزمون پیدا نشد یا پس از انتشار قابل ویرایش نیست.": "Assessment not found or it can no longer be edited after publication.",
  "سؤال پیدا نشد.": "Question not found.",
  "شناسه سؤال معتبر نیست.": "Invalid question ID.",
  "ترجمه سؤال معتبر نیست.": "Invalid question translation.",
  "سؤال پیدا نشد یا آزمون منتشر شده است.": "Question not found or the assessment has been published.",
  "ترجمه سؤال ذخیره شد.": "Question translation saved.",
  "ذخیره ترجمه سؤال انجام نشد.": "Could not save the question translation.",
  "دریافت دسته‌بندی‌ها انجام نشد.": "Could not load categories.",
  "دسته‌بندی پیدا نشد.": "Category not found.",
  "ترجمه انگلیسی دسته‌بندی معتبر نیست.": "Invalid English category translation.",
  "ذخیره ترجمه دسته‌بندی انجام نشد.": "Could not save the category translation.",
  "دریافت دوره‌ها ممکن نشد.": "Could not load courses.",
  "اطلاعات دوره معتبر نیست.": "Invalid course information.",
  "برای دوره رایگان یا ویژه اعضا مبلغ نباید ثبت شود.": "Free and members-only courses must not have a purchase price.",
  "این نشانی دوره قبلاً استفاده شده است.": "This course URL is already in use.",
  "ساخت دوره انجام نشد.": "Could not create the course.",
  "شما به مدیریت این دوره دسترسی ندارید.": "You do not have permission to manage this course.",
  "وضعیت دوره معتبر نیست.": "Invalid course status.",
  "برای انتشار، دست‌کم یک درس منتشرشده به دوره اضافه کنید.": "Add at least one published lesson before publishing the course.",
  "تغییر وضعیت دوره انجام نشد.": "Could not update the course status.",
  "دریافت آزمون‌های دوره انجام نشد.": "Could not load course assessments.",
  "اطلاعات آزمون معتبر نیست.": "Invalid assessment information.",
  "ساخت آزمون انجام نشد.": "Could not create the assessment.",
  "دریافت دسته‌بندی دوره انجام نشد.": "Could not load course categories.",
  "دریافت مدرس‌ها انجام نشد.": "Could not load instructors.",
  "اختصاص مدرس انجام نشد.": "Could not assign the instructor.",
  "اطلاعات بخش معتبر نیست.": "Invalid section information.",
  "این ترتیب برای بخش دیگری استفاده شده است.": "This position is already used by another section.",
  "ساخت بخش انجام نشد.": "Could not create the section.",
  "ترجمه انگلیسی درس معتبر نیست.": "Invalid English lesson translation.",
  "ذخیره ترجمه درس انجام نشد.": "Could not save the lesson translation.",
  "اطلاعات فایل آموزشی معتبر نیست.": "Invalid learning-resource information.",
  "بخش پیدا نشد.": "Section not found.",
  "ترجمه انگلیسی بخش معتبر نیست.": "Invalid English section translation.",
  "ذخیره ترجمه بخش انجام نشد.": "Could not save the section translation.",
  "اطلاعات درس معتبر نیست.": "Invalid lesson information.",
  "این ترتیب برای درس دیگری استفاده شده است.": "This position is already used by another lesson.",
  "ساخت درس انجام نشد.": "Could not create the lesson.",
  "دسترسی مدیریت رویداد ندارید.": "You do not have event-management access.",
  "دریافت رویدادها انجام نشد.": "Could not load events.",
  "اطلاعات رویداد معتبر نیست.": "Invalid event information.",
  "مبلغ و ارز رویداد با نوع دسترسی سازگار نیست.": "The event price and currency do not match its access type.",
  "اطلاعات ویرایش رویداد معتبر نیست.": "Invalid event update information.",
  "دریافت فهرست شرکت‌کنندگان انجام نشد.": "Could not load the attendee list.",
  "دریافت گزارش مالی انجام نشد.": "Could not load the financial report.",
  "دریافت وضعیت مالی انجام نشد.": "Could not load the financial status.",
  "دریافت پلن‌ها انجام نشد.": "Could not load membership plans.",
  "اطلاعات پلن معتبر نیست.": "Invalid membership plan information.",
  "اطلاعات ویرایش پلن معتبر نیست.": "Invalid membership plan update information.",
  "دریافت دوره‌های پلن انجام نشد.": "Could not load the plan's courses.",
  "فهرست دوره‌ها معتبر نیست.": "Invalid course list.",
  "یکی از دوره‌های انتخاب‌شده وجود ندارد.": "One of the selected courses does not exist.",
  "به‌روزرسانی دسترسی پلن انجام نشد.": "Could not update plan access.",
  "دریافت درخواست‌های عضویت انجام نشد.": "Could not load membership requests.",
  "درخواست پیدا نشد.": "Request not found.",
  "وضعیت درخواست معتبر نیست.": "Invalid request status.",
  "درخواست در انتظار بررسی پیدا نشد.": "Pending request not found.",
  "درخواست پلن پولی بدون پرداخت قابل تأیید نیست.": "A paid-plan request cannot be approved without payment.",
  "حساب عضو فعال نیست.": "The member account is not active.",
  "بررسی درخواست عضویت انجام نشد.": "Could not review the membership request.",
  "دریافت عضویت‌ها ممکن نشد.": "Could not load memberships.",
  "اطلاعات اعطای عضویت معتبر نیست.": "Invalid membership grant information.",
  "کاربر فعال و تأییدشده پیدا نشد.": "No active, approved user was found.",
  "پلن فعال پیدا نشد.": "Active plan not found.",
  "این عضویت هم‌اکنون فعال یا زمان‌بندی شده است.": "This membership is already active or scheduled.",
  "عضویت پیدا نشد.": "Membership not found.",
  "وضعیت عضویت معتبر نیست.": "Invalid membership status.",
  "عضویت فعال یا در انتظار پیدا نشد.": "Active or pending membership not found.",
  "تغییر وضعیت عضویت انجام نشد.": "Could not update the membership status.",
  "دریافت پیام‌های پشتیبانی انجام نشد.": "Could not load support messages.",
  "کاربر پیدا نشد یا امکان تغییر این حساب وجود ندارد.": "User not found or this account cannot be changed.",
  "ذخیره تغییرات انجام نشد.": "Could not save the changes.",
};

export function localizeStaffText(value: string, locale: StaffLocale): string {
  if (locale === "fa") return value;
  const trimmed = value.trim();
  const statusLabels: Record<string, string> = { pending: "Pending", approved: "Approved", rejected: "Rejected", suspended: "Suspended", active: "Active", inactive: "Inactive", requested: "Requested", paid: "Paid", canceled: "Canceled", published: "Published", draft: "Draft", archived: "Archived", open: "Open", in_progress: "In progress", resolved: "Resolved", closed: "Closed", waitlisted: "Waitlisted", course: "Course", membership: "Membership", event: "Event", month: "Monthly", year: "Yearly", none: "None" };
  const translated = translations[trimmed] ?? apiTranslations[trimmed] ?? statusLabels[trimmed];
  if (translated) return value.replace(trimmed, translated);
  return value.replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)));
}

function localizeNode(node: ReactNode, locale: StaffLocale): ReactNode {
  if (typeof node === "string") return localizeStaffText(node, locale);
  if (typeof node === "number" || node == null || typeof node === "boolean") return node;
  if (Array.isArray(node)) return node.map((child) => localizeNode(child, locale));
  if (React.isValidElement(node)) {
    const element = node as React.ReactElement<{ children?: ReactNode; [key: string]: unknown }>;
    const props: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(element.props)) {
      if (key === "children") props.children = localizeNode(value as ReactNode, locale);
      else if (typeof value === "string" && ["aria-label", "title", "placeholder", "alt"].includes(key)) props[key] = localizeStaffText(value, locale);
      else props[key] = value;
    }
    return React.cloneElement(element, props);
  }
  return node;
}

export default function StaffLocalized({ locale, children }: { locale: StaffLocale; children: ReactNode }) {
  return <>{localizeNode(children, locale)}</>;
}

export function staffDate(value: string, locale: StaffLocale, options?: Intl.DateTimeFormatOptions): string {
  return locale === "en" ? new Date(value).toLocaleString("en-US", options) : options?.dateStyle && !options.timeStyle ? new Date(value).toLocaleDateString("fa-IR") : new Date(value).toLocaleString("fa-IR");
}

export function staffNumber(value: number, locale: StaffLocale): string {
  return value.toLocaleString(locale === "en" ? "en-US" : "fa-IR");
}

export function staffContent(persian: string, english: string | null | undefined, locale: StaffLocale): string {
  if (locale === "fa") return persian;
  return english?.trim() || "Translation pending";
}
