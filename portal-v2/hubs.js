import { allPageIds, listPortalGroups, findPage } from './page-registry.js';
import { DESKTOP_NAV_GROUPS } from './navigation-model.js';

const PORTAL_CORE = Object.freeze([
  'overzicht','profiel','data-ai','ai-scan','kansenkaart','csrd-impact','gegevens-invullen','ingevulde-gegevens','businesscase',
  'cijfers-maatstaven','waarde-financiering','mensen','branche-markt','onderzoek','compliance-governance','compliance-command-center','ai-capabilities',
  'strategy-dna','strategiemodellen','modellen','model-bcg','canvassen','eindconclusie','due-diligence','exit','strategie-naar-maandagochtend','actueel-houden',
  'wijzigingen','advies','offerte','roadmap','uitvoeringsladder','taken-werkstromen',
  'os:impact-engine','os:scenario-simulator','os:next-best-actions','os:monitoring-learning','os:evidence-health','os:capability-graph'
]);
const DATA_AI = Object.freeze(['data-ai','koppelingen','ai-scan','ai-capabilities','data-ai-passport','trust-center']);
const TASKS = Object.freeze(['actieve-acties','taken-werkstromen','roadmap','advies','outcomes-evidence','wijzigingen']);
const MORE = Object.freeze(['gebruikers','documenten','instellingen','billing','frisse-blik','audit','compliance-governance']);

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
  portal:Object.freeze({ label:'Alle pagina’s', description:'Volledig portaalmenu met alle geregistreerde Portal V2-pagina’s, gegroepeerd per onderdeel.', pages:Object.freeze(allPageIds()) }),
  project:Object.freeze({ label:'Jouw project', description:'Van offerte en bouwen tot koppelen, uitvoeren, documenteren, samenwerken en factureren.', pages:projectTargets }),
  'data-ai':Object.freeze({ label:'Data & AI', description:'Data, koppelingen, AI-kansen, capabilities, dataprofiel en vertrouwen in AI.', pages:DATA_AI }),
  tasks:Object.freeze({ label:'Acties', description:'Wat nu moet gebeuren: actieve acties, taken, roadmap, advies, resultaten en wijzigingen.', pages:TASKS }),
  more:Object.freeze({ label:'Meer', description:'Documenten, gebruikers, instellingen, abonnement, Frisse Blik, compliance en audit.', pages:MORE })
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
  if(hubId==='portal') return DESKTOP_NAV_GROUPS.map(group=>({
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
  // The full portal catalogue is a catch-all discovery surface, not a curated customer hub.
  // Only the focused hubs count as an assignment for navigation simplicity.
  const assigned=new Set(Object.entries(HUB_DEFINITIONS)
    .filter(([id])=>id!=='portal')
    .flatMap(([,hub])=>hub.pages));
  return allPageIds().filter(id=>!assigned.has(id));
}
