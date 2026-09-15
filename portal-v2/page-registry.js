import { DIRECTIEMODEL, START_GROEP, BEHEER_GROEP, groepIdVoorVraag } from './directiemodel.js';

/**
 * De zijbalk van Portal V2.
 *
 * Tot nu toe stonden hier zes mappen: Besturen, Realiseren, Data & intelligence,
 * Continu\u00efteit & risico, Beheren. Die indeling vertelde waar een pagina stond.
 * Vanaf nu is elke groep een vraag die een directie stelt, en zijn de pagina's
 * eronder de onderbouwing van het antwoord op die vraag.
 *
 * De groepen worden opgebouwd uit directiemodel.js. Er staat hier dus geen
 * tweede lijst met vragen of pagina's: zijbalk en antwoordblok op Overzicht
 * kunnen niet uit elkaar lopen, want ze lezen dezelfde bron.
 *
 * Er is geen pagina verdwenen. Elke pagina-id uit de oude indeling hangt onder
 * precies \u00e9\u00e9n vraag; wat geen vraag beantwoordt (instellingen, gebruikers, de
 * rekenwijze) staat onder Beheren.
 */

const GROEPEN = Object.freeze([
  START_GROEP,
  ...DIRECTIEMODEL.map(vraag => Object.freeze({
    id: groepIdVoorVraag(vraag.id),
    label: vraag.vraag,
    domein: vraag.domein,
    icoon: vraag.icoon,
    vraagId: vraag.id,
    paginas: vraag.paginas
  })),
  BEHEER_GROEP
]);

export const PORTAL_SECTIONS = Object.freeze(Object.fromEntries(GROEPEN.map(groep => [
  groep.id,
  Object.freeze({
    label: groep.label,
    domein: groep.domein,
    icoon: groep.icoon,
    vraagId: groep.vraagId ?? null,
    pages: groep.paginas
  })
])));

const PAGE_META = {
  overzicht:{label:'Overzicht'}, profiel:{label:'Profiel per onderdeel'}, 'data-ai':{label:'Data en AI'}, 'ai-scan':{label:'AI-scan: kansenkaart'}, kansenkaart:{label:'Kansenkaart'}, 'csrd-impact':{label:'CSRD & Impact'}, 'gegevens-invullen':{label:'Je gegevens invullen'}, 'ingevulde-gegevens':{label:'Wat je hebt ingevuld'}, businesscase:{label:'Businesscase'},
  'cijfers-maatstaven':{label:'Cijfers en maatstaven'}, 'waarde-financiering':{label:'Waarde en financiering'}, mensen:{label:'Mensen'}, 'branche-markt':{label:'Branche en markt'}, onderzoek:{label:'Onderzoek'}, 'compliance-governance':{label:'Compliance, security en governance'}, 'compliance-command-center':{label:'Compliance Command Center'}, 'ai-capabilities':{label:'AI-capabilities'}, 'data-ai-passport':{label:'Data & AI Passport'}, 'eu-ai-act-audit':{label:'EU AI Act auditrapport'}, 'rekenwijze':{label:'Hoe dit portaal rekent'},
  'strategy-dna':{label:'Strategy DNA'}, strategiemodellen:{label:'Strategiemodellen'}, modellen:{label:'Alle modellen'}, canvassen:{label:'Canvassen'}, eindconclusie:{label:'De eindconclusie'}, 'due-diligence':{label:'Due diligence'}, exit:{label:'Exit'},
  'strategie-naar-maandagochtend':{label:'Van strategie naar maandagochtend'}, 'actueel-houden':{label:'Actueel houden'}, wijzigingen:{label:'Wijzigingen'}, advies:{label:'Advies'}, offerte:{label:'Offerte'}, roadmap:{label:'Roadmap'}, uitvoeringsladder:{label:'Uitvoeringsladder'}, 'taken-werkstromen':{label:'Taken & werkstromen'},
  koppelingen:{label:'Koppelingen'}, gebruikers:{label:'Gebruikers'}, documenten:{label:'Documenten'}, instellingen:{label:'Instellingen'}, audit:{label:'Audit'},
  bronnenstatus:{label:'Bronnenstatus'}, datahubstatus:{label:'Datahubstatus'}, 'brain-verwerking':{label:'Brain-verwerking'}, agentstatus:{label:'Agentstatus'}, 'actieve-acties':{label:'Actieve acties'}, 'recovery-obligations':{label:'Open recovery obligations'}, 'outcomes-evidence':{label:'Outcomes & evidence'}, 'learning-writeback':{label:'Learning/writeback'}, 'self-heal':{label:'Self-heal / recovery'}, audittrail:{label:'Audittrail'}
};

export const PORTAL_PAGE_INDEX = Object.freeze(Object.entries(PORTAL_SECTIONS).reduce((acc,[sectionId,section])=>{
  for(const id of section.pages) acc[id]={id,sectionId,vraagId:section.vraagId,...(PAGE_META[id]??{label:id})};
  return acc;
},{}));

export function listPortalGroups() {
  return Object.entries(PORTAL_SECTIONS).map(([id, section]) => ({
    id,
    label: section.label,
    domein: section.domein,
    icoon: section.icoon,
    vraagId: section.vraagId,
    pages: section.pages.map(pageId => ({ id:pageId, ...PORTAL_PAGE_INDEX[pageId] }))
  }));
}

export function findPage(pageId) {
  return PORTAL_PAGE_INDEX[pageId] || null;
}

export function allPageIds() {
  return Object.keys(PORTAL_PAGE_INDEX);
}
