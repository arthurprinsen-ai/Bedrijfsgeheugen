export const PORTAL_SECTIONS = Object.freeze({
  overzicht: { label: 'Overzicht', pages: ['overzicht'] },
  inzicht: { label: 'Inzicht', pages: ['profiel','data-ai','ai-scan','kansenkaart','csrd-impact','gegevens-invullen','ingevulde-gegevens','businesscase'] },
  vergelijken: { label: 'Vergelijken', pages: ['cijfers-maatstaven','waarde-financiering','mensen','branche-markt','onderzoek','compliance-governance','ai-capabilities'] },
  denken: { label: 'Denken', pages: ['strategiemodellen','modellen','canvassen','eindconclusie'] },
  overname: { label: 'Overname', pages: ['due-diligence','exit'] },
  doen: { label: 'Doen', pages: ['strategie-naar-maandagochtend','actueel-houden','wijzigingen','advies','offerte','roadmap','uitvoeringsladder','taken-werkstromen'] },
  'brein-powerhouse': { label: 'Brein & Powerhouse', pages: ['bronnenstatus','datahubstatus','brain-verwerking','agentstatus','actieve-acties','recovery-obligations','outcomes-evidence','learning-writeback','self-heal','audittrail'] },
  beheer: { label: 'Beheer', pages: ['koppelingen','gebruikers','documenten','instellingen','audit'] }
});

const PAGE_META = {
  overzicht:{label:'Overzicht',legacyTab:'overzicht'}, profiel:{label:'Profiel per onderdeel',legacyTab:'profiel'}, 'data-ai':{label:'Data en AI',legacyTab:'dataai'}, 'ai-scan':{label:'AI-scan: kansenkaart',legacyTab:'aiscan'}, kansenkaart:{label:'Kansenkaart',legacyTab:'aiscan'}, 'csrd-impact':{label:'CSRD & Impact',legacyTab:null}, 'gegevens-invullen':{label:'Je gegevens invullen',legacyTab:'invoeren'}, 'ingevulde-gegevens':{label:'Wat je hebt ingevuld',legacyTab:'antwoorden'}, businesscase:{label:'Businesscase',legacyTab:'business'},
  'cijfers-maatstaven':{label:'Cijfers en maatstaven',legacyTab:'cijfers'}, 'waarde-financiering':{label:'Waarde en financiering',legacyTab:'waarde'}, mensen:{label:'Mensen',legacyTab:'mensen'}, 'branche-markt':{label:'Branche en markt',legacyTab:'branche'}, onderzoek:{label:'Onderzoek',legacyTab:'onderzoek'}, 'compliance-governance':{label:'Compliance, security en governance',legacyTab:'beleid'}, 'ai-capabilities':{label:'AI-capabilities',legacyTab:'aicap'},
  strategiemodellen:{label:'Strategiemodellen',legacyTab:'strategie'}, modellen:{label:'Alle modellen',legacyTab:'strategie'}, canvassen:{label:'Canvassen',legacyTab:'canvassen'}, eindconclusie:{label:'De eindconclusie',legacyTab:'eindconclusie'}, 'due-diligence':{label:'Due diligence',legacyTab:'dd'}, exit:{label:'Exit',legacyTab:'dd'},
  'strategie-naar-maandagochtend':{label:'Van strategie naar maandagochtend',legacyTab:'dna'}, 'actueel-houden':{label:'Actueel houden',legacyTab:'bijhouden'}, wijzigingen:{label:'Wijzigingen',legacyTab:'wijzigingen'}, advies:{label:'Advies',legacyTab:'advies'}, offerte:{label:'Offerte',legacyTab:'offerte'}, roadmap:{label:'Roadmap',legacyTab:'roadmap'}, uitvoeringsladder:{label:'Uitvoeringsladder',legacyTab:'dna'}, 'taken-werkstromen':{label:'Taken & werkstromen',legacyTab:'bijhouden'},
  koppelingen:{label:'Koppelingen',legacyTab:null}, gebruikers:{label:'Gebruikers',legacyTab:null}, documenten:{label:'Documenten',legacyTab:null}, instellingen:{label:'Instellingen',legacyTab:null}, audit:{label:'Audit',legacyTab:null},
  bronnenstatus:{label:'Bronnenstatus',legacyTab:null}, datahubstatus:{label:'Datahubstatus',legacyTab:null}, 'brain-verwerking':{label:'Brain-verwerking',legacyTab:null}, agentstatus:{label:'Agentstatus',legacyTab:null}, 'actieve-acties':{label:'Actieve acties',legacyTab:null}, 'recovery-obligations':{label:'Open recovery obligations',legacyTab:null}, 'outcomes-evidence':{label:'Outcomes & evidence',legacyTab:null}, 'learning-writeback':{label:'Learning/writeback',legacyTab:null}, 'self-heal':{label:'Self-heal / recovery',legacyTab:null}, audittrail:{label:'Audittrail',legacyTab:null}
};

export const PORTAL_PAGE_INDEX = Object.freeze(Object.entries(PORTAL_SECTIONS).reduce((acc,[sectionId,section])=>{for(const id of section.pages)acc[id]={id,sectionId,...(PAGE_META[id]??{label:id,legacyTab:null})};return acc;},{}));
export const findPortalPage=id=>PORTAL_PAGE_INDEX[id]??null;
export const assertPortalCoverage=existingIds=>existingIds.filter(id=>!findPortalPage(id));
export function buildStrategyTrace(buildingBlock={}){return{id:buildingBlock.id??null,order:['strategie','thema','capability','afdeling','proces','systeem','data','ai','maatstaf','actie','outcome']}}
export function buildExecutionLadderTrace(step={}){return{id:step.id??null,order:['tellen','vastleggen','koppelen','meten','borgen','actie','outcome']}}
export function buildChangeTrace(change={}){return{id:change.id??null,order:['wijziging','geraakte-onderdelen','powerhouse-analyse','taak-actie','outcome','brain-update']}}
