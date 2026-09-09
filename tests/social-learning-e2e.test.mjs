import test from 'node:test';
import assert from 'node:assert/strict';
import { createSocialOutcomeHandler } from '../netlify/functions/social-outcome-ingest.mjs';
import { runEvaluation } from '../netlify/functions/social-learning-evaluate.mjs';
import { createSocialLearningContextHandler } from '../netlify/functions/social-learning-context.mjs';

const token='test-token';
const config={windowsHours:[24,48,72],windowToleranceHours:6,promotion:{minSampleSize:5,minPublicationDates:2,minConfidence:.75},explorationTarget:.2,metricPriority:['revenue','orders','offers','qualified_leads','meetings','dms','substantive_interactions','clicks','likes']};
const request=(url,method='GET',body)=>new Request(url,{method,headers:{'content-type':'application/json','x-bg-service-token':token},body:body?JSON.stringify(body):undefined});

test('ingest -> evaluate -> project -> apply -> reconcile works without Make',async()=>{
  const posts=new Map(),snapshots=new Map(),learnings=new Map(),applications=new Map(),decisions=[];
  let due=[];
  const cohort=Array.from({length:5},(_,i)=>({postId:`c${i}`,platform:'linkedin_company',format:'text',funnelStage:'consideration',contentPillar:'knowledge',observedAt:`2026-08-${20+i}T10:00:00Z`,metrics:{impressions:100,revenue:100,comments:4,shares:1,saves:1}}));
  const store={
    putPost:async p=>posts.set(p.postId,p),
    appendSnapshot:async s=>{const a=snapshots.get(s.postId)||[];a.push(s);snapshots.set(s.postId,a)},
    listDuePosts:async()=>due,
    getSnapshots:async id=>snapshots.get(id)||[],
    getCohort:async()=>cohort,
    putEvaluation:async()=>{},
    upsertLearning:async l=>learnings.set(l.learningId,l),
    listCurrentLearnings:async()=>[...learnings.values()],
    putProjection:async()=>{},getProjection:async()=>null,
    recordDecision:async d=>{decisions.push(d);return d},
    recordApplication:async a=>applications.set(a.applicationId,a),
    reconcileApplications:async d=>{for(const [id,a] of applications){if(a.postId===d.postId)applications.set(id,{...a,actualEffect:d.effect,verificationStatus:d.verificationStatus})}},
    recordObligation:async()=>{}
  };
  const ingest=createSocialOutcomeHandler({serviceToken:token,persistEvent:async e=>({event:e,status:'RECEIVED'}),store});
  const publishedAt='2026-09-01T10:00:00Z';
  const first={eventId:'e1',tenantId:'t1',idempotencyKey:'i1',platform:'linkedin_company',externalPostId:'p1',postId:'p1',publishedAt,observedAt:'2026-09-02T10:00:00Z',source:'linkedin-direct',format:'text',funnelStage:'consideration',contentPillar:'knowledge',hookType:'tension',metrics:{impressions:100,revenue:200,comments:20,shares:5,saves:5}};
  assert.equal((await ingest(request('https://example.test/api/social-outcome-ingest','POST',first))).status,202);
  due=[{...posts.get('p1'),tenantId:'t1',dueWindow:24}];
  const evaluation=await runEvaluation({store,now:new Date('2026-09-02T11:00:00Z'),config});
  assert.equal(evaluation.evaluated,1);
  const proven=[...learnings.values()].find(l=>l.status==='PROVEN');
  assert.ok(proven,'a sufficiently evidenced learning must become PROVEN');

  const context=createSocialLearningContextHandler({serviceToken:token,store,maxLearnings:6});
  const projectionResponse=await context(request('https://example.test/api/social-learning-context?tenantId=t1'));
  const projection=await projectionResponse.json();
  assert.equal(projection.learnings[0].learningId,proven.learningId);

  const decision={tenantId:'t1',decisionId:'d2',postId:'p2',consideredLearningIds:[proven.learningId],appliedLearningIds:[proven.learningId],mode:'EXPLOIT',expectedEffects:{[proven.learningId]:0.2}};
  assert.equal((await context(request('https://example.test/api/social-learning-context','POST',decision))).status,202);
  assert.equal(decisions.length,1);
  assert.equal(applications.get(`p2:${proven.learningId}`).verificationStatus,'PENDING');

  const second={...first,eventId:'e2',idempotencyKey:'i2',externalPostId:'p2',postId:'p2',publishedAt:'2026-09-03T10:00:00Z',observedAt:'2026-09-04T10:00:00Z',metrics:{impressions:100,revenue:230,comments:22,shares:5,saves:6}};
  await ingest(request('https://example.test/api/social-outcome-ingest','POST',second));
  due=[{...posts.get('p2'),tenantId:'t1',dueWindow:24}];
  await runEvaluation({store,now:new Date('2026-09-04T11:00:00Z'),config});
  const reconciled=applications.get(`p2:${proven.learningId}`);
  assert.equal(reconciled.verificationStatus,'VERIFIED');
  assert.ok(Number.isFinite(reconciled.actualEffect));
});
