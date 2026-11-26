import type { Metadata } from "next";
import Image from "next/image";
import PublicHeader from "@/components/public-header";
import PublicFooter from "@/components/public-footer";
import { ginMembershipLevels } from "@/lib/gin-membership-levels";

export const metadata: Metadata = {
  title: "سطوح عضویت شبکه اطلاعات جهانی",
  description: "معرفی ۱۲ سطح عضویت GIN، شرایط احراز، مزایا و امتیازات اعلام‌شده در وب‌سایت رسمی.",
  alternates: { canonical: "/fa/membership-levels", languages: { en: "/en/membership-levels", fa: "/fa/membership-levels" } },
  openGraph: { title: "سطوح عضویت شبکه اطلاعات جهانی | GIN", description: "معرفی ۱۲ سطح عضویت GIN و شرایط احراز آن‌ها.", url: "/fa/membership-levels", siteName: "Global Information Network", locale: "fa_IR", type: "website", images: ["/gin/gin-social-card.png"] },
  twitter: { card: "summary_large_image", title: "سطوح عضویت شبکه اطلاعات جهانی | GIN", description: "معرفی ۱۲ سطح عضویت GIN و شرایط احراز آن‌ها.", images: ["/gin/gin-social-card.png"] },
};

export default function MembershipLevelsReferencePage() {
  return <><PublicHeader /><main className="membership-levels-reference-page"><div className="public-container">
    <div className="catalog-heading"><span className="eyebrow">GLOBAL INFORMATION NETWORK</span><h1>سطوح عضویت</h1><p>شبکه اطلاعات جهانی دارای ۱۲ سطح عضویت است. ارتقا به هر سطح به احراز شرایط اختصاصی و تأیید کمیته پذیرش عضویت نیاز دارد. سطوح بالاتر ممکن است مزایای محرمانه، پاداش‌های نقدی، دسترسی ویژه و امتیازات دیگری داشته باشند.</p><p>در هر سطح، شرایط احراز و مزایای سطح بعدی برای عضو پذیرفته‌شده اعلام می‌شود و این روند تا سطح دوازدهم ادامه دارد.</p></div>
    <div className="membership-levels-reference-table-wrap" role="region" aria-label="جدول سطوح عضویت" tabIndex={0}><table className="membership-levels-reference-table"><thead><tr><th>سطح عضویت</th><th>شرایط احراز</th><th>مزایا</th><th>پاداش نقدی، امتیازات و مزایا</th></tr></thead><tbody>{ginMembershipLevels.map((item) => <tr key={item.level}><th scope="row"><div className="membership-levels-reference-level"><Image src={`/gin/membership-levels/${item.image}`} alt={item.alt} width={68} height={68} /><span>{item.titleFa}</span></div></th><td>{item.level === 1 ? "هزینه اولیه: ۱٬۵۰۰ دلار؛ حق عضویت ماهانه: ۱۵۰ دلار" : "محرمانه"}</td><td>{item.level === 1 ? "دسترسی به بخش سطح اول وب‌سایت GIN و امکان شرکت در رویدادها با خرید بلیت" : "محرمانه"}</td><td>محرمانه</td></tr>)}</tbody></table></div>
    <p className="membership-levels-reference-disclaimer">GIN خود را یک سازمان اطلاع‌رسانی و انجمن خصوصی «عضو با عضو» معرفی می‌کند. این سازمان مشاوره مالی، مالیاتی، حقوقی، سرمایه‌گذاری یا پزشکی ارائه نمی‌دهد. مشورت با متخصصان مستقل توصیه شده است. عضویت، فرصت کسب‌وکار محسوب نمی‌شود.</p>
  </div></main><PublicFooter /></>;
}
