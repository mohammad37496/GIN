import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: { default: "GIN | Global Information Network", template: "%s | GIN" },
  description: "Global Information Network — شبکه جهانی اطلاعات، یادگیری و ارتباط اعضا.",
  applicationName: "Global Information Network",
  icons: { icon: "/icon.svg", shortcut: "/icon.svg", apple: "/icon.svg" },
  openGraph: {
    title: "GIN | Global Information Network",
    description: "شبکه جهانی اطلاعات، یادگیری و ارتباط اعضا.",
    siteName: "Global Information Network",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fa" dir="rtl"><body>{children}</body></html>;
}
