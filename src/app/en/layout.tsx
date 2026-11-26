import { headers } from "next/headers";
import EnglishSiteFrame from "@/components/english-site-frame";

const staffWorkspacePaths = new Set([
  "/en/admin",
  "/en/affiliate",
  "/en/instructor",
  "/en/events-manager",
  "/en/finance-center",
  "/en/support-center",
]);

export default async function EnglishLayout({ children }: { children: React.ReactNode }) {
  const pathname = (await headers()).get("x-website-path") ?? "";
  if (staffWorkspacePaths.has(pathname)) return children;
  return <EnglishSiteFrame>{children}</EnglishSiteFrame>;
}
