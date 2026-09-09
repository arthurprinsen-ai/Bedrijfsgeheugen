const METRICS=['impressions','reach','likes','comments','shares','saves','clicks','profile_visits','followers_gained','dms','leads','qualified_leads','meetings','offers','orders','revenue'];

export function normalizeMetricSnapshot(payload={}){
  const out={};
  for(const key of METRICS){
    const value=payload[key];
    out[key]=value===undefined||value===null?null:Number(value);
    if(out[key]!==null&&!Number.isFinite(out[key])) out[key]=null;
  }
  return out;
}

const rate=(value,denominator)=>value===null||denominator===null||!Number.isFinite(denominator)||denominator<=0?null:value/denominator;

export function metricVector(snapshot={}){
  const s=normalizeMetricSnapshot(snapshot);
  const exposure=(s.impressions??s.reach);
  const substantiveParts=[s.comments,s.shares,s.saves].filter(v=>v!==null);
  const substantive=substantiveParts.length?substantiveParts.reduce((a,b)=>a+b,0):null;
  return {
    ...s,
    substantive_interactions:substantive,
    comment_rate:rate(s.comments,exposure),
    share_rate:rate(s.shares,exposure),
    save_rate:rate(s.saves,exposure),
    click_rate:rate(s.clicks,exposure),
    substantive_interaction_rate:rate(substantive,exposure),
    lead_rate:rate(s.leads,exposure),
    qualified_lead_rate:rate(s.qualified_leads,exposure)
  };
}

export function selectEvaluationWindow({publishedAt,observedAt,windows=[24,48,72]}){
  const age=(new Date(observedAt)-new Date(publishedAt))/36e5;
  if(!Number.isFinite(age)||age<0) return null;
  let best=null,bestDelta=Infinity;
  for(const window of windows){const delta=Math.abs(age-window);if(delta<bestDelta){best=window;bestDelta=delta;}}
  return best;
}

export function buildCohort(posts=[],target={}){
  const keys=['platform','accountType','format','funnelStage','contentPillar'];
  return posts.filter(post=>post?.postId!==target?.postId&&keys.every(k=>target?.[k]==null||post?.[k]==null||post[k]===target[k]));
}

export function evaluateLearningCandidate(input={},config={}){
  const promotion=config.promotion||{};
  const dates=new Set(input.publicationDates||[]);
  const promotable=Number(input.sampleSize||0)>=Number(promotion.minSampleSize??5)
    && dates.size>=Number(promotion.minPublicationDates??2)
    && Number(input.confidence||0)>=Number(promotion.minConfidence??0.75)
    && input.directionConsistent===true
    && input.higherPriorityContradiction!==true
    && Number(input.effectSize||0)>0;
  return {promotable,confidence:Number(input.confidence||0),sampleSize:Number(input.sampleSize||0)};
}

export function transitionLearningState(current='CANDIDATE',evidence={},config={}){
  const result=evaluateLearningCandidate(evidence,config);
  const confidence=Number(evidence.confidence||0);
  if(current==='RETIRED') return 'RETIRED';
  if(current==='PROVEN' && (!evidence.directionConsistent || confidence<0.6 || evidence.higherPriorityContradiction)) return 'WEAKENING';
  if(current==='WEAKENING' && (confidence<0.4 || Number(evidence.effectSize||0)<=0)) return 'RETIRED';
  if(result.promotable) return 'PROVEN';
  if(current==='CANDIDATE' && Number(evidence.sampleSize||0)>0) return 'TESTING';
  return current;
}

export function chooseDecisionMode(history=[],config={}){
  const target=Number(config.explorationTarget??0.2);
  if(!history.length) return 'EXPLORE';
  const exploration=history.filter(x=>x==='EXPLORE').length/history.length;
  return exploration<target?'EXPLORE':'EXPLOIT';
}

export function metricPriorityWinner(vector={},priority=[]){
  for(const key of priority){const value=vector[key];if(value!==null&&value!==undefined)return {metric:key,value};}
  return null;
}
