import { PROFILE_DIMENSIONS } from './company-input.js';
import { ensureInteractionParityStyles } from './interaction-parity-style.js';

const FACTOR=Object.freeze([0,1,.78,.5,.22,.06]);
const DEFAULT_SHARES=Object.freeze([.10,.25,.35,.20,.10]);
export const EXECUTION_STEP_NAMES=Object.freeze(['Tellen','Vastleggen','Koppelen','Meten','Borgen']);
export const EXECUTION_LADDER_SHARES=Object.freeze({
  sturing:DEFAULT_SHARES,
  commercie:Object.freeze([.10,.20,.40,.20,.10]),
  operatie:DEFAULT_SHARES,
  finance:Object.freeze([.10,.20,.40,.20,.10]),
  mensen:Object.freeze([.05,.20,.35,.25,.15]),
  analytics:Object.freeze([.05,.20,.40,.20,.15]),
  quality:DEFAULT_SHARES,
  governance:DEFAULT_SHARES,
  tech:Object.freeze([.05,.15,.45,.20,.15]),
  culture:DEFAULT_SHARES,
  service:DEFAULT_SHARES,
  security:Object.freeze([.15,.30,.25,.20,.10]),
  duurzaam:DEFAULT_SHARES
});

const byId=new Map(PROFILE_DIMENSIONS.map(item=>[item.id,item]));
const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const level=value=>Math.max(1,Math.min(5,Math.round(Number(value)||2));
const pct=value=>new Intl.NumberFormat('nl-NL',{style:'percent',maximumFractionDigits:0}).format(value||0);
const euro=value=>new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(value||0);
const boolSteps=value=>Array.from({length:5},(_,i)=>Boolean(Array.isArray(value)&&value[i]));

export function executionThemeMetrics(state={},dimensionId){
  const item=byId.get(String(dimensionId));
  if(!item)throw new Error(`UNKNOWN_EXECUTION_DIMENSION:${dimensionId}`);
  const profile=state?.portal?.profile||{};
  const employees=Math.max(1,Number(profile.employees)||24);
  const hourlyCost=Math.max(0,Number(profile.hourlyCost)||52);
  const maturity=level(profile.maturity?.[item.id]);
  const currentAnnualCost=item.weeklyHours*FACTOR[maturity]*(employees/24)*46*hourlyCost;
  const potentialValue=currentAnnualCost*.7;
  const shares=EXECUTION_LADDER_SHARES[item.id]||DEFAULT_SHARES;
  const completed=boolSteps(state?.portal?.strategy?.execution?.[item.id]);
  const realizedShare=Math.min(1,completed.reduce((sum,done,index)=>sum+(done?(shares[index]||0):0),0));
  return Object.freeze({
    id:item.id,label:item.label,maturity,currentAnnualCost,potentialValue,
    realizedShare,realizedValue:potentialValue*realizedShare,
    completedSteps:completed.filter(Boolean).length,totalSteps:5,
    shares:Object.freeze([...shares]),completed:Object.freeze(completed)
  });
}

export function executionValueSummary(state={},dimensionIds=[]){
  const ids=[...new Set((Array.isArray(dimensionIds)?dimensionIds:[]).map(String))].filter(id=>byId.has(id));
  const themes=ids.map(id=>executionThemeMetrics(state,id));
  return Object.freeze({
    potentialValue:themes.reduce((sum,item)=>sum+item.potentialValue,0),
    realizedValue:themes.reduce((sum,item)=>sum+item.realizedValue,0),
    completedSteps:themes.reduce((sum,item)=>sum+item.completedSteps,0),
    totalSteps:themes.reduce((sum,item)=>sum+item.totalSteps,0),
    themes:Object.freeze(themes)
  });
}

export function defaultExecutionThemes(state={},limit=3){
  return PROFILE_DIMENSIONS.map(item=>executionThemeMetrics(state,item.id))
    .sort((a,b)=>b.currentAnnualCost-a.currentAnnualCost)
    .slice(0,Math.max(1,limit))
    .map(item=>item.id);
}

function selectedThemes(state={}){
  const saved=state?.portal?.strategy?.executionThemes;
  const clean=[...new Set((Array.isArray(saved)?saved:[]).map(String))].filter(id=>byId.has(id)).slice(0,3);
  return clean.length?clean:defaultExecutionThemes(state,3);
}

function themeSelector(state,selected){
  return `<div class="v2executionthemes" role="group" aria-label="Uitvoeringsthema's">${PROFILE_DIMENSIONS.map(item=>{
    const active=selected.includes(item.id);
    return `<button type="button" data-execution-theme="${esc(item.id)}" aria-pressed="${active?'true':'false'}" ${!active&&selected.length>=3?'disabled':''}>${esc(item.label)}</button>`;
  }).join('')}</div>`;
}

function themeCard(theme){
  return `<article class="v2executioncard" data-execution-card="${esc(theme.id)}"><header><div><small>${esc(theme.label)}</small><strong>${euro(theme.realizedValue)} / ${euro(theme.potentialValue)}</strong></div><span>${pct(theme.realizedShare)}</span></header><div class="v2executionsteps">${EXECUTION_STEP_NAMES.map((name,index)=>`<label><input type="checkbox" data-execution-step="${index}" ${theme.completed[index]?'checked':''}><span><b>${index+1}. ${esc(name)}</b><small>${pct(theme.shares[index])} van realiseerbaar potentieel</small></span></label>`).join('')}</div></article>`;
}

export function mountStrategyExecution(root,{domainState,onSaveStatus}={}){
  if(!root?.querySelectorAll)throw new TypeError('STRATEGY_EXECUTION_ROOT_REQUIRED');
  if(!domainState?.get||!domainState?.set)throw new TypeError('STRATEGY_EXECUTION_STATE_REQUIRED');
  ensureInteractionParityStyles(root.ownerDocument||globalThis.document);
  let saveTimer=null;
  const flush=()=>{clearTimeout(saveTimer);saveTimer=setTimeout(()=>domainState.flush?.().then(()=>onSaveStatus?.(domainState.status?.()||'saved')).catch(()=>onSaveStatus?.('error')),250);};
  const dirty=()=>{onSaveStatus?.(domainState.status?.()||'dirty');flush();};
  const render=()=>{
    const state=domainState.get()||{};const selected=selectedThemes(state);const summary=executionValueSummary(state,selected);
    root.innerHTML=`<section class="pvmodule v2execution"><div class="pvmodulehead"><span>5. Uitvoeren</span><h3>Van strategie naar aantoonbaar vrijgespeelde capaciteit</h3><p>Kies maximaal drie thema's. Legacy-semantiek: maximaal 70% van het huidige handwerk geldt als realiseerbaar; waarde telt pas mee zodra een uitvoeringsstap is afgerond.</p></div><div class="v2profilemetrics"><article><small>Realiseerbaar potentieel</small><strong>${euro(summary.potentialValue)}</strong><span>70% van huidig handwerk in gekozen thema's</span></article><article><small>Gerealiseerd</small><strong>${euro(summary.realizedValue)}</strong><span>${summary.completedSteps} van ${summary.totalSteps} treden afgerond</span></article></div>${themeSelector(state,selected)}<div class="v2executiongrid">${summary.themes.map(themeCard).join('')}</div></section>`;
    root.querySelectorAll('[data-execution-theme]').forEach(button=>button.addEventListener('click',()=>{
      const id=button.dataset.executionTheme;let next=[...selected];
      if(next.includes(id))next=next.filter(value=>value!==id);else if(next.length<3)next.push(id);
      if(!next.length)next=defaultExecutionThemes(domainState.get()||{},3);
      domainState.set('portal.strategy.executionThemes',next);dirty();render();
    }));
    root.querySelectorAll('[data-execution-card]').forEach(card=>{
      const id=card.dataset.executionCard;
      card.querySelectorAll('[data-execution-step]').forEach(input=>input.addEventListener('change',()=>{
        const index=Number(input.dataset.executionStep);const current=boolSteps(domainState.get(`portal.strategy.execution.${id}`));current[index]=input.checked;
        domainState.set(`portal.strategy.execution.${id}`,current);dirty();render();
      }));
    });
  };
  render();
  return Object.freeze({refresh:render,getSummary:()=>{const state=domainState.get()||{};return executionValueSummary(state,selectedThemes(state));}});
}
