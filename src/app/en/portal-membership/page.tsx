import type { Metadata } from "next";
import EnglishPortalMembershipPage from "@/components/english-portal-membership-page";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Portal Membership Plans",
  description: "Membership plans for the GIN learning portal. These are separate from official Global Information Network membership.",
  alternates: { canonical: "/en/portal-membership", languages: { en: "/en/portal-membership", fa: "/fa/membership" } },
  robots: { index: false, follow: false },
  openGraph: { title: "Portal Membership Plans | GIN", description: "Membership plans for the GIN learning portal, separate from official GIN membership.", url: "/en/portal-membership", siteName: "Global Information Network", type: "website", images: ["/gin/gin-social-card.png"] },
  twitter: { card: "summary_large_image", title: "Portal Membership Plans | GIN", description: "Membership plans for the GIN learning portal, separate from official GIN membership.", images: ["/gin/gin-social-card.png"] },
};

export default function EnglishPortalMembershipRoute() {
  return <EnglishPortalMembershipPage />;
}
