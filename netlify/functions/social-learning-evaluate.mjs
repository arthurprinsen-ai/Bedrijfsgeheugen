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

/** Bounded hourly evaluation with separate fresh/overdue fairness lanes.
 * Never equate a missing 24/48/72h snapshot to zero engagement. */
export function selectDueEvaluationBatch(due=[],{now=new Date(),limit=2}={}){
  if(!Array.isArray(due))throw new TypeError('DUE_EVALUATIONS_MUST_BE_ARRAY');
  const bound=Math.max(1,Math.min(8,Math.floor(Number(limit)||2)));
  const clock=now instanceof Date?now:new Date(now);
  if(Number.isNaN(clock.getTime()))throw new TypeError('EVALUATION_CLOCK_INVALID');
  const valid=due.filter(p=>p&&p.postId&&Number.isFinite(Date.parse(p.publishedAt||''))&&[24,48,72].includes(Number(p.dueWindow||p.windowHours)));
  const sorted=[...valid].sort((a,b)=>String(a.postId).localeCompare(String(b.postId))||
    Number(a.dueWindow||a.windowHours)-Number(b.dueWindow||b.windowHours));
  // Existing one-hour supervisor stays authoritative. The canonical store
  // marks a window evidence-backed only when an actual provider observation
  // occurred within ±6 hours of the 24/48/72h measurement window.
  const withEvidence=sorted.filter(p=>p.hasWindowSnapshot===true);
  const withoutEvidence=sorted.filter(p=>p.hasWindowSnapshot!==true);
  function rotatedMissing(list,n){
    if(n<=0||!list.length)return [];
    const recent=list.filter(p=>clock.getTime()-Date.parse(p.publishedAt)<=96*3600000);
    const old=list.filter(p=>clock.getTime()-Date.parse(p.publishedAt)>96*3600000);
    const selected=recent.slice(0,n);
    const left=n-selected.length;
    if(left>0&&old.length){
      const pages=Math.ceil(old.length/left);
      const tick=Math.floor(clock.getTime()/3600000);
      const start=(tick%pages)*left;
      selected.push(...old.slice(start,start+left));
    }
    if(selected.length<n)selected.push(...recent.slice(n-(selected.length),n));
    return selected.slice(0,n);
  }
  if(!withEvidence.length)return rotatedMissing(sorted,bound);
  const sortedProven=[...withEvidence].sort((a,b)=>
    Date.parse(b.publishedAt)-Date.parse(a.publishedAt)||
    String(a.postId).localeCompare(String(b.postId))||
    Number(a.dueWindow||a.windowHours)-Number(b.dueWindow||b.windowHours));
  const tick=Math.floor(clock.getTime()/3600000);
  // Reserve one proof-debt slot every fourth hour while evidence is available:
  // measured posts should finally produce learning, but absent snapshots
  // must remain visible as obligations, never fabricated as zero.
  const missingQuota=withoutEvidence.length&&bound>1&&tick%4===0?1:0;
  const chosen=sortedProven.slice(0,bound-missingQuota);
  chosen.push(...rotatedMissing(withoutEvidence,bound-chosen.length));
  if(chosen.length<bound)chosen.push(...sortedProven.slice(chosen.length,chosen.length+(bound-chosen.length)));
  return chosen.slice(0,bound);
}

export async function runEvaluation({store,now=new Date(),config=defaultConfig(),maxDuePosts=2}={}){
  if(!store) throw new TypeError('runEvaluation requires store');
  const due=await store.listDuePosts(now.toISOString?.()||String(now));
  let evaluated=0,missedObligations=0,learningsUpdated=0;
  const bounded=selectDueEvaluationBatch(due,{now,limit:maxDuePosts});
  for(const post of bounded){
    const tenantId=post.tenantId||'canonical';
    const windowHours=Number(post.dueWindow||post.windowHours||24);
    const snapshots=await store.getSnapshots(post.postId);
    // Provider-date reports, old unlinked sources and partial-scope metrics
    // cannot become an exact 24/48/72-hour experiment observation even if
    // their retrieval timestamp happens to fall inside the window.
    const sourceQualified=(Array.isArray(snapshots)?snapshots:[])
      .filter(x=>['OBSERVED','PROVIDER_OBSERVED'].includes(x?.dataQuality));
    const snapshot=selectSnapshotForWindow({snapshots:sourceQualified,publishedAt:post.publishedAt,windowHours,toleranceHours:Number(config.windowToleranceHours??6)});
    if(!snapshot){
      missedObligations++;
      const hadUnqualified=(Array.isArray(snapshots)?snapshots:[]).length>0;
      if(store.recordObligation) await store.recordObligation({tenantId,id:`social-snapshot:${post.postId}:${windowHours}`,
        type:hadUnqualified?'UNVERIFIED_OR_PARTIAL_WINDOW':'MISSED_OBLIGATION',
        owner:'POWERHOUSE_SOCIAL_LEARNING',postId:post.postId,windowHours,
        dueAt:new Date(new Date(post.publishedAt).getTime()+windowHours*36e5).toISOString()});
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
  return {evaluated,missedObligations,learningsUpdated,dueTotal:due.length,attempted:bounded.length,unprocessedDue:Math.max(0,due.length-bounded.length)};
}

/** Keep ONE existing hourly Netlify scheduler; process both isolated brand/canonical
 * scopes without merging their post, learning or customer evidence. */
export async function runScheduledTenants({
  storeFactory=createSocialLearningStore,
  tenants=['canonical','bedrijfsgeheugen'],
  now=new Date(),
  maxDuePosts=2,
  config=defaultConfig()
}={}){
  const distinct=[...new Set(tenants)];
  // Validate ALL tenant authorities before invoking any provider or writing
  // data. Every scoped worker remains independently bounded to two windows.
  if(!distinct.length||distinct.some(id=>!['canonical','bedrijfsgeheugen'].includes(id))){
    throw new Error('UNAUTHORIZED_SOCIAL_TENANT_SCOPE');
  }
  const settled=await Promise.allSettled(distinct.map(async tenantId=>{
    const store=storeFactory({tenantId});
    return runEvaluation({store,now,maxDuePosts,config});
  }));
  const done=settled.map((result,i)=>result.status==='fulfilled'
    ? {tenantId:distinct[i],...result.value,ok:true}
    : {tenantId:distinct[i],ok:false,error_class:'TENANT_EVALUATION_FAILED',
       evaluated:0,missedObligations:0,learningsUpdated:0,unprocessedDue:null});
  const healthy=done.every(result=>result.ok);
  return {contract:'SOCIAL_LEARNING_HOURLY_BOUNDED_MULTI_TENANT-v1',
    tenants:done,healthy,
    totals:{evaluated:done.reduce((a,x)=>a+x.evaluated,0),
      missedObligations:done.reduce((a,x)=>a+x.missedObligations,0),
      dueBacklog:healthy?done.reduce((a,x)=>a+x.unprocessedDue,0):null,
      failedTenantScopes:done.filter(x=>!x.ok).length},
    status:healthy?'COMPLETE':'PARTIAL_FAILURE_RETRY_EXISTING_HOURLY_OWNER'};
}
export default async ()=>{
  try{
    const result=await runScheduledTenants();
    console.log('SOCIAL_LEARNING_WINDOW_SUMMARY',JSON.stringify(result.totals));
    if(!result.healthy)console.error('SOCIAL_LEARNING_SCOPED_FAILURE',result.tenants.filter(x=>!x.ok).map(x=>x.tenantId));
    return new Response(null,{status:result.healthy?204:503});
  }catch(error){
    console.error('SOCIAL_LEARNING_EVALUATION_FAILED',String(error?.message||'error'));
    return new Response(null,{status:503});
  }
};
export const config={schedule:'@hourly'};
