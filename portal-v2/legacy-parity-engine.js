import { LEGACY_FUNCTIONAL_INVENTORY } from './legacy-functional-inventory.js';

const n=(v,f=0)=>Number.isFinite(Number(v))?Number(v):f;
const clamp=(v,min=0,max=100)=>Math.max(min,Math.min(max,n(v)));
const avg=(xs=[])=>xs.length?xs.reduce((s,v)=>s+n(v),0)/xs.length:0;
const ratio=(a,b,m=1)=>n(b)!==0?n(a)/n(b)*m:0;
const arr=v=>Array.isArray(v)?v:[];
const p=(s,k)=>String(k).split('.').reduce((v,key)=>v==null?undefined:v[key],s);
const pct=v=>clamp(v,0,100);
const readiness5=v=>clamp(n(v,1),1,5);
const horizonWeight=v=>({'Nu':1,'3 maanden':.9,'6 maanden':.75,'12 maanden':.55,'Later':.35}[v]??.5);
const statusWeight=v=>({'ontbreekt':0,'concept':.35,'vastgesteld':.75,'geoefend':1,'Open':.25,'Bezig':.6,'Geborgd':1}[v]??0);
const taskFrequency=v=>({'Dagelijks':1,'Wekelijks':.8,'Maandelijks':.45,'Incidenteel':.2}[v]??.5);

function profile(s){return s?.portal?.profile||{}}
function metrics(s){return s?.portal?.metrics||{}}
function finance(s){return s?.portal?.valueFinance||{}}
function aiScan(s){return s?.portal?.aiScan||{}}
/* Modellen die het oude klantportaal wel tekende maar V2 nog niet kende.
   Formules een op een geport uit klantportaal.html: tekenCmmiGrafiek (CMMI),
   de Greiner-banden op personeelsomvang, tekenTrustedAdvisor, en de
   DuPont-ontleding bij de waardebepaling. */
const CMMI_NIVEAUS=Object.freeze([
  ['Initieel','Het werk lukt door inzet van mensen. Uitkomsten wisselen per keer.'],
  ['Beheerst','Per afdeling afspraken, maar elke afdeling doet het net anders.'],
  ['Gedefinieerd','Een vastgelegde manier van werken die iedereen volgt.'],
  ['Gemeten','Je stuurt op cijfers: wat kost een proces en hoe lang duurt het.'],
  ['Optimaliserend','Verbeteren is routine; afwijkingen worden vanzelf gezien.']
]);
const GREINER_FASEN=Object.freeze([
  [0,10,'Groei door creativiteit','Alles loopt via de oprichter. Iedereen doet alles.','Leiderschapscrisis: de oprichter wordt het knelpunt.'],
  [10,25,'Groei door sturing','Er komen leidinggevenden, taken worden verdeeld.','Autonomiecrisis: mensen willen zelf beslissen, alles moet langs de top.'],
  [25,60,'Groei door delegatie','Afdelingen krijgen ruimte en eigen verantwoordelijkheid.','Beheersingscrisis: het overzicht verdwijnt, iedereen doet het net anders.'],
  [60,150,'Groei door coordinatie','Vaste processen en rapportages over afdelingen heen.','Bureaucratiecrisis: procedures gaan zwaarder wegen dan het werk.'],
  [150,Infinity,'Groei door samenwerking','Sturen op vertrouwen en gedeelde doelen in plaats van regels.','']
]);
const TRUSTED_ADVISOR=Object.freeze([
  ['Leverancier','Je levert wat er is besteld. Inwisselbaar op prijs.'],
  ['Vakman','Ze bellen je om je kennis, niet om je prijslijst.'],
  ['Partner','Je denkt mee over hun proces, niet alleen over jouw product.'],
  ['Vertrouwd adviseur','Ze bellen je voordat ze een besluit nemen, ook over dingen die je niet verkoopt.']
]);
function people(s){return s?.portal?.people||{}}
function headcount(s){return n(profile(s).headcount)||n(people(s).headcount)||0}

function manualCost(s){const x=profile(s);return n(x.manualHoursPerWeek)*46*n(x.hourlyCost)}
function maturityScores(s){const x=profile(s);const vals=arr(x.dimensionScores).map(n).filter(v=>v>0);if(vals.length)return vals;return Object.values(x.dimensions||{}).map(n).filter(v=>v>0)}
function completion(values){const xs=arr(values);return xs.length?xs.filter(v=>v!==undefined&&v!==null&&v!=='').length/xs.length*100:0}
function roadmapItems(s){return arr(s?.portal?.roadmap?.items)}
function adviceItems(s){return arr(s?.portal?.advice?.items)}
function findings(s){return arr(s?.portal?.strategy?.findings)}
function dueItems(s){return arr(s?.portal?.dueDiligence?.findings)}

const C={
 'average-maturity':s=>avg(maturityScores(s)),
 'manual-work-annual':s=>manualCost(s),
 'fte-lost':s=>n(profile(s).manualHoursPerWeek)/(40),
 'company-state':s=>{const m=avg(maturityScores(s));return m>=4?'voorsprong':m>=3?'op koers':m>=2?'kwetsbaar':'urgent'},
 'blocker-ranking':s=>arr(s?.portal?.overview?.blockers).map(x=>({...x,score:n(x.impact)*n(x.urgency,1)})).sort((a,b)=>b.score-a.score),
 'progress':s=>{const xs=roadmapItems(s);return xs.length?avg(xs.map(x=>x.done===true?100:n(x.progress))):0},
 'advice-priority':s=>adviceItems(s).map(x=>({...x,score:n(x.priority)*2+ratio(x.value,Math.max(1,n(x.duration)),1)})).sort((a,b)=>b.score-a.score),

 'dimension-maturity':s=>maturityScores(s),
 'profile-average':s=>avg(maturityScores(s)),
 'manual-work-impact':s=>manualCost(s),

 'data-ai-maturity':s=>readiness5(s?.portal?.dataAi?.maturity),
 'implementation-phase':s=>Math.max(1,['Oriëntatie','Fundament','Pilot','Opschalen','Borgen'].indexOf(s?.portal?.dataAi?.phase)+1),
 'change-readiness':s=>readiness5(s?.portal?.dataAi?.changeReadiness),
 'cost-benefit-curve':s=>Math.max(0,n(s?.portal?.dataAi?.costBenefit)),
 'governance-readiness':s=>readiness5(s?.portal?.dataAi?.governance),

 'annual-task-cost':s=>arr(aiScan(s).tasks).reduce((sum,x)=>sum+n(x.hoursPerWeek)*46*n(aiScan(s).hourlyRate),0),
 'supportable-share':s=>{const xs=arr(aiScan(s).tasks);return xs.length?avg(xs.map(x=>readiness5(x.dataReadiness)/5*.7+taskFrequency(x.repetition)*.3))*100:0},
 'risk-adjusted-benefit':s=>{const xs=arr(aiScan(s).tasks);const rate=n(aiScan(s).hourlyRate);return xs.reduce((sum,x)=>{const cost=n(x.hoursPerWeek)*46*rate;const support=readiness5(x.dataReadiness)/5;const risk=.6+.08*readiness5(x.errorRisk);return sum+cost*support*risk},0)},
 'opportunity-score':s=>{const xs=arr(aiScan(s).tasks);return xs.length?avg(xs.map(x=>n(x.hoursPerWeek)*taskFrequency(x.repetition)*readiness5(x.dataReadiness)*(6-readiness5(x.errorRisk)))):0},

 'input-completeness':s=>{const x=s?.portal?.inputs||{};return completion(Object.values(x))},
 'downstream-recalculation':s=>Object.keys(s?.portal?.inputs||{}).length,
 'answer-completeness':s=>completion(Object.values(s?.portal?.inputs||{})),

 'benefit-at-target-maturity':s=>{const target=clamp(s?.portal?.businessCase?.target,1,5);const factor=[0,1,.78,.5,.22,.06][target];return manualCost(s)*(1-factor)},
 'delay-cost':s=>C['benefit-at-target-maturity'](s)/12*n(s?.portal?.businessCase?.delay),
 'investment-net-result':s=>C['benefit-at-target-maturity'](s)-n(s?.portal?.businessCase?.investment),
 'payback':s=>{const monthly=C['benefit-at-target-maturity'](s)/12;return monthly>0?n(s?.portal?.businessCase?.investment)/monthly:0},

 'gross-margin':s=>n(metrics(s).grossMargin),
 'ebitda-margin':s=>ratio(metrics(s).ebitda,metrics(s).revenue,100),
 'wage-ratio':s=>ratio(metrics(s).wages,metrics(s).revenue,100),
 'marketing-ratio':s=>ratio(metrics(s).marketing,metrics(s).revenue,100),
 'it-ratio':s=>ratio(metrics(s).it,metrics(s).revenue,100),
 'dso':s=>n(metrics(s).dso),
 'customer-concentration':s=>n(metrics(s).largestCustomer),
 'productivity':s=>ratio(metrics(s).revenue,Math.max(1,n(profile(s).headcount||profile(s).employees)),1),
 'measurement-trend':s=>{const xs=arr(metrics(s).measurements);if(xs.length<2)return 0;return n(xs.at(-1)?.value)-n(xs[0]?.value)},

 'enterprise-value':s=>n(metrics(s).ebitda)*n(finance(s).multiple),
 'equity-value':s=>C['enterprise-value'](s)-n(finance(s).debt)+n(finance(s).cash),
 'dcf':s=>{const e=n(metrics(s).ebitda);const w=clamp(finance(s).wacc,1,50)/100;const g=.02;return w>g?e*(1+g)/(w-g):0},
 'dupont':s=>ratio(metrics(s).ebitda,finance(s).balance,1)*ratio(finance(s).balance,finance(s).equity,1),
 'altman-z':s=>{const f=finance(s),m=metrics(s),a=Math.max(1,n(f.balance));const wc=n(f.cash)-n(f.debt);return 1.2*wc/a+1.4*n(f.equity)/a+3.3*n(m.ebitda)/a+.6*n(f.equity)/Math.max(1,n(f.debt))+ratio(m.revenue,a,1)},
 'interest-coverage':s=>ratio(metrics(s).ebitda,finance(s).interest,1),
 'dscr':s=>ratio(metrics(s).ebitda,Math.max(1,n(finance(s).interest)+Math.max(0,n(finance(s).debt)*.1)),1),
 'break-even':s=>{const gm=clamp(metrics(s).grossMargin,0,100)/100;return gm>0?n(finance(s).fixed)/gm:0},
 'safety-margin':s=>{const rev=n(metrics(s).revenue),be=C['break-even'](s);return rev?((rev-be)/rev)*100:0},
 'cmmi-level':s=>{const gem=avg(maturityScores(s));return gem?clamp(Math.round(gem),1,5):0},
 'cmmi-ladder':s=>{const eigen=C['cmmi-level'](s);return CMMI_NIVEAUS.map(([naam,uitleg],i)=>({level:i+1,naam,uitleg,bereikt:i+1<eigen,huidig:i+1===eigen}))},
 'greiner-phase':s=>{const mw=headcount(s);if(!mw)return null;const f=GREINER_FASEN.find(([lo,hi])=>mw>=lo&&mw<hi)||GREINER_FASEN[GREINER_FASEN.length-1];return {vanaf:f[0],tot:f[1],fase:f[2],uitleg:f[3],crisis:f[4],medewerkers:mw}},
 'greiner-ladder':s=>{const mw=headcount(s);return GREINER_FASEN.map(([lo,hi,fase,uitleg,crisis])=>({vanaf:lo,tot:hi,fase,uitleg,crisis,huidig:mw>=lo&&mw<hi}))},
 'trusted-advisor-level':s=>{const m=profile(s).dimensions||{};const mt=metrics(s);const grootste=n(mt.largestCustomer);const herhaal=(mt.repeat===''||mt.repeat==null)?null:n(mt.repeat);let pos=1;if(readiness5(m.service)>=3)pos++;if(herhaal!==null&&herhaal>=50)pos++;if(readiness5(m.mensen)>=3&&grootste&&grootste<25)pos++;return clamp(pos,1,4)},
 'trusted-advisor-ladder':s=>{const eigen=C['trusted-advisor-level'](s);return TRUSTED_ADVISOR.map(([naam,uitleg],i)=>({level:i+1,naam,uitleg,bereikt:i+1<eigen,huidig:i+1===eigen}))},
 'dupont-breakdown':s=>{const m=metrics(s),f=finance(s);const omzet=n(m.revenue),balans=n(f.balance),ev=n(f.equity);const nettomarge=omzet?n(m.ebitda)*.6/omzet:0;const omloop=ratio(omzet,balans);const hefboom=ratio(balans,ev);return {netMargin:nettomarge*100,assetTurnover:omloop,leverage:hefboom,roe:nettomarge*omloop*hefboom*100}},
 'ebitda-multiple':s=>n(finance(s).multiple),
 'tei-summary':s=>{const baten=C['benefit-at-target-maturity'](s);const kosten=n(s?.portal?.businessCase?.investment);const risico=C['risk-adjusted-benefit'](s);return {kosten,baten,risicogewogen:risico,flexibiliteit:Math.max(0,baten-risico),netto:baten-kosten}},
 'sensitivity':s=>({base:C['equity-value'](s),downside:(n(metrics(s).ebitda)*.85*n(finance(s).multiple)-n(finance(s).debt)+n(finance(s).cash)),upside:(n(metrics(s).ebitda)*1.15*n(finance(s).multiple)-n(finance(s).debt)+n(finance(s).cash))}),

 'absence-gap':s=>n(s?.portal?.people?.absence)-4,
 'turnover-gap':s=>n(s?.portal?.people?.turnover)-10,
 'enps-gap':s=>n(s?.portal?.people?.enps)-20,
 'mto-maturity':s=>({'Geen meting':1,'Verouderd':2.5,'Actueel':5}[s?.portal?.people?.mto]??1),
 'vacancy-pressure':s=>ratio(s?.portal?.people?.vacancies,Math.max(1,n(profile(s).headcount||profile(s).employees)),100),

 'industry-benchmark-deltas':s=>arr(s?.portal?.market?.benchmarks).map(x=>({...x,delta:n(x.company)-n(x.benchmark)})),
 'industry-growth-context':s=>n(s?.portal?.market?.growth),
 'maturity-vs-cost-position':s=>({maturity:avg(maturityScores(s)),cost:manualCost(s)}),
 'do-nothing-cost':s=>manualCost(s)+C['delay-cost'](s),

 'technology-readiness':s=>avg([s?.portal?.dataAi?.maturity,s?.portal?.dataAi?.governance,s?.portal?.dataAi?.changeReadiness].map(readiness5)),
 'governance-maturity':s=>{const xs=Object.values(s?.portal?.compliance?.policies||{});return xs.length?avg(xs.map(x=>statusWeight(x)*5)):0},
 'esg-readiness':s=>avg(Object.values(s?.portal?.compliance?.esg||{}).map(readiness5)),
 'policy-completeness':s=>{const xs=Object.values(s?.portal?.compliance?.policies||{});return xs.length?avg(xs.map(x=>statusWeight(x)))*100:0},
 'compliance-risk':s=>100-(C['policy-completeness'](s)*.6+C['esg-readiness'](s)/5*40),
 'ai-capability-readiness':s=>avg(Object.values(s?.portal?.aiCapabilities||{}).map(readiness5)),
 'ai-capability-gap':s=>5-C['ai-capability-readiness'](s),

 'model-finding-value':s=>findings(s).reduce((sum,x)=>sum+n(x.value),0),
 'model-finding-horizon':s=>findings(s).map(x=>({...x,horizonWeight:horizonWeight(x.horizon)})),
 'priority-filter':s=>findings(s).filter(x=>n(x.value)>=n(s?.portal?.strategy?.minimumValue)&&horizonWeight(x.horizon)>=horizonWeight(s?.portal?.strategy?.horizon)),
 'canvas-completeness':s=>{const x=s?.portal?.canvases||{};return completion(Object.values(x).flatMap(v=>[v?.answer,v?.owner]))},
 'canvas-consensus':s=>{const xs=Object.values(s?.portal?.canvases||{}).filter(v=>v?.answer);return xs.length?Math.min(100,60+xs.filter(v=>v.owner).length/xs.length*40):0},

 'cross-source-consensus':s=>{const scores=[avg(maturityScores(s))/5,C['policy-completeness'](s)/100,C['ai-capability-readiness'](s)/5,Math.min(1,roadmapItems(s).length/5)];return avg(scores)*100},
 'recommendation-priority':s=>C['advice-priority'](s),
 'final-synthesis':s=>({consensus:C['cross-source-consensus'](s),value:C['model-finding-value'](s),capacity:C['fte-lost'](s),risk:C['compliance-risk'](s)}),

 'dd-readiness':s=>{const xs=dueItems(s);return xs.length?avg(xs.map(x=>(x.evidence?50:0)+(x.owner?25:0)+(n(x.materiality)>0?25:0))):0},
 'materiality':s=>avg(dueItems(s).map(x=>n(x.materiality))),
 'red-flags':s=>dueItems(s).filter(x=>x.redFlag===true).length,
 'transferability':s=>{const xs=dueItems(s);return xs.length?100-xs.filter(x=>x.redFlag===true||!x.evidence).length/xs.length*100:100},

 'theme-impact':s=>{const dna=s?.portal?.strategy?.dna||{};return Object.values(dna).filter(Boolean).length},
 'capability-maturity':s=>C['ai-capability-readiness'](s),
 'change-sequencing':s=>roadmapItems(s).slice().sort((a,b)=>n(a.start)-n(b.start)),
 'layer-maturity':s=>avg(Object.values(s?.portal?.strategyDna?.layers||{}).map(readiness5)),

 'freshness':s=>{const d=s?.portal?.freshness?.reviewDate;if(!d)return 0;const days=(Date.now()-Date.parse(d))/86400000;return clamp(100-days/3,0,100)},
 'expired-items':s=>arr(s?.portal?.freshness?.items).filter(x=>x.reviewDate&&Date.parse(x.reviewDate)<Date.now()).length,
 'ownership-completeness':s=>{const xs=arr(s?.portal?.freshness?.items);return xs.length?xs.filter(x=>x.owner).length/xs.length*100:0},
 'change-impact':s=>avg(arr(s?.portal?.changes?.items).map(x=>n(x.impact))),
 'follow-up-status':s=>{const xs=arr(s?.portal?.changes?.items);return xs.length?avg(xs.map(x=>statusWeight(x.status)))*100:0},

 'benefit-per-duration':s=>adviceItems(s).map(x=>({...x,benefitPerWeek:ratio(x.value,Math.max(1,n(x.duration)),1)})),
 'cross-model-weight':s=>adviceItems(s).map(x=>({...x,weighted:n(x.priority)*ratio(x.value,Math.max(1,n(x.duration)),1)})),
 'offer-total':s=>n(s?.portal?.offer?.sprints)*2*n(s?.portal?.offer?.weeklyPrice),
 'weekly-price':s=>n(s?.portal?.offer?.weeklyPrice),
 'end-price':s=>C['offer-total'](s),
 'timeline-position':s=>roadmapItems(s).map(x=>({title:x.title,start:clamp(x.start,1,12),end:clamp(n(x.start)+n(x.duration)-1,1,12)})),
 'duration':s=>roadmapItems(s).reduce((sum,x)=>sum+n(x.duration),0),
 'completion-progress':s=>{const xs=roadmapItems(s);return xs.length?avg(xs.map(x=>x.done===true?100:n(x.progress))):0},
 'roadmap-value':s=>roadmapItems(s).reduce((sum,x)=>sum+n(x.value),0)
};

const EXPECTED=[...new Set(Object.values(LEGACY_FUNCTIONAL_INVENTORY).flatMap(item=>item.calculations||[]))];

const FIELD_MAP={
 mw:'portal.profile.manualHoursPerWeek',uur:'portal.profile.hourlyCost',bDoel:'portal.businessCase.target',bUitstel:'portal.businessCase.delay',bInvest:'portal.businessCase.investment',
 cOmzet:'portal.metrics.revenue',cBrutomarge:'portal.metrics.grossMargin',cEbitda:'portal.metrics.ebitda',cLoon:'portal.metrics.wages',cKlanten:'portal.metrics.customers',cGrootste:'portal.metrics.largestCustomer',cMarketing:'portal.metrics.marketing',cNieuw:'portal.metrics.newCustomers',cDso:'portal.metrics.dso',cIt:'portal.metrics.it',kNps:'portal.metrics.nps',kTevreden:'portal.metrics.satisfaction',kHerhaal:'portal.metrics.repeat',kKlacht:'portal.metrics.complaints',
 wSchuld:'portal.valueFinance.debt',wCash:'portal.valueFinance.cash',wEV:'portal.valueFinance.equity',wBalans:'portal.valueFinance.balance',wVast:'portal.valueFinance.fixed',wRente:'portal.valueFinance.interest',wMultiple:'portal.valueFinance.multiple',wWacc:'portal.valueFinance.wacc',
 asTarief:'portal.aiScan.hourlyRate',mVerzuim:'portal.people.absence',mVerloop:'portal.people.turnover',mEnps:'portal.people.enps',mMto:'portal.people.mto',mVac:'portal.people.vacancies',bKeuze:'portal.market.industry',bOmzet:'portal.market.revenue',
 kHorizon:'portal.strategy.horizon',kMin:'portal.strategy.minimumValue',bsWat:'portal.freshness.what',bsWaarom:'portal.freshness.why',bsDatum:'portal.freshness.date',bsDoor:'portal.freshness.by',bsRaakt:'portal.freshness.affects',dcNaam:'portal.freshness.document',dcBij:'portal.freshness.documentOwner',dcDatum:'portal.freshness.reviewDate',
 nTitel:'portal.roadmap.draft.title',nDim:'portal.roadmap.draft.dimension',nStart:'portal.roadmap.draft.start',nDuur:'portal.roadmap.draft.duration'
};
function setPath(root,path,value){const keys=path.split('.');let x=root;for(let i=0;i<keys.length-1;i++)x=x[keys[i]]??={};x[keys.at(-1)]=value}
export function migrateLegacyState(legacy={}){const out={portal:{}};for(const [key,path] of Object.entries(FIELD_MAP))if(Object.hasOwn(legacy,key))setPath(out,path,legacy[key]);return out}
export function listCalculatorIds(){return Object.keys(C)}
export function calculateLegacyEquivalent(id,state={}){if(!C[id])throw new Error(`LEGACY_PARITY_CALCULATOR_MISSING:${id}`);return C[id](state)}
export function calculateCapability(capability,state={}){const item=LEGACY_FUNCTIONAL_INVENTORY[capability];if(!item)throw new Error(`LEGACY_CAPABILITY_UNKNOWN:${capability}`);return Object.fromEntries(item.calculations.map(id=>[id,calculateLegacyEquivalent(id,state)]))}
export function parityCoverage(){const actual=new Set(listCalculatorIds());const missing=EXPECTED.filter(id=>!actual.has(id));const extra=[...actual].filter(id=>!EXPECTED.includes(id));return Object.freeze({total:EXPECTED.length,implemented:EXPECTED.length-missing.length,missing:Object.freeze(missing),extra:Object.freeze(extra)})}
export const LEGACY_PARITY_ENGINE_VERSION='2026-09-09-v1';
