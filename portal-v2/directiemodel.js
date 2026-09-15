/**
 * Het stuurmodel van het portaal: de zes vragen die een directie stelt.
 *
 * Waarom dit bestand bestaat
 * --------------------------
 * De zijbalk was een mappenkast: Besturen, Realiseren, Data & intelligence.
 * Een map zegt waar iets staat, niet waarom je er zou kijken. Een directie
 * opent een portaal met een vraag. Dit bestand is de enige plek waar die zes
 * vragen staan, mét de pagina's die het antwoord dragen.
 *
 * Het heeft bewust geen imports. Zowel de zijbalk (page-registry.js) als het
 * antwoordblok op Overzicht (modules/directievragen.js) leest hieruit; zou een
 * van de twee een eigen lijst bijhouden, dan lopen zijbalk en antwoord binnen
 * een maand uit elkaar en beantwoordt een groep een andere vraag dan hij belooft.
 *
 * Regel bij het indelen: elke pagina hangt onder precies één vraag. Een pagina
 * die onder twee vragen hangt, is een pagina waarvan niemand weet waarvoor hij
 * dient. `paginas[0]` is de pagina die de vraag het meest direct beantwoordt;
 * die wordt geopend als je op de vraag zelf klikt.
 */

export const DIRECTIEMODEL = Object.freeze([
  Object.freeze({
    id: 'gezond',
    vraag: 'Hoe gezond zijn we?',
    domein: 'Vitaliteit en verdiencapaciteit',
    icoon: '\u2661',
    mist: 'Nog geen volwassenheid ingevuld voor de bedrijfsonderdelen.',
    invul: 'gegevens-invullen',
    paginas: Object.freeze(['profiel', 'cijfers-maatstaven', 'businesscase', 'waarde-financiering', 'mensen', 'gegevens-invullen', 'ingevulde-gegevens'])
  }),
  Object.freeze({
    id: 'vastlopen',
    vraag: 'Waar loopt het vast?',
    domein: 'Frictie, lekkage en afhankelijkheid',
    icoon: '\u26a0',
    mist: 'Nog geen doorgerekend knelpunt: vul uren, kosten en omzet aan.',
    invul: 'gegevens-invullen',
    paginas: Object.freeze(['ai-capabilities', 'taken-werkstromen', 'uitvoeringsladder', 'wijzigingen', 'actueel-houden'])
  }),
  Object.freeze({
    id: 'koers',
    vraag: 'Volgen we onze koers?',
    domein: 'Strategie tegenover uitvoering',
    icoon: '\u2197',
    mist: 'Nog geen roadmap met eigenaren en voortgang.',
    invul: 'roadmap',
    paginas: Object.freeze(['roadmap', 'strategie-naar-maandagochtend', 'strategy-dna', 'strategiemodellen', 'canvassen', 'modellen', 'eindconclusie'])
  }),
  Object.freeze({
    id: 'aankomend',
    vraag: 'Wat komt er op ons af?',
    domein: 'Kansen, bedreigingen en wetgeving',
    icoon: '\u25f7',
    mist: 'Nog geen verplichting of ontwikkeling met een datum voor dit bedrijf.',
    invul: 'compliance-governance',
    paginas: Object.freeze(['compliance-governance', 'compliance-command-center', 'eu-ai-act-audit', 'csrd-impact', 'branche-markt', 'onderzoek', 'audit', 'audittrail', 'due-diligence', 'exit'])
  }),
  Object.freeze({
    id: 'zelf',
    vraag: 'Wat kunnen we zelf?',
    domein: 'Kennis, data en AI-capaciteit',
    icoon: '\u2726',
    mist: 'Nog geen kansen afgeleid: doe eerst de scan.',
    invul: 'ai-scan',
    paginas: Object.freeze(['ai-scan', 'kansenkaart', 'data-ai', 'koppelingen', 'data-ai-passport', 'brain-verwerking', 'bronnenstatus', 'datahubstatus', 'agentstatus', 'documenten'])
  }),
  Object.freeze({
    id: 'besluit',
    vraag: 'Wat besluiten we nu?',
    domein: 'Van besluit naar aantoonbaar resultaat',
    icoon: '\u2713',
    mist: 'Zonder eigen gegevens geen advies; het portaal verzint er geen.',
    invul: 'gegevens-invullen',
    paginas: Object.freeze(['advies', 'actieve-acties', 'offerte', 'recovery-obligations', 'outcomes-evidence', 'learning-writeback', 'self-heal'])
  })
]);

/** Boven de vragen: het scherm waar ze alle zes samen staan. */
export const START_GROEP = Object.freeze({
  id: 'overzicht',
  label: 'Overzicht',
  domein: 'De zes vragen op \u00e9\u00e9n scherm',
  icoon: '\u2302',
  paginas: Object.freeze(['overzicht'])
});

/** Onder de vragen: wat geen vraag beantwoordt maar wel moet kunnen. */
export const BEHEER_GROEP = Object.freeze({
  id: 'beheren',
  label: 'Beheren',
  domein: 'Instellingen, toegang en rekenwijze',
  icoon: '\u2699',
  paginas: Object.freeze(['instellingen', 'gebruikers', 'rekenwijze'])
});

/** De volgorde waarin een directie de vragen stelt. */
export const VRAAG_VOLGORDE = Object.freeze(DIRECTIEMODEL.map(vraag => vraag.id));

/** De zijbalkgroep-id die bij een vraag hoort. */
export function groepIdVoorVraag(vraagId) {
  return `vraag-${vraagId}`;
}

/** Welke vraag beantwoordt deze pagina? Null voor Overzicht en Beheren. */
export function vraagVoorPagina(paginaId) {
  return DIRECTIEMODEL.find(vraag => vraag.paginas.includes(paginaId)) || null;
}
