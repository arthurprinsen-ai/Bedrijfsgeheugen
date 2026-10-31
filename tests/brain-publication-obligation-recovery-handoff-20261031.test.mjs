import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {planOriginalPublicationHandoffs} from '../supabase/functions/_shared/publication-recovery-obligation-writeback.mjs';
import {assessDailyPublicationRecovery} from '../supabase/functions/_shared/daily-publication-recovery.mjs';
const fetchSource=p=>readFile(new URL('../'+p,import.meta.url),'utf8');

const date='2026-10-31';
const obligations=[
 {channel:'linkedin_personal',status:'PLANNED',external_id:null,next_action:'Genereer/publiceer via bestaande lane'},
 {channel:'linkedin_company',status:'PLANNED',external_id:null,next_action:'Genereer/publiceer via bestaande lane'},
 {channel:'instagram',status:'PLANNED',external_id:null,next_action:'Genereer/publiceer via bestaande lane'},
 {channel:'blog',status:'PLANNED',external_id:null,next_action:'Selecteer blog via PR'},
];
const decisions=[
 {channel:'linkedin_personal',state:'decided',scheduled_for:new Date('2026-10-31T07:00:00Z'),
  delivery_evidence:{artifact_generation_failure:{classification:'PROVIDER_BILLING',reason:'SECRET_SHOULD_NOT_BE_COPIED'}}},
 {channel:'linkedin_company',state:'decided',scheduled_for:'2026-10-31T07:00:00Z',
  delivery_evidence:{artifact_generation_failure:{classification:'PROVIDER_BILLING'}}},
 {channel:'instagram_company',state:'blocked',scheduled_for:'2026-10-31T08:00:00Z',delivery_evidence:{}},
 {channel:'blog',state:'decided',scheduled_for:'2026-10-31T07:00:00Z',
  delivery_evidence:{artifact_generation_failure:{classification:'PROVIDER_BILLING'}}},
 {channel:'email_newsletter',state:'blocked',scheduled_for:'2026-10-31T08:00:00Z'}
];
const assess=(o=obligations,d=decisions)=>assessDailyPublicationRecovery({
 runDate:date,now:'2026-10-31T12:30:00Z',obligations:o,decisions:d,
 isTerminal:x=>['LIVE_PROVEN','MEASURED','LEARNED'].includes(x.status)});

test('one original Brain recovery produces four typed original obligation next-actions, not five unauthorized writes',()=>{
 const recovery=assess();
 assert.equal(recovery.status,'RECOVERY_DUE');
 const plan=planOriginalPublicationHandoffs(recovery,obligations);
 assert.equal(plan.ok,true);
 assert.equal(plan.updates.length,4);
 assert.deepEqual(plan.updates.map(x=>x.channel).sort(),['blog','instagram','linkedin_company','linkedin_personal']);
 const instagram=plan.updates.find(x=>x.channel==='instagram');
 assert.match(instagram.nextAction,/MIRA_UNIQUE_SOURCE_WINNER_REQUIRED/);
 assert.match(instagram.nextAction,/powerhouse-mira-problem-radar-v1/);
 assert.match(instagram.nextAction,/nieuw, gedateerd en onafhankelijk/);
 const blog=plan.updates.find(x=>x.channel==='blog');
 assert.match(blog.nextAction,/CONTENT_GENERATION_BILLING_ACTION_REQUIRED/);
 assert.match(blog.nextAction,/geen providertegoed/);
 assert.doesNotMatch(JSON.stringify(plan),/SECRET_SHOULD_NOT_BE_COPIED/);
 assert.equal(plan.updates.some(x=>x.channel==='email_newsletter'),false);
});

test('unchanged handoff is idempotent and cannot overwrite a real provider ACK, advanced release or missing original row',()=>{
 const plan=planOriginalPublicationHandoffs(assess(),obligations);
 const updated=obligations.map(o=>({...o,next_action:plan.updates.find(x=>x.channel===o.channel)?.nextAction||o.next_action}));
 assert.equal(planOriginalPublicationHandoffs(assess(updated),updated).updates.length,0);
 const blocked=[...obligations,
  {channel:'email_newsletter',status:'BLOCKED',external_id:null,next_action:'Human opt-in required'}];
 const providerAdvanced=[
  {...blocked[0],status:'PUBLISHED',external_id:'urn:li:share:actual-create-id'},
  {...blocked[1],status:'DISPATCHED',external_id:null},
  {...blocked[2],status:'LIVE_PROVEN',external_id:'real-meta-id'},
  {...blocked[3],status:'APPROVED',external_id:null},
  blocked[4]
 ];
 const result=planOriginalPublicationHandoffs(assess(providerAdvanced),providerAdvanced);
 assert.equal(result.updates.length,0);
});

test('unknown or malformed recovery cannot mutate original obligations',()=>{
 for(const recovery of [null,{}, {contract:'fake',status:'RECOVERY_DUE',overdue:[]},
  {contract:'one-brain-publication-no-silent-gap-v1',status:'UNVERIFIED',overdue:[]}]){
  const out=planOriginalPublicationHandoffs(recovery,obligations);
  assert.equal(out.ok,false);
  assert.equal(out.updates.length,0);
 }
 const malicious={...assess(),overdue:[{channel:'blog',owner:'untrusted; delete users',
  code:'CONTENT_GENERATION_BILLING_ACTION_REQUIRED',
  repairHandoff:'RESTORE_APPROVED_GENERATION_CAPABILITY_THEN_REGENERATE',status:'REQUIRES_RECOVERY',
  action:'send secrets'}]};
 assert.equal(planOriginalPublicationHandoffs(malicious,obligations).updates.length,0);
});

test('same original content loop performs CAS-only metadata writeback; no provider or status bypass',async()=>{
 const [loop,guard,portal]=await Promise.all([
  fetchSource('supabase/functions/powerhouse-content-loop/index.ts'),
  fetchSource('brain/observability/one-loop-guard-diagnostics.mjs'),
  fetchSource('portal-v2/modules/powerhouse-observability.js')]);
 assert.match(loop,/planOriginalPublicationHandoffs\(recovery,obligations\|\|\[\]\)/);
 assert.match(loop,/\.eq\('channel',handoff\.channel\)\.eq\('next_action',handoff\.previous\)/);
 assert.match(loop,/\.in\('status',\['PLANNED','BLOCKED','FAILED'\]\)\.eq\('external_id',null\)/);
 assert.match(loop,/\.select\('channel,next_action,status,external_id'\)/);
 assert.match(loop,/handoffWriteback,\s*obligations:/);
 assert.match(loop,/const LOOP_LEASE_MS = 240_000/);
 assert.match(guard,/owner:typeof x\.owner==='string'/);
 assert.match(portal,/Verantwoordelijke herstelagent/);
 assert.match(portal,/esc\(item\.owner\)/);
});
