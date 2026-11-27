"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { officialMemberHomePaths, officialPublicLocales, officialPublicLocaleCodes, type OfficialPublicLocaleCode } from "@/lib/official-public-locales";
import { OfficialLocaleReferenceNavigation } from "@/components/official-public-home";
import { officialEnglishReferencePages, officialPublicReferencePages, officialReferencePagePath } from "@/lib/official-public-reference-routes";

const resetPasswordUrls: Record<OfficialPublicLocaleCode, string> = {
  en: "https://globalinformationnetwork.com/my-account/lost-password/",
  de: "https://globalinformationnetwork.com/de/mein-konto/lost-password/",
  fr: "https://globalinformationnetwork.com/fr/mon-compte/lost-password/",
  es: "https://globalinformationnetwork.com/es/mi-cuenta/lost-password/",
  hu: "https://globalinformationnetwork.com/hu/az-en-szamlam/lost-password/",
  sq: "https://globalinformationnetwork.com/sq/llogaria-ime/lost-password/",
  pt: "https://globalinformationnetwork.com/pt/minha-conta/lost-password/",
};

const copy: Record<OfficialPublicLocaleCode, {
  welcome: string; heading: string; username: string; password: string; remember: string; submit: string;
  lost: string; busy: string; failed: string; connection: string; home: string; copyright: string;
}> = {
  en: { welcome: "Welcome!", heading: "Login", username: "Username or email address", password: "Password", remember: "Remember me", submit: "Log in", lost: "Lost your password?", busy: "Signing in…", failed: "Unable to sign in.", connection: "Unable to connect to the server.", home: "Home", copyright: "All rights reserved" },
  de: { welcome: "Willkommen!", heading: "Anmelden", username: "Benutzername oder E-Mail-Adresse", password: "Passwort", remember: "Angemeldet bleiben", submit: "Anmelden", lost: "Passwort vergessen?", busy: "Anmeldung läuft…", failed: "Anmeldung nicht möglich.", connection: "Verbindung zum Server nicht möglich.", home: "Home", copyright: "Alle Rechte vorbehalten" },
  fr: { welcome: "Bienvenue!", heading: "Se connecter", username: "Identifiant ou e-mail", password: "Mot de passe", remember: "Se souvenir de moi", submit: "Se connecter", lost: "Mot de passe perdu ?", busy: "Connexion…", failed: "Connexion impossible.", connection: "Impossible de contacter le serveur.", home: "Accueil", copyright: "Tous droits réservés" },
  es: { welcome: "Bienvenidos!", heading: "Acceder", username: "Nombre de usuario o correo electrónico", password: "Contraseña", remember: "Recuérdame", submit: "Acceso", lost: "¿Perdiste tu contraseña?", busy: "Iniciando sesión…", failed: "No se pudo iniciar sesión.", connection: "No se pudo conectar con el servidor.", home: "Inicio Público", copyright: "Todos los derechos reservados" },
  hu: { welcome: "Üdvözöljük", heading: "Belépés", username: "Felhasználónév vagy e-mail cím", password: "Jelszó", remember: "Emlékezz rám", submit: "Belépés", lost: "Elfelejtett jelszó?", busy: "Bejelentkezés…", failed: "A bejelentkezés nem sikerült.", connection: "A szerver nem érhető el.", home: "Home", copyright: "Minden jog fenntartva" },
  sq: { welcome: "Mirësevini!", heading: "Hyrje", username: "Emër përdoruesi ose email", password: "Fjalëkalim", remember: "Mbamë mend", submit: "Hyni", lost: "Humbët fjalëkalimin tuaj?", busy: "Duke hyrë…", failed: "Hyrja dështoi.", connection: "Lidhja me serverin dështoi.", home: "Home", copyright: "TË GJITHA TË DREJTAT E REZERVUARA" },
  pt: { welcome: "Bem-vindo!", heading: "Iniciar sessão", username: "Nome de utilizador ou email", password: "Senha", remember: "Manter sessão", submit: "Iniciar sessão", lost: "Perdeu a sua senha?", busy: "A iniciar sessão…", failed: "Não foi possível iniciar sessão.", connection: "Não foi possível ligar ao servidor.", home: "Home", copyright: "TODOS OS DIREITOS RESERVADOS" },
};

const homePath: Record<OfficialPublicLocaleCode, string> = {
  en: "/en", de: "/de/home-public", fr: "/fr/home-public", es: "/es/home-public-spanish", hu: "/hu/home-public", sq: "/sq/home-public", pt: "/pt/home-public",
};

function MemberHomeLocalePicker({ locale }: { locale: OfficialPublicLocaleCode }) {
  return <details className="gin-official-locale-picker"><summary>{officialPublicLocales[locale].label}<span aria-hidden="true">⌄</span></summary><div>{officialPublicLocaleCodes.map((code) => <Link key={code} href={officialMemberHomePaths[code]} lang={officialPublicLocales[code].htmlLang} aria-current={code === locale ? "page" : undefined}>{officialPublicLocales[code].label}</Link>)}</div></details>;
}

function MemberHomeNavigation({ locale }: { locale: OfficialPublicLocaleCode }) {
  const active = officialPublicLocales[locale];
  const links = {
    home: <Link href={homePath[locale]}>{active.navigation.home}</Link>,
    join: <a href={active.navigation.sidebarJoinHref} target="_blank" rel="noopener noreferrer">{active.navigation.join}</a>,
    about: <Link href={active.navigation.aboutHref}>{active.navigation.about}</Link>,
    contact: <Link href={active.contactPath}>{active.navigation.contact}</Link>,
    login: <Link href={officialMemberHomePaths[locale]} aria-current="page">{active.navigation.login}</Link>,
  };
  return <nav className="gin-official-locale-nav" aria-label="Primary navigation">{active.navigation.primaryOrder.map((key) => <span key={key}>{links[key]}</span>)}</nav>;
}

export default function OfficialMemberHome({ locale }: { locale: OfficialPublicLocaleCode }) {
  const active = officialPublicLocales[locale];
  const words = copy[locale];
  const legalPages = locale === "en" ? officialEnglishReferencePages : officialPublicReferencePages[locale];
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, remember }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || words.failed);
      document.cookie = `gin_locale=${locale}; Path=/; Max-Age=31536000; SameSite=Lax${window.location.protocol === "https:" ? "; Secure" : ""}`;
      const requested = new URLSearchParams(window.location.search).get("next");
      const staffRoutes: Record<string, string> = Object.fromEntries(["dashboard", "admin", "affiliate", "instructor", "events-manager", "finance-center", "support-center"].map((route) => [`/${route}`, `/en/${route}`]));
      const destination = requested?.startsWith(`/${locale}/`) || requested === `/${locale}` ? requested : locale === "en" ? staffRoutes[data.redirectTo] || data.redirectTo : data.redirectTo;
      window.location.assign(destination || (locale === "en" ? "/en/dashboard" : "/dashboard"));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : words.connection);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="gin-official-locale-site gin-member-home" lang={active.htmlLang} dir="ltr">
      <header className="gin-official-locale-header">
        <Link href={homePath[locale]} className="gin-official-locale-brand" aria-label="Global Information Network home"><Image src="/gin/reference-header-banner.jpg" alt="Global Information Network" fill priority sizes="100vw" /></Link>
        <details className="gin-official-locale-mobile-menu"><summary aria-label={active.navigation.menu}><span className="gin-official-locale-menu-icon"><i/><i/><i/></span><span>{active.navigation.menu}</span></summary><div className="gin-official-locale-mobile-menu-panel"><MemberHomeLocalePicker locale={locale}/><MemberHomeNavigation locale={locale}/><OfficialLocaleReferenceNavigation locale={locale}/></div></details>
        <div className="gin-official-locale-navigation"><MemberHomeLocalePicker locale={locale}/><MemberHomeNavigation locale={locale}/></div>
      </header>
      <div className="gin-official-locale-layout">
        <aside className="gin-official-locale-sidebar"><OfficialLocaleReferenceNavigation locale={locale}/></aside>
        <main className="gin-official-locale-main gin-member-home-main">
          <p className="gin-member-home-welcome">{words.welcome}</p>
          <section className="gin-member-home-login" aria-labelledby="gin-member-home-title">
            <h1 id="gin-member-home-title">{words.heading}</h1>
            <form onSubmit={submit}>
              <label>{words.username} <span aria-hidden="true">*</span><input name="username" type="text" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} required maxLength={254}/></label>
              <label>{words.password} <span aria-hidden="true">*</span><input name="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required maxLength={72}/></label>
              <div className="gin-member-home-form-actions"><label className="gin-member-home-remember"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)}/><span>{words.remember}</span></label><button type="submit" disabled={busy}>{busy ? words.busy : words.submit}</button></div>
              {error ? <p className="gin-member-home-error" role="alert">{error}</p> : null}
            </form>
            <a className="gin-member-home-lost" href={resetPasswordUrls[locale]} target="_blank" rel="noopener noreferrer">{words.lost}</a>
          </section>
        </main>
      </div>
      <footer className="gin-official-locale-footer">
        <nav><Link href={homePath[locale]}>{words.home}</Link><Link href={officialMemberHomePaths[locale]}>{active.navigation.login}</Link><Link href={active.contactPath}>{active.navigation.contact}</Link><a href={active.navigation.sidebarJoinHref} target="_blank" rel="noopener noreferrer">{active.navigation.sidebarJoin}</a></nav>
        <Link className="gin-member-home-levels-image" href={officialReferencePagePath(locale, "membershipLevels")}><Image src="/gin/levels-footer.png" alt={locale === "en" ? "GIN membership levels" : locale === "de" ? "GIN-Mitgliedschaftsstufen" : locale === "fr" ? "Niveaux d’adhésion GIN" : locale === "es" ? "Niveles de membresía GIN" : locale === "hu" ? "GIN tagsági szintek" : locale === "sq" ? "Nivelet e anëtarësimit GIN" : "Níveis de adesão GIN"} width={320} height={100}/></Link>
        <nav aria-label="Legal information">{(["privacy", "terms", "memberAgreement"] as const).map((key) => { const page = legalPages[key]; return page ? <Link key={key} href={`/${locale}/${page.slug}`}>{page.label}</Link> : null; })}</nav>
        <nav aria-label="Change language">{officialPublicLocaleCodes.map((code) => <Link key={code} href={officialMemberHomePaths[code]} lang={officialPublicLocales[code].htmlLang} aria-current={code === locale ? "page" : undefined}>{officialPublicLocales[code].label}</Link>)}</nav>
        <p>Copyright © {new Date().getFullYear()} Global Information Network. {words.copyright}</p>
      </footer>
    </div>
  );
}
