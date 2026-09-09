const FIELDS=['exposures','clicks','substantive_interactions','leads','qualified_leads','meetings','proposals','orders','revenue_eur'];

export function normalizeRevenueEvidence(input={}){
  const out={};
  for(const key of FIELDS){
    const raw=input[key];
    if(raw===undefined||raw===null||raw===''){out[key]=null;continue;}
    const n=Number(raw);out[key]=Number.isFinite(n)?n:null;
  }
  return out;
}

const rate=(n,d)=>n===null||d===null||!Number.isFinite(d)||d<=0?null:n/d;

export function revenueMetricVector(input={}){
  const e=normalizeRevenueEvidence(input);
  return {
    ...e,
    revenue_per_exposure:rate(e.revenue_eur,e.exposures),
    order_rate:rate(e.orders,e.exposures),
    proposal_rate:rate(e.proposals,e.exposures),
    qualified_lead_rate:rate(e.qualified_leads,e.exposures),
    meeting_rate:rate(e.meetings,e.exposures),
    lead_rate:rate(e.leads,e.exposures),
    click_rate:rate(e.clicks,e.exposures),
    substantive_interaction_rate:rate(e.substantive_interactions,e.exposures)
  };
}

const KEYS={revenue:'revenue_per_exposure',orders:'order_rate',proposals:'proposal_rate',offers:'proposal_rate',qualified_leads:'qualified_lead_rate',meetings:'meeting_rate',leads:'lead_rate',clicks:'click_rate',substantive_interactions:'substantive_interaction_rate'};
const effect=(current,baseline)=>baseline===0?(current>0?1:current<0?-1:0):(current-baseline)/Math.abs(baseline);

export function selectRevenueMetric(target={},cohort=[],priority=[]){
  const effects=[];
  for(const metric of priority){
    const key=KEYS[metric]||metric;
    const current=target[key];
    if(!Number.isFinite(current))continue;
    const values=cohort.map(v=>v[key]).filter(Number.isFinite);
    if(!values.length)continue;
    const baseline=values.reduce((a,b)=>a+b,0)/values.length;
    effects.push({metric,key,current,baseline,effectSize:effect(current,baseline)});
  }
  if(!effects.length)return null;
  return {...effects[0],allEffects:effects,higherPriorityContradiction:false};
}

export function evaluateRevenueLearning(input={},config={}){
  const p=config.promotion||{};
  const publicationDates=new Set(input.publicationDates||[]);
  const promotable=Number(input.sampleSize||0)>=Number(p.minSampleSize??5)
    && publicationDates.size>=Number(p.minPublicationDates??2)
    && Number(input.confidence||0)>=Number(p.minConfidence??.75)
    && input.directionConsistent===true
    && input.higherPriorityContradiction!==true
    && Number(input.effectSize||0)>0;
  return {promotable,confidence:Number(input.confidence||0),sampleSize:Number(input.sampleSize||0)};
}

export function transitionRevenueLearningState(current='CANDIDATE',evidence={},config={}){
  if(current==='RETIRED')return 'RETIRED';
  if(current==='PROVEN'&&(!evidence.directionConsistent||Number(evidence.confidence||0)<.6||evidence.higherPriorityContradiction))return 'WEAKENING';
  if(current==='WEAKENING'&&(Number(evidence.confidence||0)<.4||Number(evidence.effectSize||0)<=0))return 'RETIRED';
  if(evaluateRevenueLearning(evidence,config).promotable)return 'PROVEN';
  if(current==='CANDIDATE'&&Number(evidence.sampleSize||0)>0)return 'TESTING';
  return current;
}
