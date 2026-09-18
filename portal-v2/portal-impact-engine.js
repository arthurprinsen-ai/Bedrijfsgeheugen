import { dependencyTargets } from './legacy-dependency-contract.js';
import { calculateLegacyEquivalent as calc } from './legacy-parity-engine.js';
import { bevindingen, bevindingenSamenvatting } from './bevindingen.js';

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
  freshness:'actueel-houden',changes:'wijzigingen',advice:'advies',offer:'offerte',roadmap:'roadmap',tasks:'taken-werkstromen'
});

const n=v=>Number.isFinite(Number(v))?Number(v):null;
const stable=v=>v&&typeof v==='object'?JSON.stringify(v):String(v??'');
function safe(id,state){try{return calc(id,state)}catch{return null}}
function valueChanged(a,b){
  if(typeof a==='number'||typeof b==='number'){const aa=n(a),bb=n(b);return aa!==bb}
  return stable(a)!==stable(b);
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
  return parts[0]==='portal' ? (SECTION_PAGE[parts[1]]||null) : null;
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
  return Object.freeze({
    path,sourcePage,
    affectedPages:Object.freeze(sourcePage?closure(sourcePage):['overzicht','advies','eindconclusie']),
    changes:Object.freeze(changes),advice,
    changed:Boolean(changes.length||advice.added.length||advice.removed.length||advice.totalBefore!==advice.totalAfter||advice.valueBefore!==advice.valueAfter)
  });
}
export const PORTAL_IMPACT_ENGINE_VERSION='2026-09-18-v1';
