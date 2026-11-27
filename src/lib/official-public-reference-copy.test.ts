import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { getOfficialReferenceCopy, officialPublicReferenceCopy } from "./official-public-reference-copy";

test("member benefits and membership levels render source-grounded decision details in all six non-English locales", () => {
  const locales = ["de", "fr", "es", "hu", "sq", "pt"] as const;
  const info = readFileSync(new URL("../components/official-public-info.tsx", import.meta.url), "utf8");
  assert.match(info, /referenceCopy\?\.sections\.length/);
  assert.match(info, /referenceCopy\.sections\.map/);

  for (const code of locales) {
    const copy = officialPublicReferenceCopy[code];
    const benefits = copy.sections.memberBenefits ?? [];
    const levels = copy.sections.membershipLevels ?? [];
    assert.ok(benefits.length >= 3, `${code} member benefits must include fees/events, communications, and course/access details`);
    assert.ok(levels.length >= 2, `${code} membership levels must include Level I terms and legal/business disclaimers`);
    assert.deepEqual(getOfficialReferenceCopy(code, "memberBenefits").sections, benefits);
    assert.deepEqual(getOfficialReferenceCopy(code, "membershipLevels").sections, levels);

    const benefitsText = benefits.map((section) => section.body).join(" ");
    const levelsText = levels.map((section) => section.body).join(" ");
    assert.match(benefitsText, /1[ .]500|1500/);
    assert.match(benefitsText, /150/);
    assert.match(benefitsText, /cancel|annul|anul|lemond|kündig/i);
    assert.match(benefitsText, /5.?10|fünf bis zehn|cinq à dix|öt.?tíz|cinco a diez|cinco a dez|pesë deri në dhjetë/);
    assert.match(benefitsText, /SMS/);
    assert.match(benefitsText, /GIN Core Success Training/);
    assert.match(benefitsText, /first event is free|premier événement est gratuit|primer evento es GRATIS|első esemény pedig ingyenes|ngjarja e parë është falas|primeiro evento é GRATUITO|erste Veranstaltung jedoch kostenlos/i);
    assert.match(levelsText, /CLASSIFIED|classificad/i);
    assert.match(levelsText, /1[ .]500|1500/);
    assert.match(levelsText, /150/);
    const levelOneAccessPatterns = {
      de: /Mitgliederbereichen der GIN-Website/,
      fr: /espaces du site GIN/,
      es: /secciones del sitio web de GIN/,
      hu: /GIN weboldalának I\. szintű tagi részei/,
      sq: /seksionet e Nivelit I në faqen e GIN/,
      pt: /áreas de membros de Nível I no sítio Web da GIN/,
    };
    assert.match(levelsText, levelOneAccessPatterns[code], `${code} must describe Level I website access`);
    assert.match(levelsText, /ticket|billet|entrada|jegy|biletë|bilhete/i, `${code} must describe event-ticket requirements`);
    assert.match(levelsText, /financial|finanz|financier|financiero|financeiro|pénzügyi|financiare/i);
    assert.match(levelsText, /medical|medizin|médical|médico|orvosi|mjekësore/i);
    assert.match(levelsText, /business opportunity|geschäftsmöglichkeit|opportunité commerciale|oportunidad de negocio|üzleti lehetőség|mundësi biznesi|oportunidade de negócio/i);
  }

  for (const code of ["de", "fr", "sq"] as const) {
    const text = (officialPublicReferenceCopy[code].sections.memberBenefits ?? []).map((section) => section.body).join(" ");
    assert.match(text, /20[ .]000/);
    assert.match(text, /Major Weekend/);
    assert.match(text, /kostenloses Ticket|billet gratuit|biletë falas/i);
  }

  const spanishBenefits = (officialPublicReferenceCopy.es.sections.memberBenefits ?? []).map((section) => section.body).join(" ");
  assert.match(spanishBenefits, /2\.000/);
  assert.match(spanishBenefits, /crucero/);
  assert.match(officialPublicReferenceCopy.es.sections.memberBenefits?.[0].body ?? "", /no anuncia una entrada gratuita específica/);

  for (const code of ["hu", "pt"] as const) {
    const text = (officialPublicReferenceCopy[code].sections.memberBenefits ?? []).map((section) => section.body).join(" ");
    assert.match(text, /Major Weekend/);
    assert.match(text, /first event is free|első esemény pedig ingyenes|primeiro evento é GRATUITO/i);
    assert.doesNotMatch(officialPublicReferenceCopy[code].sections.memberBenefits?.[0].body ?? "", /20[ .]000/);
  }
});
