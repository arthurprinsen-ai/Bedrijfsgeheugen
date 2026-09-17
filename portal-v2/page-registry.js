// Zijbalkindeling volgens het vastgestelde Overzicht-design: zes groepen.
// De items uit het design staan vooraan in hun groep; de overige pagina's
// staan daaronder in dezelfde groep, zodat geen enkele pagina uit beeld raakt.
// Wat nergens past staat in 'Overig'. Alle pagina-ids uit de oude acht secties
// zijn hier opnieuw ondergebracht; er is niets verwijderd.
export const PORTAL_SECTIONS = Object.freeze({
  overzicht: { label: 'Overzicht', pages: ['overzicht','actieve-acties','advies'] },
  besturen: { label: 'Besturen', pages: ['profiel','strategie-naar-maandagochtend','strategiemodellen','canvassen','eindconclusie','roadmap','strategy-dna','modellen','kansenkaart','businesscase','ai-scan','os:impact-engine','os:scenario-simulator','os:next-best-actions'] },
  realiseren: { label: 'Realiseren', pages: ['taken-werkstromen','documenten','uitvoeringsladder','offerte','gegevens-invullen','ingevulde-gegevens','actueel-houden'] },
  'data-intelligence': { label: 'Data & intelligence', pages: ['data-ai','cijfers-maatstaven','koppelingen','brain-verwerking','ai-capabilities','data-ai-passport','bronnenstatus','datahubstatus','agentstatus','rekenwijze','onderzoek','branche-markt','os:evidence-health','os:capability-graph'] },
  'continuiteit-risico': { label: 'Continuïteit & risico', pages: ['wijzigingen','compliance-governance','learning-writeback','compliance-command-center','eu-ai-act-audit','csrd-impact','audit','audittrail','recovery-obligations','self-heal','outcomes-evidence','mensen','os:monitoring-learning'] },
  beheren: { label: 'Beheren', pages: ['instellingen','gebruikers','billing','frisse-blik'] },
  overig: { label: 'Overig', pages: ['due-diligence','exit','waarde-financiering'] }
});

const PAGE_META = {
  overzicht:{label:'Overzicht'}, profiel:{label:'Profiel per onderdeel'}, 'data-ai':{label:'Data en AI'}, 'ai-scan':{label:'AI-scan: kansenkaart'}, kansenkaart:{label:'Kansenkaart'}, 'csrd-impact':{label:'CSRD & Impact'}, 'gegevens-invullen':{label:'Je gegevens invullen'}, 'ingevulde-gegevens':{label:'Wat je hebt ingevuld'}, businesscase:{label:'Businesscase'},
  'cijfers-maatstaven':{label:'Cijfers en maatstaven'}, 'waarde-financiering':{label:'Waarde en financiering'}, mensen:{label:'Mensen'}, 'branche-markt':{label:'Branche en markt'}, onderzoek:{label:'Onderzoek'}, 'compliance-governance':{label:'Compliance, security en governance'}, 'compliance-command-center':{label:'Compliance Command Center'}, 'ai-capabilities':{label:'AI-capabilities'}, 'data-ai-passport':{label:'Data & AI Passport'}, 'eu-ai-act-audit':{label:'EU AI Act auditrapport'}, 'rekenwijze':{label:'Hoe dit portaal rekent'},
  'strategy-dna':{label:'Strategy DNA'}, strategiemodellen:{label:'Strategiemodellen'}, modellen:{label:'Alle modellen'}, canvassen:{label:'Canvassen'}, eindconclusie:{label:'De eindconclusie'}, 'due-diligence':{label:'Due diligence'}, exit:{label:'Exit'},
  'strategie-naar-maandagochtend':{label:'Van strategie naar maandagochtend'}, 'actueel-houden':{label:'Actueel houden'}, wijzigingen:{label:'Wijzigingen'}, advies:{label:'Advies'}, offerte:{label:'Offerte'}, roadmap:{label:'Roadmap'}, uitvoeringsladder:{label:'Uitvoeringsladder'}, 'taken-werkstromen':{label:'Taken & werkstromen'},
  koppelingen:{label:'Koppelingen'}, gebruikers:{label:'Gebruikers'}, documenten:{label:'Documenten'}, instellingen:{label:'Instellingen'}, billing:{label:'Facturen & abonnement'}, 'frisse-blik':{label:'Frisse Blik Scan'}, audit:{label:'Audit'},
  bronnenstatus:{label:'Bronnenstatus'}, datahubstatus:{label:'Datahubstatus'}, 'brain-verwerking':{label:'Brain-verwerking'}, agentstatus:{label:'Agentstatus'}, 'actieve-acties':{label:'Actieve acties'}, 'recovery-obligations':{label:'Open recovery obligations'}, 'outcomes-evidence':{label:'Outcomes & evidence'}, 'learning-writeback':{label:'Learning/writeback'}, 'self-heal':{label:'Self-heal / recovery'}, audittrail:{label:'Audittrail'},
  'os:impact-engine':{label:'€ Impact Engine'}, 'os:scenario-simulator':{label:'Scenario Simulator'}, 'os:next-best-actions':{label:'Next Best Actions & besluiten'}, 'os:monitoring-learning':{label:'Monitoring & Learning'}, 'os:evidence-health':{label:'Data & Evidence Health'}, 'os:capability-graph':{label:'Capability Graph'}
};

export const PORTAL_PAGE_INDEX = Object.freeze(Object.entries(PORTAL_SECTIONS).reduce((acc,[sectionId,section])=>{
  for(const id of section.pages) acc[id]={id,sectionId,...(PAGE_META[id]??{label:id})};
  return acc;
},{}));

export function listPortalGroups() {
  return Object.entries(PORTAL_SECTIONS).map(([id, section]) => ({
    id,
    label: section.label,
    pages: section.pages.map(pageId => ({ id:pageId, ...PORTAL_PAGE_INDEX[pageId] }))
  }));
}

export function findPage(pageId) {
  return PORTAL_PAGE_INDEX[pageId] || null;
}

export function allPageIds() {
  return Object.keys(PORTAL_PAGE_INDEX);
}
