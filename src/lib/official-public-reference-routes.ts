import type { OfficialPublicLocaleCode } from "./official-public-locales";

type ReferencePage = { slug: string; label: string; sourceUrl: string; navigationLabel?: string };
type ReferencePageKey = "whatWeOffer" | "memberBenefits" | "successSystem" | "events" | "training" | "membershipLevels" | "faq" | "hotels" | "clubhouses" | "clubVision" | "cruise" | "whyJoin" | "whoWeAre" | "memberAgreement" | "terms" | "privacy";

export type OfficialReferencePageKey = ReferencePageKey;

const englishReferenceSlugs: Partial<Record<ReferencePageKey, string>> = {
  whatWeOffer: "what-we-offer", memberBenefits: "member-benefits", successSystem: "the-gin-success-system", events: "our-events", training: "our-training", membershipLevels: "membership-levels", faq: "faq", hotels: "gin-hotels", clubhouses: "clubhouses-and-lodges", clubVision: "the-club-vision", cruise: "the-gin-cruise-ship", whoWeAre: "who-we-are", memberAgreement: "member-agreement", terms: "terms-of-use", privacy: "privacy-policy-2",
};

export const officialEnglishReferencePages: Partial<Record<ReferencePageKey, Pick<ReferencePage, "slug" | "label" | "navigationLabel">>> = {
  whatWeOffer: { slug: "what-we-offer", label: "What We Offer" },
  memberBenefits: { slug: "member-benefits", label: "Member Benefits" },
  successSystem: { slug: "the-gin-success-system", label: "GIN Success System" },
  events: { slug: "our-events", label: "GIN Events" },
  training: { slug: "our-training", label: "Our Training" },
  membershipLevels: { slug: "membership-levels", label: "Membership Levels" },
  faq: { slug: "faq", label: "Frequently Asked Questions" },
  hotels: { slug: "gin-hotels", label: "GIN Hotel Collection" },
  clubhouses: { slug: "clubhouses-and-lodges", label: "GIN Clubhouses" },
  clubVision: { slug: "the-club-vision", label: "Club Vision" },
  cruise: { slug: "the-gin-cruise-ship", label: "GIN Cruise Ship" },
  whoWeAre: { slug: "who-we-are", label: "Who We Are" },
  memberAgreement: { slug: "member-agreement", label: "Member Agreement" },
  terms: { slug: "terms-of-use", label: "Terms of Use" },
  privacy: { slug: "privacy-policy-2", label: "Privacy Policy" },
};

export const officialPublicReferencePages: Record<Exclude<OfficialPublicLocaleCode, "en">, Record<ReferencePageKey, ReferencePage>> = {
  de: {
    whatWeOffer: { slug: "was-wir-bieten", label: "Was Wir Bieten", sourceUrl: "https://globalinformationnetwork.com/de/was-wir-bieten/" },
    memberBenefits: { slug: "vorteile-fuer-mitglieder", label: "Vorteile für Mitglieder", navigationLabel: "Vorteile für Mitglieder", sourceUrl: "https://globalinformationnetwork.com/de/vorteile-fuer-mitglieder/" },
    successSystem: { slug: "das-gin-erfolgssystem", label: "Das GIN-Erfolgssystem", navigationLabel: "Das GIN-Erfolgssystem", sourceUrl: "https://globalinformationnetwork.com/de/das-gin-erfolgssystem/" },
    events: { slug: "unsere-veranstaltungen", label: "Unsere Veranstaltungen", navigationLabel: "GIN-Events", sourceUrl: "https://globalinformationnetwork.com/de/unsere-veranstaltungen/" },
    training: { slug: "unser-training", label: "Unser Training", navigationLabel: "GIN-Schulungen", sourceUrl: "https://globalinformationnetwork.com/de/unser-training/" },
    membershipLevels: { slug: "mitgliedschaftsstufen", label: "Mitgliedschaftsstufen", sourceUrl: "https://globalinformationnetwork.com/de/mitgliedschaftsstufen/" },
    faq: { slug: "faq-german", label: "Häufige Fragen", navigationLabel: "FAQ", sourceUrl: "https://globalinformationnetwork.com/de/faq-german/" },
    hotels: { slug: "gin-hotel-kollektion", label: "GIN Hotel Kollektion", navigationLabel: "GIN Hotel Kollektion", sourceUrl: "https://globalinformationnetwork.com/de/gin-hotel-kollektion/" },
    clubhouses: { slug: "clubhaeuser-und-lodges", label: "Clubhäuser und Lodges", sourceUrl: "https://globalinformationnetwork.com/de/clubhaeuser-und-lodges/" },
    clubVision: { slug: "die-vision-des-clubs", label: "Die Vision des Clubs", navigationLabel: "Die Vision des Clubs", sourceUrl: "https://globalinformationnetwork.com/de/die-vision-des-clubs/" },
    cruise: { slug: "das-gin-kreuzfahrtschiff", label: "Das GIN-Kreuzfahrtschiff", navigationLabel: "Das GIN-Kreuzfahrtschiff", sourceUrl: "https://globalinformationnetwork.com/de/das-gin-kreuzfahrtschiff/" },
    whyJoin: { slug: "warum-beitreten", label: "Warum Beitreten", sourceUrl: "https://globalinformationnetwork.com/de/warum-beitreten/" },
    whoWeAre: { slug: "wer-wir-sind", label: "Wer Wir Sind", sourceUrl: "https://globalinformationnetwork.com/de/wer-wir-sind/" },
    memberAgreement: { slug: "mitglieder-vereinbarung", label: "Mitgliedervereinbarung", sourceUrl: "https://globalinformationnetwork.com/de/mitglieder-vereinbarung/" },
    terms: { slug: "nutzungsbedingungen", label: "Nutzungsbedingungen", sourceUrl: "https://globalinformationnetwork.com/de/nutzungsbedingungen/" },
    privacy: { slug: "datenschutz-bestimmungen", label: "Datenschutzbestimmungen", sourceUrl: "https://globalinformationnetwork.com/de/datenschutz-bestimmungen/" },
  },
  fr: {
    whatWeOffer: { slug: "ce-que-nous-offrons", label: "Ce Que Nous Offrons", sourceUrl: "https://globalinformationnetwork.com/fr/ce-que-nous-offrons/" },
    memberBenefits: { slug: "avantages-pour-les-membres", label: "Avantages pour les Membres", navigationLabel: "Avantages pour les Membres", sourceUrl: "https://globalinformationnetwork.com/fr/avantages-pour-les-membres/" },
    successSystem: { slug: "le-systeme-de-succes-gin", label: "Le Système GIN Success", navigationLabel: "Le Système GIN Success", sourceUrl: "https://globalinformationnetwork.com/le-systeme-gin-success/" },
    events: { slug: "nos-evenements", label: "Nos Événements", navigationLabel: "Événements GIN", sourceUrl: "https://globalinformationnetwork.com/fr/nos-evenements/" },
    training: { slug: "notre-formation", label: "Notre Formation", navigationLabel: "Formation GIN", sourceUrl: "https://globalinformationnetwork.com/fr/notre-formation/" },
    membershipLevels: { slug: "niveaux-dadhesion", label: "Niveaux d’Adhésion", sourceUrl: "https://globalinformationnetwork.com/fr/niveaux-dadhesion/" },
    faq: { slug: "faq-french", label: "FAQ", navigationLabel: "FAQ", sourceUrl: "https://globalinformationnetwork.com/fr/faq-french/" },
    hotels: { slug: "gin-hotel-collection", label: "Collection d’Hôtels GIN", navigationLabel: "GIN Hotel Collection", sourceUrl: "https://globalinformationnetwork.com/fr/gin-hotel-collection/" },
    clubhouses: { slug: "clubhouses-et-lodges", label: "Clubhouses et Lodges", sourceUrl: "https://globalinformationnetwork.com/fr/clubhouses-et-lodges/" },
    clubVision: { slug: "la-vision-du-club", label: "La Vision du Club", navigationLabel: "La Vision du Club", sourceUrl: "https://globalinformationnetwork.com/fr/la-vision-du-club/" },
    cruise: { slug: "le-navire-de-croisiere-gin", label: "Le Navire de Croisière GIN", navigationLabel: "Le Navire de Croisière GIN", sourceUrl: "https://globalinformationnetwork.com/fr/le-navire-de-croisiere-gin/" },
    whyJoin: { slug: "pourquoi-devriez-vous-envisager-de-faire-une-demande-dadhesion", label: "Pourquoi Adhérer", sourceUrl: "https://globalinformationnetwork.com/fr/pourquoi-devriez-vous-envisager-de-faire-une-demande-dadhesion/" },
    whoWeAre: { slug: "qui-sommes-nous", label: "Qui Sommes-Nous", sourceUrl: "https://globalinformationnetwork.com/fr/qui-sommes-nous/" },
    memberAgreement: { slug: "entente-de-membre", label: "Entente de Membre", sourceUrl: "https://globalinformationnetwork.com/fr/entente-de-membre/" },
    terms: { slug: "conditions-dutilisation", label: "Conditions d’Utilisation", sourceUrl: "https://globalinformationnetwork.com/fr/conditions-dutilisation/" },
    privacy: { slug: "politique-de-confidentialite", label: "Politique de Confidentialité", sourceUrl: "https://globalinformationnetwork.com/fr/politique-de-confidentialite/" },
  },
  es: {
    whatWeOffer: { slug: "lo-que-ofrecemos", label: "Lo Que Ofrecemos", sourceUrl: "https://globalinformationnetwork.com/es/lo-que-ofrecemos/" },
    memberBenefits: { slug: "beneficios-para-miembros", label: "Beneficios para Miembros", navigationLabel: "Beneficios para Miembros", sourceUrl: "https://globalinformationnetwork.com/es/beneficios-para-miembros/" },
    successSystem: { slug: "el-sistema-de-exito-de-gin", label: "El Sistema de Éxito de GIN", navigationLabel: "El Sistema de Éxito de GIN", sourceUrl: "https://globalinformationnetwork.com/es/el-sistema-de-exito-de-gin/" },
    events: { slug: "nuestros-eventos", label: "Nuestros Eventos", navigationLabel: "Eventos GIN", sourceUrl: "https://globalinformationnetwork.com/es/nuestros-eventos/" },
    training: { slug: "nuestra-formacion", label: "Nuestra Formación", navigationLabel: "Formación GIN", sourceUrl: "https://globalinformationnetwork.com/es/nuestra-formacion/" },
    membershipLevels: { slug: "niveles-de-afiliacion", label: "Niveles de Afiliación", sourceUrl: "https://globalinformationnetwork.com/es/niveles-de-afiliacion/" },
    faq: { slug: "preguntas-frecuentes", label: "Preguntas Frecuentes", navigationLabel: "Preguntas Frecuentes", sourceUrl: "https://globalinformationnetwork.com/es/preguntas-frecuentes/" },
    hotels: { slug: "coleccion-gin-hotel", label: "Colección de Hoteles GIN", navigationLabel: "Colección GIN Hotel", sourceUrl: "https://globalinformationnetwork.com/es/coleccion-gin-hotel/" },
    clubhouses: { slug: "casas-club-y-lodges", label: "Casas Club y Lodges", sourceUrl: "https://globalinformationnetwork.com/es/casas-club-y-lodges/" },
    clubVision: { slug: "la-vision-del-club", label: "La Visión del Club", navigationLabel: "La Visión del Club", sourceUrl: "https://globalinformationnetwork.com/es/la-vision-del-club/" },
    cruise: { slug: "el-crucero-gin", label: "El Crucero GIN", navigationLabel: "El Crucero GIN", sourceUrl: "https://globalinformationnetwork.com/es/el-crucero-gin/" },
    whyJoin: { slug: "por-que-unirse", label: "Por Qué Unirse", sourceUrl: "https://globalinformationnetwork.com/es/por-que-unirse/" },
    whoWeAre: { slug: "quienes-somos", label: "Quiénes Somos", sourceUrl: "https://globalinformationnetwork.com/es/quienes-somos/" },
    memberAgreement: { slug: "acuerdo-de-miembro", label: "Acuerdo de Miembro", sourceUrl: "https://globalinformationnetwork.com/es/acuerdo-de-miembro/" },
    terms: { slug: "terminos-de-uso", label: "Términos de Uso", sourceUrl: "https://globalinformationnetwork.com/es/terminos-de-uso/" },
    privacy: { slug: "politica-de-privacidad", label: "Política de Privacidad", sourceUrl: "https://globalinformationnetwork.com/es/politica-de-privacidad/" },
  },
  hu: {
    whatWeOffer: { slug: "amit-ajanlunk", label: "Amit Ajánlunk", sourceUrl: "https://globalinformationnetwork.com/hu/amit-ajanlunk/" },
    memberBenefits: { slug: "tagi-elonyok", label: "Tagi Előnyök", navigationLabel: "Tagi Előnyök", sourceUrl: "https://globalinformationnetwork.com/hu/tagi-elonyok/" },
    successSystem: { slug: "a-gin-success-system-hu", label: "A GIN Siker Rendszere", navigationLabel: "A GIN Success System", sourceUrl: "https://globalinformationnetwork.com/hu/a-gin-success-system-hu/" },
    events: { slug: "rendezvenyeink", label: "Rendezvényeink", navigationLabel: "GIN Események", sourceUrl: "https://globalinformationnetwork.com/hu/rendezvenyeink/" },
    training: { slug: "kepzesunk", label: "Képzésünk", navigationLabel: "GIN Képzés", sourceUrl: "https://globalinformationnetwork.com/hu/kepzesunk/" },
    membershipLevels: { slug: "tagsagi-szintek", label: "Tagsági Szintek", sourceUrl: "https://globalinformationnetwork.com/hu/tagsagi-szintek/" },
    faq: { slug: "faq-hungarian", label: "Gyakori Kérdések", navigationLabel: "GYIK", sourceUrl: "https://globalinformationnetwork.com/hu/faq-hungarian/" },
    hotels: { slug: "gin-hotel-collection-hu", label: "GIN Hotel Collection", navigationLabel: "GIN Hotel Collection", sourceUrl: "https://globalinformationnetwork.com/hu/gin-hotel-collection-hu/" },
    clubhouses: { slug: "klubhazak-es-kunyhok", label: "Klubházak és Kunyhók", sourceUrl: "https://globalinformationnetwork.com/hu/klubhazak-es-kunyhok/" },
    clubVision: { slug: "a-club-vision", label: "A Club Vision", navigationLabel: "A Club Vision", sourceUrl: "https://globalinformationnetwork.com/hu/a-club-vision/" },
    cruise: { slug: "a-gin-cruise-ship-hu", label: "A GIN Cruise Ship", navigationLabel: "A GIN Tengerjáró Hajó", sourceUrl: "https://globalinformationnetwork.com/hu/a-gin-cruise-ship-hu/" },
    whyJoin: { slug: "miert-csatlakozzon", label: "Miért Csatlakozzon", sourceUrl: "https://globalinformationnetwork.com/hu/miert-csatlakozzon/" },
    whoWeAre: { slug: "kik-vagyunk", label: "Kik Vagyunk", sourceUrl: "https://globalinformationnetwork.com/hu/kik-vagyunk/" },
    memberAgreement: { slug: "tagsagi-megallapodas", label: "Tagsági Megállapodás", sourceUrl: "https://globalinformationnetwork.com/hu/tagsagi-megallapodas/" },
    terms: { slug: "felhasznalasi-feltetelek", label: "Felhasználási Feltételek", sourceUrl: "https://globalinformationnetwork.com/hu/felhasznalasi-feltetelek/" },
    privacy: { slug: "adatvedelmi-iranyelvek", label: "Adatvédelmi Irányelvek", sourceUrl: "https://globalinformationnetwork.com/hu/adatvedelmi-iranyelvek/" },
  },
  sq: {
    whatWeOffer: { slug: "cfare-ofrojme", label: "Çfarë Ofrojmë", sourceUrl: "https://globalinformationnetwork.com/sq/cfare-ofrojme/" },
    memberBenefits: { slug: "perfitimet-e-anetarit", label: "Përfitimet e Anëtarit", navigationLabel: "Përfitimet e Anëtarit", sourceUrl: "https://globalinformationnetwork.com/sq/perfitimet-e-anetarit/" },
    successSystem: { slug: "sistemi-i-suksesit-gin", label: "Sistemi i Suksesit GIN", navigationLabel: "Sistemi i Suksesit GIN", sourceUrl: "https://globalinformationnetwork.com/sq/sistemi-i-suksesit-gin/" },
    events: { slug: "ngjarjet-tona", label: "Ngjarjet Tona", navigationLabel: "Ngjarjet GIN", sourceUrl: "https://globalinformationnetwork.com/sq/ngjarjet-tona/" },
    training: { slug: "trajnimi-yne", label: "Trajnimi Ynë", navigationLabel: "Trajnim GIN", sourceUrl: "https://globalinformationnetwork.com/sq/trajnimi-yne/" },
    membershipLevels: { slug: "nivelet-e-anetaresimit", label: "Nivelet e Anëtarësimit", sourceUrl: "https://globalinformationnetwork.com/sq/nivelet-e-anetaresimit/" },
    faq: { slug: "faq-shqip", label: "Pyetje të Shpeshta", navigationLabel: "FAQ", sourceUrl: "https://globalinformationnetwork.com/sq/faq-shqip/" },
    hotels: { slug: "koleksioni-gin-hotel", label: "Koleksioni i Hoteleve GIN", navigationLabel: "Koleksioni GIN Hotel", sourceUrl: "https://globalinformationnetwork.com/sq/koleksioni-gin-hotel/" },
    clubhouses: { slug: "klube-dhe-shtepiza", label: "Klube dhe Shtëpiza", sourceUrl: "https://globalinformationnetwork.com/sq/klube-dhe-shtepiza/" },
    clubVision: { slug: "vizioni-i-klubit", label: "Vizioni i Klubit", navigationLabel: "Vizioni i Klubit", sourceUrl: "https://globalinformationnetwork.com/sq/vizioni-i-klubit/" },
    cruise: { slug: "anija-e-lundrimit-gin", label: "Anija e Lundrimit GIN", navigationLabel: "Anija e Lundrimit GIN", sourceUrl: "https://globalinformationnetwork.com/sq/anija-e-lundrimit-gin/" },
    whyJoin: { slug: "pse-duhet-te-konsideroni-aplikimin-per-anetaresim", label: "Pse të Bashkoheni", sourceUrl: "https://globalinformationnetwork.com/sq/pse-duhet-te-konsideroni-aplikimin-per-anetaresim/" },
    whoWeAre: { slug: "kush-jemi", label: "Kush Jemi", sourceUrl: "https://globalinformationnetwork.com/sq/kush-jemi/" },
    memberAgreement: { slug: "marreveshja-e-anetarit", label: "Marrëveshja e Anëtarit", sourceUrl: "https://globalinformationnetwork.com/sq/marreveshja-e-anetarit/" },
    terms: { slug: "kushtet-e-perdorimit", label: "Kushtet e Përdorimit", sourceUrl: "https://globalinformationnetwork.com/sq/kushtet-e-perdorimit/" },
    privacy: { slug: "politika-e-privatesise", label: "Politika e Privatësisë", sourceUrl: "https://globalinformationnetwork.com/sq/politika-e-privatesise/" },
  },
  pt: {
    whatWeOffer: { slug: "o-que-oferecemos", label: "O Que Oferecemos", sourceUrl: "https://globalinformationnetwork.com/pt/o-que-oferecemos/" },
    memberBenefits: { slug: "beneficios-para-membros", label: "Benefícios para Membros", navigationLabel: "Benefícios para Membros", sourceUrl: "https://globalinformationnetwork.com/pt/beneficios-para-membros/" },
    successSystem: { slug: "o-sistema-de-sucesso-gin", label: "O Sistema de Sucesso GIN", navigationLabel: "O Sistema de Sucesso GIN", sourceUrl: "https://globalinformationnetwork.com/pt/o-sistema-de-sucesso-gin/" },
    events: { slug: "nossos-eventos", label: "Nossos Eventos", navigationLabel: "Eventos GIN", sourceUrl: "https://globalinformationnetwork.com/pt/nossos-eventos/" },
    training: { slug: "nosso-treinamento", label: "Nosso Treinamento", navigationLabel: "Treinamento GIN", sourceUrl: "https://globalinformationnetwork.com/pt/nosso-treinamento/" },
    membershipLevels: { slug: "niveis-de-adesao", label: "Níveis de Adesão", sourceUrl: "https://globalinformationnetwork.com/pt/niveis-de-adesao/" },
    faq: { slug: "faq-portuguese", label: "Perguntas Frequentes", navigationLabel: "FAQ", sourceUrl: "https://globalinformationnetwork.com/pt/faq-portuguese/" },
    hotels: { slug: "colecao-gin-hotel", label: "Coleção GIN Hotel", navigationLabel: "Coleção GIN Hotel", sourceUrl: "https://globalinformationnetwork.com/pt/colecao-gin-hotel/" },
    clubhouses: { slug: "clubhouses-e-lodges", label: "Clubhouses e Lodges", sourceUrl: "https://globalinformationnetwork.com/pt/clubhouses-e-lodges/" },
    clubVision: { slug: "a-visao-do-clube", label: "A Visão do Clube", navigationLabel: "A Visão do Clube", sourceUrl: "https://globalinformationnetwork.com/pt/a-visao-do-clube/" },
    cruise: { slug: "o-navio-de-cruzeiro-gin", label: "O Navio de Cruzeiro GIN", navigationLabel: "O Navio de Cruzeiro GIN", sourceUrl: "https://globalinformationnetwork.com/pt/o-navio-de-cruzeiro-gin/" },
    whyJoin: { slug: "porque-aderir", label: "Porquê Aderir", sourceUrl: "https://globalinformationnetwork.com/pt/porque-aderir/" },
    whoWeAre: { slug: "quem-nos-somos", label: "Quem Nós Somos", sourceUrl: "https://globalinformationnetwork.com/pt/quem-nos-somos/" },
    memberAgreement: { slug: "acordo-de-membro", label: "Acordo de Membro", sourceUrl: "https://globalinformationnetwork.com/pt/acordo-de-membro/" },
    terms: { slug: "termos-de-uso", label: "Termos de Uso", sourceUrl: "https://globalinformationnetwork.com/pt/termos-de-uso/" },
    privacy: { slug: "politica-de-privacidade", label: "Política de Privacidade", sourceUrl: "https://globalinformationnetwork.com/pt/politica-de-privacidade/" },
  },
};

export function officialReferencePageForSlug(locale: Exclude<OfficialPublicLocaleCode, "en">, slug: string) {
  return Object.values(officialPublicReferencePages[locale]).find((page) => page.slug === slug) ?? null;
}

export function officialReferencePageKeyForSlug(locale: Exclude<OfficialPublicLocaleCode, "en">, slug: string): OfficialReferencePageKey | null {
  return (Object.entries(officialPublicReferencePages[locale]).find(([, page]) => page.slug === slug)?.[0] as ReferencePageKey | undefined) ?? null;
}

export function officialReferencePageParams(locale: Exclude<OfficialPublicLocaleCode, "en">) {
  return Object.values(officialPublicReferencePages[locale]).map(({ slug }) => ({ slug }));
}

export function officialReferencePageKeyForPath(pathname: string): OfficialReferencePageKey | null {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length !== 2) return null;
  const [locale, slug] = segments;
  if (locale === "en") return (Object.entries(englishReferenceSlugs).find(([, value]) => value === slug)?.[0] as ReferencePageKey | undefined) ?? null;
  if (!(locale in officialPublicReferencePages)) return null;
  return (Object.entries(officialPublicReferencePages[locale as Exclude<OfficialPublicLocaleCode, "en">]).find(([, page]) => page.slug === slug)?.[0] as ReferencePageKey | undefined) ?? null;
}

export function officialReferencePagePath(locale: OfficialPublicLocaleCode, page: OfficialReferencePageKey) {
  if (locale === "en") return englishReferenceSlugs[page] ? `/en/${englishReferenceSlugs[page]}` : "/en";
  return `/${locale}/${officialPublicReferencePages[locale][page].slug}`;
}

export function officialReferencePageAlternates(page: OfficialReferencePageKey): Record<string, string> {
  const englishPath = officialReferencePagePath("en", page);
  return {
    ...(englishReferenceSlugs[page] ? { en: englishPath } : {}),
    de: officialReferencePagePath("de", page),
    fr: officialReferencePagePath("fr", page),
    es: officialReferencePagePath("es", page),
    hu: officialReferencePagePath("hu", page),
    sq: officialReferencePagePath("sq", page),
    pt: officialReferencePagePath("pt", page),
    "x-default": englishPath,
  };
}
