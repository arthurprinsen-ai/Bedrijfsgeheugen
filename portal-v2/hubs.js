import { allPageIds, listPortalGroups, findPage } from './page-registry.js';

const PORTAL_CORE = Object.freeze([
  'overzicht','profiel','data-ai','ai-scan','kansenkaart','csrd-impact','gegevens-invullen','ingevulde-gegevens','businesscase',
  'cijfers-maatstaven','waarde-financiering','mensen','branche-markt','onderzoek','compliance-governance','compliance-command-center','ai-capabilities',
  'strategy-dna','strategiemodellen','modellen','model-bcg','canvassen','eindconclusie','due-diligence','exit','strategie-naar-maandagochtend','actueel-houden',
  'wijzigingen','advies','offerte','roadmap','uitvoeringsladder','taken-werkstromen',
  'os:impact-engine','os:scenario-simulator','os:next-best-actions','os:monitoring-learning','os:evidence-health','os:capability-graph'
]);
const DATA_AI = Object.freeze(['data-ai','koppelingen','ai-scan','ai-capabilities','bronnenstatus','datahubstatus','brain-verwerking','agentstatus','powerhouse-control-center','os:evidence-health','os:capability-graph']);
const TASKS = Object.freeze(['taken-werkstromen','actieve-acties','roadmap','recovery-obligations','outcomes-evidence','wijzigingen','advies','os:next-best-actions','os:monitoring-learning','os:scenario-simulator']);
const MORE = Object.freeze(['gebruikers','documenten','instellingen','billing','frisse-blik','audit','audittrail','compliance-governance','compliance-command-center','learning-writeback','self-heal']);

const entry=(id,label,target=id)=>Object.freeze({id,label,target});
const PORTAL_NAV_GROUPS = Object.freeze([
  Object.freeze({id:'overview',label:'Overzicht',pages:Object.freeze([
    entry('overview-home','Overzicht','overzicht'),
    entry('overview-advice','Advies','advies'),
    entry('overview-conclusion','Eindconclusie','eindconclusie')
  ])}),
  Object.freeze({id:'csrd',label:'CSRD & Impact',pages:Object.freeze([
    entry('csrd-main','CSRD & Impact','csrd-impact'),
    entry('csrd-compliance','Compliance & governance','compliance-governance'),
    entry('csrd-command','Compliance overzicht','compliance-command-center')
  ])}),
  Object.freeze({id:'health',label:'Bedrijfsgezondheid',pages:Object.freeze([
    entry('health-profile','Bedrijfsprofiel','profiel'),
    entry('health-context','Bedrijfssituatie','bedrijfssituatie'),
    entry('health-kpis','Cijfers & maatstaven','cijfers-maatstaven'),
    entry('health-value','Waarde & financiering','waarde-financiering'),
    entry('health-businesscase','Businesscase','businesscase')
  ])}),
  Object.freeze({id:'strategy',label:'Strategie & uitvoering',pages:Object.freeze([
    entry('strategy-monday','Strategie naar uitvoering','strategie-naar-maandagochtend'),
    entry('strategy-dna-nav','Strategy DNA','strategy-dna'),
    entry('strategy-models','Strategiemodellen','strategiemodellen'),
    entry('strategy-canvases','Canvassen','canvassen'),
    entry('strategy-roadmap','Roadmap','roadmap')
  ])}),
  Object.freeze({id:'processes',label:'Processen & organisatie',pages:Object.freeze([
    entry('process-workflows','Taken & werkstromen','taken-werkstromen'),
    entry('process-people','Mensen & rollen','mensen'),
    entry('process-current','Actueel houden','actueel-houden'),
    entry('process-changes','Wijzigingen','wijzigingen')
  ])}),
  Object.freeze({id:'knowledge',label:'Kennis',pages:Object.freeze([
    entry('knowledge-docs','Documenten','documenten'),
    entry('knowledge-research','Onderzoek','onderzoek'),
    entry('knowledge-sources','Bronnenbibliotheek','bronnenbibliotheek')
  ])}),
  Object.freeze({id:'data',label:'Data & koppelingen',pages:Object.freeze([
    entry('data-overview','Data & AI','data-ai'),
    entry('data-links','Koppelingen','koppelingen'),
    entry('data-passport','Data & AI Passport','data-ai-passport'),
    entry('data-status','Datahubstatus','datahubstatus')
  ])}),
  Object.freeze({id:'ai',label:'AI & Insights',pages:Object.freeze([
    entry('ai-opportunities','AI-kansen','ai-scan'),
    entry('ai-capabilities-nav','AI-capabilities','ai-capabilities'),
    entry('ai-trust','AI Trust Center','trust-center'),
    entry('ai-external','AI & technologie actueel','ai-technologie-actueel')
  ])}),
  Object.freeze({id:'actions',label:'Acties & impact',pages:Object.freeze([
    entry('actions-active','Actieve acties','actieve-acties'),
    entry('actions-impact','Impact & waarde','os:impact-engine'),
    entry('actions-outcomes','Outcomes & bewijs','outcomes-evidence'),
    entry('actions-next','Volgende beste acties','os:next-best-actions')
  ])}),
  Object.freeze({id:'reports',label:'Rapportages & beheer',pages:Object.freeze([
    entry('reports-audit','Audit & rapportage','audit'),
    entry('reports-users','Gebruikers','gebruikers'),
    entry('reports-settings','Instellingen','instellingen'),
    entry('reports-billing','Facturen & abonnement','billing'),
    entry('reports-scan','Frisse Blik Scan','frisse-blik')
  ])})
]);

export const PROJECT_GROUPS = Object.freeze([
  Object.freeze({id:'project-overview',label:'Overzicht',pages:Object.freeze([])}),
  Object.freeze({id:'commercial',label:'Commercieel',pages:Object.freeze([
    entry('project-offerte','Offerte','offerte'),
    entry('project-uren','Uren & facturen','waarde-financiering')
  ])}),
  Object.freeze({id:'build',label:'Bouwen & koppelen',pages:Object.freeze([
    entry('project-koppelingen','Koppelingen','koppelingen'),
    entry('project-integraties','Integraties','koppelingen'),
    entry('project-taken','Taken & werkstromen','taken-werkstromen')
  ])}),
  Object.freeze({id:'information',label:'Projectinformatie',pages:Object.freeze([
    entry('project-documenten','Documenten','documenten'),
    entry('project-notities','Notities','documenten'),
    entry('project-activiteit','Activiteit','wijzigingen')
  ])}),
  Object.freeze({id:'collaboration',label:'Samenwerken',pages:Object.freeze([
    entry('project-team','Team & toegang','gebruikers')
  ])})
]);

const projectTargets=Object.freeze(PROJECT_GROUPS.flatMap(group=>group.pages.map(page=>page.target)));

export const HUB_DEFINITIONS = Object.freeze({
  portal:Object.freeze({ label:'Alle pagina’s', description:'Volledig portaalmenu met alle geregistreerde Portal V2-pagina’s, gegroepeerd per onderdeel.', pages:Object.freeze(allPageIds()) }),
  project:Object.freeze({ label:'Jouw project', description:'Van offerte en bouwen tot koppelen, uitvoeren, documenteren, samenwerken en factureren.', pages:projectTargets }),
  'data-ai':Object.freeze({ label:'Data & AI', description:'Data, koppelingen, AI-kansen, capabilities en de aantoonbare Brain/Datahub-status.', pages:DATA_AI }),
  tasks:Object.freeze({ label:'Taken', description:'Uitvoering, roadmap, actieve acties, recovery obligations, scenarios, monitoring en outcomes/evidence.', pages:TASKS }),
  more:Object.freeze({ label:'Meer', description:'Beheer, documenten, gebruikers, abonnement, Frisse Blik, compliance, audit en systeemfuncties.', pages:MORE })
});

export function hubPages(hubId){ return [...(HUB_DEFINITIONS[hubId]?.pages || [])]; }
export function hubDefinition(hubId){ return HUB_DEFINITIONS[hubId] || null; }

export function groupedHubPages(hubId){
  if(hubId==='project'){
    return PROJECT_GROUPS.map(group=>({
      id:group.id,
      label:group.label,
      pages:group.pages.map(page=>{
        const target=findPage(page.target);
        return {...page,sectionId:target?.sectionId||null,target:page.target};
      })
    }));
  }
  if(hubId==='portal') return PORTAL_NAV_GROUPS.map(group=>({
    id:group.id,
    label:group.label,
    pages:group.pages.map(page=>{
      const target=findPage(page.target);
      return {...page,sectionId:target?.sectionId||null,target:page.target};
    })
  })).filter(group=>group.pages.length);
  const allowed=new Set(hubPages(hubId));
  return listPortalGroups().map(group=>({
    ...group,
    pages:group.pages.filter(page=>allowed.has(page.id))
  })).filter(group=>group.pages.length);
}

export function unassignedPortalPages(){
  const assigned=new Set(Object.values(HUB_DEFINITIONS).flatMap(hub=>hub.pages));
  return allPageIds().filter(id=>!assigned.has(id));
}
