import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {loadOneLoopAssurance,summarizeOneLoopAssurance,ONE_LOOP_ASSURANCE_CONTRACT}
  from '../brain/observability/one-loop-assurance-readback.mjs';

const names=['full-cycle-production-proof','daily-compound-learning','revenue-flywheel',
  'one-brain-reconcile','content-closed-loop','data-spine-watchdog','execution-resilience',
  'external-intelligence-universe','mira-problem-loop','portal-visual-density',
  'self-improvement-layer','seo-opportunity-resolver','signal-taxonomy-self-heal',
  'source-backed-outbound','autonomous-outreach'];
const clock='2026-10-30T07:02:00Z';
function rows(){return names.map((loop_key,i)=>({
  loop_key,status:i<5?'RED':i===14?'AMBER':'GREEN',
  checked_at:'2026-10-30T07:00:00Z',fresh_stage_count:i===14?6:8,
  required_stage_count:8,missing_stages:i===14?['action','readback']:[],
  evidence:{guard_pass:i<5?false:i===14?null:true,cron_jobname:'original-owner'}
}));}
test('exact original 15-loop population has one RED overall if any original guard fails',()=>{
  const view=summarizeOneLoopAssurance(rows(),{observedAt:clock});
  assert.equal(view.status,'READBACK_COMPLETE');assert.equal(view.contract,ONE_LOOP_ASSURANCE_CONTRACT);
  assert.deepEqual(view.counts,{total:15,green:9,amber:1,red:5});
  assert.equal(view.overallStatus,'RED');
  assert.equal(view.loops.filter(x=>x.problem==='ORIGINAL_GUARD_FAILED').length,5);
  assert.deepEqual(view.loops.find(x=>x.key==='autonomous-outreach').missingStages,['action','readback']);
  assert.equal(view.publisherAuthority,'existing-only');
  assert.doesNotMatch(JSON.stringify(view),/original-owner|access.token|service_role/i);
});
test('incomplete and duplicate population fail closed without synthesizing green',()=>{
  assert.equal(summarizeOneLoopAssurance(rows().slice(0,14),{observedAt:clock}).status,'UNVERIFIED');
  const duplicate=rows();duplicate[14].loop_key=duplicate[0].loop_key;
  assert.equal(summarizeOneLoopAssurance(duplicate,{observedAt:clock}).reason,'LOOP_IDENTITY_OR_STATUS_INVALID');
});
test('canonical stale evidence cannot be shown as fresh',()=>{
  const v=rows();v[0].checked_at='2026-10-30T06:00:00Z';
  assert.equal(summarizeOneLoopAssurance(v,{observedAt:clock}).reason,'CANONICAL_ASSURANCE_NOT_FRESH');
});
test('failed guard or missing stage can never be classified as green',()=>{
  const v=rows();v[0].status='GREEN';
  assert.equal(summarizeOneLoopAssurance(v,{observedAt:clock}).reason,'CANONICAL_GREEN_CONFLICTS_WITH_EVIDENCE');
  const second=rows();second[14].status='GREEN';
  assert.equal(summarizeOneLoopAssurance(second,{observedAt:clock}).reason,'CANONICAL_GREEN_CONFLICTS_WITH_EVIDENCE');
});
test('real provider readback uses original view, returns bounded sanitized fields only',async()=>{
  let calls=0;
  const r=await loadOneLoopAssurance({baseUrl:'https://example.supabase.co',
    key:'test-only-placeholder',now:()=>clock,fetchImpl:async(url,options)=>{
      calls++;const u=new URL(url);
      assert.equal(u.pathname,'/rest/v1/powerhouse_loop_assurance_state_v1');
      assert.equal(u.searchParams.get('limit'),'25');
      assert.equal(options.method,'GET');
      return {ok:true,status:200,json:async()=>rows()};
    }});
  assert.equal(calls,1);assert.equal(r.status,'READBACK_COMPLETE');
  assert.equal(r.counts.total,15);
  assert.equal((await loadOneLoopAssurance({baseUrl:'',key:''})).status,'UNVERIFIED');
});
test('provider failures and errors never become green',async()=>{
  const failed=await loadOneLoopAssurance({baseUrl:'https://example.supabase.co',
    key:'test-only',fetchImpl:async()=>({ok:false,status:503})});
  assert.equal(failed.status,'UNVERIFIED');assert.equal(failed.reason,'CANONICAL_ASSURANCE_PROVIDER_503');
  const error=await loadOneLoopAssurance({baseUrl:'https://example.supabase.co',
    key:'test-only',fetchImpl:async()=>{throw new Error('provider blocked')}});
  assert.equal(error.status,'UNVERIFIED');
});
test('original portal-only route enforces identity+tenant+admin, never stores credentials',()=>{
  const server=readFileSync('netlify/functions/powerhouse-one-loop-assurance.mjs','utf8');
  const portal=readFileSync('portal-v2/modules/powerhouse-observability.js','utf8');
  assert.match(server,/isPowerhouseAdmin\(user/);
  assert.match(server,/resolveIdentityTenant\(user\)/);
  assert.match(server,/UNAUTHENTICATED/);
  assert.match(server,/method!=='GET'/);
  assert.match(server,/cache-control':'private, no-store'/);
  assert.match(portal,/data-one-loop-assurance/);
  assert.match(portal,/function oneLoopAssuranceView/);
  assert.match(portal,/data-evidence-status="UNVERIFIED"/);
  assert.match(portal,/oneLoopAssuranceView\(observability.oneLoopAssurance\)/);
  assert.doesNotMatch(server,/\.insert\(|\.update\(|\.upsert\(/);
});
