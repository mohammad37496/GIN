import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { officialPublicLocales, officialPublicLocaleCodes, officialLocaleForPath, officialPageKeyForPath, officialLocalePathForPage, officialPublicLocaleAlternates } from "./official-public-locales";
import { officialPublicInfoCopy } from "./official-public-info-copy";
import { officialPublicReferenceCopy } from "./official-public-reference-copy";
import { generateOfficialPublicLocaleMetadata } from "./official-public-locale-route";
import { officialEnglishReferencePages, officialPublicReferencePages, officialReferencePageAlternates, officialReferencePageForSlug, officialReferencePageKeyForPath, officialReferencePageKeyForSlug, officialReferencePagePath } from "./official-public-reference-routes";
import { englishPublicPages } from "./english-public-pages";

test("all six non-English official homepage paths match the published WordPress routes", () => {
  assert.deepEqual(officialPublicLocaleCodes, ["en", "de", "fr", "es", "hu", "sq", "pt"]);
  assert.deepEqual(officialPublicLocaleCodes.map((code) => officialPublicLocales[code].homePath), [
    "/en", "/de/home-public", "/fr/home-public", "/es/home-public-spanish", "/hu/home-public", "/sq/home-public", "/pt/home-public",
  ]);
  assert.equal(officialPublicLocales.de.sourceHomeUrl, "https://globalinformationnetwork.com/de/home-public/");
  assert.equal(officialPublicLocales.fr.sourceHomeUrl, "https://globalinformationnetwork.com/fr/home-public/");
  assert.equal(officialPublicLocales.es.sourceHomeUrl, "https://globalinformationnetwork.com/es/home-public-spanish/");
  assert.equal(officialPublicLocales.hu.sourceHomeUrl, "https://globalinformationnetwork.com/hu/home-public/");
  assert.equal(officialPublicLocales.sq.sourceHomeUrl, "https://globalinformationnetwork.com/sq/home-public/");
  assert.equal(officialPublicLocales.pt.sourceHomeUrl, "https://globalinformationnetwork.com/pt/home-public/");
  assert.deepEqual(officialPublicLocaleCodes.slice(1).map((code) => officialPublicLocales[code].aboutPath), [
    "/de/ueber-uns", "/fr/a-propos-de-nous", "/es/acerca-de-nosotros", "/hu/rolunk", "/sq/rreth-nesh", "/pt/quem-somos",
  ]);
  assert.equal(officialPublicLocales.fr.contactPath, "/fr/nous-contacter");
});

test("each public locale has source-grounded home copy and exact about/contact route mappings", () => {
  for (const code of officialPublicLocaleCodes) {
    const locale = officialPublicLocales[code];
    assert.ok(locale.navigation.home.length > 1 && locale.navigation.about.length > 1 && locale.navigation.contact.length > 1 && locale.navigation.login.length > 1 && locale.navigation.join.length > 1 && locale.navigation.menu.length > 1 && locale.navigation.sidebarAbout.length > 1 && locale.navigation.sidebarJoin.length > 1, `${code} navigation labels must be localized`);
    assert.deepEqual([...locale.navigation.primaryOrder].sort(), ["about", "contact", "home", "join", "login"]);
    assert.ok(locale.navigation.aboutHref.startsWith(`/${code}/`) || code === "en");
    assert.ok(locale.navigation.loginHref.startsWith("https://globalinformationnetwork.com/"));
    assert.ok(locale.navigation.sidebarJoinHref.startsWith("https://"));
    assert.ok(locale.copy.welcome.trim().length > 12, `${code} needs a localized H1`);
    assert.ok(locale.copy.intro.trim().length > 60, `${code} needs the source intro`);
    assert.ok(locale.copy.pillars.every((item) => item.trim().length > 8), `${code} needs all three source pillars`);
    assert.ok(locale.aboutPath.startsWith(`/${code}/`), `${code} about route must be locale-prefixed`);
    assert.ok(locale.contactPath.startsWith(`/${code}/`), `${code} contact route must be locale-prefixed`);
  }
  assert.equal(officialPublicLocales.pt.copy.pillars[1], "Saúde dinâmica e longevidade");
  assert.match(officialPublicLocales.hu.copy.intro, /az élet kulcsfontosságú területein/);
  assert.doesNotMatch(officialPublicLocales.pt.copy.pillars.join(" "), /Dynamic Vibrant Health/);
  for (const code of ["de", "fr", "hu", "sq", "pt"] as const) assert.notEqual(officialPublicLocales[code].navigation.home, "Home", `${code} homepage navigation must be localized`);
  assert.match(officialPublicLocales.hu.copy.speak, /Beszéljen/);
  assert.match(officialPublicLocales.sq.copy.speak, /të nivelit të lartë/);
  for (const code of ["de", "fr", "es", "hu", "sq", "pt"] as const) {
    assert.ok(officialPublicInfoCopy[code].about.sections.length >= 3);
    assert.ok(officialPublicInfoCopy[code].about.sourceUrl.startsWith("https://globalinformationnetwork.com/"));
    assert.ok(officialPublicInfoCopy[code].contact.sourceUrl.startsWith("https://globalinformationnetwork.com/"));
    assert.ok(officialPublicInfoCopy[code].about.sourceNote.length > 40);
  }
});

test("all six translated homepages include source-based member, training, history, goals and event sections", () => {
  for (const code of ["de", "fr", "es", "hu", "sq", "pt"] as const) {
    const sections = officialPublicLocales[code].copy.sections;
    assert.equal(sections.length, 13, `${code} homepage is missing major official sections`);
    assert.ok(sections.every((section) => section.title.length > 5 && section.body.length > 80), `${code} homepage section copy is incomplete`);
    assert.ok((sections[1].items?.length ?? 0) >= 7, `${code} training topic list is incomplete`);
    assert.match(sections[2].body, /2003/);
    assert.match(sections[2].body, /2009/);
    assert.match(sections[2].body, /160/);
    assert.match(sections[5].body, /2009/);
    assert.match(sections[6].body, /4|vier|quatre|cuatro|négy|katër|quatro/i);
    assert.match(sections[7].body, /1[,. ]?500|1500/);
    assert.match(sections[7].body, /150/);
    assert.match(sections[8].body, /2028/);
    assert.match(sections[9].body, /GIN/);
    assert.match(sections[10].body, /James Allen/);
    assert.match(sections[10].body, /Napoleon Hill/);
    assert.match(sections[11].body, /GIN Adventures/);
    assert.match(sections[12].body, /Tom Morter/);
    assert.match(sections[12].body, /Ted Morter/);
    assert.match(sections[12].body, /John Gray/);
  }
  const home = readFileSync(new URL("../components/official-public-home.tsx", import.meta.url), "utf8");
  const info = readFileSync(new URL("../components/official-public-info.tsx", import.meta.url), "utf8");
  const css = readFileSync(new URL("../app/official-public-locales.css", import.meta.url), "utf8");
  assert.match(home, /copy\.sections\.map/);
  assert.match(home, /<details className="gin-official-locale-mobile-menu">[\s\S]*?gin-official-locale-mobile-menu-panel/);
  assert.match(info, /const pageKey = page === "about" \? "aboutPath" : page === "contact" \? "contactPath" : "homePath"/);
  assert.match(info, /<details className="gin-official-locale-mobile-menu">[\s\S]*?gin-official-locale-mobile-menu-panel[\s\S]*?OfficialLocalePicker locale=\{locale\} pageKey=\{pageKey\} referencePageKey=\{referencePageKey\}/);
  assert.match(css, /\.gin-official-locale-navigation \{ display:none; \}/);
  assert.match(css, /\.gin-official-locale-mobile-menu \{ display:block; position:absolute; top:22px; right:12px/);
  assert.match(css, /\.gin-official-locale-main \{ padding:14px 10px 48px/);
  assert.match(css, /\.gin-official-locale-brand::before \{[^}]*width:70px/);
});

test("locale resolution recognizes all explicit public locale paths without guessing a locale from content", () => {
  assert.equal(officialLocaleForPath("/en"), "en");
  for (const code of ["de", "fr", "es", "hu", "sq", "pt"] as const) {
    assert.equal(officialLocaleForPath(officialPublicLocales[code].homePath), code);
    assert.equal(officialLocaleForPath(officialPublicLocales[code].aboutPath), code);
    assert.equal(officialLocaleForPath(officialPublicLocales[code].contactPath), code);
  }
  assert.equal(officialLocaleForPath("/fa/contact"), null);
});

test("official language switching preserves the current home, about, or contact page", () => {
  assert.equal(officialPageKeyForPath("/de/home-public"), "homePath");
  assert.equal(officialPageKeyForPath("/fr/a-propos-de-nous"), "aboutPath");
  assert.equal(officialPageKeyForPath("/es/contactanos"), "contactPath");
  assert.equal(officialLocalePathForPage("pt", "homePath"), "/pt/home-public");
  assert.equal(officialLocalePathForPage("pt", "aboutPath"), "/pt/quem-somos");
  assert.equal(officialLocalePathForPage("pt", "contactPath"), "/pt/fale-conosco");
  const picker = readFileSync(new URL("../components/official-public-home.tsx", import.meta.url), "utf8");
  assert.match(picker, /href=\{referencePageKey \? officialReferencePagePath\(code as OfficialPublicLocaleCode, referencePageKey\) : item\[pageKey\]\}/);
  const switcher = readFileSync(new URL("../components/locale-switcher.tsx", import.meta.url), "utf8");
  assert.match(switcher, /language\.paths\[officialPageKey\]/);
});

test("every verified English reference subject resolves to a local page with the official source URL", () => {
  assert.equal(Object.keys(officialEnglishReferencePages).length, 15);
  for (const key of Object.keys(officialEnglishReferencePages) as Array<keyof typeof officialEnglishReferencePages>) {
    const slug = officialReferencePagePath("en", key).split("/").pop()!;
    assert.equal(officialEnglishReferencePages[key]?.slug, slug);
    assert.ok(englishPublicPages[slug], `English reference subject ${key} must resolve to /en/${slug}`);
  }
  assert.equal(officialEnglishReferencePages.clubVision?.slug, "the-club-vision");
  assert.ok(englishPublicPages["the-club-vision"]);
  assert.equal(englishPublicPages["the-club-vision"].officialUrl, "https://globalinformationnetwork.com/the-club-vision/");
  assert.equal(officialReferencePagePath("en", "clubVision"), "/en/the-club-vision");
  assert.equal(officialReferencePageKeyForPath("/en/the-club-vision"), "clubVision");
  assert.equal(officialEnglishReferencePages.privacy?.slug, "privacy-policy-2");
  assert.equal(englishPublicPages["privacy-policy-2"].officialUrl, "https://globalinformationnetwork.com/privacy-policy-2/");
  assert.equal(officialReferencePagePath("en", "privacy"), "/en/privacy-policy-2");
  assert.equal(officialReferencePagePath("en", "whyJoin"), "/en", "no verified English Why Join route exists");
  assert.equal(officialReferencePageKeyForPath("/en/why-join"), null);
  assert.equal(englishPublicPages["why-join"], undefined);
  assert.equal(officialReferencePageAlternates("whyJoin").en, undefined);
  assert.equal(officialReferencePageAlternates("whyJoin")["x-default"], "/en");
  for (const page of ["homePath", "aboutPath", "contactPath"] as const) {
    const alternates = officialPublicLocaleAlternates(page);
    assert.equal(alternates.en, officialPublicLocales.en[page]);
    assert.equal(alternates.fa, page === "homePath" ? "/fa" : page === "aboutPath" ? "/fa/about" : "/fa/contact");
    assert.equal(alternates["x-default"], officialPublicLocales.en[page]);
    for (const code of officialPublicLocaleCodes) assert.equal(alternates[officialPublicLocales[code].htmlLang], officialPublicLocales[code][page]);
  }
});

test("all 96 localized reference subjects have reversible local aliases and only French success-system uses a root source URL", () => {
  const locales = ["de", "fr", "es", "hu", "sq", "pt"] as const;
  const keys = Object.keys(officialPublicReferencePages.de) as Array<keyof typeof officialPublicReferencePages.de>;
  const sourceUrls: string[] = [];
  const rootSourceExceptions: string[] = [];
  for (const code of locales) {
    for (const key of keys) {
      const page = officialPublicReferencePages[code][key];
      const localPath = officialReferencePagePath(code, key);
      assert.equal(localPath, `/${code}/${page.slug}`, `${code}/${key} must use its published local alias`);
      assert.equal(officialReferencePageKeyForPath(localPath), key, `${localPath} must round-trip to ${key}`);
      assert.ok(page.sourceUrl.startsWith("https://globalinformationnetwork.com/"));
      sourceUrls.push(page.sourceUrl);
      if (!new URL(page.sourceUrl).pathname.startsWith(`/${code}/`)) rootSourceExceptions.push(`${code}:${key}`);
    }
  }
  assert.equal(sourceUrls.length, 96);
  assert.equal(new Set(sourceUrls).size, 96, "localized source URLs must be unique");
  assert.deepEqual(rootSourceExceptions, ["fr:successSystem"]);
  assert.equal(officialReferencePagePath("fr", "successSystem"), "/fr/le-systeme-de-succes-gin");
  assert.deepEqual(officialReferencePageAlternates("successSystem"), {
    en: "/en/the-gin-success-system",
    de: "/de/das-gin-erfolgssystem",
    fr: "/fr/le-systeme-de-succes-gin",
    es: "/es/el-sistema-de-exito-de-gin",
    hu: "/hu/a-gin-success-system-hu",
    sq: "/sq/sistemi-i-suksesit-gin",
    pt: "/pt/o-sistema-de-sucesso-gin",
    "x-default": "/en/the-gin-success-system",
  });
});

test("official Club Vision sidebar destinations and the French success-system navigation target match the live reference", () => {
  const clubVisionSlugs = {
    de: "die-vision-des-clubs",
    fr: "la-vision-du-club",
    es: "la-vision-del-club",
    hu: "a-club-vision",
    sq: "vizioni-i-klubit",
    pt: "a-visao-do-clube",
  } as const;
  for (const [code, slug] of Object.entries(clubVisionSlugs) as Array<[keyof typeof clubVisionSlugs, string]>) {
    assert.equal(officialReferencePagePath(code, "clubVision"), `/${code}/${slug}`);
    assert.equal(officialPublicReferencePages[code].clubVision.sourceUrl, `https://globalinformationnetwork.com/${code}/${slug}/`);
  }
  assert.equal(officialPublicReferencePages.fr.successSystem.sourceUrl, "https://globalinformationnetwork.com/le-systeme-gin-success/");
  const home = readFileSync(new URL("../components/official-public-home.tsx", import.meta.url), "utf8");
  assert.match(home, /clubVision/);
  assert.match(home, /locale === "de" && key === "faq"/);
});

test("all locale routes are statically registered and localized pages expose canonical hreflang metadata", () => {
  for (const code of ["de", "fr", "es", "hu", "sq", "pt"] as const) {
    const route = readFileSync(new URL(`../app/${code}/home-public${code === "es" ? "-spanish" : ""}/page.tsx`, import.meta.url), "utf8");
    const infoRoute = readFileSync(new URL(`../app/${code}/[slug]/page.tsx`, import.meta.url), "utf8");
    assert.match(route, /alternates:\s*\{\s*canonical:/);
    assert.match(route, /languages:/);
    assert.match(infoRoute, /generateStaticParams/);
    assert.match(infoRoute, /generateOfficialPublicLocaleMetadata/);
  }
  const sitemap = readFileSync(new URL("../app/sitemap.ts", import.meta.url), "utf8");
  const englishHome = readFileSync(new URL("../app/en/page.tsx", import.meta.url), "utf8");
  const englishDynamic = readFileSync(new URL("../app/en/[slug]/page.tsx", import.meta.url), "utf8");
  assert.match(sitemap, /officialPublicLocaleCodes/);
  assert.match(sitemap, /officialPublicReferencePages/);
  assert.match(sitemap, /officialReferencePageAlternates/);
  assert.match(sitemap, /x-default/);
  assert.match(englishHome, /officialPublicLocaleAlternates\("homePath"\)/);
  assert.match(englishDynamic, /officialLocalePageKey/);
  assert.match(englishDynamic, /officialReferencePageAlternates/);
  assert.match(englishDynamic, /languageAlternates\["x-default"\]/);
  const routeHelper = readFileSync(new URL("./official-public-locale-route.tsx", import.meta.url), "utf8");
  assert.match(routeHelper, /officialReferencePageAlternates/);
});

test("official locale pages keep membership and portal flows on their authoritative services", () => {
  const home = readFileSync(new URL("../components/official-public-home.tsx", import.meta.url), "utf8");
  const info = readFileSync(new URL("../components/official-public-info.tsx", import.meta.url), "utf8");
  const locales = readFileSync(new URL("./official-public-locales.ts", import.meta.url), "utf8");
  assert.match(home, /signup\.globalinformationnetwork\.com/);
  assert.match(home, /active\.navigation\.loginHref/);
  assert.match(locales, /globalinformationnetwork\.com\/member-home/);
  assert.match(home, /OfficialLocaleReferenceNavigation/);
  assert.match(home, /active\.navigation\.primaryOrder\.map/);
  assert.match(home, /active\.navigation\.aboutHref/);
  assert.match(home, /active\.navigation\.loginHref/);
  assert.match(home, /navigation\.sidebarJoinHref/);
  assert.match(home, /navigation\.sidebarAbout/);
  assert.match(info, /OfficialLocaleReferenceNavigation/);
  assert.match(info, /reference-header-banner\.jpg/);
  assert.doesNotMatch(home, /\/api\/(?:courses|membership|events)/);
});

test("all non-English reference routes render source-attributed localized summaries instead of redirecting away", () => {
  const info = readFileSync(new URL("../components/official-public-info.tsx", import.meta.url), "utf8");
  const picker = readFileSync(new URL("../components/official-public-home.tsx", import.meta.url), "utf8");
  const routeHelper = readFileSync(new URL("./official-public-locale-route.tsx", import.meta.url), "utf8");
  assert.match(info, /page: "about" \| "contact" \| "reference"/);
  assert.match(info, /referenceCopy\.legalNotice/);
  assert.match(info, /href=\{sourceUrl\}/);
  assert.match(picker, /referencePageKey \? officialReferencePagePath/);
  assert.match(routeHelper, /page="reference" referencePageKey=\{referencePageKey\}/);
  for (const code of ["de", "fr", "es", "hu", "sq", "pt"] as const) {
    const pages = Object.values(officialPublicReferencePages[code]);
    assert.equal(pages.length, 16);
    assert.equal(Object.keys(officialPublicReferenceCopy[code].summaries).length, 16);
    assert.ok(officialPublicReferenceCopy[code].sourceNote.length > 30);
    assert.ok(officialPublicReferenceCopy[code].sourceAction.length > 4);
    assert.ok(officialPublicReferenceCopy[code].notice.length > 40);
    for (const page of pages) {
      assert.ok(page.slug.length > 2);
      if (code === "fr" && page.slug === "le-systeme-de-succes-gin") assert.equal(page.sourceUrl, "https://globalinformationnetwork.com/le-systeme-gin-success/");
      else assert.ok(page.sourceUrl.startsWith(`https://globalinformationnetwork.com/${code}/`));
      assert.equal(officialReferencePageForSlug(code, page.slug)?.sourceUrl, page.sourceUrl);
      const key = officialReferencePageKeyForSlug(code, page.slug);
      assert.ok(key);
      assert.ok(officialPublicReferenceCopy[code].summaries[key].length > 40, `${code}/${page.slug} needs a meaningful localized summary`);
      const metadata = generateOfficialPublicLocaleMetadata(code, page.slug);
      assert.equal(metadata.alternates?.canonical, officialReferencePagePath(code, key), `${code}/${page.slug} needs its own canonical URL`);
      assert.deepEqual(metadata.alternates?.languages, officialReferencePageAlternates(key), `${code}/${page.slug} needs reciprocal seven-locale hreflang and x-default URLs`);
    }
    const route = readFileSync(new URL(`../app/${code}/[slug]/page.tsx`, import.meta.url), "utf8");
    assert.match(route, /renderOfficialPublicLocalePage/);
    assert.doesNotMatch(route, /redirect\(/);
  }
});

test("language switching preserves the selected reference subject across all seven locale route maps", () => {
  assert.equal(officialReferencePageKeyForPath("/en/what-we-offer"), "whatWeOffer");
  assert.equal(officialReferencePageKeyForPath("/en/our-events"), "events");
  assert.equal(officialReferencePageKeyForPath("/de/was-wir-bieten"), "whatWeOffer");
  assert.equal(officialReferencePageKeyForPath("/fr/nos-evenements"), "events");
  assert.equal(officialReferencePagePath("de", "whatWeOffer"), "/de/was-wir-bieten");
  assert.equal(officialReferencePagePath("fr", "events"), "/fr/nos-evenements");
  assert.equal(officialReferencePagePath("en", "events"), "/en/our-events");
  assert.equal(officialReferencePagePath("en", "whyJoin"), "/en");
  const switcher = readFileSync(new URL("../components/locale-switcher.tsx", import.meta.url), "utf8");
  assert.match(switcher, /officialReferencePagePath\(language\.code as OfficialPublicLocaleCode, referencePageKey\)/);
});
