import Link from "next/link";
import LocaleSwitcher from "@/components/locale-switcher";

export type StaffModuleLink = { title: string; description: string; href: string };

function persianWorkspaceHref(href: string) {
  if (!href.startsWith("/")) return href;
  return href.startsWith("/fa/") ? href : `/fa${href}`;
}

export default function EnglishStaffLanding({ title, description, openLabel, openHref, modules = [] }: {
  title: string; description: string; openLabel: string; openHref: string; modules?: StaffModuleLink[];
}) {
  return <main className="gin-en-staff">
    <header className="gin-en-staff-header"><Link href="/en" className="gin-en-staff-brand">GLOBAL INFORMATION NETWORK</Link><nav><Link href="/en/dashboard">Member Dashboard</Link><LocaleSwitcher initialLocale="en" /></nav></header>
    <section className="gin-en-staff-main"><span className="gin-en-course-kicker">GIN STAFF WORKSPACE</span><h1>{title}</h1><p className="gin-en-page-intro">{description}</p>
      <div className="gin-en-staff-note"><strong>Workspace availability</strong><p>The English workspace overview is available. Operational administration tools still use the existing Persian interface; opening a tool switches to the Persian workspace so its language and direction remain correct.</p></div>
      <a className="gin-en-button" href={persianWorkspaceHref(openHref)}>{openLabel}</a>
      {modules.length > 0 && <section className="gin-en-staff-modules"><h2>Workspace Areas</h2><div className="gin-en-staff-grid">{modules.map((module) => <article key={module.href}><h3>{module.title}</h3><p>{module.description}</p><a href={persianWorkspaceHref(module.href)}>Open area</a></article>)}</div></section>}
    </section>
  </main>;
}
