
import {buildBusinessContext} from '../brain/context/business-context-engine.mjs';

const CONTEXT_PAGES=new Set(['bedrijfssituatie','cijfers-maatstaven','businesscase','waarde-financiering','branche-markt','roadmap','actieve-acties','due-diligence','exit','outcomes-evidence','learning-writeback','brain-verwerking','trust-center','powerhouse-control-center']);
const QUALITY_PAGES=new Set(['outcomes-evidence','learning-writeback','brain-verwerking','trust-center','powerhouse-control-center']);
const SCENARIO_PAGES=new Set(['businesscase','waarde-financiering','due-diligence','exit','roadmap','actieve-acties']);

const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const num=(v,d=1)=>Number.isFinite(Number(v))?Number(v).toLocaleString('nl-NL',{maximumFractionDigits:d}):'—';
function fmt(value,unit){
  if(!Number.isFinite(Number(value)))return '—';
  if(unit==='€')return new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(Number(value));
  return num(value,unit==='%'?1:0)+(unit?' '+unit:'');
}
function statusLabel(status){return ({'on-track':'Op koers','at-risk':'Risico','off-track':'Niet op koers'})[status]||'Nog niet voorspelbaar';}
function statusTone(status){return status==='on-track'?'good':status==='at-risk'?'warn':status==='off-track'?'bad':'unknown';}

function forecastChart(f){
  const values=[f.current,f.forecast?.lower,f.forecast?.expected,f.forecast?.upper,f.target].map(Number).filter(Number.isFinite);
  if(values.length<2)return '';
  const lo=Math.min(...values),hi=Math.max(...values),span=Math.max(1e-9,hi-lo);
  const x=v=>12+((Number(v)-lo)/span)*276;
  const current=Number.isFinite(Number(f.current))?x(f.current):null;
  const expected=Number.isFinite(Number(f.forecast?.expected))?x(f.forecast.expected):null;
  const lower=Number.isFinite(Number(f.forecast?.lower))?x(f.forecast.lower):expected;
  const upper=Number.isFinite(Number(f.forecast?.upper))?x(f.forecast.upper):expected;
  const target=Number.isFinite(Number(f.target))?x(f.target):null;
  return '<svg class="fsv-chart" viewBox="0 0 300 48" role="img" aria-label="Forecastband">'+
    '<line x1="12" y1="24" x2="288" y2="24" class="fsv-axis"/>'+
    (lower!=null&&upper!=null?'<rect x="'+Math.min(lower,upper)+'" y="15" width="'+Math.max(3,Math.abs(upper-lower))+'" height="18" rx="9" class="fsv-band"/>':'')+
    (current!=null?'<circle cx="'+current+'" cy="24" r="5" class="fsv-current"/>':'')+
    (expected!=null?'<circle cx="'+expected+'" cy="24" r="6" class="fsv-expected"/>':'')+
    (target!=null?'<line x1="'+target+'" y1="8" x2="'+target+'" y2="40" class="fsv-target"/><text x="'+Math.max(8,Math.min(276,target-10))+'" y="8">doel</text>':'')+
    '</svg>';
}
function forecastCard(f){
  const available=f.forecastStatus==='available'&&f.forecast;
  return '<article class="fsv-card"><header><div><span class="fsv-kicker">'+esc(f.label)+'</span><h4>'+esc(statusLabel(f.trackStatus))+'</h4></div><b class="fsv-pill '+statusTone(f.trackStatus)+'">'+esc(f.targetDate?new Date(f.targetDate).toLocaleDateString('nl-NL'):'Geen doeldatum')+'</b></header>'+
    forecastChart(f)+
    '<div class="fsv-metrics"><span><small>Nu</small><b>'+fmt(f.current,f.unit)+'</b></span><span><small>Verwacht</small><b>'+(available?fmt(f.forecast.expected,f.unit):'—')+'</b></span><span><small>Bandbreedte</small><b>'+(available?esc(fmt(f.forecast.lower,f.unit)+' – '+fmt(f.forecast.upper,f.unit)):'Onvoldoende historie')+'</b></span><span><small>Doel</small><b>'+fmt(f.target,f.unit)+'</b></span></div>'+
    '<footer><span>'+(f.evidence?.historyPoints||0)+' historiepunten</span><span>'+(available?'Trend uit waargenomen historie':'Minimaal 3 historiepunten nodig')+'</span></footer></article>';
}
function scenarioCard(s){
  const actions=(s.nextBestActions||[]).slice(0,2);
  return '<article class="fsv-scenario"><header><div><span>Scenario</span><h4>'+esc(s.label)+'</h4></div><b>Wat-als</b></header>'+
    '<div class="fsv-scenario-values"><span><small>Basis</small><b>'+fmt(s.baselineExpected,s.unit)+'</b></span><span><small>Met aannames</small><b>'+fmt(s.evidenceAdjustedScenarioExpected??s.scenarioExpected,s.unit)+'</b></span><span><small>Doel</small><b>'+fmt(s.target,s.unit)+'</b></span></div>'+
    '<p>Scenario-effecten zijn aannames totdat outcomes ze hebben gekalibreerd.</p>'+
    '<div class="fsv-actions">'+actions.map(a=>'<button type="button" data-fsv-page="'+esc(a.page)+'">'+esc(a.action)+' →</button>').join('')+'</div></article>';
}
async function loadPredictionQuality(fetchImpl=globalThis.fetch){
  try{
    const response=await fetchImpl('/api/portal-prediction-intelligence',{headers:{accept:'application/json'},credentials:'same-origin'});
    if(!response.ok)return null;
    return response.json();
  }catch{return null;}
}
function qualityPanel(q={}){
  const state=String(q.prediction_state||'UNKNOWN');
  const tone=state==='CALIBRATED_LEARNING'?'good':state.includes('DEGRADED')||state.includes('CRITICAL')?'warn':'unknown';
  return '<article class="fsv-quality"><header><div><span class="fsv-kicker">Voorspelkwaliteit</span><h4>Leert Powerhouse aantoonbaar beter vooruitkijken?</h4></div><b class="fsv-pill '+tone+'">'+esc(state.replaceAll('_',' '))+'</b></header>'+
    '<div class="fsv-quality-grid"><span><small>Brier-score</small><b>'+num(q.brier_score,4)+'</b></span><span><small>Calibratiefout</small><b>'+num(q.calibration_error,4)+'</b></span><span><small>Timingfout</small><b>'+num(q.timing_mae_days,1)+' dagen</b></span><span><small>Resolved</small><b>'+num(q.resolved_total,0)+' / '+num(q.forecast_total,0)+'</b></span><span><small>Signalen</small><b>'+num(q.signal_total,0)+'</b></span><span><small>Brontypen</small><b>'+num(q.independent_source_types,0)+'</b></span></div>'+
    '<p>Deze metingen bepalen of forecast-methodes mogen promoveren. Slechtere challengers blijven buiten productie.</p></article>';
}
function selfImprovementPanel(s={}){
  if(!s||typeof s!=='object')return '';
  const state=String(s.self_improvement_state||'UNKNOWN');
  const tone=state==='READY_FOR_CONTROLLED_PROMOTION'?'good':state==='GUARDRAIL_BLOCKED'?'bad':state==='LEARNING'?'warn':'unknown';
  const loop=Array.isArray(s.contract?.loop)?s.contract.loop:['observe','detect','hypothesize','build','test','evaluate','compare','promote','measure','learn'];
  const measured=Number(s.candidate_measured)||0,total=Number(s.candidate_total)||0;
  const verified=Number(s.verified_outcomes)||0,companies=Number(s.learning_companies)||0;
  const ready=Number(s.compiler_ready)||0,evidencePending=Number(s.compiler_evidence_pending)||0,regressionPending=Number(s.compiler_regression_pending)||0;
  const modelIssues=(Number(s.model_health_degraded)||0)+(Number(s.model_health_unknown)||0);
  const defects=Number(s.escaped_defects_without_regression)||0;
  return '<article class="fsv-improvement"><header><div><span class="fsv-kicker">Compound Intelligence</span><h4>Wordt Powerhouse aantoonbaar slimmer?</h4></div><b class="fsv-pill '+tone+'">'+esc(state.replaceAll('_',' '))+'</b></header>'+
    '<div class="fsv-loop" aria-label="Zelfverbeteringslus">'+loop.map((step,index)=>'<span><b>'+esc(step)+'</b>'+(index<loop.length-1?'<i>→</i>':'')+'</span>').join('')+'</div>'+
    '<div class="fsv-quality-grid"><span><small>Geverifieerde outcomes</small><b>'+num(verified,0)+'</b></span><span><small>Lerende bedrijven</small><b>'+num(companies,0)+'</b></span><span><small>Gemeten kandidaten</small><b>'+num(measured,0)+' / '+num(total,0)+'</b></span><span><small>Klaar voor evaluatie</small><b>'+num(ready,0)+'</b></span><span><small>Evidence/regressie open</small><b>'+num(evidencePending+regressionPending,0)+'</b></span><span><small>Model/guardrail issues</small><b>'+num(modelIssues+defects,0)+'</b></span></div>'+
    '<p>Alleen bewezen verbeteringen mogen via evaluatie, regressie- en security-gates promoveren. Powerhouse herschrijft productie nooit ongecontroleerd.</p></article>';
}
function ensureStyles(doc=document){
  if(!doc||doc.querySelector('link[data-foresight-context-ui]'))return;
  const link=doc.createElement('link');link.rel='stylesheet';link.href='./foresight-context.css';link.dataset.foresightContextUi='true';doc.head.appendChild(link);
}
function contextModel(state={}){try{return buildBusinessContext(state||{});}catch{return null;}}
export function buildContextualForesightModel(pageId,state={},quality=null,{overview=false}={}){
  const context=contextModel(state);
  return Object.freeze({
    pageId,
    context,
    forecasts:Object.freeze([...(context?.goalForecasts||[])]),
    scenarios:Object.freeze([...(context?.goalScenarios||[])]),
    showQuality:Boolean(overview||QUALITY_PAGES.has(pageId)),
    showScenario:Boolean(SCENARIO_PAGES.has(pageId)),
    quality
  });
}
function sectionMarkup({pageId,state,quality,overview=false}={}){
  const model=buildContextualForesightModel(pageId,state,quality,{overview});
  const forecasts=model.forecasts;
  const scenarios=model.scenarios;
  const showQuality=model.showQuality;
  const showScenario=model.showScenario;
  const predictionCards=forecasts.slice(0,overview?3:4).map(forecastCard).join('');
  const scenarioCards=showScenario?scenarios.slice(0,3).map(scenarioCard).join(''):'';
  if(!predictionCards&&!scenarioCards&&!showQuality)return '';
  return '<section class="fsv-context" data-foresight-context="true" data-page="'+esc(pageId||'overzicht')+'">'+
    '<div class="fsv-head"><div><span class="fsv-kicker">Powerhouse Foresight</span><h3>'+(overview?'Wat zien we aankomen?':'Vooruitblik in deze context')+'</h3><p>Waarschijnlijkheden en scenario’s naast de actuele bedrijfscontext — met onzekerheid zichtbaar, nooit als zekerheid.</p></div><span class="fsv-live">Predict → Act → Learn</span></div>'+
    (predictionCards?'<div class="fsv-grid">'+predictionCards+'</div>':'<div class="fsv-empty"><b>Nog geen onderbouwde bedrijfsforecast.</b><span>Leg doelen, actuele waarden en minimaal drie historiepunten vast; Powerhouse vult hier geen voorbeeldvoorspellingen in.</span></div>')+
    (scenarioCards?'<div class="fsv-scenarios">'+scenarioCards+'</div>':'')+
    (showQuality&&quality?qualityPanel(quality)+selfImprovementPanel(quality.self_improvement):'')+
    '</section>';
}
function bind(section,openPage){section?.querySelectorAll?.('[data-fsv-page]').forEach(btn=>btn.addEventListener('click',()=>openPage?.(btn.dataset.fsvPage)));}
export async function mountContextualForesight(host,{pageId,state={},openPage,fetchImpl=globalThis.fetch}={}){
  if(!host||!CONTEXT_PAGES.has(pageId))return null;
  ensureStyles(host.ownerDocument||document);
  host.querySelector?.('[data-foresight-context]')?.remove();
  const quality=QUALITY_PAGES.has(pageId)?await loadPredictionQuality(fetchImpl):null;
  const html=sectionMarkup({pageId,state,quality});
  if(!html)return null;
  const holder=(host.ownerDocument||document).createElement('div');holder.innerHTML=html;
  const section=holder.firstElementChild;host.appendChild(section);bind(section,openPage);return section;
}
export async function mountOverviewForesight(root,{state={},openPage,fetchImpl=globalThis.fetch}={}){
  const main=root?.querySelector?.('.main');if(!main)return null;
  ensureStyles(root.ownerDocument||document);
  main.querySelector?.('[data-foresight-context]')?.remove();
  const quality=await loadPredictionQuality(fetchImpl);
  const holder=(root.ownerDocument||document).createElement('div');holder.innerHTML=sectionMarkup({pageId:'overzicht',state,quality,overview:true});
  const section=holder.firstElementChild;if(!section)return null;
  const anchor=main.querySelector('[data-business-journey-overview]')||main.querySelector('#companyDecisionCockpit')||main.querySelector('.dashboard');
  if(anchor?.parentNode===main)anchor.after(section);else main.appendChild(section);
  bind(section,openPage);return section;
}
export const FORESIGHT_CONTEXT_PAGES=Object.freeze([...CONTEXT_PAGES]);
