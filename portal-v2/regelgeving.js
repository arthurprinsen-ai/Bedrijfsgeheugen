/**
 * Regelgevingsregister van Bedrijfsgeheugen.
 *
 * Wat een organisatie raakt aan wet- en regelgeving: AI, arbeid, cyber,
 * privacy, duurzaamheid, financieel en producten. Per regel staat vast wat hij
 * inhoudt, wie hij raakt, welke data er gelden, waar het staat, en — dat is het
 * belangrijkste — wanneer de informatie voor het laatst is nagekeken en wanneer
 * dat opnieuw moet.
 *
 * Waarom dat laatste erin zit
 * ---------------------------
 * Een lijst met wetten in een repo is per definitie een momentopname. Data
 * schuiven. Het duidelijkste voorbeeld staat hieronder: de hoog-risico-
 * verplichtingen van de AI Act stonden jarenlang op 2 augustus 2026 en zijn op
 * 27 juli 2026 — zes dagen voor die deadline — via de Digital Omnibus
 * verschoven naar 2 december 2027. Wie in juni 2026 een statisch overzicht had
 * gemaakt, gaf zijn klanten vanaf augustus verkeerde informatie zonder het te
 * merken.
 *
 * Dit register kan zichzelf niet bijwerken. Wat het wél doet, is weigeren stil
 * te verouderen: elke regel heeft een `peildatum` en een `herzienUiterlijk`, en
 * tests/delivery-regelgeving-actueel.test.mjs gaat rood zodra een van die
 * termijnen verstrijkt of zodra een aangekondigde datum gepasseerd is terwijl
 * de status nog op "verwacht" staat.
 *
 * Bij elke wijziging: pas de inhoud aan, zet de peildatum op vandaag en zet
 * herzienUiterlijk vooruit. Niet andersom.
 */

const VANDAAG = '2026-09-10';

/** Hoe hard een regel is. */
export const STATUS = Object.freeze({
  GELDT: 'geldt',              // in werking, verplichtingen lopen
  GEFASEERD: 'gefaseerd',      // deels in werking, resterende data in de toekomst
  VERWACHT: 'verwacht',        // aangenomen of aangekondigd, nog niet in werking
  VOORSTEL: 'voorstel'         // nog in het wetgevingsproces, inhoud kan wijzigen
});

export const CATEGORIEEN = Object.freeze({
  ai: 'AI en algoritmes',
  arbeid: 'Arbeid en personeel',
  cyber: 'Cyber en weerbaarheid',
  privacy: 'Privacy en gegevens',
  duurzaam: 'Duurzaamheid en keten',
  financieel: 'Financieel en fiscaal',
  product: 'Producten en diensten'
});

const regel = item => Object.freeze({ ...item, mijlpalen: Object.freeze(item.mijlpalen || []) });

export const REGELGEVING = Object.freeze([
  regel({
    id: 'eu-ai-act', categorie: 'ai', naam: 'EU AI Act (Verordening 2024/1689)',
    wat: 'Europese regels voor het ontwikkelen, aanbieden en gebruiken van AI, ingedeeld naar risico.',
    raakt: 'Iedere organisatie die AI ontwikkelt, inkoopt of op de werkvloer gebruikt.',
    status: STATUS.GEFASEERD,
    mijlpalen: [
      { datum: '2025-02-02', wat: 'Verboden AI-praktijken en de plicht tot AI-geletterdheid gelden.' },
      { datum: '2025-08-02', wat: 'Regels voor general-purpose AI-modellen, governance en sancties gelden.' },
      { datum: '2026-08-02', wat: 'Transparantieplicht (artikel 50): mensen moeten weten dat ze met AI te maken hebben.' },
      { datum: '2026-12-02', wat: 'Einde overgangstermijn markering AI-gegenereerde content; nieuw verbod op nudifiers en AI-gegenereerd kindermisbruikmateriaal.' },
      { datum: '2027-12-02', wat: 'Hoog-risico AI uit bijlage III (werving, beoordeling, kredietscores) moet voldoen.' },
      { datum: '2028-08-02', wat: 'Hoog-risico AI in gereguleerde producten (bijlage I) moet voldoen.' }
    ],
    letop: 'De hoog-risicodata zijn op 27 juli 2026 verschoven door de Digital Omnibus, Verordening (EU) 2026/1744. Bronnen van vóór augustus 2026 noemen nog 2 augustus 2026 en zijn dus onjuist.',
    bron: 'EUR-Lex / Digital Omnibus on AI', url: 'https://eur-lex.europa.eu/eli/reg/2024/1689/oj',
    peildatum: '2026-09-10', herzienUiterlijk: '2026-12-15'
  }),
  regel({
    id: 'ai-geletterdheid', categorie: 'ai', naam: 'AI-geletterdheid (artikel 4 AI Act)',
    wat: 'Personeel dat met AI werkt moet voldoende kennis hebben van wat het systeem doet en waar het misgaat.',
    raakt: 'Elke werkgever die AI inzet, ongeacht omvang.',
    status: STATUS.GELDT,
    mijlpalen: [{ datum: '2025-02-02', wat: 'Verplichting geldt.' },
                { datum: '2026-07-27', wat: 'Door de Digital Omnibus versoepeld van resultaats- naar inspanningsverplichting.' }],
    bron: 'EUR-Lex', url: 'https://eur-lex.europa.eu/eli/reg/2024/1689/oj',
    peildatum: '2026-09-10', herzienUiterlijk: '2027-02-01'
  }),
  regel({
    id: 'avg', categorie: 'privacy', naam: 'AVG / GDPR',
    wat: 'Regels voor het verwerken van persoonsgegevens: grondslag, dataminimalisatie, beveiliging, rechten van betrokkenen en meldplicht bij datalekken.',
    raakt: 'Elke organisatie die persoonsgegevens verwerkt.',
    status: STATUS.GELDT,
    mijlpalen: [{ datum: '2018-05-25', wat: 'Van toepassing.' }],
    letop: 'Bij AI-inzet komen AVG en AI Act samen: een verwerkingsgrondslag is iets anders dan een AI-risicoclassificatie, allebei zijn nodig.',
    bron: 'Autoriteit Persoonsgegevens', url: 'https://www.autoriteitpersoonsgegevens.nl',
    peildatum: '2026-09-10', herzienUiterlijk: '2027-09-01'
  }),
  regel({
    id: 'cyberbeveiligingswet', categorie: 'cyber', naam: 'Cyberbeveiligingswet (NIS2)',
    wat: 'Zorgplicht, meldplicht en registratieplicht voor digitale weerbaarheid. Bestuurders zijn aanspreekbaar.',
    raakt: 'Ruim 8.000 organisaties in achttien sectoren. Ook leveranciers daarvan, via ketenverantwoordelijkheid: klanten leggen de eisen door.',
    status: STATUS.GELDT,
    mijlpalen: [{ datum: '2026-07-07', wat: 'Aangenomen door de Eerste Kamer.' },
                { datum: '2026-08-15', wat: 'In werking, zonder formele gedoogperiode.' }],
    letop: 'Ook als je zelf niet onder de wet valt kun je er via je klanten mee te maken krijgen. Dat is voor het mkb vaak de werkelijke route.',
    bron: 'NCSC, Cyberbeveiligingswet', url: 'https://www.ncsc.nl/cyberbeveiligingswet-nis2',
    peildatum: '2026-09-10', herzienUiterlijk: '2027-02-15'
  }),
  regel({
    id: 'wwke', categorie: 'cyber', naam: 'Wet weerbaarheid kritieke entiteiten',
    wat: 'Fysieke en organisatorische weerbaarheid van entiteiten met een kritieke functie.',
    raakt: 'Circa 500 organisaties, formeel aangewezen als kritieke entiteit.',
    status: STATUS.GELDT,
    mijlpalen: [{ datum: '2026-08-15', wat: 'In werking.' }],
    bron: 'Rijksoverheid', url: 'https://www.rijksoverheid.nl/onderwerpen/cybersecurity',
    peildatum: '2026-09-10', herzienUiterlijk: '2027-02-15'
  }),
  regel({
    id: 'cra', categorie: 'product', naam: 'Cyber Resilience Act (Verordening 2024/2847)',
    wat: 'Verplichte cybereisen voor producten met digitale elementen: veilig ontwerp, updates gedurende de levensduur en kwetsbaarhedenbeheer.',
    raakt: 'Fabrikanten, importeurs en distributeurs van hardware en software op de EU-markt.',
    status: STATUS.GEFASEERD,
    mijlpalen: [{ datum: '2026-09-11', wat: 'Meldplicht voor actief misbruikte kwetsbaarheden en ernstige incidenten, via het meldloket van het NCSC.' }],
    letop: 'De meldplicht geldt ook voor producten die al op de markt staan.',
    bron: 'Rijksinspectie Digitale Infrastructuur', url: 'https://www.rdi.nl/onderwerpen/draadloze-apparatuur/handel-en-apparatuur/cra',
    peildatum: '2026-09-10', herzienUiterlijk: '2026-12-15'
  }),
  regel({
    id: 'schijnzelfstandigheid', categorie: 'arbeid', naam: 'Handhaving schijnzelfstandigheid',
    wat: 'De Belastingdienst beoordeelt of een zzp-relatie feitelijk een dienstverband is. Bij herkwalificatie volgen naheffingen, en bij opzet of grove schuld vergrijpboetes.',
    raakt: 'Elke opdrachtgever die met zzp\'ers werkt.',
    status: STATUS.GELDT,
    mijlpalen: [{ datum: '2025-01-01', wat: 'Handhavingsmoratorium opgeheven.' },
                { datum: '2026-01-01', wat: 'Strengere handhaving; controles zonder voorafgaande waarschuwing mogelijk.' },
                { datum: '2027-01-01', wat: 'Einde van de gedeeltelijk verlengde zachte landing.' }],
    letop: 'Naast de fiscus is er een tweede route: de zzp\'er zelf kan bij de rechter een dienstverband claimen, met terugwerkende kracht tot vijf jaar en bij pensioen langer.',
    bron: 'Belastingdienst, Handhavingsplan arbeidsrelaties', url: 'https://www.belastingdienst.nl',
    peildatum: '2026-09-10', herzienUiterlijk: '2026-12-15'
  }),
  regel({
    id: 'rechtsvermoeden-uurtarief', categorie: 'arbeid', naam: 'Wet invoering rechtsvermoeden van arbeidsovereenkomst op basis van uurtarief (36.783)',
    wat: 'Onder een bepaald uurtarief geldt een rechtsvermoeden van werknemerschap. De opdrachtgever moet dan aannemelijk maken dat er géén dienstverband is.',
    raakt: 'Opdrachtgevers die met zelfstandigen werken tegen een laag uurtarief.',
    status: STATUS.GEFASEERD,
    mijlpalen: [{ datum: '2026-04-21', wat: 'Aangenomen door de Tweede Kamer.' },
                { datum: '2026-06-16', wat: 'Aangenomen door de Eerste Kamer.' },
                { datum: '2027-01-01', wat: 'Beoogd minimumtarief van 38 euro per uur volgens de huidige plannen.' }],
    letop: 'Let op: dit is niet de Wet Vbar. Het verduidelijkingsdeel van de Vbar is bij nota van wijziging geschrapt en gaat als apart wetsvoorstel verder onder de naam Zelfstandigenwet. Het rechtsvermoeden werkt alleen civielrechtelijk tussen opdrachtgever en zelfstandige; de Belastingdienst kan er geen beroep op doen en toetst met het eigen holistische kader. De datum van inwerkingtreding volgt bij koninklijk besluit.',
    bron: 'Eerste Kamer, dossier 36.783', url: 'https://www.eerstekamer.nl/wetsvoorstel/36783_wet_invoering',
    peildatum: '2026-09-10', herzienUiterlijk: '2026-11-15'
  }),
  regel({
    id: 'zelfstandigenwet', categorie: 'arbeid', naam: 'Zelfstandigenwet (opvolger van de Vbar-verduidelijking)',
    wat: 'Nieuw wetsvoorstel dat moet verduidelijken wanneer iemand zelfstandige is en wanneer werknemer.',
    raakt: 'Elke opdrachtgever die met zelfstandigen werkt.',
    status: STATUS.VOORSTEL,
    letop: 'Wetsvoorstel in wording: er ligt nog geen aangenomen tekst en geen datum. De Wet Vbar zoals die tot maart 2026 werd aangekondigd wordt niet ingevoerd; wie daar nog naar verwijst, verwijst naar een gepasseerd station.',
    bron: 'Eerste Kamer, dossier 36.783 (toelichting nota van wijziging)', url: 'https://www.eerstekamer.nl/wetsvoorstel/36783_wet_invoering',
    peildatum: '2026-09-10', herzienUiterlijk: '2026-11-15'
  }),
  regel({
    id: 'wtta', categorie: 'arbeid', naam: 'Wet toelating terbeschikkingstelling arbeidskrachten (Wtta)',
    wat: 'Uitleners van arbeidskrachten moeten toegelaten zijn. Inleners mogen alleen met toegelaten uitleners werken.',
    raakt: 'Elke organisatie die uitzendkrachten of gedetacheerden inleent.',
    status: STATUS.VERWACHT,
    mijlpalen: [{ datum: '2027-01-01', wat: 'Van kracht.' },
                { datum: '2028-01-01', wat: 'Boete mogelijk bij inlenen van een niet-toegelaten uitlener.' }],
    bron: 'AWVN, overzicht wet- en regelgeving', url: 'https://www.awvn.nl/publicaties/veranderende-wet-en-regelgeving-2026/',
    peildatum: '2026-09-10', herzienUiterlijk: '2026-12-15'
  }),
  regel({
    id: 'loontransparantie', categorie: 'arbeid', naam: 'Loontransparantie (EU-richtlijn 2023/970)',
    wat: 'Inzicht in beloning, verbod op vragen naar het huidige salaris, en rapportage over de beloningskloof tussen mannen en vrouwen.',
    raakt: 'Werkgevers; rapportageplicht schaalt mee met de omvang.',
    status: STATUS.GEFASEERD,
    mijlpalen: [{ datum: '2026-06-07', wat: 'Uiterste datum waarop lidstaten de richtlijn moesten omzetten; die termijn is verstreken.' },
                { datum: '2027-01-01', wat: 'Verwachte inwerkingtreding van de Nederlandse implementatie.' }],
    letop: 'De Nederlandse omzetting loopt achter op de Europese termijn. Een richtlijn die te laat is omgezet kan onder omstandigheden al rechtstreekse werking hebben richting de overheid. Controleer de actuele stand voordat je hier iets over toezegt.',
    bron: 'AWVN, overzicht wet- en regelgeving', url: 'https://www.awvn.nl/publicaties/veranderende-wet-en-regelgeving-2026/',
    peildatum: '2026-09-10', herzienUiterlijk: '2026-11-15'
  }),
  regel({
    id: 'flexwerkers', categorie: 'arbeid', naam: 'Wet meer zekerheid flexwerkers',
    wat: 'Verbod op nulurencontracten, invoering van bandbreedtecontracten met een marge van dertig procent.',
    raakt: 'Werkgevers met oproep- of min-maxcontracten.',
    status: STATUS.VOORSTEL,
    mijlpalen: [{ datum: '2027-01-01', wat: 'Verwachte inwerkingtreding.' }],
    letop: 'Wetsvoorstel: de bandbreedte van dertig procent en het verbod op nulurencontracten kunnen tijdens de behandeling nog wijzigen. Niet als vaststaand presenteren.',
    bron: 'AWVN, overzicht wet- en regelgeving', url: 'https://www.awvn.nl/publicaties/veranderende-wet-en-regelgeving-2026/',
    peildatum: '2026-09-10', herzienUiterlijk: '2026-12-15'
  }),
  regel({
    id: 'wia-bedrijfsarts', categorie: 'arbeid', naam: 'Advies bedrijfsarts leidend bij WIA',
    wat: 'Het oordeel van de bedrijfsarts wordt leidend bij de WIA-beoordeling.',
    raakt: 'Werkgevers met langdurig zieke medewerkers.',
    status: STATUS.VERWACHT,
    mijlpalen: [{ datum: '2028-01-01', wat: 'Van toepassing, voor medewerkers die ziek worden vanaf 1 januari 2026.' }],
    bron: 'Rijksoverheid', url: 'https://www.rijksoverheid.nl/onderwerpen/ziekteverzuim-en-re-integratie',
    peildatum: '2026-09-10', herzienUiterlijk: '2027-06-01'
  }),
  regel({
    id: 'arbowet-rie', categorie: 'arbeid', naam: 'Arbowet: risico-inventarisatie en preventiemedewerker',
    wat: 'Elke werkgever heeft een actuele RI&E met plan van aanpak en wijst een preventiemedewerker aan.',
    raakt: 'Elke werkgever met personeel.',
    status: STATUS.GELDT,
    letop: 'Dit is de meest gecontroleerde en meest verwaarloosde verplichting in het mkb. Een verouderde RI&E telt als geen RI&E.',
    bron: 'Nederlandse Arbeidsinspectie', url: 'https://www.nlarbeidsinspectie.nl',
    peildatum: '2026-09-10', herzienUiterlijk: '2027-09-01'
  }),
  regel({
    id: 'klokkenluiders', categorie: 'arbeid', naam: 'Wet bescherming klokkenluiders',
    wat: 'Interne meldprocedure en bescherming van melders tegen benadeling.',
    raakt: 'Werkgevers vanaf vijftig medewerkers.',
    status: STATUS.GELDT,
    bron: 'Huis voor Klokkenluiders', url: 'https://www.huisvoorklokkenluiders.nl',
    peildatum: '2026-09-10', herzienUiterlijk: '2027-09-01'
  }),
  regel({
    id: 'pensioen-wtp', categorie: 'arbeid', naam: 'Wet toekomst pensioenen',
    wat: 'Overgang naar het nieuwe pensioenstelsel; bestaande regelingen moeten worden aangepast.',
    raakt: 'Werkgevers met een pensioenregeling.',
    status: STATUS.GEFASEERD,
    mijlpalen: [{ datum: '2028-01-01', wat: 'Uiterste datum waarop regelingen moeten zijn omgezet.' }],
    bron: 'Rijksoverheid', url: 'https://www.rijksoverheid.nl/onderwerpen/pensioen',
    peildatum: '2026-09-10', herzienUiterlijk: '2027-06-01'
  }),
  regel({
    id: 'csrd', categorie: 'duurzaam', naam: 'CSRD, gewijzigd door Omnibus (Richtlijn 2026/470)',
    wat: 'Rapportage over duurzaamheid volgens Europese standaarden.',
    raakt: 'Vanaf boekjaren die starten op of na 1 januari 2027: meer dan 1.000 medewerkers én meer dan 450 miljoen euro netto-omzet. Beursgenoteerde kleine ondernemingen vallen er volledig buiten.',
    status: STATUS.GEFASEERD,
    mijlpalen: [{ datum: '2026-02-26', wat: 'Omnibus-richtlijn gepubliceerd; versoepelingen definitief.' },
                { datum: '2027-01-01', wat: 'Nieuwe drempels gelden vanaf boekjaren die op of na deze datum starten.' },
                { datum: '2027-03-19', wat: 'Uiterste datum voor omzetting in Nederlands recht.' }],
    letop: 'Voor het mkb verandert de wet, maar de marktvraag niet: grote klanten blijven ketengegevens opvragen, begrensd tot de vrijwillige VSME-standaard.',
    bron: 'RVO, Omnibusvoorstel', url: 'https://www.rvo.nl/onderwerpen/omnibusvoorstel',
    peildatum: '2026-09-10', herzienUiterlijk: '2027-01-15'
  }),
  regel({
    id: 'csddd', categorie: 'duurzaam', naam: 'CSDDD (gepaste zorgvuldigheid in de keten)',
    wat: 'Onderzoek doen naar en handelen op mensenrechten- en milieurisico\'s in de eigen keten.',
    raakt: 'Meer dan 5.000 medewerkers én meer dan 1,5 miljard euro netto-omzet.',
    status: STATUS.GEFASEERD,
    mijlpalen: [{ datum: '2026-02-26', wat: 'Drempels verhoogd; verplicht klimaattransitieplan vervallen.' }],
    bron: 'RVO, Omnibusvoorstel', url: 'https://www.rvo.nl/onderwerpen/omnibusvoorstel',
    peildatum: '2026-09-10', herzienUiterlijk: '2027-01-15'
  }),
  regel({
    id: 'data-act', categorie: 'privacy', naam: 'Data Act (Verordening 2023/2854)',
    wat: 'Toegang tot en overdraagbaarheid van data uit verbonden producten, en het makkelijker wisselen van clouddienst.',
    raakt: 'Aanbieders van verbonden producten en clouddiensten, en hun zakelijke afnemers.',
    status: STATUS.GELDT,
    mijlpalen: [{ datum: '2025-09-12', wat: 'Van toepassing.' }],
    bron: 'ICTRecht wetgevingsoverzicht', url: 'https://www.ictrecht.nl/hubfs/Kennisdocumenten/ICTRecht%20Wetgevingsoverzicht.pdf',
    peildatum: '2026-09-10', herzienUiterlijk: '2027-03-01'
  }),
  regel({
    id: 'wwft', categorie: 'financieel', naam: 'Wwft (witwassen en terrorismefinanciering)',
    wat: 'Cliëntenonderzoek, doorlopende monitoring en melding van ongebruikelijke transacties.',
    raakt: 'Accountants, adviseurs, makelaars, financiële dienstverleners en handelaren in goederen boven de contantgrens.',
    status: STATUS.GELDT,
    bron: 'FIU-Nederland, meldportaal', url: 'https://www.fiu-nederland.nl',
    peildatum: '2026-09-10', herzienUiterlijk: '2027-06-01'
  }),
  regel({
    id: 'dora', categorie: 'financieel', naam: 'DORA (digitale operationele weerbaarheid)',
    wat: 'Eisen aan ICT-risicobeheer, incidentrapportage en het toezicht op kritieke ICT-dienstverleners.',
    raakt: 'Financiële instellingen en hun ICT-leveranciers.',
    status: STATUS.GELDT,
    mijlpalen: [{ datum: '2025-01-17', wat: 'Van toepassing.' }],
    bron: 'De Nederlandsche Bank', url: 'https://www.dnb.nl',
    peildatum: '2026-09-10', herzienUiterlijk: '2027-03-01'
  }),
  regel({
    id: 'toegankelijkheid', categorie: 'product', naam: 'European Accessibility Act',
    wat: 'Toegankelijkheidseisen voor onder meer webshops, bankdiensten, e-books en klantenservice.',
    raakt: 'Aanbieders van consumentgerichte digitale diensten; micro-ondernemingen zijn deels uitgezonderd.',
    status: STATUS.GELDT,
    mijlpalen: [{ datum: '2025-06-28', wat: 'Van toepassing.' }],
    bron: 'ICTRecht wetgevingsoverzicht', url: 'https://www.ictrecht.nl/hubfs/Kennisdocumenten/ICTRecht%20Wetgevingsoverzicht.pdf',
    peildatum: '2026-09-10', herzienUiterlijk: '2027-03-01'
  })
]);

/* ---------- gebruik ---------- */

const dag = value => String(value || '').slice(0, 10);
const isDatum = value => /^\d{4}-\d{2}-\d{2}$/.test(dag(value));

/** Alle regels in een categorie. */
export function regelsInCategorie(categorie) {
  return REGELGEVING.filter(item => item.categorie === categorie);
}

/**
 * Wat er de komende periode verandert, op datum gesorteerd.
 * Geeft per mijlpaal de regel erbij, zodat een scherm niets hoeft op te zoeken.
 */
export function komendeMijlpalen(vanaf = VANDAAG, maanden = 18) {
  const start = new Date(dag(vanaf));
  const eind = new Date(start); eind.setMonth(eind.getMonth() + maanden);
  return REGELGEVING
    .flatMap(item => item.mijlpalen.map(m => ({ ...m, regel: item.naam, id: item.id, categorie: item.categorie })))
    .filter(m => isDatum(m.datum) && new Date(m.datum) >= start && new Date(m.datum) <= eind)
    .sort((a, b) => a.datum.localeCompare(b.datum));
}

/** Mijlpalen die al gepasseerd zijn: dat zijn de verplichtingen die nu lopen. */
export function lopendeVerplichtingen(peil = VANDAAG) {
  return REGELGEVING
    .flatMap(item => item.mijlpalen.map(m => ({ ...m, regel: item.naam, id: item.id, categorie: item.categorie })))
    .filter(m => isDatum(m.datum) && new Date(m.datum) <= new Date(dag(peil)))
    .sort((a, b) => b.datum.localeCompare(a.datum));
}

/**
 * Regels waarvan de informatie aan herziening toe is. Dit is de kern van
 * "altijd actueel": het register kan zichzelf niet bijwerken, maar het kan wel
 * melden dat het niet meer te vertrouwen is.
 */
export function verlopenHerzieningen(peil = VANDAAG) {
  const nu = new Date(dag(peil));
  return REGELGEVING.filter(item => isDatum(item.herzienUiterlijk) && new Date(item.herzienUiterlijk) < nu);
}

/**
 * Regels waarvan een aangekondigde datum gepasseerd is terwijl de status nog
 * op verwacht of voorstel staat. Dan klopt het register niet meer met de
 * werkelijkheid, ook al is de herzieningsdatum nog niet verstreken.
 */
export function achterhaaldeStatus(peil = VANDAAG) {
  const nu = new Date(dag(peil));
  return REGELGEVING.filter(item => {
    if (item.status !== STATUS.VERWACHT && item.status !== STATUS.VOORSTEL) return false;
    return item.mijlpalen.some(m => isDatum(m.datum) && new Date(m.datum) <= nu);
  });
}

/** Regels die bij een branche horen, op basis van de wetgeving in external-data.js. */
export function regelsVoorBranche(brancheWetten = []) {
  const tekst = brancheWetten.join(' ').toLocaleLowerCase('nl');
  return REGELGEVING.filter(item =>
    tekst.includes(item.naam.toLocaleLowerCase('nl').split(' (')[0].slice(0, 12)) ||
    item.categorie === 'arbeid' || item.categorie === 'privacy');
}

export const REGELGEVING_PEILDATUM = VANDAAG;
export const REGELGEVING_VERSION = '2026-09-10-v1';
