import { PROFILE_DIMENSIONS } from './modules/company-input.js';
import { calculateLegacyEquivalent } from './legacy-parity-engine.js';
import { EXECUTION_LADDER_CATALOG, EXECUTION_LADDER_STANDARD, EXECUTION_LADDER_REALIZABILITY, EXECUTION_LADDER_STEPS } from './execution-ladder-catalog.js';

const n=v=>Number.isFinite(Number(v))?Number(v):0;
const clone=v=>structuredClone(v);
const completedValue=(state,id,index)=>Boolean(state?.portal?.execution?.completed?.[id]?.[index]);

function standardFor(dimension){
 const raw=clone(EXECUTION_LADDER_STANDARD);
 raw.t=raw.t==='{{dimension}}'?dimension.label:raw.t;
 return raw;
}
function ladderFor(dimension){return clone(EXECUTION_LADDER_CATALOG[dimension.id]||standardFor(dimension))}
function adviceCount(state){
 const counts={};
 for(const item of state?.portal?.advice?.items||[]){
   const key=item?.dimension||item?.dim||item?.area;
   if(key)counts[key]=(counts[key]||0)+1;
 }
 return counts;
}

export function selectExecutionThemes(state={}){
 const costs=calculateLegacyEquivalent('dimension-costs',state);
 if(!costs.length)return [];
 const byId=new Map(costs.map(x=>[x.id,x]));
 const dimensions=PROFILE_DIMENSIONS.filter(x=>byId.has(x.id));
 const maturity=state?.portal?.profile?.maturity||{};
 const weakest=dimensions.slice().sort((a,b)=>(n(maturity[a.id])||2)-(n(maturity[b.id])||2))[0];
 const costliest=costs[0]&&dimensions.find(x=>x.id===costs[0].id);
 const counts=adviceCount(state);
 const mostFlagged=dimensions.slice().sort((a,b)=>(counts[b.id]||0)-(counts[a.id]||0))[0];
 const chosen=[],why={};
 for(const [d,reason] of [[weakest,'smalste schakel'],[costliest,'duurste post'],[mostFlagged,(counts[mostFlagged?.id]||0)>0?'vaakst aangewezen door modellen en canvassen':'hoge kosten']]){
   if(d&&!chosen.some(x=>x.id===d.id)){chosen.push(d);why[d.id]=reason}
 }
 for(const x of costs){
   if(chosen.length>=3)break;
   const d=dimensions.find(v=>v.id===x.id);
   if(d&&!chosen.some(v=>v.id===d.id)){chosen.push(d);why[d.id]='hoge kosten'}
 }
 return chosen.slice(0,3).map(d=>{
   const cost=byId.get(d.id)?.kosten||0,definition=ladderFor(d);
   return Object.freeze({id:d.id,label:d.label,title:definition.t,department:definition.afd,reason:why[d.id],level:n(maturity[d.id])||2,cost,steps:Object.freeze(definition.s.map((step,index)=>Object.freeze({...step,index,name:EXECUTION_LADDER_STEPS[index],done:completedValue(state,d.id,index)})))});
 });
}

export function executionLadderModel(state={}){
 const themes=selectExecutionThemes(state);
 let completed=0,realized=0,potential=0;
 for(const theme of themes){
   const max=theme.cost*EXECUTION_LADDER_REALIZABILITY;potential+=max;
   for(const step of theme.steps)if(step.done){completed++;realized+=max*n(step.deel)}
 }
 return Object.freeze({
   themes:Object.freeze(themes),
   completed,
   totalSteps:themes.reduce((s,t)=>s+t.steps.length,0),
   realized,
   potential,
   remaining:Math.max(0,potential-realized),
   progress:themes.length?Math.round(completed/(themes.length*5)*100):0,
   realizability:EXECUTION_LADDER_REALIZABILITY
 });
}

export function toggleExecutionStep(domainState,themeId,index){
 if(!domainState?.get||!domainState?.set)throw new TypeError('DOMAIN_STATE_REQUIRED');
 const current=Boolean(domainState.get()?.portal?.execution?.completed?.[themeId]?.[index]);
 domainState.set(`portal.execution.completed.${themeId}.${index}`,!current);
 return !current;
}
