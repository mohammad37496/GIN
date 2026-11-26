import Image from "next/image";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpLeft, BookOpen, CalendarDays, Compass, GraduationCap, HeartPulse, ShieldCheck, Sparkles, Users, Wallet } from "lucide-react";
import PublicHeader from "@/components/public-header";
import PublicFooter from "@/components/public-footer";

export const metadata: Metadata = {
  title: "شبکه جهانی اطلاعات GIN",
  description: "شبکه جهانی اطلاعات؛ جامعه‌ای بین‌المللی برای یادگیری، ارتباط و رشد در حوزه‌های سلامت، ثروت و شادی.",
  alternates: { canonical: "/fa", languages: { fa: "/fa", en: "/en" } },
  openGraph: { title: "شبکه جهانی اطلاعات GIN", description: "یادگیری، ارتباط و رشد در جامعه جهانی GIN.", locale: "fa_IR", type: "website" },
};

const pillars = [
  { icon: Wallet, title: "ثروت و استقلال مالی", text: "آموزش سواد مالی، کارآفرینی و شناخت بهتر فرصت‌ها برای تصمیم‌گیری آگاهانه." },
  { icon: HeartPulse, title: "سلامت و تندرستی", text: "منابع آموزشی درباره سبک زندگی، تندرستی و مراقبت آگاهانه از خود." },
  { icon: Compass, title: "شادی و رشد فردی", text: "مهارت‌های زندگی، ارتباطات، هدف‌گذاری و پرورش نگرشی سازنده." },
];

const learningAreas = [
  "خلق ثروت، سواد مالی و کارآفرینی",
  "سلامت، تندرستی و سبک زندگی",
  "شادمانی، آرامش و هوش هیجانی",
  "روابط انسانی، ارتباطات و رهبری",
  "رشد حرفه‌ای و مهارت‌های کسب‌وکار",
  "خودشناسی و یادگیری مادام‌العمر",
];

const introVideo = "https://player.mediadelivery.net/embed/21211/8afabd85-d7a1-43a1-824d-b467272f0951?autoplay=false&loop=false&muted=false&preload=false&responsive=true";
const storiesVideo = "https://player.mediadelivery.net/embed/34091/f9dd38fa-5c2d-43f4-a9ad-888be6ebc0cd?autoplay=false&loop=false&muted=false&preload=false&responsive=true";

export default function Home() {
  return <>
    <PublicHeader />
    <main className="gin-home">
      <section className="gin-hero">
        <Image src="/gin/gin-banner.webp" alt="گردهمایی اعضای شبکه جهانی GIN" fill priority sizes="100vw" className="gin-hero-image" />
        <div className="gin-hero-shade" />
        <div className="public-container gin-hero-content">
          <span className="gin-kicker"><Sparkles size={15} /> THE GLOBAL INFORMATION NETWORK</span>
          <h1>به شبکه جهانی اطلاعات <em>GIN</em> خوش آمدید</h1>
          <p>جامعه‌ای بین‌المللی برای یادگیری، ارتباط و رشد در سه حوزه مهم زندگی: سلامت، ثروت و شادی.</p>
          <div className="gin-hero-actions">
            <Link href="/register" className="button gin-gold-button">درخواست عضویت <ArrowLeft size={17} /></Link>
            <Link href="/about" className="gin-hero-link">درباره شبکه بیشتر بدانید <ArrowUpLeft size={17} /></Link>
          </div>
          <div className="gin-hero-note"><ShieldCheck size={16} /> درخواست‌های عضویت پس از بررسی و تأیید فعال می‌شوند.</div>
        </div>
        <div className="gin-hero-caption">LEARN · CONNECT · GROW</div>
      </section>

      <section className="gin-intro-section public-container">
        <div className="gin-section-lead">
          <span className="eyebrow">A PRIVATE LEARNING COMMUNITY</span>
          <h2>دانش، ارتباط و تجربه؛ در کنار هم</h2>
          <p>GIN یک شبکه یادگیری و جامعه اعضاست که محتوای آموزشی، رویدادها و فرصت تعامل را در یک فضای یکپارچه گرد هم می‌آورد. اعضا می‌توانند مسیر یادگیری خود را متناسب با هدف‌ها و علاقه‌هایشان دنبال کنند.</p>
          <Link href="/who-we-are" className="text-arrow">با هویت و مأموریت GIN آشنا شوید <ArrowLeft size={16} /></Link>
        </div>
        <div className="gin-pillar-grid">
          {pillars.map(({ icon: Icon, title, text }, index) => <article className="gin-pillar" key={title}>
            <span className="gin-pillar-number">0{index + 1}</span>
            <Icon size={27} strokeWidth={1.6} />
            <h3>{title}</h3>
            <p>{text}</p>
          </article>)}
        </div>
      </section>

      <section className="gin-community-section">
        <div className="public-container gin-community-layout">
          <div className="gin-community-copy">
            <span className="eyebrow">A PRIVATE SUCCESS COMMUNITY</span>
            <h2>موفقیت در کنار افرادی که به رشد یکدیگر اهمیت می‌دهند</h2>
            <p>شبکه جهانی اطلاعات، جامعه‌ای بین‌المللی برای افرادی است که می‌خواهند در مسیر اهداف شخصی و حرفه‌ای خود یاد بگیرند، ارتباط بسازند و از تجربه دیگران استفاده کنند.</p>
            <p>اعضای GIN به آموزش‌های موضوعی، منابع چندرسانه‌ای، فرصت‌های یادگیری گروهی، رویدادهای حضوری و آنلاین و ارتباط با جامعه‌ای از افراد هم‌مسیر دسترسی دارند.</p>
            <Link href="/about" className="text-arrow">درباره مأموریت و ارزش‌های GIN <ArrowLeft size={16} /></Link>
          </div>
          <div className="gin-community-image">
            <Image src="/gin/gin-training.webp" alt="فضای آموزشی و گردهمایی اعضای شبکه جهانی اطلاعات" fill sizes="(max-width: 850px) 100vw, 50vw" />
            <span>LEARN · CONNECT · GROW</span>
          </div>
        </div>
      </section>

      <section className="gin-offer-section">
        <div className="public-container gin-offer-layout">
          <div className="gin-offer-image">
            <Image src="/gin/paris-intercontinental.webp" alt="گردهمایی آموزشی اعضای GIN در یک رویداد بین‌المللی" fill sizes="(max-width: 850px) 100vw, 50vw" />
            <span>GLOBAL CONNECTIONS</span>
          </div>
          <div className="gin-offer-copy">
            <span className="eyebrow">WHAT GIN OFFERS</span>
            <h2>فراتر از یک کتابخانه آموزشی</h2>
            <p>تجربه GIN از آموزش آنلاین و منابع چندرسانه‌ای تا رویدادها و ارتباط میان اعضا امتداد دارد. کتابخانه آموزشی پورتال، دوره‌ها و درس‌ها را با امکان ثبت‌نام و پیگیری پیشرفت در اختیار کاربران مجاز قرار می‌دهد.</p>
            <ul className="gin-check-list">
              <li><BookOpen size={17} /> دوره‌ها، درس‌ها و منابع آموزشی</li>
              <li><GraduationCap size={17} /> آزمون‌ها و گواهی‌های پایان دوره</li>
              <li><Users size={17} /> جامعه اعضا و ارتباطات آموزشی</li>
              <li><CalendarDays size={17} /> رویدادها و گردهمایی‌ها</li>
            </ul>
            <Link href="/what-we-offer" className="button">مشاهده برنامه‌ها و مزایا <ArrowLeft size={16} /></Link>
          </div>
        </div>
      </section>

      <section className="gin-video-section">
        <div className="public-container gin-video-layout">
          <div className="gin-video-copy">
            <span className="eyebrow">DISCOVER GIN</span>
            <h2>با شبکه جهانی اطلاعات آشنا شوید</h2>
            <p>ویدئوی معرفی را تماشا کنید و با دیدگاه کلی، حوزه‌های آموزشی و جامعه GIN آشنا شوید.</p>
            <Link href="/faq" className="text-arrow">پاسخ پرسش‌های متداول <ArrowLeft size={16} /></Link>
          </div>
          <div className="gin-video-frame"><iframe src={introVideo} title="ویدئوی معرفی شبکه جهانی اطلاعات GIN" loading="lazy" allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;" allowFullScreen /></div>
        </div>
      </section>

      <section className="gin-learning-section">
        <div className="public-container gin-learning-layout">
          <div>
            <span className="eyebrow">AREAS OF LEARNING</span>
            <h2>در مسیر رشد، موضوعات موردعلاقه خود را دنبال کنید</h2>
            <p>محتوای آموزشی در حوزه‌های گوناگون زندگی سازمان‌دهی می‌شود. برای مشاهده دوره‌های منتشرشده و شرایط دسترسی، وارد کتابخانه آموزشی شوید.</p>
            <Link href="/courses" className="button">ورود به کتابخانه آموزش <ArrowLeft size={16} /></Link>
          </div>
          <div className="gin-learning-list">{learningAreas.map((area, index) => <Link href="/courses" key={area}><span>0{index + 1}</span><strong>{area}</strong><ArrowUpLeft size={17} /></Link>)}</div>
        </div>
      </section>

      <section className="gin-stories-section">
        <div className="public-container">
          <div className="gin-centered-heading"><span className="eyebrow">MEMBERS SHARE THEIR STORIES</span><h2>تجربه‌ها و روایت‌های اعضا</h2><p>با روایت‌های منتشرشده از اعضای جامعه GIN آشنا شوید.</p></div>
          <div className="gin-stories-frame"><iframe src={storiesVideo} title="روایت‌ها و تجربه‌های اعضای GIN" loading="lazy" allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;" allowFullScreen /></div>
        </div>
      </section>

      <section className="gin-membership-steps-section">
        <div className="public-container">
          <div className="gin-centered-heading">
            <span className="eyebrow">YOUR GIN JOURNEY</span>
            <h2>شروع عضویت و ورود به جامعه GIN</h2>
            <p>درخواست خود را ثبت کنید؛ پس از بررسی و تأیید، دسترسی متناسب با سطح عضویت برای شما فعال می‌شود.</p>
          </div>
          <div className="gin-membership-steps">
            <article><span>01</span><ShieldCheck size={25}/><h3>ثبت درخواست</h3><p>اطلاعات حساب خود را وارد کنید و درخواست عضویت را ارسال کنید.</p></article>
            <article><span>02</span><Users size={25}/><h3>بررسی عضویت</h3><p>درخواست توسط مدیر بررسی می‌شود و وضعیت آن در حساب شما قابل پیگیری است.</p></article>
            <article><span>03</span><BookOpen size={25}/><h3>آغاز یادگیری</h3><p>پس از تأیید، به دوره‌ها، منابع آموزشی و امکانات فعال حساب خود دسترسی خواهید داشت.</p></article>
          </div>
          <div className="gin-steps-action"><Link href="/register" className="button gin-gold-button">ثبت درخواست عضویت <ArrowLeft size={17}/></Link><Link href="/membership" className="text-arrow">آشنایی با سطوح عضویت <ArrowLeft size={16}/></Link></div>
        </div>
      </section>

      <section className="gin-events-section">
        <div className="public-container gin-events-layout">
          <div className="gin-events-copy"><span className="eyebrow">EVENTS & CONNECTIONS</span><h2>یادگیری در رویدادها و گردهمایی‌ها ادامه دارد</h2><p>رویدادهای حضوری و آنلاین فرصتی برای آشنایی، تبادل تجربه و یادگیری جمعی فراهم می‌کنند. برنامه‌های فعال، زمان‌بندی و ظرفیت آن‌ها در تقویم رویدادهای پورتال نمایش داده می‌شود.</p><Link href="/events" className="button">مشاهده رویدادها <ArrowLeft size={16} /></Link></div>
          <div className="gin-events-image"><Image src="/gin/gin-community.webp" alt="گردهمایی بزرگ اعضای شبکه GIN" fill sizes="(max-width: 850px) 100vw, 50vw" /></div>
        </div>
      </section>

      <section className="gin-cruise-section">
        <div className="public-container gin-cruise-layout">
          <div className="gin-cruise-image"><Image src="/gin/gin-cruise.webp" alt="کشتی تفریحی در برنامه سفر گروهی" fill sizes="(max-width: 850px) 100vw, 42vw" /></div>
          <div><span className="eyebrow">GIN COMMUNITY EXPERIENCES</span><h2>اطلاعات سفرها و تجربه‌های گروهی</h2><p>اطلاعات برنامه‌های سفر و گردهمایی‌های ویژه در صفحه مربوط به آن‌ها منتشر می‌شود. جزئیات رزرو یا ثبت‌نام فقط پس از تأیید برگزارکننده فعال خواهد شد.</p><Link href="/cruise" className="text-arrow">مشاهده اطلاعات سفرها <ArrowLeft size={16} /></Link></div>
        </div>
      </section>

      <section className="gin-membership-cta">
        <div className="public-container gin-membership-cta-inner">
          <div><span className="eyebrow">BECOME A MEMBER</span><h2>مسیر یادگیری و ارتباط خود را با GIN آغاز کنید</h2><p>درخواست عضویت خود را ثبت کنید. پس از بررسی و تأیید، به امکانات متناسب با سطح دسترسی حساب خود وارد می‌شوید.</p></div>
          <div className="gin-cta-actions"><Link href="/register" className="button gin-gold-button">درخواست عضویت <ArrowLeft size={17} /></Link><Link href="/membership" className="gin-cta-secondary">مشاهده سطوح عضویت</Link></div>
        </div>
      </section>
    </main>
    <PublicFooter />
  </>;
}
