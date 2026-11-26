import type { Metadata, Viewport } from "next";
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

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fa" dir="rtl"><body>{children}</body></html>;
}
