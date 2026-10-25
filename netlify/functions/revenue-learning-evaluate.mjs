import {createHash} from 'node:crypto';
import {createRevenueLearningStore} from './_revenue-learning-store.mjs';
import {revenueMetricVector,selectRevenueMetric,transitionRevenueLearningState} from './_revenue-learning-model.mjs';

const DEFAULT={promotion:{minSampleSize:5,minPublicationDates:2,minConfidence:.75},metricPriority:['revenue','orders','proposals','qualified_leads','meetings','leads','clicks','substantive_interactions']};
const idFor=f=>`revenue:${createHash('sha256').update(String(f)).digest('hex').slice(0,24)}`;
const rank=l=>Number(l.confidence||0)*Math.abs(Number(l.effectSize||0));

// One existing hourly evaluator; never evaluate an unbounded store page.
// Rotate channels by hour and prefer real provider-/source-backed observations.
export function selectDueRevenueBatch(due=[],{now=new Date(),limit=8}={}){
  if(!Array.isArray(due))throw new TypeError('REVENUE_DUE_EVIDENCE_MUST_BE_ARRAY');
  const bound=Math.max(1,Math.min(16,Math.floor(Number(limit)||8)));
  const clock=now instanceof Date?now:new Date(now);
  if(!Number.isFinite(clock.getTime()))throw new TypeError('REVENUE_EVALUATION_CLOCK_INVALID');
  const valid=due.filter(row=>row&&row.evidenceId&&row.contentId&&row.channel);
  const quality=row=>String(row.dataQuality||'').toUpperCase()==='OBSERVED'?1:0;
  const time=row=>Date.parse(row.updatedAt||row.publishedAt||'')||0;
  const sorted=[...valid].sort((a,b)=>quality(b)-quality(a)||time(b)-time(a)||
    String(a.evidenceId).localeCompare(String(b.evidenceId)));
  const channels=[...new Set(sorted.map(row=>row.channel))].sort();
  const tick=Math.floor(clock.getTime()/3600000);
  const rotated=channels.slice(tick%Math.max(channels.length,1))
    .concat(channels.slice(0,tick%Math.max(channels.length,1)));
  const chosen=[];const seen=new Set();
  const add=row=>{if(row&&!seen.has(row.evidenceId)&&chosen.length<bound){
    seen.add(row.evidenceId);chosen.push(row);
  }};
  // Every eligible channel gets a fair chance rather than letting website
  // inference monopolize the newest-150 source page.
  for(const channel of rotated) add(sorted.find(row=>row.channel===channel));
  const remainder=sorted.filter(row=>!seen.has(row.evidenceId));
  if(remainder.length&&chosen.length<bound){
    const start=(tick*(bound-chosen.length))%remainder.length;
    for(const row of remainder.slice(start).concat(remainder.slice(0,start)))add(row);
  }
  return chosen;
}

export function hasVerifiedRevenueSource(row){
  const quality=String(row?.dataQuality||'').toUpperCase();
  return ['OBSERVED','PROVIDER_OBSERVED'].includes(quality)
    &&Array.isArray(row.sourceRefs)&&row.sourceRefs.some(x=>typeof x==='string'&&x.trim().length>0);
}

async function refreshProjection(active,now){
  const current=await active.listCurrentLearnings();
  const learnings=current.filter(l=>l.status==='PROVEN').sort((a,b)=>rank(b)-rank(a)).slice(0,8);
  const generatedAt=now().toISOString();
  const projection={version:`revenue-${generatedAt}`,generatedAt,learnings};
  await active.putProjection(projection);
  return projection;
}

export function createRevenueEvaluator({store,config=DEFAULT,now=()=>new Date(),maxDueEvidence=8}={}){
  return async()=>{
    const active=store||createRevenueLearningStore();
    const actionEvidence=typeof active.reconcileActionLearningObligations==='function'
      ? await active.reconcileActionLearningObligations()
      : {reconciled:0,total:0};
    const due=await active.listDueEvidence(now().toISOString());
    const bounded=selectDueRevenueBatch(due,{now:now(),limit:maxDueEvidence});
    let evaluated=0,missingVerifiedSource=0,insufficientCohort=0,noComparableMetric=0;
    for(const target of bounded){
      // Inferred page visits or unlinked social aggregates are useful research
      // context, never proof of ROI, a winning creative or a paid order.
      if(!hasVerifiedRevenueSource(target)){
        missingVerifiedSource++;
        await active.recordObligation({id:`source:${target.evidenceId}`,type:'VERIFIED_SOURCE_REQUIRED',
          status:'OPEN',contentId:target.contentId,windowHours:target.windowHours||0});
        continue;
      }
      const rawCohort=await active.listCohort({target,limit:30});
      const cohort=(Array.isArray(rawCohort)?rawCohort:[]).filter(hasVerifiedRevenueSource);
      if(cohort.length<Number(config.promotion?.minSampleSize??5)){
        insufficientCohort++;
        await active.recordObligation({id:`cohort:${target.evidenceId}`,type:'INSUFFICIENT_VERIFIED_COHORT',
          status:'OPEN',contentId:target.contentId,windowHours:target.windowHours,
          cohortSize:cohort.length});
        continue;
      }
      const targetVector=revenueMetricVector(target),cohortVectors=cohort.map(revenueMetricVector),selected=selectRevenueMetric(targetVector,cohortVectors,config.metricPriority||DEFAULT.metricPriority);
      if(!selected){
        noComparableMetric++;
        await active.recordObligation({id:`metric:${target.evidenceId}`,type:'NO_COMPARABLE_VERIFIED_METRIC',
          status:'OPEN',contentId:target.contentId});
        continue;
      }
      const dates=[...new Set(cohort.map(x=>x.publicationDate).filter(Boolean))];
      const confidence=Math.min(.99,.5+cohort.length*.1);
      const evidence={sampleSize:cohort.length,publicationDates:dates,confidence,effectSize:selected.effectSize,directionConsistent:selected.effectSize>0,higherPriorityContradiction:selected.higherPriorityContradiction};
      const status=transitionRevenueLearningState(target.currentLearningStatus||'CANDIDATE',evidence,config);
      const validatedAt=now().toISOString();
      const learning={learningId:idFor(target.componentFingerprint||target.contentId),fingerprint:target.componentFingerprint||target.contentId,componentScope:target.channel||'cross_channel',claim:`${target.componentFingerprint||target.contentId} affects ${selected.metric}`,effectMetric:selected.metric,effectSize:selected.effectSize,sampleSize:cohort.length,confidence,status,baselineDefinition:`mean cohort ${selected.metric}=${selected.baseline}`,evidenceWindow:`${target.windowHours||0}h`,firstSeenAt:target.publishedAt||validatedAt,lastValidatedAt:validatedAt,expiresOrReviewAt:new Date(now().getTime()+30*864e5).toISOString(),evidenceRefs:[target.evidenceId,...cohort.map(x=>x.evidenceId)]};
      await active.upsertLearning(learning);
      await active.reconcileApplications({contentId:target.contentId,windowHours:target.windowHours,effect:selected.effectSize,verificationStatus:'VERIFIED'});
      await active.markEvidenceEvaluated(target.evidenceId,validatedAt);
      evaluated++;
    }
    const projection=await refreshProjection(active,now);
    return {contract:'REVENUE_LEARNING_BOUNDED_VERIFIED_MULTI_CHANNEL-v1',
      evaluated,total:due.length,attempted:bounded.length,unprocessedDue:Math.max(0,due.length-bounded.length),
      missingVerifiedSource,insufficientCohort,noComparableMetric,
      projectionVersion:projection.version,projectedLearnings:projection.learnings.length,actionEvidence};
  };
}

export default async()=>{
  try{
    const result=await createRevenueEvaluator()();
    console.log('REVENUE_LEARNING_HOURLY_VERIFIED_SUMMARY',JSON.stringify(result));
    return new Response(null,{status:204});
  }catch(error){
    console.error('REVENUE_LEARNING_HOURLY_FAILED',String(error?.message||'unknown'));
    return new Response(null,{status:503});
  }
};
export const config={schedule:'@hourly'};
