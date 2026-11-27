import type { OfficialPublicLocaleCode } from "./official-public-locales";

export const officialPublicInfoCopy: Record<Exclude<OfficialPublicLocaleCode, "en">, {
  about: { title: string; intro: string; sections: Array<{ title: string; body: string }>; sourceUrl: string; sourceNote: string };
  contact: { title: string; intro: string; action: string; sourceUrl: string; sourceNote: string };
}> = {
  de: {
    about: {
      title: "Über uns",
      intro: "Die offizielle GIN-Seite erklärt, dass das Netzwerk 2003 in Istanbul konzipiert und 2009 offiziell gegründet wurde. Diese Angaben geben die Selbstdarstellung der Organisation wieder.",
      sections: [
        { title: "Wie alles begann", body: "Laut der offiziellen Selbstdarstellung wurde GIN 2003 im Ritz-Carlton-Hotel in Istanbul konzipiert und 2009 offiziell gegründet." },
        { title: "Unser Zweck und das GIN-Credo", body: "Die Organisation beschreibt als Zweck, Mitglieder bei persönlicher Entwicklung und beim Verfolgen ihrer Ziele zu unterstützen. Das veröffentlichte Credo nennt unter anderem Zugang zu Wissen, Glück, Privatsphäre, Meinungsfreiheit und Wohlstand als Leitgedanken." },
        { title: "Einordnung der Aussagen", body: "Historische, politische und gesellschaftliche Behauptungen auf der Originalseite sind Aussagen der Organisation. Diese Zusammenfassung stellt sie nicht als unabhängig bestätigte Tatsachen dar." },
      ],
      sourceUrl: "https://globalinformationnetwork.com/de/ueber-uns/", sourceNote: "Dies ist eine gekürzte Zusammenfassung der offiziellen Selbstdarstellung. Für den vollständigen Originaltext besuchen Sie die offizielle GIN-Seite.",
    },
    contact: { title: "Kontaktieren Uns", intro: "Die offizielle GIN-Seite lädt Besucher ein, Fragen per E-Mail oder Telefon zu stellen und stellt dafür ein Kontaktformular bereit.", action: "Offizielles Kontaktformular öffnen", sourceUrl: "https://globalinformationnetwork.com/de/kontaktieren-uns/", sourceNote: "Das Formular wird von der offiziellen GIN-Website betrieben. Diese Portal-Seite übermittelt keine Kontaktdaten an GIN." },
  },
  fr: {
    about: {
      title: "À Propos de Nous", intro: "Selon le site officiel, le réseau GIN a été conçu à Istanbul en 2003 et officiellement fondé en 2009. Ces dates sont rapportées comme faisant partie de la présentation de l’organisation.",
      sections: [
        { title: "Comment tout a commencé", body: "Selon la présentation officielle, GIN a été conçu en 2003 à l’hôtel Ritz-Carlton d’Istanbul et officiellement fondé en 2009." },
        { title: "Notre but et le credo GIN", body: "L’organisation présente son objectif comme le soutien des membres dans leur développement personnel et la poursuite de leurs objectifs. Le credo publié mentionne notamment l’accès au savoir, le bonheur, la vie privée, la liberté d’expression et la prospérité." },
        { title: "À propos des déclarations du site", body: "Les affirmations historiques, politiques et sociales figurant sur le site original sont attribuées à l’organisation. Ce résumé ne les présente pas comme des faits vérifiés indépendamment." },
      ],
      sourceUrl: "https://globalinformationnetwork.com/fr/a-propos-de-nous/", sourceNote: "Il s’agit d’un résumé de la présentation officielle. Consultez la page officielle de GIN pour lire le texte source complet.",
    },
    contact: { title: "Contactez-Nous", intro: "Le site officiel de GIN invite les visiteurs à poser leurs questions par e-mail ou par téléphone et propose un formulaire de contact.", action: "Ouvrir le formulaire officiel", sourceUrl: "https://globalinformationnetwork.com/fr/nous-contacter/", sourceNote: "Le formulaire est hébergé par le site officiel de GIN. Cette page du portail ne transmet aucune donnée de contact à GIN." },
  },
  es: {
    about: {
      title: "Acerca de Nosotros", intro: "Según el sitio oficial, GIN fue concebida en Estambul en 2003 y fundada oficialmente en 2009. Estas fechas forman parte de la presentación de la propia organización.",
      sections: [
        { title: "Cómo comenzó todo", body: "Según la presentación oficial, GIN fue concebida en 2003 en el hotel Ritz-Carlton de Estambul y fundada oficialmente en 2009." },
        { title: "Nuestro propósito y el credo GIN", body: "La organización presenta su propósito como apoyar a sus miembros en el desarrollo personal y la consecución de sus objetivos. El credo publicado menciona, entre otros principios, el acceso al conocimiento, la felicidad, la privacidad, la libertad de expresión y la prosperidad." },
        { title: "Atribución de las declaraciones", body: "Las afirmaciones históricas, políticas y sociales de la página original se atribuyen a la organización. Este resumen no las presenta como hechos verificados de forma independiente." },
      ],
      sourceUrl: "https://globalinformationnetwork.com/es/acerca-de-nosotros/", sourceNote: "Este es un resumen de la presentación oficial. Consulte la página oficial de GIN para leer el texto original completo.",
    },
    contact: { title: "Contáctanos", intro: "El sitio oficial de GIN invita a los visitantes a enviar preguntas por correo electrónico o teléfono y ofrece un formulario de contacto.", action: "Abrir el formulario oficial", sourceUrl: "https://globalinformationnetwork.com/es/contactanos/", sourceNote: "El formulario está alojado en el sitio oficial de GIN. Esta página del portal no envía datos de contacto a GIN." },
  },
  hu: {
    about: {
      title: "Rólunk", intro: "A hivatalos oldal szerint a GIN ötlete 2003-ban, Isztambulban született, hivatalosan pedig 2009-ben alapították. Ezek az adatok a szervezet saját bemutatásából származnak.",
      sections: [
        { title: "Hogyan kezdődött", body: "A hivatalos bemutató szerint a GIN ötlete 2003-ban, az isztambuli Ritz-Carlton Hotelben született, és 2009-ben alapították hivatalosan." },
        { title: "Célunk és a GIN hitvallása", body: "A szervezet céljaként a tagok személyes fejlődésének és céljaik elérésének támogatását nevezi meg. A közzétett hitvallás többek között a tudáshoz való hozzáférést, a boldogságot, a magánéletet, a szólásszabadságot és a jólétet említi." },
        { title: "A weboldalon szereplő állítások", body: "Az eredeti oldalon szereplő történelmi, politikai és társadalmi állítások a szervezet saját állításai. Ez az összefoglaló nem tünteti fel őket függetlenül igazolt tényként." },
      ],
      sourceUrl: "https://globalinformationnetwork.com/hu/rolunk/", sourceNote: "Ez a hivatalos önbemutatás rövid összefoglalója. A teljes eredeti szövegért keresse fel a GIN hivatalos oldalát.",
    },
    contact: { title: "Lépjen kapcsolatba velünk", intro: "A GIN hivatalos oldala e-mailben vagy telefonon várja a látogatók kérdéseit, és kapcsolatfelvételi űrlapot biztosít.", action: "Hivatalos kapcsolatfelvételi űrlap megnyitása", sourceUrl: "https://globalinformationnetwork.com/hu/lepjen-kapcsolatba-velunk/", sourceNote: "Az űrlapot a GIN hivatalos weboldala üzemelteti. Ez a portáloldal nem továbbít kapcsolatfelvételi adatokat a GIN-nek." },
  },
  sq: {
    about: {
      title: "Rreth nesh", intro: "Sipas faqes zyrtare, GIN u konceptua në Stamboll në vitin 2003 dhe u themelua zyrtarisht në vitin 2009. Këto data janë pjesë e përshkrimit të vetë organizatës.",
      sections: [
        { title: "Si filloi gjithçka", body: "Sipas prezantimit zyrtar, GIN u konceptua në Hotel Ritz-Carlton në Stamboll në vitin 2003 dhe u themelua zyrtarisht në vitin 2009." },
        { title: "Qëllimi ynë dhe kredoja GIN", body: "Organizata e përshkruan qëllimin e saj si mbështetje për anëtarët në zhvillimin personal dhe arritjen e synimeve. Kredoja e publikuar përmend, ndër të tjera, qasjen në dije, lumturinë, privatësinë, lirinë e shprehjes dhe begatinë." },
      { title: "Atribuimi i deklaratave", body: "Deklaratat historike, politike dhe shoqërore në faqen origjinale i atribuohen organizatës. Kjo përmbledhje nuk i paraqet ato si fakte të verifikuara në mënyrë të pavarur." },
      ],
      sourceUrl: "https://globalinformationnetwork.com/sq/rreth-nesh/", sourceNote: "Ky është një përmbledhje e prezantimit zyrtar. Vizitoni faqen zyrtare të GIN për tekstin e plotë origjinal.",
    },
    contact: { title: "Na kontaktoni", intro: "Faqja zyrtare e GIN fton vizitorët të dërgojnë pyetje me email ose telefon dhe ofron një formular kontakti.", action: "Hap formularin zyrtar të kontaktit", sourceUrl: "https://globalinformationnetwork.com/sq/na-kontakt/", sourceNote: "Formulari mbahet në faqen zyrtare të GIN. Kjo faqe e portalit nuk dërgon të dhëna kontakti te GIN." },
  },
  pt: {
    about: {
      title: "Quem Somos", intro: "Segundo o site oficial, a GIN foi concebida em Istambul em 2003 e fundada oficialmente em 2009. Estas datas fazem parte da apresentação da própria organização.",
      sections: [
        { title: "Como tudo começou", body: "Segundo a apresentação oficial, a GIN foi concebida em 2003 no Hotel Ritz-Carlton, em Istambul, e fundada oficialmente em 2009." },
        { title: "O nosso propósito e o credo GIN", body: "A organização apresenta como propósito apoiar os membros no desenvolvimento pessoal e na concretização dos seus objetivos. O credo publicado menciona, entre outros princípios, o acesso ao conhecimento, a felicidade, a privacidade, a liberdade de expressão e a prosperidade." },
        { title: "Atribuição das declarações", body: "As afirmações históricas, políticas e sociais presentes na página original são atribuídas à organização. Este resumo não as apresenta como factos verificados de forma independente." },
      ],
      sourceUrl: "https://globalinformationnetwork.com/pt/quem-somos/", sourceNote: "Este é um resumo da apresentação oficial. Consulte a página oficial da GIN para ler o texto original completo.",
    },
    contact: { title: "Fale Conosco", intro: "O site oficial da GIN convida os visitantes a enviar perguntas por e-mail ou telefone e disponibiliza um formulário de contacto.", action: "Abrir o formulário oficial", sourceUrl: "https://globalinformationnetwork.com/pt/fale-conosco/", sourceNote: "O formulário é alojado no site oficial da GIN. Esta página do portal não envia dados de contacto para a GIN." },
  },
};

export function getOfficialInfoCopy(locale: OfficialPublicLocaleCode, page: "about" | "contact") {
  if (locale === "en") return null;
  return officialPublicInfoCopy[locale][page];
}
