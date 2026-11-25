const METRICS=['impressions','reach','likes','reactions','comments','shares','saves','clicks','profile_visits','followers_gained','views','dms','leads','qualified_leads','meetings','offers','orders','revenue'];
// Legacy Buffer measured data use display column names. These map 1:1 only
// when the underlying provider count has the SAME semantic meaning.
// "Reactions" is NOT "likes"; ambiguous "Eng. Rate" is never imported.
const BUFFER_ALIASES=Object.freeze({
  impressions:'Impressions',reach:'Reach',reactions:'Reactions',
  comments:'Comments',shares:'Shares',saves:'Saves',
  followers_gained:'Follows',views:'Views'
});
export function normalizeMetricSnapshot(payload={}){
  const out={};
  for(const key of METRICS){
    const value=Object.hasOwn(payload||{},key)?payload[key]:
      Object.hasOwn(payload||{},BUFFER_ALIASES[key])?payload[BUFFER_ALIASES[key]]:undefined;
    const n=value===undefined||value===null?null:Number(value);
    out[key]=n!==null&&Number.isFinite(n)&&n>=0?n:null;
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
    revenue_per_impression:rate(s.revenue,exposure),
    order_rate:rate(s.orders,exposure),
    offer_rate:rate(s.offers,exposure),
    qualified_lead_rate:rate(s.qualified_leads,exposure),
    meeting_rate:rate(s.meetings,exposure),
    dm_rate:rate(s.dms,exposure),
    lead_rate:rate(s.leads,exposure),
    substantive_interaction_rate:rate(substantive,exposure),
    reaction_rate:rate(s.reactions,exposure),
    click_rate:rate(s.clicks,exposure),
    like_rate:rate(s.likes,exposure),
    comment_rate:rate(s.comments,exposure),
    share_rate:rate(s.shares,exposure),
    save_rate:rate(s.saves,exposure)
  };
}

export function selectEvaluationWindow({publishedAt,observedAt,windows=[24,48,72]}){
  const age=(new Date(observedAt)-new Date(publishedAt))/36e5;
  if(!Number.isFinite(age)||age<0) return null;
  let best=null,bestDelta=Infinity;
  for(const window of windows){const delta=Math.abs(age-window);if(delta<bestDelta){best=window;bestDelta=delta;}}
  return best;
}

export function selectSnapshotForWindow({snapshots=[],publishedAt,windowHours,toleranceHours=6}){
  const target=Number(windowHours);
  let best=null,bestDelta=Infinity;
  for(const snapshot of snapshots){
    const age=(new Date(snapshot.observedAt)-new Date(publishedAt))/36e5;
    const delta=Math.abs(age-target);
    if(Number.isFinite(delta)&&delta<=toleranceHours&&delta<bestDelta){best=snapshot;bestDelta=delta;}
  }
  return best;
}

export function buildCohort(posts=[],target={}){
  const keys=['platform','accountType','format','funnelStage','contentPillar'];
  return posts.filter(post=>post?.postId!==target?.postId&&keys.every(k=>target?.[k]==null||post?.[k]===target[k]));
}

const metricKey={reactions:'reaction_rate',revenue:'revenue_per_impression',orders:'order_rate',offers:'offer_rate',qualified_leads:'qualified_lead_rate',meetings:'meeting_rate',dms:'dm_rate',substantive_interactions:'substantive_interaction_rate',clicks:'click_rate',likes:'like_rate'};
const effect=(current,baseline)=>baseline===0?(current>0?1:current<0?-1:0):(current-baseline)/Math.abs(baseline);

export function selectOptimizationMetric(targetVector={},cohortVectors=[],priority=[]){
  const effects=[];
  for(const metric of priority){
    const key=metricKey[metric]||metric;
    const current=targetVector[key];
    if(!Number.isFinite(current)) continue;
    const comparable=cohortVectors.map(v=>v[key]).filter(Number.isFinite);
    if(!comparable.length) continue;
    const baseline=comparable.reduce((a,b)=>a+b,0)/comparable.length;
    effects.push({metric,key,current,baseline,effectSize:effect(current,baseline)});
  }
  if(!effects.length) return null;
  const selected=effects[0];
  return {...selected,higherPriorityContradiction:false,allEffects:effects};
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
  for(const key of priority){const value=vector[metricKey[key]||key];if(value!==null&&value!==undefined)return {metric:key,value};}
  return null;
}
