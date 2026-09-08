import { allPageIds, listPortalGroups } from './page-registry.js';

const PORTAL_CORE = Object.freeze([
  'overzicht','profiel','data-ai','ai-scan','kansenkaart','csrd-impact','gegevens-invullen','ingevulde-gegevens','businesscase',
  'cijfers-maatstaven','waarde-financiering','mensen','branche-markt','onderzoek','compliance-governance','compliance-command-center','ai-capabilities',
  'strategy-dna','strategiemodellen','modellen','canvassen','eindconclusie','due-diligence','exit','strategie-naar-maandagochtend','actueel-houden',
  'wijzigingen','advies','offerte','roadmap','uitvoeringsladder','taken-werkstromen'
]);
const DATA_AI = Object.freeze(['data-ai','koppelingen','ai-scan','ai-capabilities','bronnenstatus','datahubstatus','brain-verwerking','agentstatus']);
const TASKS = Object.freeze(['taken-werkstromen','actieve-acties','roadmap','recovery-obligations','outcomes-evidence','wijzigingen','advies']);
const MORE = Object.freeze(['gebruikers','documenten','instellingen','audit','audittrail','compliance-governance','compliance-command-center','learning-writeback','self-heal']);

export const HUB_DEFINITIONS = Object.freeze({
  portal:Object.freeze({ label:'Portaal', description:'Alle functionele Portal V2-onderdelen in één native navigatie.', pages:PORTAL_CORE }),
  'data-ai':Object.freeze({ label:'Data & AI', description:'Data, koppelingen, AI-kansen, capabilities en de aantoonbare Brain/Datahub-status.', pages:DATA_AI }),
  tasks:Object.freeze({ label:'Taken', description:'Uitvoering, roadmap, actieve acties, recovery obligations en outcomes/evidence.', pages:TASKS }),
  more:Object.freeze({ label:'Meer', description:'Beheer, documenten, gebruikers, compliance, audit en systeemfuncties.', pages:MORE })
});

export function hubPages(hubId){ return [...(HUB_DEFINITIONS[hubId]?.pages || [])]; }
export function hubDefinition(hubId){ return HUB_DEFINITIONS[hubId] || null; }

export function groupedHubPages(hubId){
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
