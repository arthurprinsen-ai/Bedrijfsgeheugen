import { dependencyTargets } from './legacy-dependency-contract.js';
import { LEGACY_FUNCTIONAL_INVENTORY } from './legacy-functional-inventory.js';
import { calculateLegacyEquivalent as calc } from './legacy-parity-engine.js';
import { bevindingen, bevindingenSamenvatting } from './bevindingen.js';
import { PORTAL_PAGE_INDEX } from './page-registry.js';

// A page remains a first-class causal node even if no legacy calculator consumes it.
const REGISTERED_PAGES=Object.freeze(new Set(Object.keys(PORTAL_PAGE_INDEX)));
const OBSERVATION_SURFACES=Object.freeze(['overzicht','advies','wijzigingen','audittrail','learning-writeback','powerhouse-control-center']);
const REVIEW_RULES=Object.freeze([
  {pattern:/^portal\.(?:data-ai-passport|dataAi|aiScan|aiCapabilities|ai-capabilities|ai-technologie-actueel|koppelingen|trust-center|eu-ai-act-audit|csrd-impact|instellingen)(?:\.|$)/,domains:['ai-runtime','data-residency','privacy-security','supplier','finance','csrd-esrs'],pages:['data-ai-passport','koppelingen','trust-center','compliance-governance','csrd-impact','businesscase','roadmap','data-ai','ai-capabilities','powerhouse-control-center','wet-regelgeving']},
  {pattern:/^portal\.(?:wet-regelgeving|bronnenbibliotheek|bronnenstatus|compliance-command-center)(?:\.|$)/,domains:['regulatory','privacy-security','csrd-esrs'],pages:['compliance-governance','csrd-impact','due-diligence','roadmap','advies']},
  {pattern:/^portal\.(?:metrics|valueFinance|waarde-financiering|cijfers-maatstaven|businesscase|billing)(?:\.|$)/,domains:['finance','impact-economics'],pages:['businesscase','waarde-financiering','cijfers-maatstaven','due-diligence','csrd-impact','roadmap']},
  // Native external-data pages are first-class change sources too; this is an
  // obligation to reassess dependent views, never proof of materiality or cash value.
  {pattern:/^portal\.(?:external|sources|regulatory|ondernemersdata|omgevingsradar|arbeidsmarkt-personeel|subsidies-regelingen|economie-branche-actueel|ai-technologie-actueel|deadlines)(?:\.|$)/,domains:['external-intelligence','finance','people','regulatory','csrd-esrs'],pages:['omgevingsradar','branche-markt','mensen','cijfers-maatstaven','businesscase','waarde-financiering','compliance-governance','csrd-impact','due-diligence','roadmap','advies','audittrail']}
]);

const CALCS=Object.freeze([
  ['manual-work-annual','money'],['dimension-cost-total','money'],['dimension-potential-total','money'],
  ['fte-lost','fte'],['benefit-at-target-maturity','money'],['delay-cost','money'],['investment-net-result','money'],['payback','months'],
  ['annual-task-cost','money'],['risk-adjusted-benefit','money'],['supportable-share','percent'],
  ['gross-margin','percent'],['ebitda-margin','percent'],['dso','days'],['productivity','money'],
  ['enterprise-value','money'],['equity-value','money'],['dcf','money'],['altman-z','score'],['dscr','score'],
  ['interest-coverage','score'],['break-even','money'],['safety-margin','percent'],
  ['absence-gap','percent'],['turnover-gap','percent'],['enps-gap','score'],['vacancy-pressure','percent'],
  ['technology-readiness','score'],['governance-maturity','score'],['esg-readiness','score'],['policy-completeness','percent'],['compliance-risk','percent'],
  ['ai-capability-readiness','score'],['cross-source-consensus','percent'],['completion-progress','percent'],['roadmap-value','money']
]);

const SECTION_PAGE=Object.freeze({
  profile:'profiel',dataAi:'data-ai',aiScan:'ai-scan',businessCase:'businesscase',metrics:'cijfers-maatstaven',
  valueFinance:'waarde-financiering',people:'mensen',market:'branche-markt',research:'onderzoek',
  compliance:'compliance-governance',aiCapabilities:'ai-capabilities',strategy:'strategie-naar-maandagochtend',
  strategyDna:'strategy-dna',canvases:'canvassen',finalConclusion:'eindconclusie',dueDiligence:'due-diligence',
  freshness:'actueel-houden',changes:'wijzigingen',advice:'advies',offer:'offerte',roadmap:'roadmap',tasks:'taken-werkstromen',
  project:'overzicht',integrations:'koppelingen',connections:'koppelingen',documents:'documenten',notes:'documenten',access:'gebruikers',
  external:'ondernemersdata',regulatory:'wet-regelgeving',sources:'bronnenbibliotheek'
});


const CALCULATION_CONSUMERS=Object.freeze(Object.fromEntries(
  [...new Set(Object.values(LEGACY_FUNCTIONAL_INVENTORY).flatMap(item=>item.calculations||[]))]
    .map(id=>[id,Object.freeze(Object.values(LEGACY_FUNCTIONAL_INVENTORY).filter(item=>(item.calculations||[]).includes(id)).map(item=>item.v2Page))])
));
const PAGE_EFFECT_LABELS=Object.freeze({
  overzicht:'Executive cockpit',profiel:'Profiel & volwassenheid','data-ai':'Data & AI', 'ai-scan':'AI-kansenkaart',
  businesscase:'Businesscase','cijfers-maatstaven':'Cijfers & maatstaven','waarde-financiering':'Waarde & financiering',
  mensen:'Mensen','branche-markt':'Branche & markt',onderzoek:'Onderzoek','compliance-governance':'Compliance & governance',
  'ai-capabilities':'AI-capabilities','strategie-naar-maandagochtend':'Strategie → uitvoering',canvassen:'Canvassen',
  eindconclusie:'Eindconclusie','due-diligence':'Due diligence','strategy-dna':'Strategy DNA','actueel-houden':'Actueel houden',
  wijzigingen:'Wijzigingen',advies:'Advies',offerte:'Offerte',roadmap:'Roadmap',uitvoeringsladder:'Uitvoeringsladder',
  'taken-werkstromen':'Taken & werkstromen',koppelingen:'Koppelingen'
});
const PATH_EFFECT_RULES=Object.freeze([
  Object.freeze({pattern:/^portal\.profile(\.|$)/,kind:'foundation',reason:'Profielwaarden voeden volwassenheid, capaciteit, kosten, benchmarkpositie, businesscase en advies.',targets:['overzicht','businesscase','data-ai','onderzoek','advies','roadmap','strategie-naar-maandagochtend']}),
  Object.freeze({pattern:/^portal\.profile\.maturity(\.|$)/,kind:'maturity',reason:'Een volwassenheidsniveau verandert handwerk, FTE, capaciteitswaarde, adoptiepositie, CMMI en verbeterpotentieel.',targets:['overzicht','profiel','businesscase','data-ai','onderzoek','advies','roadmap']}),
  Object.freeze({pattern:/^portal\.(metrics|valueFinance)(\.|$)/,kind:'finance',reason:'Financiële invoer werkt door in KPI’s, waardering, financieringsratio’s, businesscase, due diligence en executive prioritering.',targets:['cijfers-maatstaven','waarde-financiering','businesscase','due-diligence','overzicht','advies']}),
  Object.freeze({pattern:/^portal\.people(\.|$)/,kind:'capacity',reason:'Mensen, verzuim, verloop en vacatures beïnvloeden capaciteit, benchmarks, risico’s, due diligence en prioriteit.',targets:['mensen','branche-markt','onderzoek','due-diligence','overzicht','advies','roadmap']}),
  Object.freeze({pattern:/^portal\.market(\.|$)/,kind:'benchmark',reason:'Branche en marktcontext wijzigen benchmark, relatieve positie, toepasselijke context en advies.',targets:['branche-markt','overzicht','profiel','mensen','onderzoek','cijfers-maatstaven','advies']}),
  Object.freeze({pattern:/^portal\.(dataAi|aiScan|aiCapabilities)(\.|$)/,kind:'ai',reason:'AI- en datawijzigingen beïnvloeden haalbaarheid, risico, governance, businesscase, compliance en roadmap.',targets:['data-ai','ai-scan','ai-capabilities','compliance-governance','businesscase','advies','roadmap','overzicht']}),
  Object.freeze({pattern:/^portal\.compliance(\.|$)/,kind:'risk',reason:'Compliancewijzigingen beïnvloeden risico, evidence, due diligence, acties, advies en executive sturing.',targets:['compliance-governance','due-diligence','advies','roadmap','overzicht','actueel-houden']}),
  Object.freeze({pattern:/^portal\.(strategy|strategyDna|canvases|finalConclusion)(\.|$)/,kind:'strategy',reason:'Strategische keuzes werken door naar conclusies, acties, prioriteiten, roadmap en uitvoering.',targets:['strategie-naar-maandagochtend','strategy-dna','canvassen','eindconclusie','advies','roadmap','uitvoeringsladder','overzicht']}),
  Object.freeze({pattern:/^portal\.(advice|roadmap|tasks|changes|freshness)(\.|$)/,kind:'execution',reason:'Uitvoering wijzigt planning, capaciteit, voortgang, gerealiseerde waarde, actualiteit en managementinformatie.',targets:['advies','roadmap','taken-werkstromen','wijzigingen','actueel-houden','uitvoeringsladder','overzicht','businesscase']}),
  Object.freeze({pattern:/^portal\.(project|integrations|connections)(\.|$)/,kind:'delivery',reason:'Project- en koppelingswijzigingen beïnvloeden planning, afhankelijkheden, uitvoerbaarheid, capaciteit, kosten en projectstatus.',targets:['koppelingen','taken-werkstromen','roadmap','businesscase','overzicht','actueel-houden']}),
  Object.freeze({pattern:/^portal\.(documents|notes|access)(\.|$)/,kind:'evidence',reason:'Documenten, notities en toegangscontext veranderen bewijs, overdraagbaarheid, governance, actualiteit en due-diligence-readiness.',targets:['documenten','gebruikers','due-diligence','compliance-governance','actueel-houden','onderzoek','overzicht']}),
  Object.freeze({pattern:/^portal\.(external|regulatory|sources)(\.|$)/,kind:'external-intelligence',reason:'Nieuwe externe data of regelgeving kan benchmark, wettelijke scope, risico, personeelscontext, deadlines, advies en prioriteiten wijzigen.',targets:['ondernemersdata','wet-regelgeving','bronnenbibliotheek','branche-markt','mensen','compliance-governance','onderzoek','advies','roadmap','overzicht']})
]);
function ruleEffects(path=''){
  return PATH_EFFECT_RULES.filter(rule=>rule.pattern.test(String(path))).map(rule=>({kind:rule.kind,reason:rule.reason,targets:[...rule.targets]}));
}
function calculationConsumerPages(changes=[]){
  return [...new Set(changes.flatMap(change=>CALCULATION_CONSUMERS[change.id]||[]))];
}
function downstreamDependencyClosure(seedPages=[]){
  const seen=new Set(seedPages.filter(Boolean)),queue=[...seen];
  while(queue.length){
    const page=queue.shift();
    for(const next of dependencyTargets(page)){
      if(!seen.has(next)){seen.add(next);queue.push(next);}
    }
  }
  return [...seen];
}

const n=v=>Number.isFinite(Number(v))?Number(v):null;
const canonical=v=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'
  ?Object.fromEntries(Object.keys(v).sort().map(key=>[key,canonical(v[key])])):v;
const stable=v=>v===undefined?'undefined':JSON.stringify(canonical(v));
function safe(id,state){try{return calc(id,state)}catch{return null}}
function valueChanged(a,b){
  if(typeof a==='number'||typeof b==='number'){const aa=n(a),bb=n(b);return aa!==bb}
  return stable(a)!==stable(b);
}
function pathValue(root,path){
  return String(path||'').split('.').filter(Boolean).reduce((value,key)=>value&&typeof value==='object'?value[key]:undefined,root);
}
function mutationChanged(path,before,after){
  const leafBefore=pathValue(before,path),leafAfter=pathValue(after,path);
  if(leafBefore!==undefined||leafAfter!==undefined)return valueChanged(leafBefore,leafAfter);
  // Parent-level patch/remove operations can invalidate a leaf without materializing it.
  const segments=String(path||'').split('.').filter(Boolean);
  const parent=segments.slice(0,2).join('.');
  return valueChanged(pathValue(before,parent),pathValue(after,parent));
}
function reviewForPath(path){
  const matches=REVIEW_RULES.filter(rule=>rule.pattern.test(String(path)));
  return {domains:[...new Set(matches.flatMap(rule=>rule.domains))],pages:[...new Set(matches.flatMap(rule=>rule.pages))]};
}
function closure(source){
  const seen=new Set([source]);const queue=[source];
  while(queue.length){
    const page=queue.shift();
    for(const target of dependencyTargets(page)){if(!seen.has(target)){seen.add(target);queue.push(target)}}
  }
  ['overzicht','advies','eindconclusie'].forEach(x=>seen.add(x));
  return [...seen];
}
export function sourcePageForPath(path=''){
  const parts=String(path).split('.').filter(Boolean);
  if(parts[0]!=='portal')return null;
  const candidate=parts[1]==='pages'?parts[2]:parts[1];
  return SECTION_PAGE[candidate]|| (REGISTERED_PAGES.has(candidate)?candidate:null);
}
export function calculateImpactSnapshot(state={}){
  const calculations=Object.fromEntries(CALCS.map(([id])=>[id,safe(id,state)]));
  const findings=bevindingen(state);
  const summary=bevindingenSamenvatting(state);
  return Object.freeze({calculations,findings,summary});
}
export function impactForMutation({path,before={},after={}}={}){
  const sourcePage=sourcePageForPath(path);
  const beforeSnap=calculateImpactSnapshot(before),afterSnap=calculateImpactSnapshot(after);
  const changes=[];
  for(const [id,unit] of CALCS){
    const from=beforeSnap.calculations[id],to=afterSnap.calculations[id];
    if(!valueChanged(from,to))continue;
    const delta=(n(from)!==null&&n(to)!==null)?n(to)-n(from):null;
    changes.push(Object.freeze({id,unit,from,to,delta}));
  }
  const beforeIds=new Set(beforeSnap.findings.map(x=>x.id)),afterIds=new Set(afterSnap.findings.map(x=>x.id));
  const advice=Object.freeze({
    added:afterSnap.findings.filter(x=>!beforeIds.has(x.id)).map(x=>x.id),
    removed:beforeSnap.findings.filter(x=>!afterIds.has(x.id)).map(x=>x.id),
    totalBefore:beforeSnap.summary.totaal,totalAfter:afterSnap.summary.totaal,
    valueBefore:beforeSnap.summary.waardePerJaar,valueAfter:afterSnap.summary.waardePerJaar
  });
  const rules=ruleEffects(path);
  const review=reviewForPath(path);
  const rawChanged=mutationChanged(path,before,after);
  const mappingStatus=sourcePage?'MAPPED':'REVIEW_REQUIRED';
  const calculationPages=calculationConsumerPages(changes);
  const seeds=[...(sourcePage?closure(sourcePage):[]),...calculationPages,...rules.flatMap(rule=>rule.targets),...review.pages,...OBSERVATION_SURFACES];
  const dependencyPages=downstreamDependencyClosure(seeds);
  const affectedPages=[...new Set([...dependencyPages,'overzicht','advies','eindconclusie'].filter(page=>REGISTERED_PAGES.has(page)))];
  const effectDetails=affectedPages.map(page=>Object.freeze({
    page,label:PAGE_EFFECT_LABELS[page]||page,
    viaCalculation:changes.filter(change=>(CALCULATION_CONSUMERS[change.id]||[]).includes(page)).map(change=>change.id),
    viaRule:rules.filter(rule=>rule.targets.includes(page)).map(rule=>rule.kind),
    relation:page===sourcePage?'source':calculationPages.includes(page)?'calculation':'dependency'
  }));
  return Object.freeze({
    path,sourcePage,
    affectedPages:Object.freeze(affectedPages),
    changes:Object.freeze(changes),advice,
    effectRules:Object.freeze(rules.map(rule=>Object.freeze({...rule,targets:Object.freeze([...rule.targets])}))),
    effectDetails:Object.freeze(effectDetails),
    mappingStatus,
    reviewDomains:Object.freeze(review.domains),
    externalExecutionAuthorized:false,
    evidenceStatus:'OBSERVED_NOT_VERIFIED',
    changed:Boolean(rawChanged||changes.length||advice.added.length||advice.removed.length||advice.totalBefore!==advice.totalAfter||advice.valueBefore!==advice.valueAfter)
  });
}
export const PORTAL_IMPACT_ENGINE_VERSION='2026-10-08-v4-one-brain-all-pages';
