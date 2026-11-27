import type { OfficialPublicLocaleCode } from "./official-public-locales";
import type { OfficialReferencePageKey } from "./official-public-reference-routes";

export type OfficialReferenceContentSection = { title: string; body: string };

type LocalizedReferenceCopy = {
  summaries: Record<OfficialReferencePageKey, string>;
  sections: Partial<Record<OfficialReferencePageKey, OfficialReferenceContentSection[]>>;
  sourceNote: string;
  sourceAction: string;
  notice: string;
};

export const officialPublicReferenceCopy: Record<Exclude<OfficialPublicLocaleCode, "en">, LocalizedReferenceCopy> = {
  de: {
    sections: {
      memberBenefits: [
        { title: "Kosten, Kündigung und erstes Major Weekend", body: "GIN nennt eine einmalige Aufnahmegebühr von 1.500 US-Dollar und einen laufenden Monatsbeitrag von 150 US-Dollar. Laut GIN kann die Mitgliedschaft jederzeit gekündigt werden. Nach Annahme des Antrags beschreibt GIN ein kostenloses Ticket für ein bevorstehendes dreitägiges Major Weekend; den Wert beziffert GIN mit mehr als 20.000 US-Dollar. Die Teilnahme soll persönlich oder virtuell möglich sein. Die Seite erklärt außerdem, dass für Major-Weekend-Veranstaltungen normalerweise ein Ticket gekauft werden muss, die erste Veranstaltung jedoch kostenlos ist. Ticketwert und Vorteile sind Angaben von GIN, keine unabhängig bestätigten Bewertungen." },
        { title: "Wöchentliche Informationen und vertrauliche Mitteilungen", body: "GIN beschreibt ein wöchentliches Audio-Update per E-Mail, üblicherweise fünf bis zehn Minuten lang, von der Geschäftsführung oder einem hochrangigen Mitglied. Außerdem nennt GIN gelegentliche private, vertrauliche Mitteilungen per SMS, Telefon, E-Mail oder Post, wenn zeitkritische globale Insider-Informationen zu Investitionen oder ähnlichen Themen für Mitglieder hilfreich sein könnten." },
        { title: "Kurse, Treffen und weitere Mitgliederleistungen", body: "GIN gibt an, Mitgliedern kostenlosen Zugang zum GIN Core Success Training zu gewähren: genannt werden der 14-stündige Success Mastery Audio-Kurs, „The Power of GIN and the GIN System“ und „The 10 Steps to Success“. GIN beziffert das Training auf mehr als 30 Stunden und behauptet einen separaten Kaufwert von über 20.000 US-Dollar; diese Werte sind nicht unabhängig bestätigt. Zusätzlich nennt GIN kostenlosen Zugang zu lokalen Treffen vor Ort und virtuell, vierteljährlichen virtuellen Erfolgsseminaren und Rallyes sowie ein wöchentliches Audio zur Mitgliederentwicklung. Weitere Vorteile sollen erst nach dem Beitritt bekannt werden. Umfang, Verfügbarkeit und Bedingungen sind direkt bei GIN zu prüfen." },
      ],
      membershipLevels: [
        { title: "Zwölf Stufen und Zugang auf Level I", body: "GIN veröffentlicht zwölf Mitgliedschaftsstufen, für die jeweils bestimmte Voraussetzungen und die Zustimmung des Membership Acceptance Committee gelten. Für Level I nennt GIN eine Aufnahmegebühr von 1.500 US-Dollar und einen Monatsbeitrag von 150 US-Dollar. Level I umfasst den Zugang zu den für diese Stufe vorgesehenen Mitgliederbereichen der GIN-Website. Für die Teilnahme an GIN-Veranstaltungen ist zusätzlich ein Ticket erforderlich." },
        { title: "Nicht öffentliche Stufen und wichtige Hinweise", body: "Einzelheiten zu höheren Mitgliedschaftsstufen sind auf der offiziellen Seite als CLASSIFIED gekennzeichnet und werden hier nicht ergänzt oder vermutet. GIN bezeichnet sich als Informationsorganisation und private Vereinigung; laut eigener Erklärung bietet sie keine Finanz-, Steuer-, Rechts-, Anlage- oder medizinische Beratung und ist keine Geschäftsmöglichkeit. GIN empfiehlt, unabhängige Fachleute zu konsultieren. Diese Angaben geben die Erklärung der Organisation wieder und ersetzen keine eigene Prüfung." },
      ],
    },
    summaries: {
      whatWeOffer: "GIN stellt Schulungen für Mitglieder, Veranstaltungen, Networking, Mentoring und weitere veröffentlichte Vorteile vor.",
      memberBenefits: "Diese Seite fasst die von GIN beschriebenen Vorteile zusammen, darunter Lernangebote, Veranstaltungen, Mitgliederinformationen und zusätzliche Ressourcen.",
      successSystem: "GIN beschreibt ein fünfgliedriges System aus Audio-Trainings, Büchern, Veranstaltungen, Anerkennung und Beziehungen.",
      events: "Vorgestellt werden persönliche und virtuelle Veranstaltungen, Major Weekends, Seminare, Workshops und internationale Netzwerktreffen; Termine können sich ändern.",
      training: "Die Trainingsseite beschreibt die Mitgliederbibliothek und Programme wie Success Mastery und Science of Personal Mastery; der Zugang kann eine Mitgliedschaft voraussetzen.",
      membershipLevels: "GIN veröffentlicht zwölf Mitgliedschaftsstufen. Höhere Stufen erfordern Qualifikation und Zustimmung des Membership Acceptance Committee; als CLASSIFIED markierte Details sind öffentlich nicht verfügbar.",
      faq: "Die FAQ behandelt Vorteile, Bewerbung, Mitgliedsbeiträge, Kündigung, Teilnahme und Fragen zur Organisation. Gebühren und aktuelle Bedingungen sollten vor einer Bewerbung direkt bestätigt werden.",
      hotels: "Die Galerie zeigt eine Auswahl von Hotels und Veranstaltungsorten, an denen GIN-Veranstaltungen und Treffen stattgefunden haben; sie bestätigt weder Verfügbarkeit noch Buchungsmöglichkeiten.",
      clubhouses: "GIN beschreibt ein sich entwickelndes Netzwerk privater Clubhäuser für lokale Treffen, Schulungen und soziale Aktivitäten; die Verfügbarkeit einzelner Standorte muss bestätigt werden.",
      clubVision: "Die Club Vision skizziert GINs Vorstellung eines privaten internationalen Successful Life Club. Die genannten Vorteile und Ziele sind Aussagen der Organisation, keine garantierten Ergebnisse.",
      cruise: "Das vorgeschlagene FREEDOM-Kreuzfahrtschiff ist ein Machbarkeitskonzept; Bau, Buchung, Eigentum oder Investitionsmöglichkeiten sind nicht bestätigt.",
      whyJoin: "GIN beschreibt die Mitgliedschaft als private, antragsbasierte Gemeinschaft für Wissensaustausch, Beziehungen und mitgliederinterne Lernangebote; bestimmte Ergebnisse werden nicht garantiert.",
      whoWeAre: "Diese Seite fasst GINs eigene Darstellung seiner Entstehung, seines Credos, seiner privaten Mitgliedschaftsstruktur und seiner weltweiten Ziele zusammen.",
      memberAgreement: "Die Mitgliedervereinbarung enthält die Bedingungen der GIN-Mitgliedschaft. Prüfen Sie den vollständigen aktuellen Text zu Gebühren, Pflichten, Kündigung und Verhaltensregeln.",
      terms: "Die Nutzungsbedingungen regeln den Zugriff auf und die Nutzung der offiziellen GIN-Website. Maßgeblich ist der vollständige aktuelle Rechtstext.",
      privacy: "Die Datenschutzerklärung beschreibt die von GIN erfassten Informationen sowie deren Nutzung und Weitergabe. Lesen Sie den vollständigen aktuellen Text vor der Übermittlung persönlicher Daten.",
    },
    sourceNote: "Diese Seite ist eine kurze Zusammenfassung der veröffentlichten GIN-Angaben. Für vollständige und aktuelle Informationen öffnen Sie die offizielle Seite.",
    sourceAction: "Offizielle Seite öffnen",
    notice: "Aussagen zu Vorteilen, Ergebnissen und zukünftigen Angeboten werden GIN zugeschrieben und sind nicht unabhängig bestätigt. Diese Zusammenfassung ersetzt keine vollständigen Vertrags- oder Rechtstexte.",
  },
  fr: {
    sections: {
      memberBenefits: [
        { title: "Tarifs, annulation et premier Major Weekend", body: "GIN indique que l’adhésion coûte 1 500 $ US à l’inscription, puis 150 $ US par mois. Selon GIN, l’adhésion peut être annulée à tout moment. Après acceptation de la demande, GIN annonce un billet gratuit pour un prochain Major Weekend de trois jours, dont GIN estime la valeur à plus de 20 000 $ US. La participation serait possible en personne ou en ligne. La page précise également que les événements Major Weekend nécessitent normalement l’achat d’un billet, mais que le premier événement est gratuit. La valeur du billet et les avantages décrits sont des déclarations de GIN, non des évaluations vérifiées indépendamment." },
        { title: "Informations hebdomadaires et communications privées", body: "GIN décrit une mise à jour audio hebdomadaire par courriel, généralement de cinq à dix minutes, envoyée par son directeur général ou un membre de haut niveau. GIN mentionne aussi des communications privées et confidentielles occasionnelles par SMS, téléphone, courriel ou courrier postal lorsque des informations mondiales urgentes liées à l’investissement ou à des sujets similaires pourraient être utiles aux membres." },
        { title: "Cours, réunions et autres avantages membres", body: "GIN annonce un accès gratuit au GIN Core Success Training, comprenant le cours audio Success Mastery de 14 heures, « The Power of GIN and the GIN System » et « The 10 Steps to Success ». GIN présente cette formation comme dépassant 30 heures et lui attribue une valeur de plus de 20 000 $ US en cas d’achat séparé; ces montants ne sont pas vérifiés indépendamment. GIN mentionne aussi l’accès gratuit aux réunions des sections locales, en personne ou en ligne, aux séminaires et rallyes virtuels trimestriels, ainsi qu’un audio hebdomadaire de développement des membres. D’autres avantages seraient révélés après l’adhésion. Vérifiez directement auprès de GIN la portée, la disponibilité et les conditions actuelles." },
      ],
      membershipLevels: [
        { title: "Douze niveaux et accès au niveau I", body: "GIN présente douze niveaux d’adhésion, chacun soumis à des critères de qualification et à l’approbation du comité d’acceptation des membres. Pour le niveau I, GIN indique des frais d’inscription de 1 500 $ US et une cotisation mensuelle de 150 $ US. Ce niveau donne accès aux espaces du site GIN réservés aux membres de niveau I. La participation aux événements GIN nécessite l’achat d’un billet supplémentaire." },
        { title: "Niveaux non publics et avertissements importants", body: "Les détails des niveaux supérieurs sont marqués CLASSIFIED sur la page officielle; ils ne sont ni reproduits ni supposés ici. GIN se décrit comme une organisation d’information et une association privée; selon sa propre déclaration, elle ne fournit aucun conseil financier, fiscal, juridique, d’investissement ou médical et ne constitue pas une opportunité commerciale. GIN recommande de consulter des experts indépendants. Ces informations reprennent la déclaration de l’organisation et ne remplacent pas une vérification personnelle." },
      ],
    },
    summaries: {
      whatWeOffer: "GIN présente les formations destinées aux membres, les événements, le réseautage, le mentorat et les autres avantages publiés.",
      memberBenefits: "Cette page résume les avantages décrits par GIN, notamment les ressources d’apprentissage, les événements, les informations aux membres et d’autres ressources.",
      successSystem: "GIN décrit un système en cinq volets fondé sur les formations audio, les livres, les événements, la reconnaissance et les relations.",
      events: "La page présente des événements en personne et virtuels, des Major Weekends, des séminaires, des ateliers et des rencontres internationales; les dates peuvent changer.",
      training: "La page de formation présente la bibliothèque réservée aux membres et des programmes tels que Success Mastery et Science of Personal Mastery; l’accès peut nécessiter une adhésion.",
      membershipLevels: "GIN publie douze niveaux d’adhésion. Les niveaux supérieurs exigent une qualification et l’approbation du Membership Acceptance Committee; les détails marqués CLASSIFIED ne sont pas publics.",
      faq: "La FAQ aborde les avantages, la candidature, les cotisations, l’annulation, la participation et des questions sur l’organisation. Vérifiez les frais et conditions en vigueur avant de candidater.",
      hotels: "La galerie présente une sélection d’hôtels et de lieux où des événements et réunions GIN ont eu lieu; elle ne confirme ni disponibilité ni possibilité de réservation.",
      clubhouses: "GIN décrit un réseau en développement de Clubhouses privés pour les rencontres locales, la formation et les activités sociales; la disponibilité de chaque lieu doit être confirmée.",
      clubVision: "La Club Vision expose l’idée de GIN d’un Successful Life Club privé et international. Les avantages et objectifs décrits sont des déclarations de l’organisation, pas des résultats garantis.",
      cruise: "Le navire de croisière FREEDOM proposé reste un concept à l’étude de faisabilité; sa construction, des réservations, une propriété ou un investissement ne sont pas confirmés.",
      whyJoin: "GIN présente l’adhésion comme une communauté privée sur candidature, axée sur le partage de connaissances, les relations et l’apprentissage réservé aux membres; aucun résultat n’est garanti.",
      whoWeAre: "Cette page résume la présentation de GIN concernant ses origines, son credo, sa structure d’adhésion privée et ses objectifs internationaux.",
      memberAgreement: "L’accord de membre contient les conditions applicables à l’adhésion GIN. Consultez le texte complet et actuel concernant les frais, obligations, annulation et règles de conduite.",
      terms: "Les conditions d’utilisation régissent l’accès au site officiel de GIN et son utilisation. Le texte juridique complet et actuel fait foi.",
      privacy: "La politique de confidentialité décrit les informations recueillies par GIN et leur utilisation ou partage. Lisez le texte complet et actuel avant de transmettre des données personnelles.",
    },
    sourceNote: "Cette page résume brièvement les informations publiées par GIN. Consultez la page officielle pour le contenu complet et les informations à jour.",
    sourceAction: "Ouvrir la page officielle",
    notice: "Les affirmations relatives aux avantages, résultats et offres futures sont attribuées à GIN et ne sont pas vérifiées indépendamment. Ce résumé ne remplace aucun contrat ni document juridique complet.",
  },
  es: {
    sections: {
      memberBenefits: [
        { title: "Cuotas, cancelación y evento de crucero anunciado", body: "GIN indica que la membresía cuesta 1.500 USD en un pago inicial y 150 USD al mes. Según GIN, puede cancelarse en cualquier momento. La página española no anuncia una entrada gratuita específica para un Major Weekend de tres días ni atribuye a esa entrada un valor superior a 20.000 USD. En su lugar, afirma que GIN dispone de todo el crucero, que más de 2.000 miembros estarán a bordo y que los seminarios, talleres, eventos y comidas serán gratuitos; la propia página lo califica como un evento que cambiará la vida. Son afirmaciones promocionales de GIN y no verificaciones independientes sobre el viaje o su disponibilidad." },
        { title: "Actualizaciones semanales y comunicados privados", body: "GIN describe un correo semanal con una actualización de audio, normalmente de cinco a diez minutos, enviado por su director general o un miembro de alto nivel. También menciona comunicados privados y confidenciales ocasionales por SMS, teléfono, correo electrónico o postal cuando información global urgente relacionada con inversiones u otros asuntos similares pueda ser útil para los miembros." },
        { title: "Formación, reuniones y reglas de entradas", body: "GIN anuncia acceso gratuito a GIN Core Success Training, incluido el curso de audio Success Mastery de 14 horas, «The Power of GIN and the GIN System» y «The 10 Steps to Success». GIN afirma que la formación supera las 30 horas y que su valor de compra por separado supera los 20.000 USD; estas cifras no están verificadas independientemente. También menciona reuniones de capítulos locales gratuitas, presenciales o virtuales, seminarios y encuentros virtuales trimestrales, y un audio semanal de desarrollo de miembros. Para los grandes eventos de fin de semana normalmente se requiere comprar entrada, aunque el primer evento es GRATIS. GIN dice que revelará otros beneficios después de la incorporación. Confirme con GIN el alcance, la disponibilidad y las condiciones actuales." },
      ],
      membershipLevels: [
        { title: "Doce niveles y acceso al Nivel I", body: "GIN publica doce niveles de membresía, sujetos a requisitos específicos y a la aprobación del Comité de Aceptación de Membresías. Para el Nivel I, GIN indica una cuota de iniciación de 1.500 USD y cuotas mensuales de 150 USD. El Nivel I da acceso a las secciones del sitio web de GIN reservadas para ese nivel. Para asistir a eventos de GIN se requiere comprar una entrada adicional." },
        { title: "Niveles no públicos y advertencias importantes", body: "Los detalles de los niveles superiores aparecen como CLASSIFIED en la página oficial; no se reproducen ni se presuponen aquí. GIN se define como una organización informativa y una asociación privada; según su propia declaración, no ofrece asesoramiento financiero, fiscal, legal, de inversión ni médico, y no es una oportunidad de negocio. GIN recomienda consultar a profesionales independientes. Esta información reproduce la declaración de la organización y no sustituye una evaluación propia." },
      ],
    },
    summaries: {
      whatWeOffer: "GIN presenta la formación para miembros, los eventos, la creación de redes, la mentoría y otros beneficios publicados.",
      memberBenefits: "Esta página resume los beneficios descritos por GIN, incluidos recursos de aprendizaje, eventos, información para miembros y otros recursos.",
      successSystem: "GIN describe un sistema de cinco partes basado en formación de audio, libros, eventos, reconocimiento y relaciones.",
      events: "La página presenta eventos presenciales y virtuales, Major Weekends, seminarios, talleres y encuentros internacionales; las fechas pueden cambiar.",
      training: "La página de formación describe la biblioteca para miembros y programas como Success Mastery y Science of Personal Mastery; el acceso puede requerir membresía.",
      membershipLevels: "GIN publica doce niveles de membresía. Los niveles superiores requieren cualificación y aprobación del Membership Acceptance Committee; los detalles marcados CLASSIFIED no son públicos.",
      faq: "Las preguntas frecuentes abordan beneficios, solicitudes, cuotas, cancelación, participación y cuestiones sobre la organización. Confirme las tarifas y condiciones vigentes antes de solicitar la membresía.",
      hotels: "La galería muestra una selección de hoteles y lugares donde se han celebrado eventos y reuniones de GIN; no confirma disponibilidad ni opciones de reserva.",
      clubhouses: "GIN describe una red en desarrollo de Clubhouses privados para reuniones locales, formación y actividades sociales; debe confirmarse la disponibilidad de cada ubicación.",
      clubVision: "La visión del club presenta la idea de GIN de un Successful Life Club privado e internacional. Los beneficios y objetivos descritos son declaraciones de la organización, no resultados garantizados.",
      cruise: "El crucero FREEDOM propuesto es un concepto sujeto a un estudio de viabilidad; no están confirmados su construcción, reservas, propiedad ni oportunidades de inversión.",
      whyJoin: "GIN describe la membresía como una comunidad privada basada en solicitudes, centrada en compartir conocimientos, relaciones y aprendizaje exclusivo para miembros; no garantiza resultados.",
      whoWeAre: "Esta página resume la presentación de GIN sobre sus orígenes, credo, estructura de membresía privada y objetivos internacionales.",
      memberAgreement: "El acuerdo de miembro contiene las condiciones aplicables a la membresía de GIN. Consulte el texto completo y vigente sobre cuotas, obligaciones, cancelación y normas de conducta.",
      terms: "Las condiciones de uso regulan el acceso y uso del sitio oficial de GIN. El texto jurídico completo y vigente es el que prevalece.",
      privacy: "La política de privacidad describe la información que GIN recopila y cómo la utiliza o comparte. Lea el texto completo y vigente antes de enviar datos personales.",
    },
    sourceNote: "Esta página resume brevemente la información publicada por GIN. Consulte la página oficial para ver el contenido completo y la información vigente.",
    sourceAction: "Abrir la página oficial",
    notice: "Las afirmaciones sobre beneficios, resultados y ofertas futuras se atribuyen a GIN y no están verificadas de forma independiente. Este resumen no sustituye contratos ni documentos legales completos.",
  },
  hu: {
    sections: {
      memberBenefits: [
        { title: "Díjak, lemondás és heti tájékoztatás", body: "A GIN egyszeri 1 500 USD belépési díjat és folyamatos havi 150 USD tagdíjat tüntet fel; tájékoztatása szerint a tagság bármikor lemondható. Hetente, e-mailben rendszerint öt–tíz perces hangfrissítést küld az ügyvezető igazgatótól vagy egy magas szintű tagtól. Időnként bizalmas közleményeket is küldhet SMS-ben, telefonon, e-mailben vagy postai úton, ha a befektetéssel vagy hasonló témákkal kapcsolatos sürgős globális információ hasznos lehet a tagoknak." },
        { title: "Rendezvényjegyek és a Major Weekendre vonatkozó forráskorlát", body: "A magyar előnyoldal nem említi a háromnapos Major Weekendhez kapcsolódó külön ingyenes jegyet vagy a 20 000 USD feletti értéket, ezért ezt nem tüntetjük fel magyar nyelvű tagi juttatásként. A forrás ugyanakkor azt írja, hogy a fő hétvégi eseményekhez jegyvásárlás szükséges, az első esemény pedig ingyenes. A különböző nyelvű hivatalos oldalak eltérő részleteket közölhetnek; a jelentkezésre érvényes feltételeket közvetlenül a GIN-nél kell megerősíteni." },
        { title: "Képzések, találkozók és további tagi előnyök", body: "A GIN ingyenes hozzáférést ír le a GIN Core Success Training tagoknak szóló anyagaihoz, köztük a 14 órás Success Mastery hangkurzushoz, a „The Power of GIN and the GIN System” és a „The 10 Steps to Success” kurzusokhoz. A GIN több mint 30 órányi képzést és külön megvásárolva 20 000 USD feletti értéket állít; ezek nem függetlenül igazolt értékek. A leírás ingyenes helyi fejezeti találkozókat, negyedéves virtuális sikerszemináriumokat és rallykat, valamint heti tagfejlesztő hanganyagot is említ. További előnyöket a GIN szerint a tagság után ismertetnek. A hozzáférés és feltételek részleteit közvetlenül a GIN-nél ellenőrizze." },
      ],
      membershipLevels: [
        { title: "Tizenkét szint és I. szintű hozzáférés", body: "A GIN tizenkét tagsági szintet ismertet; minden szinthez meghatározott feltételek teljesítése és a tagfelvételi bizottság jóváhagyása szükséges. Az I. szinthez a GIN 1 500 USD belépési díjat és 150 USD havi tagdíjat ad meg. Az I. szint hozzáférést biztosít a GIN weboldalának I. szintű tagi részeihez; a GIN-rendezvényeken való részvételhez külön jegyet kell vásárolni." },
        { title: "Nem nyilvános szintek és fontos tájékoztatás", body: "A magasabb szintek részletei a hivatalos oldalon CLASSIFIED jelölésűek; ezeket itt nem egészítjük ki feltételezésekkel. A GIN információs szervezetként és magánegyesületként határozza meg magát; saját nyilatkozata szerint nem nyújt pénzügyi, adózási, jogi, befektetési vagy orvosi tanácsadást, és nem üzleti lehetőség. Független szakértők felkeresését ajánlja. Ezek a GIN nyilatkozatai, nem helyettesítik az önálló ellenőrzést." },
      ],
    },
    summaries: {
      whatWeOffer: "A GIN bemutatja a tagoknak szóló képzéseket, rendezvényeket, kapcsolatépítést, mentorálást és a közzétett további előnyöket.",
      memberBenefits: "Ez az oldal összefoglalja a GIN által ismertetett előnyöket, köztük a tanulási forrásokat, rendezvényeket, tagi tájékoztatást és további lehetőségeket.",
      successSystem: "A GIN egy öt részből álló rendszert ismertet, amely hanganyagokra, könyvekre, rendezvényekre, elismerésre és kapcsolatokra épül.",
      events: "Az oldal személyes és online rendezvényeket, Major Weekend eseményeket, szemináriumokat, műhelyeket és nemzetközi találkozókat mutat be; az időpontok változhatnak.",
      training: "A képzési oldal a tagi tananyagkönyvtárat, valamint a Success Mastery és a Science of Personal Mastery programokat ismerteti; a hozzáférés tagsághoz kötődhet.",
      membershipLevels: "A GIN tizenkét tagsági szintet tesz közzé. A magasabb szintek képesítést és a Membership Acceptance Committee jóváhagyását igénylik; a CLASSIFIED jelölésű részletek nem nyilvánosak.",
      faq: "A GYIK a tagsági előnyökről, jelentkezésről, díjakról, lemondásról, részvételről és a szervezettel kapcsolatos kérdésekről szól. Jelentkezés előtt ellenőrizze az aktuális díjakat és feltételeket.",
      hotels: "A galéria olyan hotelek és helyszínek válogatását mutatja be, ahol GIN-rendezvényeket és találkozókat tartottak; nem jelez aktuális szabad kapacitást vagy foglalhatóságot.",
      clubhouses: "A GIN fejlődő magán Clubhouse-hálózatot ismertet helyi találkozókhoz, képzésekhez és közösségi programokhoz; az egyes helyszínek elérhetőségét külön kell megerősíteni.",
      clubVision: "A Club Vision a GIN magánjellegű, nemzetközi Successful Life Club elképzelését mutatja be. A leírt előnyök és célok a szervezet állításai, nem garantált eredmények.",
      cruise: "A tervezett FREEDOM óceánjáró megvalósíthatósági koncepció; az építése, foglalhatósága, tulajdonlása vagy befektetési lehetősége nem megerősített.",
      whyJoin: "A GIN a tagságot magánjellegű, jelentkezéshez kötött közösségként mutatja be, amely tudásmegosztásra, kapcsolatokra és tagi tanulásra épül; eredményt nem garantál.",
      whoWeAre: "Ez az oldal a GIN saját bemutatását foglalja össze a szervezet eredetéről, hitvallásáról, zárt tagsági struktúrájáról és nemzetközi céljairól.",
      memberAgreement: "A tagi megállapodás tartalmazza a GIN-tagság feltételeit. A díjakról, kötelezettségekről, lemondásról és magatartási szabályokról a teljes, aktuális szöveget olvassa el.",
      terms: "A felhasználási feltételek szabályozzák a GIN hivatalos weboldalához való hozzáférést és annak használatát. A teljes, aktuális jogi szöveg az irányadó.",
      privacy: "Az adatvédelmi irányelvek ismertetik, milyen adatokat gyűjt a GIN, és hogyan használja vagy osztja meg azokat. Személyes adatok megadása előtt olvassa el a teljes, aktuális szöveget.",
    },
    sourceNote: "Ez az oldal röviden összefoglalja a GIN által közzétett információkat. A teljes és naprakész tartalomért nyissa meg a hivatalos oldalt.",
    sourceAction: "Hivatalos oldal megnyitása",
    notice: "Az előnyökre, eredményekre és jövőbeli ajánlatokra vonatkozó állítások a GIN-nek tulajdonítottak, függetlenül nem igazoltak. Ez az összefoglaló nem helyettesíti a teljes szerződéses vagy jogi szöveget.",
  },
  sq: {
    sections: {
      memberBenefits: [
        { title: "Tarifa, anulimi dhe Major Weekend-i i parë", body: "GIN publikon një tarifë fillestare njëherëshe prej 1 500 USD dhe një tarifë mujore prej 150 USD; sipas GIN, anëtarësimi mund të anulohet në çdo kohë. Pas pranimit të aplikimit, GIN thotë se anëtari merr një biletë falas për një Major Weekend të ardhshëm tre-ditor; vlerën mbi 20 000 USD e deklaron vetë GIN dhe pjesëmarrja mund të jetë fizikisht ose virtualisht. Faqja thotë gjithashtu se për ngjarjet Major Weekend zakonisht kërkohet blerja e biletës, por ngjarja e parë është falas. Vlera e biletës dhe përfitimet janë deklarata të GIN, jo vlerësime të verifikuara në mënyrë të pavarur." },
        { title: "Përditësime javore dhe komunikime private", body: "GIN përshkruan një përditësim audio javor me email, zakonisht pesë deri në dhjetë minuta, nga Drejtori Menaxhues ose një Anëtar i nivelit të lartë. GIN përmend gjithashtu komunikime private konfidenciale herë pas here përmes SMS, telefonit, emailit ose postës kur informacionet globale urgjente për investime ose çështje të ngjashme mund të jenë të dobishme për anëtarët." },
        { title: "Kurse, takime dhe përfitime të tjera", body: "GIN njofton qasje falas në GIN Core Success Training, përfshirë kursin audio 14-orësh Success Mastery, „The Power of GIN and the GIN System” dhe „The 10 Steps to Success”. GIN pretendon se trajnimi përmban mbi 30 orë dhe ka vlerë mbi 20 000 USD nëse blihet veçmas; këto vlera nuk janë verifikuar në mënyrë të pavarur. Përmenden gjithashtu takime falas të kapitujve lokalë, personalisht ose virtualisht, seminare dhe rally virtuale tremujore, si dhe një audio javore për zhvillimin e anëtarëve. GIN thotë se përfitime të tjera zbulohen pas anëtarësimit. Konfirmoni kushtet dhe disponueshmërinë drejtpërdrejt me GIN." },
      ],
      membershipLevels: [
        { title: "Dymbëdhjetë nivele dhe qasja në Nivelin I", body: "GIN paraqet dymbëdhjetë nivele anëtarësimi; secili kërkon plotësimin e kushteve përkatëse dhe miratimin e komitetit të pranimit. Për Nivelin I, GIN liston tarifë fillestare 1 500 USD dhe kuotë mujore 150 USD. Ky nivel jep qasje në seksionet e Nivelit I në faqen e GIN; pjesëmarrja në ngjarjet GIN kërkon blerjen e biletës." },
        { title: "Nivele jo publike dhe njoftime të rëndësishme", body: "Detajet e niveleve më të larta shënohen CLASSIFIED në faqen zyrtare; ato nuk plotësohen dhe as hamendësohen këtu. GIN e përshkruan veten si organizatë informative dhe shoqatë private; sipas deklaratës së saj, nuk ofron këshilla financiare, tatimore, ligjore, investimi ose mjekësore dhe nuk është mundësi biznesi. GIN rekomandon konsultimin me këshilltarë të pavarur. Këto janë deklarata të organizatës dhe nuk zëvendësojnë verifikimin tuaj." },
      ],
    },
    summaries: {
      whatWeOffer: "GIN paraqet trajnimet për anëtarët, ngjarjet, rrjetëzimin, mentorimin dhe përfitimet e tjera të publikuara.",
      memberBenefits: "Kjo faqe përmbledh përfitimet e përshkruara nga GIN, duke përfshirë burimet e të mësuarit, ngjarjet, informacionin për anëtarët dhe burime të tjera.",
      successSystem: "GIN përshkruan një sistem me pesë pjesë të ndërtuar mbi trajnimet audio, librat, ngjarjet, njohjen dhe marrëdhëniet.",
      events: "Faqja paraqet ngjarje fizike dhe virtuale, Major Weekends, seminare, punëtori dhe takime ndërkombëtare; datat mund të ndryshojnë.",
      training: "Faqja e trajnimit përshkruan bibliotekën e materialeve për anëtarët dhe programet Success Mastery dhe Science of Personal Mastery; qasja mund të kërkojë anëtarësim.",
      membershipLevels: "GIN publikon dymbëdhjetë nivele anëtarësimi. Nivelet më të larta kërkojnë kualifikim dhe miratim nga Membership Acceptance Committee; detajet e shënuara CLASSIFIED nuk janë publike.",
      faq: "FAQ trajton përfitimet, aplikimin, tarifat, anulimin, pjesëmarrjen dhe pyetje rreth organizatës. Konfirmoni tarifat dhe kushtet aktuale përpara aplikimit.",
      hotels: "Galeria paraqet një përzgjedhje hotelesh dhe vendesh ku janë zhvilluar ngjarje dhe takime të GIN; ajo nuk konfirmon disponueshmërinë apo mundësinë e rezervimit.",
      clubhouses: "GIN përshkruan një rrjet në zhvillim të Clubhouses private për takime lokale, trajnime dhe aktivitete shoqërore; disponueshmëria e secilit vend duhet konfirmuar.",
      clubVision: "Vizioni i klubit paraqet idenë e GIN për një Successful Life Club privat dhe ndërkombëtar. Përfitimet dhe synimet e përshkruara janë deklarata të organizatës, jo rezultate të garantuara.",
      cruise: "Anija e propozuar FREEDOM është vetëm një koncept studimi fizibiliteti; ndërtimi, rezervimet, pronësia ose mundësitë e investimit nuk janë konfirmuar.",
      whyJoin: "GIN e përshkruan anëtarësimin si një komunitet privat me aplikim, të përqendruar te ndarja e njohurive, marrëdhëniet dhe mësimi për anëtarët; nuk garantohen rezultate.",
      whoWeAre: "Kjo faqe përmbledh prezantimin e vetë GIN për origjinën, kredon, strukturën private të anëtarësimit dhe synimet ndërkombëtare.",
      memberAgreement: "Marrëveshja e anëtarit përmban kushtet e zbatueshme për anëtarësimin në GIN. Lexoni tekstin e plotë dhe aktual për tarifat, detyrimet, anulimin dhe rregullat e sjelljes.",
      terms: "Kushtet e përdorimit rregullojnë qasjen dhe përdorimin e faqes zyrtare të GIN. Teksti i plotë dhe aktual ligjor është ai që zbatohet.",
      privacy: "Politika e privatësisë përshkruan informacionin që mbledh GIN dhe mënyrën se si e përdor ose e ndan atë. Lexoni tekstin e plotë dhe aktual përpara se të dërgoni të dhëna personale.",
    },
    sourceNote: "Kjo faqe përmbledh shkurtimisht informacionin e publikuar nga GIN. Për përmbajtjen e plotë dhe të përditësuar, hapni faqen zyrtare.",
    sourceAction: "Hap faqen zyrtare",
    notice: "Pretendimet për përfitimet, rezultatet dhe ofertat e ardhshme i atribuohen GIN dhe nuk janë verifikuar në mënyrë të pavarur. Kjo përmbledhje nuk zëvendëson tekstet e plota kontraktore ose ligjore.",
  },
  pt: {
    sections: {
      memberBenefits: [
        { title: "Taxas, cancelamento e comunicados semanais", body: "A GIN indica uma taxa única de adesão de 1 500 USD e uma quota mensal contínua de 150 USD; segundo a GIN, a adesão pode ser cancelada a qualquer momento. A página refere uma atualização áudio semanal por e-mail, normalmente com cinco a dez minutos, enviada pelo Diretor Administrativo ou por um Membro de alto nível. Também menciona comunicados privados e confidenciais ocasionais por SMS, telefone, e-mail ou correio postal quando informações globais urgentes relacionadas com investimentos ou assuntos semelhantes possam ser úteis aos membros." },
        { title: "Bilhete Major Weekend e regra do primeiro evento", body: "A página portuguesa de benefícios não menciona um bilhete gratuito específico para um Major Weekend de três dias nem o valor superior a 20 000 USD indicado em algumas outras versões oficiais. Não apresentamos, portanto, essa oferta como benefício confirmado na versão portuguesa. A página afirma, porém, que os grandes eventos de fim de semana exigem a compra de bilhete e que o primeiro evento é GRATUITO. As condições podem variar entre páginas oficiais e devem ser confirmadas diretamente com a GIN." },
        { title: "Formação, reuniões e outros benefícios", body: "A GIN anuncia acesso gratuito ao GIN Core Success Training, incluindo o curso áudio Success Mastery de 14 horas, „The Power of GIN and the GIN System” e „The 10 Steps to Success”. A GIN afirma que a formação excede 30 horas e que o seu valor de compra em separado ultrapassa 20 000 USD; estes valores não foram verificados de forma independente. A página também menciona acesso gratuito a reuniões de capítulos locais, presenciais ou virtuais, seminários e encontros virtuais trimestrais, e um áudio semanal de desenvolvimento dos membros. A GIN diz que outros benefícios serão revelados após a adesão. Confirme diretamente com a GIN o âmbito, a disponibilidade e as condições atuais." },
      ],
      membershipLevels: [
        { title: "Doze níveis e acesso ao Nível I", body: "A GIN apresenta doze níveis de adesão, sujeitos ao cumprimento de requisitos específicos e à aprovação do Comité de Aceitação de Membros. Para o Nível I, indica uma taxa de iniciação de 1 500 USD e quotas mensais de 150 USD. O Nível I dá acesso às áreas de membros de Nível I no sítio Web da GIN; a participação nos eventos GIN exige a compra de bilhete." },
        { title: "Níveis não públicos e avisos importantes", body: "Os detalhes dos níveis superiores estão classificados na página oficial; não são reproduzidos nem presumidos aqui. A GIN declara ser uma organização informativa e uma associação privada; afirma que não presta aconselhamento financeiro, fiscal, jurídico, de investimento ou médico e que não é uma oportunidade de negócio. Recomenda a consulta de especialistas independentes. Estas informações reproduzem a declaração da organização e não substituem uma avaliação própria." },
      ],
    },
    summaries: {
      whatWeOffer: "A GIN apresenta formações para membros, eventos, networking, mentoria e outros benefícios publicados.",
      memberBenefits: "Esta página resume os benefícios descritos pela GIN, incluindo recursos de aprendizagem, eventos, informações para membros e outros recursos.",
      successSystem: "A GIN descreve um sistema de cinco partes baseado em formações áudio, livros, eventos, reconhecimento e relacionamentos.",
      events: "A página apresenta eventos presenciais e virtuais, Major Weekends, seminários, workshops e encontros internacionais; as datas podem mudar.",
      training: "A página de formação descreve a biblioteca de conteúdos para membros e programas como Success Mastery e Science of Personal Mastery; o acesso pode exigir adesão.",
      membershipLevels: "A GIN publica doze níveis de adesão. Os níveis superiores exigem qualificação e aprovação do Membership Acceptance Committee; os detalhes marcados CLASSIFIED não são públicos.",
      faq: "As perguntas frequentes abordam benefícios, candidatura, quotas, cancelamento, participação e questões sobre a organização. Confirme as taxas e condições atuais antes de se candidatar.",
      hotels: "A galeria apresenta uma seleção de hotéis e locais onde decorreram eventos e reuniões da GIN; não confirma disponibilidade nem possibilidade de reserva.",
      clubhouses: "A GIN descreve uma rede em desenvolvimento de Clubhouses privados para encontros locais, formação e atividades sociais; a disponibilidade de cada local deve ser confirmada.",
      clubVision: "A Club Vision apresenta a ideia da GIN de um Successful Life Club privado e internacional. Os benefícios e objetivos descritos são declarações da organização, não resultados garantidos.",
      cruise: "O navio de cruzeiro FREEDOM proposto é um conceito sujeito a estudo de viabilidade; a construção, reservas, propriedade ou oportunidades de investimento não estão confirmadas.",
      whyJoin: "A GIN descreve a adesão como uma comunidade privada baseada em candidatura, centrada na partilha de conhecimento, relações e aprendizagem exclusiva para membros; não garante resultados.",
      whoWeAre: "Esta página resume a apresentação da própria GIN sobre as suas origens, credo, estrutura de adesão privada e objetivos internacionais.",
      memberAgreement: "O acordo de membro contém as condições aplicáveis à adesão à GIN. Consulte o texto completo e atual sobre taxas, obrigações, cancelamento e regras de conduta.",
      terms: "Os termos de utilização regulam o acesso e a utilização do site oficial da GIN. O texto jurídico completo e atual é o que prevalece.",
      privacy: "A política de privacidade descreve as informações recolhidas pela GIN e a forma como são utilizadas ou partilhadas. Leia o texto completo e atual antes de enviar dados pessoais.",
    },
    sourceNote: "Esta página resume brevemente as informações publicadas pela GIN. Consulte a página oficial para obter o conteúdo completo e atualizado.",
    sourceAction: "Abrir a página oficial",
    notice: "As afirmações sobre benefícios, resultados e ofertas futuras são atribuídas à GIN e não foram verificadas de forma independente. Este resumo não substitui contratos ou documentos jurídicos completos.",
  },
};

export function getOfficialReferenceCopy(locale: Exclude<OfficialPublicLocaleCode, "en">, page: OfficialReferencePageKey) {
  const copy = officialPublicReferenceCopy[locale];
  return {
    intro: copy.summaries[page],
    sections: copy.sections[page] ?? [],
    sourceNote: copy.sourceNote,
    action: copy.sourceAction,
    legalNotice: copy.notice,
  };
}
