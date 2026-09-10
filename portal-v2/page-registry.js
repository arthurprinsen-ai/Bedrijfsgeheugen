export const PORTAL_SECTIONS = Object.freeze({
  overzicht: { label: 'Overzicht', pages: ['overzicht'] },
  inzicht: { label: 'Inzicht', pages: ['profiel','data-ai','ai-scan','kansenkaart','csrd-impact','gegevens-invullen','ingevulde-gegevens','businesscase'] },
  vergelijken: { label: 'Vergelijken', pages: ['cijfers-maatstaven','waarde-financiering','mensen','branche-markt','onderzoek','compliance-governance','compliance-command-center','ai-capabilities','data-ai-passport','eu-ai-act-audit'] },
  denken: { label: 'Denken', pages: ['strategy-dna','strategiemodellen','modellen','canvassen','eindconclusie'] },
  overname: { label: 'Overname', pages: ['due-diligence','exit'] },
  doen: { label: 'Doen', pages: ['strategie-naar-maandagochtend','actueel-houden','wijzigingen','advies','offerte','roadmap','uitvoeringsladder','taken-werkstromen'] },
  'brein-powerhouse': { label: 'Brein & Powerhouse', pages: ['bronnenstatus','datahubstatus','brain-verwerking','agentstatus','actieve-acties','recovery-obligations','outcomes-evidence','learning-writeback','self-heal','audittrail'] },
  beheer: { label: 'Beheer', pages: ['koppelingen','gebruikers','documenten','instellingen','audit'] }
});

const PAGE_META = {
  overzicht:{label:'Overzicht'}, profiel:{label:'Profiel per onderdeel'}, 'data-ai':{label:'Data en AI'}, 'ai-scan':{label:'AI-scan: kansenkaart'}, kansenkaart:{label:'Kansenkaart'}, 'csrd-impact':{label:'CSRD & Impact'}, 'gegevens-invullen':{label:'Je gegevens invullen'}, 'ingevulde-gegevens':{label:'Wat je hebt ingevuld'}, businesscase:{label:'Businesscase'},
  'cijfers-maatstaven':{label:'Cijfers en maatstaven'}, 'waarde-financiering':{label:'Waarde en financiering'}, mensen:{label:'Mensen'}, 'branche-markt':{label:'Branche en markt'}, onderzoek:{label:'Onderzoek'}, 'compliance-governance':{label:'Compliance, security en governance'}, 'compliance-command-center':{label:'Compliance Command Center'}, 'ai-capabilities':{label:'AI-capabilities'}, 'data-ai-passport':{label:'Data & AI Passport'}, 'eu-ai-act-audit':{label:'EU AI Act auditrapport'},
  'strategy-dna':{label:'Strategy DNA'}, strategiemodellen:{label:'Strategiemodellen'}, modellen:{label:'Alle modellen'}, canvassen:{label:'Canvassen'}, eindconclusie:{label:'De eindconclusie'}, 'due-diligence':{label:'Due diligence'}, exit:{label:'Exit'},
  'strategie-naar-maandagochtend':{label:'Van strategie naar maandagochtend'}, 'actueel-houden':{label:'Actueel houden'}, wijzigingen:{label:'Wijzigingen'}, advies:{label:'Advies'}, offerte:{label:'Offerte'}, roadmap:{label:'Roadmap'}, uitvoeringsladder:{label:'Uitvoeringsladder'}, 'taken-werkstromen':{label:'Taken & werkstromen'},
  koppelingen:{label:'Koppelingen'}, gebruikers:{label:'Gebruikers'}, documenten:{label:'Documenten'}, instellingen:{label:'Instellingen'}, audit:{label:'Audit'},
  bronnenstatus:{label:'Bronnenstatus'}, datahubstatus:{label:'Datahubstatus'}, 'brain-verwerking':{label:'Brain-verwerking'}, agentstatus:{label:'Agentstatus'}, 'actieve-acties':{label:'Actieve acties'}, 'recovery-obligations':{label:'Open recovery obligations'}, 'outcomes-evidence':{label:'Outcomes & evidence'}, 'learning-writeback':{label:'Learning/writeback'}, 'self-heal':{label:'Self-heal / recovery'}, audittrail:{label:'Audittrail'}
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
