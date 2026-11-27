export type OfficialPublicLocaleCode = "en" | "de" | "fr" | "es" | "hu" | "sq" | "pt";

export type OfficialPublicHomeCopy = {
  welcome: string;
  introTitle: string;
  intro: string;
  pillars: [string, string, string];
  join: string;
  questions: string;
  speak: string;
  book: string;
  stories: string;
  memberIntro: string;
  sections: { title: string; body: string; items?: string[] }[];
};

export const officialPublicLocales: Record<OfficialPublicLocaleCode, {
  label: string;
  navigation: { home: string; about: string; contact: string; login: string; join: string; menu: string; sidebarAbout: string; sidebarJoin: string; aboutHref: string; loginHref: string; sidebarJoinHref: string; primaryOrder: OfficialPublicPrimaryNavigationKey[] };
  homePath: string;
  sourceHomeUrl: string;
  aboutPath: string;
  contactPath: string;
  htmlLang: string;
  copy: OfficialPublicHomeCopy;
}> = {
  en: {
    label: "English", navigation: { home: "Home", about: "About Us", contact: "Contact Us", login: "Login", join: "Become A Member", menu: "Menu", sidebarAbout: "Who We Are", sidebarJoin: "Become a Member", aboutHref: "/en/about-us", loginHref: "https://globalinformationnetwork.com/member-home/", sidebarJoinHref: "https://signup.globalinformationnetwork.com/", primaryOrder: ["home", "join", "about", "contact", "login"] }, homePath: "/en", sourceHomeUrl: "https://globalinformationnetwork.com/",
    aboutPath: "/en/about-us", contactPath: "/en/contact-us", htmlLang: "en",
    copy: {
      welcome: "Welcome To The Global Information Network", introTitle: "The Global Information Network (GIN)",
      intro: "is a private, exclusive, “Members Only” worldwide association of individuals dedicated to achieving success in the key areas of life including:",
      pillars: ["Financial Independence and Wealth Creation", "Dynamic Vibrant Health & Longevity", "Emotional Well-being and Inner Joy"],
      join: "Become a Member Today", questions: "Have questions?", speak: "Speak with an active high-level Member", book: "Book a Call",
      stories: "Members Share Their Success Stories",
      memberIntro: "The GIN Membership includes individuals who strongly desire to improve the quality of their life and standard of living, attain higher states of consciousness, as well as experience inner peace, joy and bliss.",
      sections: [],
    },
  },
  de: {
    label: "Deutsch", navigation: { home: "Startseite", about: "Über uns", contact: "Kontaktieren Sie uns", login: "Mitglieder-Login", join: "Mitglied werden", menu: "Menü", sidebarAbout: "Über uns", sidebarJoin: "Mitglied werden", aboutHref: "/de/wer-wir-sind", loginHref: "https://globalinformationnetwork.com/de/mitgliederbereich/", sidebarJoinHref: "https://signup.globalinformationnetwork.com/", primaryOrder: ["home", "about", "contact", "join", "login"] }, homePath: "/de/home-public", sourceHomeUrl: "https://globalinformationnetwork.com/de/home-public/",
    aboutPath: "/de/ueber-uns", contactPath: "/de/kontaktieren-uns", htmlLang: "de",
    copy: {
      welcome: "Willkommen im globalen Informationsnetzwerk", introTitle: "Das Globale Informationsnetzwerk (GIN)",
      intro: "ist eine private, exklusive weltweite Vereinigung von Einzelpersonen, die sich dem Ziel verschrieben haben, Erfolg in den Schlüsselbereichen des Lebens, darunter:",
      pillars: ["Finanzielle Unabhängigkeit und Vermögensaufbau", "Dynamische, lebendige Gesundheit und Langlebigkeit", "Emotionales Wohlbefinden und innere Freude"],
      join: "Werden Sie noch heute Mitglied", questions: "Haben Sie Fragen?", speak: "Sprechen Sie mit einem aktiven hochrangigen Mitglied", book: "Termin buchen",
      stories: "Mitglieder teilen ihre Erfolgsgeschichten",
      memberIntro: "Die GIN-Mitgliedschaft umfasst Personen, die den starken Wunsch haben, ihre Lebensqualität und ihren Lebensstandard zu verbessern, höhere Bewusstseinszustände zu erreichen sowie inneren Frieden, Freude und Glückseligkeit zu erfahren.",
      sections: [
        { title: "Ein weltweites Netzwerk gegenseitiger Unterstützung", body: "GIN beschreibt sich als private, nur Mitgliedern zugängliche Gemeinschaft. Mitglieder tauschen Wissen und Erfahrungen aus, knüpfen Kontakte und unterstützen sich durch Mentoring bei persönlichen und beruflichen Zielen. Die Mitgliederliste ist vertraulich." },
        { title: "Exklusive Weiterbildung für Mitglieder", body: "Die offizielle Homepage nennt Lernangebote zu persönlichen, finanziellen und gesundheitlichen Themen, darunter:", items: ["Vermögensaufbau und Investitionen", "Immobilien und Finanzmärkte", "Vermögensschutz und Offshore-Banking", "Natürliche Gesundheit und Wohlbefinden", "Glück, innerer Frieden und emotionales Wohlbefinden", "Persönliche Entwicklung und spirituelle Freiheit", "Bewusstsein und mentale Leistungsfähigkeit"] },
        { title: "Eine internationale Gemeinschaft", body: "GIN zufolge wurde das Netzwerk 2003 in Istanbul, Türkei, konzipiert und 2009 offiziell gegründet. Die Organisation gibt an, Mitglieder in mehr als 160 Ländern zu haben." },
        { title: "Gesundheit, Wohlstand und Glück", body: "Die offizielle Homepage ordnet zentrale Lebensziele den Bereichen Gesundheit, Wohlstand und Glück zu. Diese Themen dienen als Orientierung für die individuellen Ziele der Mitglieder; Ergebnisse werden nicht garantiert." },
        { title: "Lernen und Gemeinschaft", body: "Die Homepage hebt persönliche Treffen, virtuelle Seminare, lokale Chapter-Treffen, Online-Lernangebote und Erfahrungsberichte von Mitgliedern hervor." },
        { title: "Audiokurse, Webinare und Mitgliederbibliothek", body: "GIN beschreibt maßgeschneiderte Audiolektionen, Kurse und Webinare sowie ein seit 2009 aufgebautes Archiv mit Tausenden Stunden Audio- und Videomaterial zu Gesundheit, Wohlbefinden, Vermögensaufbau, Glück und Beziehungen. Die Mitgliederbibliothek umfasst außerdem Bücher, Lernmaterialien und Online-Mentoring." },
        { title: "Veranstaltungen im Jahresverlauf", body: "Laut offizieller Homepage veranstaltet GIN jedes Jahr vier große Wochenendveranstaltungen an wechselnden internationalen Orten. Viermal jährlich finden virtuelle Seminare und Auszeichnungsrallyes statt; lokale Chapter organisieren monatliche persönliche oder virtuelle Treffen." },
        { title: "Mitgliedschaft und Level I", body: "Die offizielle Homepage nennt für Level I eine einmalige Aufnahmegebühr von 1.500 US-Dollar sowie monatliche Beiträge von 150 US-Dollar und weist auf eine geplante Preiserhöhung zum 1. Januar 2027 hin. Bewerber müssen zunächst Level I beantragen; nicht alle Anträge werden angenommen. Bitte bestätigen Sie aktuelle Preise, Verfügbarkeit und Bedingungen direkt beim offiziellen Antragsdienst." },
        { title: "Geplante fünftägige Kreuzfahrt 2028", body: "Die offizielle Homepage lädt neue Mitglieder zu einer geplanten fünftägigen Kreuzfahrt im Jahr 2028 ein und beschreibt das Vorhaben als vollständige Charter eines Schiffs für Clubmitglieder. Schiff, Termine, Preise, Teilnahmebedingungen und Verfügbarkeit müssen anhand der später veröffentlichten offiziellen Veranstaltungsinformationen bestätigt werden." },
        { title: "Mentoring, Beziehungen und vertrauliche Mitgliedschaft", body: "GIN beschreibt eine private Mitgliedergemeinschaft, in der Menschen Wissen, Kontakte und Erfahrungen austauschen und sich gegenseitig bei persönlichen und beruflichen Zielen unterstützen. Die Homepage bezeichnet die Mitgliederliste als vertraulich und stellt Mentoring sowie gegenseitige Unterstützung als zentrale Bestandteile der Gemeinschaft dar." },
        { title: "Bücher, Audiokurse und persönliche Entwicklung", body: "Die Homepage verweist auf James Allens Buch As a Man Thinketh, das Audioangebot Your Wish Is Your Command sowie auf die von GIN dargestellte Erfolgsgeschichte von Andrew Carnegie und Napoleon Hill und das Mastermind-Prinzip. Als Lernangebote nennt GIN außerdem Success Mastery und Science of Personal Mastery. Diese Titel und Erzählungen werden als Inhalte des offiziellen Programms wiedergegeben." },
        { title: "GIN Adventures und gemeinsame Erlebnisse", body: "GIN beschreibt GIN Adventures als gemeinschaftliche Reisen zu internationalen Reisezielen und nennt außerdem lokale Aktivitäten wie Essen, Wandern, Rafting und Skiausflüge. Konkrete Reisen, Termine, Teilnahmeberechtigung, Kosten und Verfügbarkeit sind jeweils anhand der offiziellen Veranstaltungsinformationen zu prüfen." },
        { title: "Auf der offiziellen Homepage genannte Dozenten", body: "Die Homepage nennt Dr. Tom Morter und Dr. Ted Morter im Zusammenhang mit Gesundheit und Wohlbefinden sowie John Gray, Autor von Men Are from Mars, Women Are from Venus, im Zusammenhang mit Beziehungen. Diese Namen und Zuordnungen geben die veröffentlichte Darstellung von GIN wieder und stellen keine unabhängige Bewertung ihrer Aussagen oder Angebote dar." },
      ],
    },
  },
  fr: {
    label: "Français", navigation: { home: "Accueil", about: "À propos de nous", contact: "Nous contacter", login: "Connexion", join: "Devenir membre", menu: "Menu", sidebarAbout: "À propos de nous", sidebarJoin: "Devenir membre", aboutHref: "/fr/qui-sommes-nous", loginHref: "https://globalinformationnetwork.com/fr/accueil-des-membres/", sidebarJoinHref: "https://signup.globalinformationnetwork.com/", primaryOrder: ["home", "about", "join", "contact", "login"] }, homePath: "/fr/home-public", sourceHomeUrl: "https://globalinformationnetwork.com/fr/home-public/",
    aboutPath: "/fr/a-propos-de-nous", contactPath: "/fr/nous-contacter", htmlLang: "fr",
    copy: {
      welcome: "Bienvenue sur le réseau mondial d’information", introTitle: "Le réseau mondial d’information (GIN)",
      intro: "est une association mondiale privée, exclusive et réservée aux membres, composée d’individus qui se consacrent à la réussite dans les domaines clés de la vie, notamment :",
      pillars: ["Indépendance financière et création de richesse", "Santé et longévité dynamiques et vibrantes", "Bien-être émotionnel et joie intérieure"],
      join: "Devenez membre aujourd’hui", questions: "Vous avez des questions ?", speak: "Parlez avec un membre actif de haut niveau", book: "Réserver un appel",
      stories: "Les membres partagent leurs réussites",
      memberIntro: "Les membres du GIN sont des personnes qui souhaitent vivement améliorer leur qualité de vie et leur niveau de vie, atteindre des états de conscience supérieurs et faire l’expérience de la paix intérieure, de la joie et de la félicité.",
      sections: [
        { title: "Un réseau mondial fondé sur l’entraide", body: "GIN se présente comme une communauté privée réservée aux membres. Les membres échangent connaissances et expériences, créent des liens et se soutiennent par le mentorat dans leurs objectifs personnels et professionnels. La liste des membres est confidentielle." },
        { title: "Formation réservée aux membres", body: "La page officielle présente des sujets de formation personnels, financiers et liés au bien-être, notamment :", items: ["Création de richesse et investissement", "Immobilier et marchés financiers", "Protection des actifs et services bancaires offshore", "Santé naturelle et bien-être", "Bonheur, paix intérieure et équilibre émotionnel", "Maîtrise de soi et développement spirituel", "Conscience et capacités mentales"] },
        { title: "Une communauté internationale", body: "Selon GIN, le réseau a été conçu à Istanbul, en Turquie, en 2003, puis officiellement fondé en 2009. L’organisation indique compter des membres dans plus de 160 pays." },
        { title: "Santé, richesse et bonheur", body: "La page d’accueil officielle présente ces trois domaines comme de grandes aspirations de vie. Ils constituent un cadre de réflexion pour les objectifs propres à chaque membre, sans garantie de résultat." },
        { title: "Apprentissage et rencontres", body: "Le site met en avant des rencontres en personne, des séminaires virtuels, des réunions de chapitres locaux, des ressources d’apprentissage en ligne et des témoignages de membres." },
        { title: "Cours audio, webinaires et bibliothèque des membres", body: "Le GIN décrit des leçons audio personnalisées, des cours et des webinaires, ainsi qu’une archive constituée depuis 2009 et comprenant des milliers d’heures de contenus audio et vidéo sur la santé, le bien-être, la création de richesse, le bonheur et les relations. La bibliothèque des membres comprend également des livres, des ressources pédagogiques et du mentorat en ligne." },
        { title: "Événements tout au long de l’année", body: "Selon la page officielle, le GIN organise chaque année quatre grands événements de week-end dans différents lieux à travers le monde. Quatre séminaires virtuels et rassemblements de remise de prix ont lieu chaque année, tandis que les chapitres locaux proposent des rencontres mensuelles en personne ou virtuelles." },
        { title: "Adhésion et niveau I", body: "La page officielle indique pour le niveau I des frais d’adhésion uniques de 1 500 USD et des cotisations mensuelles de 150 USD, et annonce une hausse de prix prévue le 1er janvier 2027. Les candidats doivent d’abord demander le niveau I ; toutes les demandes ne sont pas acceptées. Vérifiez les tarifs, la disponibilité et les conditions en vigueur auprès du service officiel de candidature." },
        { title: "Projet de croisière de cinq nuits en 2028", body: "La page officielle invite les nouveaux membres à une croisière de cinq nuits envisagée pour 2028 et présente le projet comme l’affrètement d’un navire entier pour les membres du club. Le navire, les dates, les tarifs, les conditions de participation et la disponibilité devront être confirmés dans les informations officielles de l’événement." },
        { title: "Mentorat, relations et adhésion confidentielle", body: "Le GIN décrit une communauté privée dont les membres partagent leurs connaissances, leurs contacts et leurs expériences, et s’entraident dans leurs objectifs personnels et professionnels. La page officielle indique que la liste des membres est confidentielle et présente le mentorat et le soutien mutuel comme des éléments centraux de la communauté." },
        { title: "Livres, cours audio et développement personnel", body: "La page d’accueil fait référence au livre As a Man Thinketh de James Allen, au programme audio Your Wish Is Your Command, ainsi qu’au récit présenté par le GIN sur Andrew Carnegie, Napoleon Hill et le principe du mastermind. Le GIN cite également Success Mastery et Science of Personal Mastery parmi ses programmes d’apprentissage. Ces titres et récits sont reproduits comme des éléments du programme officiel." },
        { title: "GIN Adventures et expériences partagées", body: "Le GIN présente GIN Adventures comme des voyages en groupe vers des destinations internationales et mentionne aussi des activités locales telles que des repas, des randonnées, du rafting et des sorties au ski. Les voyages précis, les dates, les critères de participation, les coûts et la disponibilité doivent être vérifiés dans les informations officielles des événements." },
        { title: "Intervenants cités sur la page officielle", body: "La page d’accueil cite le Dr Tom Morter et le Dr Ted Morter pour les sujets de santé et de bien-être, ainsi que John Gray, auteur de Men Are from Mars, Women Are from Venus, pour les relations. Ces noms et associations reprennent la présentation publiée par le GIN et ne constituent pas une évaluation indépendante de leurs affirmations ou services." },
      ],
    },
  },
  es: {
    label: "Español", navigation: { home: "Inicio Público", about: "Quienes somos", contact: "Contáctanos", login: "Mi Cuenta", join: "Hágase Miembro", menu: "Menú", sidebarAbout: "Acerca de Nosotros", sidebarJoin: "Hágase Miembro", aboutHref: "/es/quienes-somos", loginHref: "https://globalinformationnetwork.com/es/bienvenidos/", sidebarJoinHref: "https://signup.globalinformationnetwork.com/", primaryOrder: ["home", "join", "about", "login", "contact"] }, homePath: "/es/home-public-spanish", sourceHomeUrl: "https://globalinformationnetwork.com/es/home-public-spanish/",
    aboutPath: "/es/acerca-de-nosotros", contactPath: "/es/contactanos", htmlLang: "es",
    copy: {
      welcome: "Bienvenido a la Red Mundial de Información", introTitle: "La Red Mundial de Información (GIN)",
      intro: "es una asociación mundial privada, exclusiva y «solo para miembros» de personas dedicadas a lograr el éxito en las áreas clave de la vida, que incluyen:",
      pillars: ["Independencia financiera y creación de riqueza", "Salud y longevidad dinámicas y vibrantes", "Bienestar emocional y alegría interior"],
      join: "Conviértase en miembro hoy", questions: "¿Tiene preguntas?", speak: "Hable con un miembro activo de alto nivel", book: "Reservar una llamada",
      stories: "Los miembros comparten sus historias de éxito",
      memberIntro: "La membresía de GIN incluye a personas que desean fervientemente mejorar su calidad de vida y su nivel de vida, alcanzar estados superiores de conciencia y experimentar paz interior, alegría y dicha.",
      sections: [
        { title: "Una red mundial basada en el apoyo mutuo", body: "GIN se presenta como una comunidad privada y exclusiva para miembros. Sus miembros comparten conocimientos y experiencia, crean conexiones y se apoyan mediante mentoría para avanzar en sus objetivos personales y profesionales. La lista de miembros es confidencial." },
        { title: "Formación exclusiva para miembros", body: "La página oficial presenta formación sobre temas personales, financieros y de bienestar, como:", items: ["Creación de riqueza e inversión", "Bienes raíces y mercados financieros", "Protección de activos y banca internacional", "Salud natural y bienestar", "Felicidad, paz interior y bienestar emocional", "Desarrollo personal y libertad espiritual", "Conciencia y capacidad mental"] },
        { title: "Una comunidad internacional", body: "Según GIN, la red se concibió en Estambul (Turquía) en 2003 y se fundó oficialmente en 2009. La organización afirma contar con miembros en más de 160 países." },
        { title: "Salud, riqueza y felicidad", body: "La página oficial agrupa las aspiraciones vitales en tres ámbitos: salud, riqueza y felicidad. Se presentan como un marco para los objetivos individuales, no como resultados garantizados." },
        { title: "Aprendizaje y comunidad", body: "El sitio destaca encuentros presenciales, seminarios virtuales, reuniones de capítulos locales, recursos de aprendizaje en línea y testimonios de miembros." },
        { title: "Cursos de audio, seminarios web y biblioteca para miembros", body: "GIN describe lecciones de audio personalizadas, cursos y seminarios web, además de un archivo creado desde 2009 con miles de horas de audio y vídeo sobre salud, bienestar, creación de riqueza, felicidad y relaciones. La biblioteca para miembros también incluye libros, materiales educativos y mentoría en línea." },
        { title: "Eventos durante todo el año", body: "Según la página oficial, GIN organiza cuatro grandes eventos de fin de semana cada año en distintos destinos internacionales. También celebra cuatro seminarios virtuales y encuentros de premios al año, mientras que los capítulos locales organizan reuniones mensuales presenciales o virtuales." },
        { title: "Membresía y Nivel I", body: "La página oficial indica para el Nivel I una cuota de inscripción única de 1.500 USD y cuotas mensuales de 150 USD, y anuncia un aumento de precios previsto para el 1 de enero de 2027. Primero se debe solicitar el Nivel I y no se aceptan todas las solicitudes. Confirme los precios, la disponibilidad y las condiciones vigentes directamente con el servicio oficial de solicitudes." },
        { title: "Proyecto de crucero de cinco noches en 2028", body: "La página oficial invita a los nuevos miembros a un crucero previsto de cinco noches en 2028 y describe el proyecto como el uso exclusivo de un barco completo para miembros del club. El barco, las fechas, los precios, los requisitos de participación y la disponibilidad deberán confirmarse en la información oficial del evento." },
        { title: "Mentoría, relaciones y membresía confidencial", body: "GIN describe una comunidad privada cuyos miembros comparten conocimientos, contactos y experiencias, y se apoyan mutuamente en sus objetivos personales y profesionales. La página oficial indica que la lista de miembros es confidencial y presenta la mentoría y el apoyo mutuo como elementos centrales de la comunidad." },
        { title: "Libros, cursos de audio y desarrollo personal", body: "La página de inicio hace referencia al libro As a Man Thinketh de James Allen, al programa de audio Your Wish Is Your Command y al relato que GIN presenta sobre Andrew Carnegie, Napoleon Hill y el principio del mastermind. GIN también menciona Success Mastery y Science of Personal Mastery como programas de aprendizaje. Estos títulos y relatos se reproducen como contenidos del programa oficial." },
        { title: "GIN Adventures y experiencias compartidas", body: "GIN describe GIN Adventures como viajes en grupo a destinos internacionales y también menciona actividades locales como comidas, senderismo, rafting y excursiones de esquí. Los viajes concretos, las fechas, los requisitos de participación, los costes y la disponibilidad deben comprobarse en la información oficial de los eventos." },
        { title: "Formadores mencionados en la página oficial", body: "La página de inicio menciona al Dr. Tom Morter y al Dr. Ted Morter en relación con la salud y el bienestar, y a John Gray, autor de Men Are from Mars, Women Are from Venus, en relación con las relaciones. Estos nombres y asociaciones reproducen la presentación publicada por GIN y no constituyen una evaluación independiente de sus afirmaciones o servicios." },
      ],
    },
  },
  hu: {
    label: "Magyar", navigation: { home: "Kezdőlap", about: "Rólunk", contact: "Kapcsolat", login: "Bejelentkezés", join: "Legyen tag", menu: "Menü", sidebarAbout: "Rólunk", sidebarJoin: "Legyen tag", aboutHref: "/hu/kik-vagyunk", loginHref: "https://globalinformationnetwork.com/hu/tag-home/", sidebarJoinHref: "https://signup.globalinformationnetwork.com/", primaryOrder: ["home", "about", "join", "login", "contact"] }, homePath: "/hu/home-public", sourceHomeUrl: "https://globalinformationnetwork.com/hu/home-public/",
    aboutPath: "/hu/rolunk", contactPath: "/hu/lepjen-kapcsolatba-velunk", htmlLang: "hu",
    copy: {
      welcome: "Üdvözöljük a Globális Információs Hálózatban", introTitle: "A globális információs hálózat (GIN)",
      intro: "egy privát, exkluzív, kizárólag tagoknak szóló, világméretű szervezet, amelynek tagjai az élet kulcsfontosságú területein – többek között – a siker elérésére törekednek:",
      pillars: ["Pénzügyi függetlenség és vagyonteremtés", "Dinamikus, élénk egészség és hosszú élettartam", "Érzelmi jólét és belső öröm"],
      join: "Legyen Ön is tag még ma", questions: "Van kérdése?", speak: "Beszéljen egy aktív, magas szintű taggal", book: "Időpontfoglalás",
      stories: "A tagok megosztják sikertörténeteiket",
      memberIntro: "A GIN tagság olyan személyeket foglal magában, akik erősen vágynak életminőségük és életszínvonaluk javítására, magasabb tudatállapotok elérésére, valamint belső béke, öröm és boldogság megtapasztalására.",
      sections: [
        { title: "Kölcsönös támogatásra épülő globális hálózat", body: "A GIN saját bemutatása szerint zárt, kizárólag tagok számára elérhető közösség. A tagok tudást és tapasztalatot osztanak meg, kapcsolatokat építenek, és mentorálással támogatják egymást személyes és szakmai céljaikban. A tagsági névsor bizalmas." },
        { title: "Kizárólag tagoknak szóló képzések", body: "A hivatalos honlap személyes, pénzügyi és jólléti témákat sorol fel, többek között:", items: ["Vagyonteremtés és befektetések", "Ingatlan és pénzügyi piacok", "Vagyonvédelem és offshore bankolás", "Természetes egészségmegőrzés és jóllét", "Boldogság, belső béke és érzelmi jóllét", "Személyes fejlődés és spirituális szabadság", "Tudatosság és mentális képességek"] },
        { title: "Nemzetközi közösség", body: "A GIN közlése szerint a hálózatot 2003-ban Isztambulban, Törökországban álmodták meg, hivatalosan pedig 2009-ben alapították. A szervezet több mint 160 országban élő tagokról számol be." },
        { title: "Egészség, gazdagság és boldogság", body: "A hivatalos bemutatkozás ezt a három területet emeli ki az élet fontos törekvései közül. Ezek a tagok egyéni céljainak keretét adják, nem garantált eredményeket." },
        { title: "Tanulás és közösségi programok", body: "A honlap személyes találkozókat, online szemináriumokat, helyi csoporttalálkozókat, digitális tananyagokat és tagi történeteket mutat be." },
        { title: "Hanganyagok, tanfolyamok és tagi könyvtár", body: "A GIN személyre szabott hanganyagokat, tanfolyamokat és webináriumokat mutat be, valamint egy 2009 óta épülő archívumot, amely több ezer órányi, egészségről, jóllétről, vagyonteremtésről, boldogságról és kapcsolatokról szóló hang- és videóanyagot tartalmaz. A tagi könyvtár könyveket, oktatási anyagokat és online mentorálást is kínál." },
        { title: "Rendezvények az év folyamán", body: "A hivatalos honlap szerint a GIN évente négy nagy hétvégi rendezvényt tart különböző nemzetközi helyszíneken. Évente négy virtuális szemináriumot és díjátadó találkozót is szervez, a helyi csoportok pedig havonta tartanak személyes vagy online összejöveteleket." },
        { title: "Tagság és I. szint", body: "A hivatalos honlap az I. szinthez egyszeri 1500 USD belépési díjat és havi 150 USD tagdíjat tüntet fel, továbbá 2027. január 1-jére tervezett áremelést jelez. A jelentkezőknek először az I. szintre kell jelentkezniük; nem minden kérelmet fogadnak el. Az aktuális árakat, elérhetőséget és feltételeket közvetlenül a hivatalos jelentkezési szolgáltatónál ellenőrizze." },
        { title: "Tervezett ötéjszakás hajóút 2028-ban", body: "A hivatalos honlap egy 2028-ra tervezett, ötéjszakás hajóútra hívja az új tagokat, és a tervet egy teljes hajó klubtagok számára történő bérléseként mutatja be. A hajót, az időpontokat, az árakat, a részvételi feltételeket és az elérhetőséget a később közzétett hivatalos rendezvényinformációk alapján kell megerősíteni." },
        { title: "Mentorálás, kapcsolatok és bizalmas tagság", body: "A GIN olyan zárt közösségként mutatja be magát, amelyben a tagok tudást, kapcsolatokat és tapasztalatokat osztanak meg, és támogatják egymást személyes és szakmai céljaik elérésében. A hivatalos honlap szerint a tagok névsora bizalmas; a mentorálást és a kölcsönös támogatást a közösség fontos elemeiként írja le." },
        { title: "Könyvek, hanganyagok és személyes fejlődés", body: "A honlap hivatkozik James Allen As a Man Thinketh című könyvére, a Your Wish Is Your Command hanganyagra, valamint Andrew Carnegie és Napoleon Hill GIN által bemutatott történetére és a mastermind elvére. A GIN a Success Mastery és a Science of Personal Mastery programokat is megnevezi tanulási lehetőségként. Ezeket a címeket és történeteket a hivatalos program bemutatásaként közöljük." },
        { title: "GIN Adventures és közös élmények", body: "A GIN a GIN Adventures programot nemzetközi úti célokra szervezett közös utazásokként mutatja be, és helyi programokat is említ, például étkezéseket, túrázást, raftingot és síkirándulásokat. A konkrét utakról, időpontokról, részvételi feltételekről, költségekről és elérhetőségről a hivatalos rendezvényinformációk alapján kell tájékozódni." },
        { title: "A hivatalos honlapon megnevezett oktatók", body: "A honlap Dr. Tom Mortert és Dr. Ted Mortert az egészség és jóllét témakörében, John Grayt pedig – a Men Are from Mars, Women Are from Venus szerzőjeként – a párkapcsolati oktatás kapcsán nevezi meg. Ezek a nevek és kapcsolatok a GIN közzétett bemutatását tükrözik, nem jelentik állításaik vagy szolgáltatásaik független értékelését." },
      ],
    },
  },
  sq: {
    label: "Shqip", navigation: { home: "Faqja kryesore", about: "Rreth nesh", contact: "Na kontaktoni", login: "Identifikohu", join: "Bëhuni anëtar", menu: "Menu", sidebarAbout: "Rreth nesh", sidebarJoin: "Bëhuni anëtar", aboutHref: "/sq/kush-jemi", loginHref: "https://globalinformationnetwork.com/sq/shtepia-e-anetarit/", sidebarJoinHref: "https://globalinformationnetwork.com/sq/behu-anetar/", primaryOrder: ["home", "about", "join", "contact", "login"] }, homePath: "/sq/home-public", sourceHomeUrl: "https://globalinformationnetwork.com/sq/home-public/",
    aboutPath: "/sq/rreth-nesh", contactPath: "/sq/na-kontakt", htmlLang: "sq",
    copy: {
      welcome: "Mirë se vini në Rrjetin Global të Informacionit", introTitle: "Rrjeti Global i Informacionit (GIN)",
      intro: "është një shoqatë private, ekskluzive, “Vetëm për Anëtarë” në mbarë botën, e individëve të përkushtuar për të arritur sukses në fushat kryesore të jetës, duke përfshirë:",
      pillars: ["Pavarësia Financiare dhe Krijimi i Pasurisë", "Shëndet dhe Jetëgjatësi Dinamike dhe e Gjallë", "Mirëqenia Emocionale dhe Gëzimi i Brendshëm"],
      join: "Bëhuni anëtar sot", questions: "Keni pyetje?", speak: "Bisedoni me një anëtar aktiv të nivelit të lartë", book: "Rezervoni një telefonatë",
      stories: "Anëtarët ndajnë historitë e tyre të suksesit",
      memberIntro: "Anëtarësia e GIN përfshin individë që dëshirojnë fuqimisht të përmirësojnë cilësinë e jetës dhe standardin e tyre të jetesës, të arrijnë gjendje më të larta vetëdijeje, si dhe të përjetojnë paqe të brendshme, gëzim dhe lumturi.",
      sections: [
        { title: "Një rrjet global i ndërtuar mbi mbështetjen e ndërsjellë", body: "GIN e përshkruan veten si një komunitet privat vetëm për anëtarët. Anëtarët shkëmbejnë njohuri dhe përvojë, krijojnë lidhje dhe mbështesin njëri-tjetrin përmes mentorimit në synimet personale dhe profesionale. Lista e anëtarëve është konfidenciale." },
        { title: "Trajnim ekskluziv për anëtarët", body: "Faqja zyrtare përmend tema personale, financiare dhe të mirëqenies, si për shembull:", items: ["Krijimi i pasurisë dhe investimet", "Pasuritë e paluajtshme dhe tregjet financiare", "Mbrojtja e aseteve dhe bankimi offshore", "Shëndeti natyror dhe mirëqenia", "Lumturia, paqja e brendshme dhe mirëqenia emocionale", "Zhvillimi personal dhe liria shpirtërore", "Vetëdija dhe aftësitë mendore"] },
        { title: "Një komunitet ndërkombëtar", body: "Sipas GIN, rrjeti u konceptua në Stamboll të Turqisë në vitin 2003 dhe u themelua zyrtarisht në vitin 2009. Organizata deklaron se ka anëtarë në më shumë se 160 vende." },
        { title: "Shëndeti, pasuria dhe lumturia", body: "Faqja zyrtare i paraqet këto tri fusha si aspirata të rëndësishme të jetës. Ato shërbejnë si kornizë për synimet individuale të anëtarëve, jo si rezultate të garantuara." },
        { title: "Mësim dhe komunitet", body: "Faqja përmend takime fizike, seminare virtuale, takime të kapitujve lokalë, burime mësimore online dhe histori të anëtarëve." },
        { title: "Mësime audio, kurse dhe biblioteka e anëtarëve", body: "GIN përshkruan mësime audio të personalizuara, kurse dhe webinare, si dhe një arkiv të krijuar që nga viti 2009 me mijëra orë materiale audio dhe video mbi shëndetin, mirëqenien, krijimin e pasurisë, lumturinë dhe marrëdhëniet. Biblioteka e anëtarëve përfshin gjithashtu libra, materiale edukative dhe mentorim online." },
        { title: "Aktivitete gjatë gjithë vitit", body: "Sipas faqes zyrtare, GIN organizon çdo vit katër aktivitete të mëdha fundjave në vende të ndryshme ndërkombëtare. Katër herë në vit zhvillohen seminare virtuale dhe tubime për ndarjen e çmimeve, ndërsa kapitujt lokalë organizojnë takime mujore fizike ose virtuale." },
        { title: "Anëtarësimi dhe Niveli I", body: "Faqja zyrtare paraqet për Nivelin I një tarifë të vetme fillestare prej 1,500 USD dhe pagesa mujore prej 150 USD, si dhe njofton një rritje të planifikuar të çmimeve më 1 janar 2027. Aplikuesit duhet të aplikojnë fillimisht për Nivelin I; jo të gjitha aplikimet pranohen. Konfirmoni çmimet, disponueshmërinë dhe kushtet aktuale drejtpërdrejt te shërbimi zyrtar i aplikimit." },
        { title: "Projekt i një lundrimi pesënetësh në vitin 2028", body: "Faqja zyrtare i fton anëtarët e rinj në një lundrim të planifikuar pesënetësh në vitin 2028 dhe e përshkruan projektin si marrjen me qira të një anijeje të tërë për anëtarët e klubit. Anija, datat, çmimet, kushtet e pjesëmarrjes dhe disponueshmëria duhet të konfirmohen nga informacionet zyrtare të aktivitetit kur të publikohen." },
        { title: "Mentorim, marrëdhënie dhe anëtarësi konfidenciale", body: "GIN përshkruan një komunitet privat ku anëtarët ndajnë njohuri, kontakte dhe përvoja, si dhe mbështesin njëri-tjetrin në synimet personale dhe profesionale. Faqja zyrtare thotë se lista e anëtarëve është konfidenciale dhe e paraqet mentorimin dhe mbështetjen e ndërsjellë si pjesë thelbësore të komunitetit." },
        { title: "Libra, kurse audio dhe zhvillim personal", body: "Faqja kryesore i referohet librit As a Man Thinketh nga James Allen, programit audio Your Wish Is Your Command dhe rrëfimit që GIN paraqet për Andrew Carnegie, Napoleon Hill dhe parimin mastermind. GIN përmend gjithashtu Success Mastery dhe Science of Personal Mastery si programe mësimore. Këta tituj dhe rrëfime paraqiten si pjesë e programit zyrtar." },
        { title: "GIN Adventures dhe përvoja të përbashkëta", body: "GIN e përshkruan GIN Adventures si udhëtime të përbashkëta drejt destinacioneve ndërkombëtare dhe përmend edhe aktivitete lokale si ngrënie, ecje në natyrë, rafting dhe udhëtime për ski. Udhëtimet konkrete, datat, kriteret e pjesëmarrjes, kostot dhe disponueshmëria duhen kontrolluar në informacionet zyrtare të aktiviteteve." },
        { title: "Edukues të përmendur në faqen zyrtare", body: "Faqja kryesore përmend Dr. Tom Morter dhe Dr. Ted Morter në lidhje me shëndetin dhe mirëqenien, si dhe John Gray, autor i Men Are from Mars, Women Are from Venus, në lidhje me marrëdhëniet. Këta emra dhe lidhje pasqyrojnë prezantimin e publikuar nga GIN dhe nuk përbëjnë vlerësim të pavarur të pretendimeve ose shërbimeve të tyre." },
      ],
    },
  },
  pt: {
    label: "Português", navigation: { home: "Início", about: "Quem somos", contact: "Contacte-nos", login: "Acesso", join: "Torne-se membro", menu: "Menu", sidebarAbout: "Quem somos", sidebarJoin: "Torne-se membro", aboutHref: "/pt/quem-nos-somos", loginHref: "https://globalinformationnetwork.com/pt/pagina-inicial-do-membro/", sidebarJoinHref: "https://signup.globalinformationnetwork.com/", primaryOrder: ["home", "about", "join", "login", "contact"] }, homePath: "/pt/home-public", sourceHomeUrl: "https://globalinformationnetwork.com/pt/home-public/",
    aboutPath: "/pt/quem-somos", contactPath: "/pt/fale-conosco", htmlLang: "pt",
    copy: {
      welcome: "Bem-vindo à Rede Global de Informação", introTitle: "A Rede Global de Informação (GIN)",
      intro: "é uma associação mundial privada e exclusiva, “só para membros”, de indivíduos dedicados a alcançar sucesso nas principais áreas da vida, incluindo:",
      pillars: ["Independência financeira e criação de riqueza", "Saúde dinâmica e longevidade", "Bem-estar emocional e alegria interior"],
      join: "Torne-se membro hoje mesmo", questions: "Tem dúvidas?", speak: "Converse com um membro ativo de alto nível", book: "Agendar uma Chamada",
      stories: "Os membros partilham as suas histórias de sucesso",
      memberIntro: "Os membros do GIN incluem indivíduos que desejam fortemente melhorar a qualidade e o padrão de vida, alcançar estados mais elevados de consciência, bem como experimentar paz interior, alegria e felicidade.",
      sections: [
        { title: "Uma rede global baseada no apoio mútuo", body: "A GIN apresenta-se como uma comunidade privada, exclusiva para membros. Os membros partilham conhecimentos e experiência, criam ligações e apoiam-se através de mentoria para alcançar objetivos pessoais e profissionais. A lista de membros é confidencial." },
        { title: "Formação exclusiva para membros", body: "A página oficial apresenta temas de formação pessoais, financeiros e ligados ao bem-estar, como:", items: ["Criação de riqueza e investimento", "Imobiliário e mercados financeiros", "Proteção de ativos e banca offshore", "Saúde natural e bem-estar", "Felicidade, paz interior e bem-estar emocional", "Desenvolvimento pessoal e liberdade espiritual", "Consciência e capacidade mental"] },
        { title: "Uma comunidade internacional", body: "Segundo a GIN, a rede foi idealizada em Istambul, na Turquia, em 2003, e fundada oficialmente em 2009. A organização afirma ter membros em mais de 160 países." },
        { title: "Saúde, riqueza e felicidade", body: "A página oficial apresenta estas três áreas como grandes aspirações de vida. Servem de enquadramento para os objetivos individuais dos membros, não como resultados garantidos." },
        { title: "Aprendizagem e comunidade", body: "O site destaca encontros presenciais, seminários virtuais, reuniões de capítulos locais, recursos de aprendizagem online e testemunhos de membros." },
        { title: "Aulas áudio, cursos, webinars e biblioteca de membros", body: "A GIN descreve aulas áudio personalizadas, cursos e webinars, além de um arquivo criado desde 2009 com milhares de horas de conteúdos áudio e vídeo sobre saúde, bem-estar, criação de riqueza, felicidade e relacionamentos. A biblioteca de membros inclui também livros, materiais educativos e mentoria online." },
        { title: "Eventos ao longo do ano", body: "Segundo a página oficial, a GIN organiza quatro grandes eventos de fim de semana por ano, em diferentes destinos internacionais. Realiza também quatro seminários virtuais e encontros de prémios por ano, enquanto os capítulos locais promovem reuniões mensais presenciais ou virtuais." },
        { title: "Adesão e Nível I", body: "A página oficial indica para o Nível I uma taxa única de inscrição de 1.500 USD e quotas mensais de 150 USD, e anuncia um aumento de preços previsto para 1 de janeiro de 2027. Os candidatos devem começar por solicitar o Nível I; nem todos os pedidos são aceites. Confirme os preços, a disponibilidade e as condições atuais diretamente junto do serviço oficial de candidatura." },
        { title: "Projeto de cruzeiro de cinco noites em 2028", body: "A página oficial convida os novos membros para um cruzeiro planeado de cinco noites em 2028 e descreve o projeto como a utilização de um navio inteiro pelos membros do clube. O navio, as datas, os preços, as condições de participação e a disponibilidade deverão ser confirmados nas informações oficiais do evento quando forem publicadas." },
        { title: "Mentoria, relacionamentos e adesão confidencial", body: "A GIN descreve uma comunidade privada cujos membros partilham conhecimentos, contactos e experiências, apoiando-se mutuamente nos seus objetivos pessoais e profissionais. A página oficial afirma que a lista de membros é confidencial e apresenta a mentoria e o apoio mútuo como elementos centrais da comunidade." },
        { title: "Livros, cursos áudio e desenvolvimento pessoal", body: "A página inicial faz referência ao livro As a Man Thinketh, de James Allen, ao programa áudio Your Wish Is Your Command e ao relato apresentado pela GIN sobre Andrew Carnegie, Napoleon Hill e o princípio do mastermind. A GIN também menciona Success Mastery e Science of Personal Mastery como programas de aprendizagem. Estes títulos e relatos são reproduzidos como conteúdos do programa oficial." },
        { title: "GIN Adventures e experiências partilhadas", body: "A GIN descreve GIN Adventures como viagens em grupo para destinos internacionais e menciona também atividades locais, como refeições, caminhadas, rafting e passeios de esqui. As viagens concretas, datas, critérios de participação, custos e disponibilidade devem ser confirmados nas informações oficiais dos eventos." },
        { title: "Formadores mencionados na página oficial", body: "A página inicial menciona o Dr. Tom Morter e o Dr. Ted Morter no contexto da saúde e do bem-estar, e John Gray, autor de Men Are from Mars, Women Are from Venus, no contexto dos relacionamentos. Estes nomes e associações reproduzem a apresentação publicada pela GIN e não constituem uma avaliação independente das suas afirmações ou serviços." },
      ],
    },
  },
};

export const officialPublicLocaleCodes = Object.keys(officialPublicLocales) as OfficialPublicLocaleCode[];

export type OfficialPublicPageKey = "homePath" | "aboutPath" | "contactPath";
export type OfficialPublicPrimaryNavigationKey = "home" | "join" | "about" | "contact" | "login";

export function officialPublicLocaleAlternates(page: OfficialPublicPageKey): Record<string, string> {
  const persianPath = page === "homePath" ? "/fa" : page === "aboutPath" ? "/fa/about" : "/fa/contact";
  return {
    ...Object.fromEntries(officialPublicLocaleCodes.map((code) => [officialPublicLocales[code].htmlLang, officialPublicLocales[code][page]])),
    fa: persianPath,
    "x-default": officialPublicLocales.en[page],
  };
}

export function officialPageKeyForPath(pathname: string): OfficialPublicPageKey {
  for (const code of officialPublicLocaleCodes) {
    const locale = officialPublicLocales[code];
    if (pathname === locale.aboutPath) return "aboutPath";
    if (pathname === locale.contactPath) return "contactPath";
    if (pathname === locale.homePath || pathname === `/${code}` || pathname.startsWith(`/${code}/`)) return "homePath";
  }
  return "homePath";
}

export function officialLocalePathForPage(code: OfficialPublicLocaleCode, page: OfficialPublicPageKey) {
  return officialPublicLocales[code][page];
}

export function officialLocaleForPath(pathname: string): OfficialPublicLocaleCode | null {
  for (const code of officialPublicLocaleCodes) {
    if (pathname === officialPublicLocales[code].homePath || pathname.startsWith(`/${code}/`)) return code;
  }
  return pathname === "/en" || pathname.startsWith("/en/") ? "en" : null;
}
