import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import "./globals.css";
import "./public-site.css";
import "./courses.css";
import "./portal-workflows.css";
import "./dashboard.css";
import "./resource-library.css";
import "./workflow-admin.css";
import "./assessment-admin.css";
import "./support-workflow.css";
import "./roles.css";
import "./membership-controls.css";
import "./catalog-filters.css";
import "./gin-reference.css";
import "./brand.css";
import "./english-site.css";
import "./official-public-locales.css";

const siteUrl = process.env.APP_URL?.trim() || "https://globalinformationnetwork.liara.run";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "GIN | Global Information Network", template: "%s | GIN" },
  description: "Global Information Network — شبکه جهانی اطلاعات، یادگیری و ارتباط اعضا.",
  applicationName: "Global Information Network",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: ["/icon.svg"],
    apple: [{ url: "/apple-touch-icon.png", type: "image/png" }],
  },
  openGraph: {
    title: "GIN | Global Information Network",
    description: "شبکه جهانی اطلاعات، یادگیری و ارتباط اعضا.",
    siteName: "Global Information Network",
    type: "website",
    images: [{ url: "/gin/gin-social-card.png", width: 1200, height: 630, alt: "GIN — Global Information Network" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "GIN | Global Information Network",
    description: "شبکه جهانی اطلاعات، یادگیری و ارتباط اعضا.",
    images: ["/gin/gin-social-card.png"],
  },
};

export const viewport: Viewport = { themeColor: "#173c59" };

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const requestedLocale = (await headers()).get("x-website-locale") ?? "fa";
  const locale = ["fa", "en", "de", "fr", "es", "hu", "sq", "pt"].includes(requestedLocale) ? requestedLocale : "fa";
  return <html lang={locale} dir={locale === "fa" ? "rtl" : "ltr"}><body className={`locale-${locale}`}>{children}</body></html>;
}
