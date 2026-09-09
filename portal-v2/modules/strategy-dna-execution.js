import { PROFILE_DIMENSIONS } from './company-input.js';

const FACTOR=Object.freeze([0,1,.78,.5,.22,.06]);
export const STANDARD_EXECUTION_SHARES=Object.freeze([.10,.25,.35,.20,.10]);
export const EXECUTION_REALIZABILITY=.70;
const STEP_NAMES=Object.freeze(['Tellen','Vastleggen','Koppelen','Meten','Borgen']);

const clampLevel=value=>Math.max(1,Math.min(5,Math.round(Number(value)||2)));
const euro=value=>new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(Number(value)||0);
const clone=value=>JSON.parse(JSON.stringify(value??{}));

export function profileExecutionThemes(state={}){
 const profile=state?.portal?.profile||{};
 const employees=Math.max(1,Number(profile.employees)||24);
 const hourlyCost=Math.max(0,Number(profile.hourlyCost)||52);
 return PROFILE_DIMENSIONS.map(item=>{
  const level=clampLevel(profile.maturity?.[item.id]);
  const annualManualCost=item.weeklyHours*FACTOR[level]*(employees/24)*46*hourlyCost;
  return Object.freeze({id:item.id,label:item.label,annualManualCost,shares:STANDARD_EXECUTION_SHARES,level});
 });
}

export function executionSignalDimensions(state={}){
 const execution=state?.portal?.strategy?.execution||{};
 const findings=Array.isArray(state?.portal?.strategy?.findings)?state.portal.strategy.findings:[];
 const advice=Array.isArray(state?.portal?.advice?.items)?state.portal.advice.items:[];
 return [
  ...(Array.isArray(execution.signalDimensions)?execution.signalDimensions:[]),
  ...findings.map(item=>item?.dimension??item?.dim).filter(Boolean),
  ...advice.map(item=>item?.dimension??item?.dim).filter(Boolean),
 ].map(String);
}

export function selectExecutionThemeIds(themes=[],signalDimensions=[],themeCount=3){
 const valid=(Array.isArray(themes)?themes:[]).filter(theme=>theme?.id);
 if(!valid.length)return [];
 const weakest=[...valid].sort((a,b)=>(Number(a.level)||2)-(Number(b.level)||2))[0];
 const mostExpensive=[...valid].sort((a,b)=>(Number(b.annualManualCost)||0)-(Number(a.annualManualCost)||0))[0];
 const validIds=new Set(valid.map(theme=>String(theme.id)));
 const counts={};
 for(const raw of Array.isArray(signalDimensions)?signalDimensions:[]){const id=String(raw);if(validIds.has(id))counts[id]=(counts[id]||0)+1;}
 let mostReferenced=null,most=0;
 for(const [id,count] of Object.entries(counts)){if(count>most){most=count;mostReferenced=id;}}
 const selected=[];
 const add=id=>{if(id&&validIds.has(String(id))&&!selected.includes(String(id))&&selected.length<themeCount)selected.push(String(id));};
 add(weakest?.id);add(mostExpensive?.id);add(mostReferenced);
 [...valid].sort((a,b)=>(Number(b.annualManualCost)||0)-(Number(a.annualManualCost)||0)).forEach(theme=>add(theme.id));
 return selected;
}

export function executionValueMetrics({themes=[],completion={}}={}){
 let potential=0,realized=0,completedSteps=0,totalSteps=0;
 for(const theme of themes){
  const cap=Math.max(0,Number(theme.annualManualCost)||0)*EXECUTION_REALIZABILITY;
  potential+=cap;
  const shares=Array.isArray(theme.shares)&&theme.shares.length?theme.shares:STANDARD_EXECUTION_SHARES;
  shares.forEach((share,index)=>{
   totalSteps++;
   if(completion?.[theme.id]?.[index]){completedSteps++;realized+=cap*Math.max(0,Number(share)||0);}
  });
 }
 realized=Math.min(realized,potential);
 return Object.freeze({potential,realized,remaining:Math.max(potential-realized,0),completedSteps,totalSteps,progress:potential>0?realized/potential:0});
}

function render(root,themes,completion){
 const metrics=executionValueMetrics({themes,completion});
 root.innerHTML=`<section class="pvmodule" data-strategy-execution><div class="pvmodulehead"><span>Uitvoeren</span><h3>Van strategie naar aantoonbare uitvoering</h3><p>Legacy-rekenregel: maximaal 70% van de huidige handwerkwaarde is realiseerbaar. Afgeronde treden bepalen hoeveel daarvan aantoonbaar is vrijgespeeld.</p></div><div class="v2profilemetrics"><article><small>Realiseerbaar potentieel</small><strong>${euro(metrics.potential)}</strong><span>70% van geselecteerde handwerkwaarde</span></article><article><small>Gerealiseerd</small><strong>${euro(metrics.realized)}</strong><span>${metrics.completedSteps} van ${metrics.totalSteps} treden afgerond</span></article><article><small>Nog te realiseren</small><strong>${euro(metrics.remaining)}</strong><span>capaciteitswaarde, geen gegarandeerde cashbesparing</span></article></div><div class="v2reviewlist">${themes.map(theme=>`<article data-execution-theme="${theme.id}"><div><small>Niveau ${theme.level}</small><b>${theme.label}</b><span>${euro(theme.annualManualCost)} handwerk p.j. · 70% = ${euro(theme.annualManualCost*EXECUTION_REALIZABILITY)}</span></div><div>${STEP_NAMES.map((name,index)=>`<label style="display:flex;gap:.4rem;align-items:center;margin:.2rem 0"><input type="checkbox" data-execution-step="${theme.id}:${index}" ${completion?.[theme.id]?.[index]?'checked':''}><span>${index+1}. ${name}</span></label>`).join('')}</div></article>`).join('')}</div></section>`;
 return metrics;
}

export function mountStrategyExecution(root,{domainState,onSaveStatus,themeCount=3}={}){
 if(!root?.querySelectorAll)throw new TypeError('STRATEGY_EXECUTION_ROOT_REQUIRED');
 if(!domainState?.get||!domainState?.set)throw new TypeError('STRATEGY_EXECUTION_STATE_REQUIRED');
 const state=domainState.get();
 const all=profileExecutionThemes(state);
 const configured=domainState.get('portal.strategy.execution.themeIds');
 const selectedIds=Array.isArray(configured)&&configured.length?configured:selectExecutionThemeIds(all,executionSignalDimensions(state),themeCount);
 const byId=new Map(all.map(item=>[item.id,item]));
 const themes=selectedIds.map(id=>byId.get(id)).filter(Boolean);
 if(!Array.isArray(configured)||!configured.length)domainState.set('portal.strategy.execution.themeIds',selectedIds);
 let completion=clone(domainState.get('portal.strategy.execution.completed'));
 const paint=()=>{
  const metrics=render(root,themes,completion);
  root.querySelectorAll('[data-execution-step]').forEach(input=>input.addEventListener('change',event=>{
   const [id,indexText]=event.currentTarget.dataset.executionStep.split(':');const index=Number(indexText);
   const next=Array.isArray(completion[id])?[...completion[id]]:[false,false,false,false,false];next[index]=event.currentTarget.checked;
   completion={...completion,[id]:next};domainState.set('portal.strategy.execution.completed',completion);onSaveStatus?.(domainState.status?.()||'dirty');
   Promise.resolve(domainState.flush?.()).then(()=>onSaveStatus?.(domainState.status?.()||'saved')).catch(()=>onSaveStatus?.('error'));paint();
  }));
  return metrics;
 };
 paint();
 return Object.freeze({themes:[...themes],metrics:()=>executionValueMetrics({themes,completion}),refresh:paint});
}
