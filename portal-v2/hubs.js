import { allPageIds, listPortalGroups, findPage } from './page-registry.js';

const PORTAL_CORE = Object.freeze([
  'overzicht','profiel','data-ai','ai-scan','kansenkaart','csrd-impact','gegevens-invullen','ingevulde-gegevens','businesscase',
  'cijfers-maatstaven','waarde-financiering','mensen','branche-markt','onderzoek','compliance-governance','compliance-command-center','ai-capabilities',
  'strategy-dna','strategiemodellen','modellen','canvassen','eindconclusie','due-diligence','exit','strategie-naar-maandagochtend','actueel-houden',
  'wijzigingen','advies','offerte','roadmap','uitvoeringsladder','taken-werkstromen'
]);
const DATA_AI = Object.freeze(['data-ai','koppelingen','ai-scan','ai-capabilities','bronnenstatus','datahubstatus','brain-verwerking','agentstatus']);
const TASKS = Object.freeze(['taken-werkstromen','actieve-acties','roadmap','recovery-obligations','outcomes-evidence','wijzigingen','advies']);
const MORE = Object.freeze(['gebruikers','documenten','instellingen','audit','audittrail','compliance-governance','compliance-command-center','learning-writeback','self-heal']);

const entry=(id,label,target=id)=>Object.freeze({id,label,target});
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
  portal:Object.freeze({ label:'Portaal', description:'Alle functionele Portal V2-onderdelen in één native navigatie.', pages:PORTAL_CORE }),
  project:Object.freeze({ label:'Jouw project', description:'Van offerte en bouwen tot koppelen, uitvoeren, documenteren, samenwerken en factureren.', pages:projectTargets }),
  'data-ai':Object.freeze({ label:'Data & AI', description:'Data, koppelingen, AI-kansen, capabilities en de aantoonbare Brain/Datahub-status.', pages:DATA_AI }),
  tasks:Object.freeze({ label:'Taken', description:'Uitvoering, roadmap, actieve acties, recovery obligations en outcomes/evidence.', pages:TASKS }),
  more:Object.freeze({ label:'Meer', description:'Beheer, documenten, gebruikers, compliance, audit en systeemfuncties.', pages:MORE })
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
  const allowed=new Set(hubPages(hubId));
  if(hubId==='portal') allowed.clear(), PORTAL_CORE.forEach(id=>allowed.add(id));
  return listPortalGroups().map(group=>({
    ...group,
    pages:group.pages.filter(page=>allowed.has(page.id))
  })).filter(group=>group.pages.length);
}

export function unassignedPortalPages(){
  const assigned=new Set(Object.values(HUB_DEFINITIONS).flatMap(hub=>hub.pages));
  return allPageIds().filter(id=>!assigned.has(id));
}
