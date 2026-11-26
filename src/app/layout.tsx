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

export const metadata: Metadata = { title: "GIN | آکادمی یادگیری", description: "فضای اختصاصی یادگیری GIN" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fa" dir="rtl"><body>{children}</body></html>;
}
