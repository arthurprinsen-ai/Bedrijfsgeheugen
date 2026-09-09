import {createHash} from 'node:crypto';
import {createRevenueLearningStore} from './_revenue-learning-store.mjs';
import {revenueMetricVector,selectRevenueMetric,transitionRevenueLearningState} from './_revenue-learning-model.mjs';

const DEFAULT={promotion:{minSampleSize:5,minPublicationDates:2,minConfidence:.75},metricPriority:['revenue','orders','proposals','qualified_leads','meetings','leads','clicks','substantive_interactions']};
const idFor=f=>`revenue:${createHash('sha256').update(String(f)).digest('hex').slice(0,24)}`;

export function createRevenueEvaluator({store,config=DEFAULT,now=()=>new Date()}={}){
  return async()=>{
    const active=store||createRevenueLearningStore(),due=await active.listDueEvidence(now().toISOString());let evaluated=0;
    for(const target of due){
      const cohort=await active.listCohort({target,limit:30});
      if(cohort.length<Number(config.promotion?.minSampleSize??5)){
        await active.recordObligation({id:`cohort:${target.evidenceId}`,type:'INSUFFICIENT_COHORT',status:'OPEN',contentId:target.contentId,windowHours:target.windowHours,cohortSize:cohort.length});continue;
      }
      const targetVector=revenueMetricVector(target),cohortVectors=cohort.map(revenueMetricVector),selected=selectRevenueMetric(targetVector,cohortVectors,config.metricPriority||DEFAULT.metricPriority);
      if(!selected){await active.recordObligation({id:`metric:${target.evidenceId}`,type:'NO_COMPARABLE_METRIC',status:'OPEN',contentId:target.contentId});continue;}
      const dates=[...new Set(cohort.map(x=>x.publicationDate).filter(Boolean))];
      const confidence=Math.min(.99,.5+cohort.length*.1);
      const evidence={sampleSize:cohort.length,publicationDates:dates,confidence,effectSize:selected.effectSize,directionConsistent:selected.effectSize>0,higherPriorityContradiction:selected.higherPriorityContradiction};
      const status=transitionRevenueLearningState(target.currentLearningStatus||'CANDIDATE',evidence,config);
      const learning={learningId:idFor(target.componentFingerprint||target.contentId),fingerprint:target.componentFingerprint||target.contentId,componentScope:target.channel||'cross_channel',claim:`${target.componentFingerprint||target.contentId} affects ${selected.metric}`,effectMetric:selected.metric,effectSize:selected.effectSize,sampleSize:cohort.length,confidence,status,baselineDefinition:`mean cohort ${selected.metric}=${selected.baseline}`,evidenceWindow:`${target.windowHours||0}h`,firstSeenAt:target.publishedAt||now().toISOString(),lastValidatedAt:now().toISOString(),expiresOrReviewAt:new Date(now().getTime()+30*864e5).toISOString(),evidenceRefs:[target.evidenceId,...cohort.map(x=>x.evidenceId)]};
      await active.upsertLearning(learning);await active.reconcileApplications({contentId:target.contentId,windowHours:target.windowHours,effect:selected.effectSize,verificationStatus:'VERIFIED'});evaluated++;
    }
    return {evaluated,total:due.length};
  };
}

export default async()=>{await createRevenueEvaluator()();return new Response(null,{status:204});};
export const config={schedule:'@hourly'};
