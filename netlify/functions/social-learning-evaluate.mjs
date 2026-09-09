import fs from 'node:fs';
import { createSocialLearningStore } from './_social-learning-store.mjs';
import { metricVector, buildCohort, selectSnapshotForWindow, selectOptimizationMetric, transitionLearningState } from './_social-learning-model.mjs';

function defaultConfig(){
  try{return JSON.parse(fs.readFileSync(new URL('../../config/social-learning-engine.json',import.meta.url),'utf8'));}
  catch{return {windowsHours:[24,48,72],windowToleranceHours:6,promotion:{minSampleSize:5,minPublicationDates:2,minConfidence:.75},explorationTarget:.2,metricPriority:['revenue','orders','offers','qualified_leads','meetings','dms','substantive_interactions','clicks','likes']};}
}
const dateOnly=value=>String(value||'').slice(0,10);

function deriveEvidence(target,cohort,config){
  const targetVector=metricVector(target.metrics||{});
  const vectors=cohort.map(x=>metricVector(x.metrics||x)).filter(Boolean);
  const selected=selectOptimizationMetric(targetVector,vectors,config.metricPriority||[]);
  if(!selected) return null;
  const sampleSize=vectors.length+1;
  const confidence=Math.min(.99,.5+Math.min(sampleSize,20)/40+Math.min(Math.abs(selected.effectSize),1)/4);
  const higherPriorityContradiction=selected.allEffects.slice(0,selected.allEffects.findIndex(x=>x.metric===selected.metric)).some(x=>x.effectSize<0);
  return {metric:selected.metric,effectMetricKey:selected.key,effectSize:selected.effectSize,baseline:selected.baseline,sampleSize,confidence,directionConsistent:selected.effectSize>0,higherPriorityContradiction,publicationDates:[dateOnly(target.observedAt),...cohort.map(x=>dateOnly(x.observedAt||x.publishedAt))]};
}

export async function runEvaluation({store,now=new Date(),config=defaultConfig()}={}){
  if(!store) throw new TypeError('runEvaluation requires store');
  const due=await store.listDuePosts(now.toISOString?.()||String(now));
  let evaluated=0,missedObligations=0,learningsUpdated=0;
  for(const post of due){
    const tenantId=post.tenantId||'canonical';
    const windowHours=Number(post.dueWindow||post.windowHours||24);
    const snapshots=await store.getSnapshots(post.postId);
    const snapshot=selectSnapshotForWindow({snapshots,publishedAt:post.publishedAt,windowHours,toleranceHours:Number(config.windowToleranceHours??6)});
    if(!snapshot){
      missedObligations++;
      if(store.recordObligation) await store.recordObligation({tenantId,id:`social-snapshot:${post.postId}:${windowHours}`,type:'MISSED_OBLIGATION',owner:'POWERHOUSE_SOCIAL_LEARNING',postId:post.postId,windowHours,dueAt:new Date(new Date(post.publishedAt).getTime()+windowHours*36e5).toISOString()});
      continue;
    }
    const evaluationId=`evaluation:${post.postId}:${windowHours}`;
    const cohortRaw=store.getCohort?await store.getCohort({post,windowHours,toleranceHours:Number(config.windowToleranceHours??6)}):[];
    const cohort=buildCohort(cohortRaw,post);
    const evidence=deriveEvidence(snapshot,cohort,config);
    const evaluation={evaluationId,postId:post.postId,tenantId,windowHours,observedAt:snapshot.observedAt,metricVector:metricVector(snapshot.metrics||{}),cohortSize:cohort.length,evidence};
    await store.putEvaluation(evaluation);
    evaluated++;
    if(evidence&&store.upsertLearning){
      const fingerprint=[post.platform,post.hookType,post.narrativeType,post.emotion,post.ctaType].filter(Boolean).join('|')||`post:${post.postId}`;
      const status=transitionLearningState(post.learningStatus||'CANDIDATE',evidence,config);
      await store.upsertLearning({tenantId,learningId:post.learningId||`learning:${fingerprint}`,fingerprint,componentScope:'social_components',claim:`${fingerprint} effect on ${evidence.metric}`,baselineDefinition:`cohort:${cohort.length}:window:${windowHours}`,effectMetric:evidence.metric,effectSize:evidence.effectSize,sampleSize:evidence.sampleSize,confidence:evidence.confidence,status,evidenceWindow:`${windowHours}h`,firstSeenAt:post.learningFirstSeenAt||new Date(now).toISOString(),lastValidatedAt:new Date(now).toISOString(),expiresOrReviewAt:new Date(new Date(now).getTime()+30*864e5).toISOString(),evidenceRefs:[evaluationId]});
      learningsUpdated++;
    }
    if(store.reconcileApplications) await store.reconcileApplications({tenantId,postId:post.postId,windowHours,evaluationId,effect:evidence?.effectSize??null,verificationStatus:evidence?'VERIFIED':'INSUFFICIENT_EVIDENCE'});
  }
  return {evaluated,missedObligations,learningsUpdated};
}

export default async ()=>{
  try{await runEvaluation({store:createSocialLearningStore()});return new Response(null,{status:204});}
  catch(error){console.error('SOCIAL_LEARNING_EVALUATION_FAILED',error);return new Response(null,{status:500});}
};
export const config={schedule:'@hourly'};
