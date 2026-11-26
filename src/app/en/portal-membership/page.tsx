import type { Metadata } from "next";
import EnglishPortalMembershipPage from "@/components/english-portal-membership-page";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Portal Membership Plans",
  description: "Membership plans for the GIN learning portal. These are separate from official Global Information Network membership.",
  alternates: { canonical: "/en/portal-membership" },
  robots: { index: false, follow: false },
};

export default function EnglishPortalMembershipRoute() {
  return <EnglishPortalMembershipPage />;
}
