import {buildGoalForecasts,buildJourneyProgress} from './goal-forecast-engine.mjs';
import {buildGoalScenarios} from './goal-scenario-engine.mjs';
import {buildGoalOutcomeLearning} from './goal-outcome-learning.mjs';
const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const child of Object.values(value))freeze(child);}return value;};
const arr=v=>Array.isArray(v)?v:[];
const num=v=>Number.isFinite(Number(v))?Number(v):null;
const lower=v=>String(v??'').trim().toLowerCase();
const unique=v=>[...new Set(v.filter(Boolean))];

export const BUSINESS_STAGES=freeze({
  start:{id:'start',label:'Start & validatie',intent:'prove_business_model',models:['unit-economics','customer-validation','cash-runway','businesscase'],pages:['profiel','businesscase','branche-markt','waarde-financiering','roadmap']},
  validate:{id:'validate',label:'Validatie & eerste tractie',intent:'prove_repeatability',models:['unit-economics','cohort-retention','customer-concentration','cash-runway'],pages:['businesscase','cijfers-maatstaven','branche-markt','roadmap','outcomes-evidence']},
  grow:{id:'grow',label:'Groei',intent:'grow_value',models:['dupont','ansoff','businesscase','impact-engine'],pages:['businesscase','strategie-naar-maandagochtend','os:impact-engine','roadmap','outcomes-evidence']},
  scale:{id:'scale',label:'Snelle groei / opschalen',intent:'scale_without_breaking',models:['capacity-model','cost-to-serve','capability-maturity','scenario-simulator','impact-engine'],pages:['bedrijfssituatie','os:capability-graph','os:scenario-simulator','os:impact-engine','os:next-best-actions','roadmap']},
  professionalize:{id:'professionalize',label:'Professionaliseren',intent:'reduce_key_person_dependency',models:['capability-maturity','process-maturity','governance','key-person-risk'],pages:['strategy-dna','canvassen','mensen','data-ai','compliance-governance','roadmap']},
  mature:{id:'mature',label:'Volwassen & stabiel',intent:'optimize_and_protect',models:['dupont','portfolio-optimization','risk-heatmap','forecasting'],pages:['overzicht','cijfers-maatstaven','os:impact-engine','os:scenario-simulator','outcomes-evidence']},
  stagnate:{id:'stagnate',label:'Stagnatie',intent:'restore_momentum',models:['growth-gap','portfolio-analysis','customer-profitability','ansoff'],pages:['branche-markt','model-bcg','businesscase','os:impact-engine','roadmap']},
  loss:{id:'loss',label:'Verlies & herstel',intent:'restore_margin_cash',models:['break-even','contribution-margin','cash-conversion','cost-to-serve','13-week-cashflow'],pages:['herstel-continuiteit','waarde-financiering','cijfers-maatstaven','os:scenario-simulator','actieve-acties']},
  crisis:{id:'crisis',label:'Acute continuïteit',intent:'protect_continuity',models:['13-week-cashflow','cash-runway','scenario-planning','dependency-map','decision-log'],pages:['herstel-continuiteit','waarde-financiering','os:scenario-simulator','recovery-obligations','actieve-acties','audittrail']}
});

export const STRATEGIC_EVENTS=freeze({
  funding:{id:'funding',label:'Financiering ophalen',models:['funding-need','cash-runway','debt-capacity','equity-story'],pages:['waarde-financiering','businesscase','documenten','roadmap']},
  buy:{id:'buy',label:'Bedrijf kopen',models:['normalized-ebitda','qoe-signals','working-capital','customer-concentration','key-person-risk','synergy-map','100-day-plan'],pages:['due-diligence','waarde-financiering','documenten','audit','os:scenario-simulator','roadmap']},
  sell:{id:'sell',label:'Bedrijf verkopen',models:['exit-readiness','normalized-kpis','key-person-risk','process-evidence','value-leakage','data-room-readiness'],pages:['exit','due-diligence','waarde-financiering','documenten','audit','roadmap']},
  merger:{id:'merger',label:'Fusie',models:['synergy-map','operating-model','integration-risk','culture-risk'],pages:['due-diligence','os:scenario-simulator','roadmap','mensen','data-ai']},
  integration:{id:'integration',label:'Post-merger integratie',models:['100-day-plan','synergy-tracking','dependency-map','capability-overlap'],pages:['roadmap','taken-werkstromen','os:impact-engine','os:next-best-actions','outcomes-evidence']},
  succession:{id:'succession',label:'Bedrijfsopvolging',models:['key-person-risk','ownership-readiness','management-capability','transferability'],pages:['exit','mensen','documenten','roadmap','waarde-financiering']},
  mbo:{id:'mbo',label:'MBO / MBI',models:['debt-capacity','management-readiness','normalized-ebitda','cashflow-cover'],pages:['waarde-financiering','due-diligence','mensen','roadmap']},
  internationalize:{id:'internationalize',label:'Internationaliseren',models:['market-entry','scenario-analysis','capacity-model','compliance-map'],pages:['branche-markt','businesscase','os:scenario-simulator','compliance-governance','roadmap']},
  restructure:{id:'restructure',label:'Herstructureren',models:['13-week-cashflow','cost-base','scenario-planning','dependency-map'],pages:['herstel-continuiteit','waarde-financiering','actieve-acties','roadmap','audittrail']},
  portfolio:{id:'portfolio',label:'Investeerder / portfolio',models:['portfolio-benchmark','value-creation','risk-heatmap','capital-allocation','execution-tracking'],pages:['portfolio-control','model-bcg','os:impact-engine','os:scenario-simulator','outcomes-evidence']}
});

export const USER_GOALS=freeze({
  revenue_growth:{label:'Omzetgroei',models:['ansoff','pipeline-economics'],pages:['branche-markt','businesscase','roadmap']},
  profit:{label:'Meer winst',models:['dupont','contribution-margin','cost-to-serve'],pages:['cijfers-maatstaven','os:impact-engine','businesscase']},
  cash:{label:'Cash beschermen',models:['cash-conversion','13-week-cashflow','working-capital'],pages:['waarde-financiering','os:scenario-simulator','actieve-acties']},
  automate:{label:'Groei zonder extra FTE',models:['automation-potential','capacity-model','impact-engine'],pages:['data-ai','ai-scan','os:impact-engine','roadmap']},
  valuation:{label:'Ondernemingswaarde verhogen',models:['value-drivers','normalized-ebitda','risk-discount'],pages:['waarde-financiering','exit','businesscase']},
  exit:{label:'Verkoop voorbereiden',models:['exit-readiness','key-person-risk','data-room-readiness'],pages:['exit','due-diligence','documenten']},
  resilience:{label:'Risico verlagen',models:['risk-heatmap','dependency-map','scenario-planning'],pages:['compliance-governance','os:scenario-simulator','audittrail']}
});

function latestContextRecord(state={}){
  return arr(state?.records).slice().sort((a,b)=>String(b?.observedAt||b?.observed_at||'').localeCompare(String(a?.observedAt||a?.observed_at||'')))
    .find(record=>record?.payload?.business_context||record?.payload?.lifecycle_stage||record?.payload?.stage||record?.payload?.strategic_events||record?.payload?.goals);
}

function explicitStage(state){
  const record=latestContextRecord(state);
  return lower(state?.portal?.business_context?.stage||state?.portal?.lifecycle?.stage||state?.portal?.context?.stage||state?.company?.lifecycle_stage||record?.payload?.business_context?.stage||record?.payload?.lifecycle_stage||record?.payload?.stage);
}

function inferStage(state={}){
  const explicit=explicitStage(state);
  if(BUSINESS_STAGES[explicit])return {stage:explicit,source:'explicit',confidence:1,reasons:['explicit-stage']};
  const finance=state?.portal?.finance||state?.finance||state?.portal?.profile?.finance||{};
  const runway=num(finance.cash_runway_weeks??finance.runway_weeks);
  const profit=num(finance.net_income??finance.profit??finance.ebitda);
  const revenueGrowth=num(finance.revenue_growth_pct??finance.revenueGrowthPct);
  const headcountGrowth=num(state?.portal?.people?.headcount_growth_pct??state?.people?.headcount_growth_pct);
  const maturity=num(state?.portal?.maturity?.overall??state?.maturity?.overall);
  if(runway!=null&&runway<=13)return {stage:'crisis',source:'finance',confidence:.9,reasons:['cash-runway-lte-13-weeks']};
  if(profit!=null&&profit<0)return {stage:'loss',source:'finance',confidence:.85,reasons:['negative-profit']};
  if(revenueGrowth!=null&&revenueGrowth<2)return {stage:'stagnate',source:'finance',confidence:.7,reasons:['low-growth']};
  if(revenueGrowth!=null&&revenueGrowth>=30)return {stage:'scale',source:'growth',confidence:.8,reasons:['high-revenue-growth']};
  if(headcountGrowth!=null&&headcountGrowth>=25)return {stage:'scale',source:'growth',confidence:.75,reasons:['high-headcount-growth']};
  if(maturity!=null&&maturity<.45)return {stage:'professionalize',source:'maturity',confidence:.65,reasons:['low-operating-maturity']};
  return {stage:'grow',source:'default',confidence:0,reasons:['no-explicit-stage']};
}

function detectEvents(state={}){
  const record=latestContextRecord(state);
  const explicit=arr(state?.portal?.business_context?.events||state?.company?.strategic_events||record?.payload?.business_context?.events||record?.payload?.strategic_events).map(lower).filter(x=>STRATEGIC_EVENTS[x]);
  const legacyStage=lower(state?.portal?.lifecycle?.stage||state?.portal?.context?.stage||state?.company?.lifecycle_stage||record?.payload?.lifecycle_stage||record?.payload?.stage);
  const t=lower(state?.portal?.transaction?.type||state?.transaction?.type||state?.ma?.type);
  const mapped=[];
  if(STRATEGIC_EVENTS[legacyStage])mapped.push(legacyStage);
  if(['buy','buy-side','acquisition','acquire'].includes(t))mapped.push('buy');
  if(['sell','sell-side','exit','divest'].includes(t))mapped.push('sell');
  if(['merger','merge'].includes(t))mapped.push('merger');
  if(['integration','post-merger','pmi'].includes(t))mapped.push('integration');
  if(arr(state?.portal?.portfolio?.companies||state?.portfolio?.companies).length>1)mapped.push('portfolio');
  return unique([...explicit,...mapped]);
}

function detectGoals(state={}){
  const record=latestContextRecord(state);
  return unique(arr(state?.portal?.business_context?.goals||state?.portal?.goals||state?.company?.goals||record?.payload?.business_context?.goals||record?.payload?.goals).map(lower).filter(x=>USER_GOALS[x]));
}

function health(state={}){
  const finance=state?.portal?.finance||state?.finance||{};
  const risks=arr(state?.portal?.risks||state?.risks);
  const sources=arr(state?.portal?.runtime?.sources?.items||state?.portal?.sources);
  const runway=num(finance.cash_runway_weeks??finance.runway_weeks);
  const margin=num(finance.ebitda_margin_pct??finance.margin_pct);
  const growth=num(finance.revenue_growth_pct??finance.revenueGrowthPct);
  const maxRisk=risks.reduce((m,r)=>Math.max(m,Number(r?.severity??r?.score??0)||0),0);
  const unhealthySources=sources.filter(s=>s?.healthy===false).length;
  return freeze({
    cash:runway==null?'unknown':runway<=13?'critical':runway<=26?'attention':'healthy',
    margin:margin==null?'unknown':margin<0?'critical':margin<8?'attention':'healthy',
    growth:growth==null?'unknown':growth<2?'attention':'healthy',
    risk:maxRisk>=.8?'critical':maxRisk>=.5?'attention':risks.length?'healthy':'unknown',
    data:!sources.length?'unknown':unhealthySources?'attention':'healthy'
  });
}

function maturity(state={}){
  const raw=state?.portal?.maturity||state?.maturity||{};
  const dimensions=['strategy','process','data','technology','people','governance'];
  return freeze(Object.fromEntries(dimensions.map(k=>[k,num(raw[k])])) );
}

function contextHistory(state={}){
  return arr(state?.records)
    .filter(record=>{
      const p=record?.payload||{};
      return BUSINESS_STAGES[lower(p?.business_context?.stage||p?.lifecycle_stage||p?.stage)];
    })
    .sort((a,b)=>String(a?.observedAt||a?.observed_at||'').localeCompare(String(b?.observedAt||b?.observed_at||'')))
    .map(record=>{
      const p=record.payload||{};
      const stage=lower(p?.business_context?.stage||p?.lifecycle_stage||p?.stage);
      return freeze({
        stage,
        label:BUSINESS_STAGES[stage].label,
        observedAt:record?.observedAt||record?.observed_at||null,
        evidenceIds:arr(record?.evidenceIds||record?.evidence_ids).filter(Boolean)
      });
    });
}

function priorityRank(stage,events,goals){
  const now=[];
  if(stage==='crisis')now.push('cash-runway','critical-obligations','13-week-actions');
  if(stage==='loss')now.push('margin-leakage','working-capital','customer-profitability');
  if(stage==='scale')now.push('capacity-bottlenecks','automation-opportunities','capability-gaps');
  if(stage==='stagnate')now.push('growth-gap','customer-profitability','portfolio-focus');
  if(events.includes('restructure')&&stage!=='crisis')now.push('cash-runway','critical-obligations','13-week-actions');
  if(events.includes('buy'))now.push('quality-of-earnings','deal-risks','integration-readiness');
  if(events.includes('sell'))now.push('exit-readiness','value-leakage','data-room-evidence');
  if(events.includes('integration'))now.push('synergy-tracking','dependency-resolution','100-day-plan');
  if(events.includes('funding'))now.push('funding-need','runway','funding-story');
  if(goals.includes('automate')&&stage!=='scale')now.push('automation-opportunities','capacity-bottlenecks');
  return unique(now).slice(0,8);
}

function journey(stage,events){
  const map={
    start:['start','validate','grow'],
    validate:['validate','grow','professionalize'],
    grow:['grow','scale','professionalize'],
    scale:['scale','professionalize','mature'],
    professionalize:['professionalize','mature'],
    mature:['mature','grow'],
    stagnate:['stagnate','grow'],
    loss:['loss','grow'],
    crisis:['crisis','loss','grow']
  };
  const next=map[stage]||[stage];
  const overlays=events.map(id=>STRATEGIC_EVENTS[id]?.label).filter(Boolean);
  return freeze({current:stage,next:next.slice(1),overlays});
}

export function buildBusinessContext(state={}){
  const detected=inferStage(state);
  const events=detectEvents(state);
  const goals=detectGoals(state);
  const stage=BUSINESS_STAGES[detected.stage];
  const eventDefs=events.map(id=>STRATEGIC_EVENTS[id]);
  const goalDefs=goals.map(id=>USER_GOALS[id]);
  const models=unique([...stage.models,...eventDefs.flatMap(x=>x.models),...goalDefs.flatMap(x=>x.models)]);
  const pages=unique([...stage.pages,...eventDefs.flatMap(x=>x.pages),...goalDefs.flatMap(x=>x.pages)]);
  const priorities=priorityRank(detected.stage,events,goals);
  const base={
    schemaVersion:'business-context.v3',
    primary:{...detected,label:stage.label,intent:stage.intent},
    events,
    eventLabels:eventDefs.map(x=>x.label),
    goals,
    goalLabels:goalDefs.map(x=>x.label),
    health:health(state),
    maturity:maturity(state),
    models,
    pages,
    priorities,
    history:contextHistory(state),
    journey:journey(detected.stage,events),
    evidenceMode:detected.source==='default'?'unproven-default':'derived',
    learningKey:`business-context:${detected.stage}:${[...events].sort().join('+')||'none'}`
  };
  const goalForecasts=buildGoalForecasts(state,goals);
  const goalScenarios=buildGoalScenarios(state,goals);
  const goalOutcomeLearning=buildGoalOutcomeLearning(state);
  const targetJourney=buildJourneyProgress(state,base);
  return freeze({...base,goalForecasts,goalScenarios,goalOutcomeLearning,targetJourney});
}

export function buildContextNarrative(context){
  const overlays=[...context.eventLabels,...context.goalLabels];
  const primary=context.evidenceMode==='unproven-default'?'Bedrijfsfase nog niet expliciet vastgesteld':context.primary.label;
  const forecastRisks=(context.goalForecasts||[]).filter(item=>['at-risk','off-track'].includes(item.trackStatus)).map(item=>item.goalId);
  return freeze({
    headline:overlays.length?`${primary} · ${overlays.slice(0,2).join(' · ')}`:primary,
    now:context.priorities.slice(0,3),
    decide:context.models.slice(0,4),
    do:context.pages.filter(x=>['actieve-acties','roadmap','os:next-best-actions','taken-werkstromen'].includes(x)).slice(0,3),
    next:context.journey.next,
    target:context.targetJourney?.target||null,
    forecastRisks,
    scenarioPriorities:(context.goalScenarios||[]).flatMap(item=>item.nextBestActions||[]).slice(0,5)
  });
}
