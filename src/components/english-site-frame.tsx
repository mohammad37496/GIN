import EnglishPublicHeader, { EnglishPublicSidebar } from "@/components/english-public-header";
import EnglishPublicFooter from "@/components/english-public-footer";

export default function EnglishSiteFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="gin-en-site" lang="en" dir="ltr">
      <EnglishPublicHeader />
      <div className="gin-en-shell">
        <EnglishPublicSidebar />
        <main className="gin-en-main">{children}</main>
      </div>
      <EnglishPublicFooter />
    </div>
  );
}
