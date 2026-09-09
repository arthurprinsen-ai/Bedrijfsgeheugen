import fs from 'node:fs';
import { createSocialLearningStore } from './_social-learning-store.mjs';
import { metricVector, buildCohort, transitionLearningState } from './_social-learning-model.mjs';

function defaultConfig(){
  try{return JSON.parse(fs.readFileSync(new URL('../../config/social-learning-engine.json',import.meta.url),'utf8'));}
  catch{return {windowsHours:[24,48,72],promotion:{minSampleSize:5,minPublicationDates:2,minConfidence:.75},explorationTarget:.2};}
}

const latestSnapshot=snapshots=>[...snapshots].sort((a,b)=>new Date(b.observedAt)-new Date(a.observedAt))[0]||null;
const dateOnly=value=>String(value||'').slice(0,10);

function deriveEvidence(target,cohort){
  const targetVector=metricVector(target.metrics||{});
  const vectors=cohort.map(x=>metricVector(x.metrics||x)).filter(Boolean);
  const metric=targetVector.substantive_interaction_rate!==null?'substantive_interaction_rate':targetVector.qualified_lead_rate!==null?'qualified_lead_rate':null;
  if(!metric||!vectors.length) return null;
  const comparable=vectors.map(v=>v[metric]).filter(v=>Number.isFinite(v));
  if(!comparable.length) return null;
  const baseline=comparable.reduce((a,b)=>a+b,0)/comparable.length;
  const current=targetVector[metric];
  const effectSize=baseline===0?(current>0?1:0):(current-baseline)/Math.abs(baseline);
  const sampleSize=comparable.length+1;
  const confidence=Math.min(.99,.5+Math.min(sampleSize,20)/40+Math.min(Math.abs(effectSize),1)/4);
  return {metric,effectSize,sampleSize,confidence,directionConsistent:effectSize>0,higherPriorityContradiction:false,publicationDates:[dateOnly(target.observedAt),...cohort.map(x=>dateOnly(x.observedAt||x.publishedAt))]};
}

export async function runEvaluation({store,now=new Date(),config=defaultConfig()}={}){
  if(!store) throw new TypeError('runEvaluation requires store');
  const due=await store.listDuePosts(now.toISOString?.()||String(now));
  let evaluated=0,missedObligations=0,learningsUpdated=0;
  for(const post of due){
    const windowHours=Number(post.dueWindow||post.windowHours||24);
    const snapshots=await store.getSnapshots(post.postId);
    const snapshot=latestSnapshot(snapshots.filter(s=>new Date(s.observedAt)>=new Date(post.publishedAt||0)));
    if(!snapshot){
      missedObligations++;
      if(store.recordObligation) await store.recordObligation({id:`social-snapshot:${post.postId}:${windowHours}`,type:'MISSED_OBLIGATION',owner:'POWERHOUSE_SOCIAL_LEARNING',postId:post.postId,windowHours,dueAt:new Date(new Date(post.publishedAt).getTime()+windowHours*36e5).toISOString()});
      continue;
    }
    const evaluationId=`evaluation:${post.postId}:${windowHours}`;
    const cohortRaw=store.getCohort?await store.getCohort({post,windowHours}):[];
    const cohort=buildCohort(cohortRaw,post);
    const evidence=deriveEvidence(snapshot,cohort);
    const evaluation={evaluationId,postId:post.postId,tenantId:post.tenantId||snapshot.tenantId||null,windowHours,observedAt:snapshot.observedAt,metricVector:metricVector(snapshot.metrics||{}),cohortSize:cohort.length,evidence};
    await store.putEvaluation(evaluation);
    evaluated++;
    if(evidence&&store.upsertLearning){
      const fingerprint=[post.platform,post.hookType,post.narrativeType,post.emotion,post.ctaType].filter(Boolean).join('|')||`post:${post.postId}`;
      const status=transitionLearningState(post.learningStatus||'CANDIDATE',evidence,config);
      await store.upsertLearning({learningId:post.learningId||`learning:${fingerprint}`,fingerprint,componentScope:'social_components',claim:`${fingerprint} effect on ${evidence.metric}`,effectMetric:evidence.metric,effectSize:evidence.effectSize,sampleSize:evidence.sampleSize,confidence:evidence.confidence,status,lastValidatedAt:new Date(now).toISOString(),evidenceRefs:[evaluationId]});
      learningsUpdated++;
    }
    if(store.reconcileApplications) await store.reconcileApplications({postId:post.postId,windowHours,evaluationId,effect:evidence?.effectSize??null,verificationStatus:evidence?'VERIFIED':'INSUFFICIENT_EVIDENCE'});
  }
  return {evaluated,missedObligations,learningsUpdated};
}

export default async request=>{
  if(request.method!=='POST'&&request.method!=='GET') return new Response('Method Not Allowed',{status:405});
  try{return Response.json(await runEvaluation({store:createSocialLearningStore()}),{headers:{'cache-control':'no-store'}});}
  catch(error){return Response.json({error:'SOCIAL_LEARNING_EVALUATION_FAILED',message:error.message},{status:503,headers:{'cache-control':'no-store'}});}
};
