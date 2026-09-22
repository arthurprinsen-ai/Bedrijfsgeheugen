import {buildGoalForecast,GOAL_METRICS} from './goal-forecast-engine.mjs';

const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const child of Object.values(value))freeze(child);}return value;};
const arr=value=>Array.isArray(value)?value:[];
const num=value=>Number.isFinite(Number(value))?Number(value):null;
const unique=value=>[...new Set(value.filter(Boolean))];

export const GOAL_LEVERS=freeze({
  revenue_growth:[
    {id:'pricing',label:'Prijs / opbrengst per klant',action:'Test prijs- en pakketoptimalisatie',page:'businesscase'},
    {id:'conversion',label:'Conversie',action:'Verbeter commerciële conversie',page:'branche-markt'},
    {id:'retention',label:'Behoud / herhaalaankoop',action:'Verlaag churn en vergroot klantwaarde',page:'roadmap'}
  ],
  profit:[
    {id:'gross-margin',label:'Brutomarge',action:'Verbeter prijs, inkoop of mix',page:'os:impact-engine'},
    {id:'cost-to-serve',label:'Cost-to-serve',action:'Verlaag leveringskosten per klant/product',page:'cijfers-maatstaven'},
    {id:'automation',label:'Automatisering',action:'Reduceer structureel handwerk',page:'data-ai'}
  ],
  cash:[
    {id:'dso',label:'Debiteurendagen',action:'Verkort DSO / versnel incasso',page:'waarde-financiering'},
    {id:'working-capital',label:'Werkkapitaal',action:'Optimaliseer voorraad en betaalcondities',page:'waarde-financiering'},
    {id:'margin-cash',label:'Operationele marge',action:'Verbeter cashgeneratie uit operatie',page:'os:impact-engine'}
  ],
  automate:[
    {id:'workflow',label:'Workflow-automatisering',action:'Automatiseer repeterende werkstromen',page:'ai-scan'},
    {id:'integration',label:'Systeemkoppelingen',action:'Verwijder dubbele invoer en overdracht',page:'koppelingen'},
    {id:'self-service',label:'Self-service / AI',action:'Verplaats standaardwerk naar self-service of AI',page:'data-ai'}
  ],
  valuation:[
    {id:'ebitda',label:'Genormaliseerde EBITDA',action:'Verbeter duurzame EBITDA',page:'waarde-financiering'},
    {id:'multiple-risk',label:'Risicodiscount',action:'Verlaag key-person-, klant- en datarisico',page:'exit'},
    {id:'recurring',label:'Voorspelbare omzet',action:'Vergroot terugkerende omzet en contractkwaliteit',page:'businesscase'}
  ],
  exit:[
    {id:'transferability',label:'Overdraagbaarheid',action:'Verminder afhankelijkheid van eigenaar/key people',page:'exit'},
    {id:'data-room',label:'Data-room readiness',action:'Maak bewijs en documentatie due-diligence-ready',page:'due-diligence'},
    {id:'process-evidence',label:'Procesbewijs',action:'Borg processen en controls aantoonbaar',page:'audit'}
  ],
  resilience:[
    {id:'critical-risk',label:'Kritieke risico’s',action:'Sluit grootste risico en control-gap',page:'compliance-governance'},
    {id:'dependency',label:'Afhankelijkheden',action:'Reduceer single points of failure',page:'os:capability-graph'},
    {id:'recovery',label:'Recovery readiness',action:'Test herstel, fallback en verantwoordelijkheden',page:'self-heal'}
  ]
});

function gap(value,target,direction){
  if(value==null||target==null)return null;
  return direction==='down'?Math.max(0,value-target):Math.max(0,target-value);
}
function targetStatus(value,target,direction){
  if(value==null||target==null)return 'unknown';
  return direction==='down'?(value<=target?'target-reached':'gap'):(value>=target?'target-reached':'gap');
}
function assumptionMap(state,goalId){
  const raw=state?.portal?.business_context?.goal_scenarios?.[goalId]?.levers||{};
  return raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
}
function scenarioBase(forecast){
  return forecast?.forecast?.expected??forecast?.current??null;
}

export function buildGoalScenario(state={},goalId,options={}){
  const metric=GOAL_METRICS[goalId];if(!metric)return null;
  const forecast=buildGoalForecast(state,goalId,options);
  const catalog=GOAL_LEVERS[goalId]||[];
  const assumptions=assumptionMap(state,goalId);
  const levers=catalog.map(item=>{
    const input=assumptions[item.id]||{};
    const effect=num(input.effect);
    return freeze({
      ...item,
      effect,
      unit:forecast?.unit||metric.unit,
      sourceRefs:freeze(arr(input.source_refs||input.sourceRefs).filter(Boolean)),
      note:String(input.note||'').trim()||null,
      evidenceMode:arr(input.source_refs||input.sourceRefs).filter(Boolean).length?'evidence-linked':'scenario-assumption'
    });
  });
  const base=scenarioBase(forecast);
  const totalEffect=levers.reduce((sum,item)=>sum+(item.effect||0),0);
  const scenarioExpected=base==null?null:Number((base+totalEffect).toFixed(2));
  const baselineGap=gap(base,forecast?.target,metric.direction);
  const scenarioGap=gap(scenarioExpected,forecast?.target,metric.direction);
  const improvement=baselineGap==null||scenarioGap==null?null:Number((baselineGap-scenarioGap).toFixed(2));
  const ranked=[...levers].filter(item=>item.effect!=null&&item.effect!==0).sort((a,b)=>Math.abs(b.effect)-Math.abs(a.effect));
  const nextBest=ranked.length?ranked.slice(0,3):catalog.slice(0,3).map(item=>({...item,effect:null,unit:forecast?.unit||metric.unit,evidenceMode:'suggested-not-quantified',sourceRefs:[],note:null}));
  return freeze({
    schemaVersion:'goal-scenario.v1',
    goalId,
    label:forecast?.label||metric.label,
    unit:forecast?.unit||metric.unit,
    direction:metric.direction,
    baselineExpected:base,
    target:forecast?.target??null,
    targetDate:forecast?.targetDate??null,
    baselineGap,
    scenarioExpected,
    scenarioGap,
    gapImprovement:improvement,
    scenarioStatus:targetStatus(scenarioExpected,forecast?.target,metric.direction),
    forecastStatus:forecast?.forecastStatus||'insufficient-evidence',
    levers:freeze(levers),
    rankedLevers:freeze(ranked),
    nextBestActions:freeze(nextBest.map(item=>freeze({leverId:item.id,label:item.label,action:item.action,page:item.page,effect:item.effect,unit:item.unit,evidenceMode:item.evidenceMode}))),
    truth:freeze({
      forecast:forecast?.forecast?'observed-history-forecast':'no-forecast',
      scenario:'what-if-assumptions-not-prediction',
      quantifiedEffects:ranked.length,
      evidenceLinkedEffects:ranked.filter(item=>item.evidenceMode==='evidence-linked').length
    })
  });
}

export function buildGoalScenarios(state={},goalIds=[],options={}){
  return freeze(unique(arr(goalIds)).map(id=>buildGoalScenario(state,id,options)).filter(Boolean));
}
