import test from 'node:test';
import assert from 'node:assert/strict';
import { resolvePlannedActionRuntime, createCanonicalPlannedActionRecorder } from '../brain/observability/planned-action-live-recorder.mjs';
import { loadDeliveryPreflight } from '../tools/delivery-preflight.mjs';
import { matchPlannedAction, loadGuardKnowledge } from '../scripts/brain/planned-action-guard.mjs';

const serviceRoleKey = 'test-only-fake-role-never-a-real-provider-credential';
const env = {
  SUPABASE_URL:'https://example-project.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY:serviceRoleKey,
  POWERHOUSE_AGENT_ID:'brain-agent-alpha',
  GITHUB_RUN_ID:'42301230001',
  GITHUB_RUN_ATTEMPT:'1',
  GITHUB_SHA:'1234567890123456789012345678901234567890',
  POWERHOUSE_ACTION_RECALL_MODE:'required',
};
const risky = 'Apply a Supabase migration directly in production';

test('capture configuration is explicit and accepts only a trusted hosted authority', () => {
  assert.equal(resolvePlannedActionRuntime({}).state,'NOT_CONFIGURED');
  assert.throws(() => resolvePlannedActionRuntime({POWERHOUSE_ACTION_RECALL_MODE:'required'}),/AUTHORITY_OR_IDENTITY_MISSING/);
  assert.throws(() => resolvePlannedActionRuntime({...env,SUPABASE_URL:'http://example-project.supabase.co'}),/AUTHORITY_OR_IDENTITY_MISSING/);
  assert.throws(() => resolvePlannedActionRuntime({...env,SUPABASE_URL:'https://localhost'}),/AUTHORITY_OR_IDENTITY_MISSING/);
  assert.throws(() => resolvePlannedActionRuntime({...env,POWERHOUSE_AGENT_ID:'bad identity with spaces'}),/AUTHORITY_OR_IDENTITY_MISSING/);
  const c=resolvePlannedActionRuntime(env);
  assert.equal(c.state,'CONFIGURED');
  assert.equal(c.sourceRef,'github:run:42301230001');
  assert.equal(c.executionId,'run-42301230001-attempt-1');
});

test('original guard blocked decision is persisted and provider-readback verified before denying execution', async()=>{
  const requests=[], stored = new Map();
  const fakeFetch=async (url, opts) => {
    requests.push({url,method:opts.method||'GET',body:opts.body});
    if(url.endsWith('/rest/v1/rpc/brain_append_record')){
      const args=JSON.parse(opts.body);
      const key=args.p_record_id;
      if(!stored.has(key)) stored.set(key,{
        tenant_id:args.p_tenant_id,record_id:key,status:args.p_status,
        source_revision:args.p_source_revision,payload:args.p_payload,
        record_type:args.p_record_type,record_kind:args.p_record_kind,
        subject_id:args.p_subject_id,observed_at:args.p_observed_at,
        idempotency_key:args.p_idempotency_key,
      });
      return {ok:true,status:200,json:async()=>[stored.get(key)]};
    }
    if(url.includes('/rest/v1/brain_records?')){
      const u=new URL(url);
      const id=u.searchParams.get('record_id')?.slice(3);
      return {ok:true,status:200,json:async()=> stored.has(id)?[stored.get(id)]:[]};
    }
    throw Error('unexpected fake backend call');
  };
  const recorder=createCanonicalPlannedActionRecorder({env,fetchImpl:fakeFetch});
  const received=[];
  await assert.rejects(loadDeliveryPreflight({
    component:'shared',plannedAction:risky,
    recordPlannedAction:async data=>{
      received.push(data);
      const evidence=await recorder.record(data);
      assert.equal(evidence.status,'PERSISTED_READBACK_VERIFIED');
    },
  }),/PLANNED_ACTION_PREVENTION_REQUIRED/);
  assert.equal(received.length,1);
  assert.equal(received[0].result.ok,false);
  assert.equal(stored.size,1);
  const observation=[...stored.values()][0];
  assert.equal(observation.payload.sourceKind,'REAL_AGENT_PREFLIGHT');
  assert.equal(observation.payload.blocked,true);
  assert.ok(observation.payload.matchedRuleIds.includes('MIGRATION_AND_LOCK_IN_SAME_CHANGE_WITH_PROVIDER_READBACK'));
  assert.ok(!JSON.stringify(requests).includes(risky),'raw action never leaves the agent runtime');
  assert.ok(!JSON.stringify(requests).includes('my secret'));
  assert.ok(!JSON.stringify(stored).includes(risky));
  assert.equal(requests.filter(r=>r.method==='POST').length,1);
  assert.equal(requests.filter(r=>r.method==='GET').length,1);
  assert.equal(requests[0].url,'https://example-project.supabase.co/rest/v1/rpc/brain_append_record');
  const originalId=observation.record_id;
  await recorder.record(received[0]);
  assert.equal(stored.size,1,'same action result is idempotent');
  assert.equal([...stored.values()][0].record_id,originalId);
});

test('corrected acknowledged preflight becomes a different real observation', async()=>{
  const observed=[];
  const knowledge=await loadGuardKnowledge();
  const before=matchPlannedAction({action:risky,...knowledge});
  const after=await loadDeliveryPreflight({
    component:'shared',plannedAction:risky,
    acknowledgedPreventionRules:before.unacknowledged.map(x=>x.ruleId),
    recordPlannedAction:async data=>observed.push(data),
  });
  assert.equal(after.plannedActionGuard.ok,true);
  assert.equal(observed.length,1);
  assert.deepEqual(observed[0].result.unacknowledged,[]);
});

test('failed persistence or non-independent provider readback is a hard error, not a green receipt', async()=>{
  const errorFetch=async()=>({ok:false,status:503});
  const recorder=createCanonicalPlannedActionRecorder({env,fetchImpl:errorFetch});
  await assert.rejects(recorder.record({
    action:risky,result:{ok:false,matches:[{ruleId:'MIGRATION_AND_LOCK_IN_SAME_CHANGE_WITH_PROVIDER_READBACK'}],unacknowledged:[{ruleId:'MIGRATION_AND_LOCK_IN_SAME_CHANGE_WITH_PROVIDER_READBACK'}]},
  }),/CANONICAL_BRAIN_APPEND_HTTP_503/);
  const mismatchFetch=async(url,options)=>url.includes('/rpc/brain_append_record')
    ? {ok:true,status:200,json:async()=>[{tenant_id:'canonical',record_id:'pretend',record_type:'Evidence',record_kind:'evidence',subject_id:'planned-action:pretend',observed_at:new Date().toISOString(),payload:{}}]}
    : {ok:true,status:200,json:async()=>[]};
  const mismatch=createCanonicalPlannedActionRecorder({env,fetchImpl:mismatchFetch});
  await assert.rejects(mismatch.record({
    action:'Write a code change',
    result:{ok:true,matches:[],unacknowledged:[]},
  }),/PLANNED_ACTION_BRAIN_READBACK_MISMATCH/);
});

test('unsupported recorder hook type rejects and never bypasses original block',async()=>{
  await assert.rejects(loadDeliveryPreflight({
    component:'shared',plannedAction:risky,recordPlannedAction:'not-a-callback',
  }),/recordPlannedAction callback required/);
});
