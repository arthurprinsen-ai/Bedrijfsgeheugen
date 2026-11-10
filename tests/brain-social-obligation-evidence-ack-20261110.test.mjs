import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {verifiedSocialWindowAck} from '../supabase/functions/_shared/social-learning-window-ack.mjs';
import {runScheduledTenants} from '../netlify/functions/social-learning-evaluate.mjs';

const postId='6aaa57852bae7e96e951773d';
const tenantId='canonical';
const published='2026-09-16T08:47:02.523Z';
const observed='2026-09-18T10:58:21.308Z';
const post={tenant_id:tenantId,post_id:postId,external_post_id:postId,published_at:published};
const obligation={tenant_id:tenantId,obligation_id:'social-snapshot:'+postId+':48',
  post_id:postId,type:'UNVERIFIED_OR_PARTIAL_WINDOW',window_hours:48,status:'OPEN'};
const evaluation={tenant_id:tenantId,evaluation_id:'evaluation:'+postId+':48',
  post_id:postId,window_hours:48,observed_at:observed,
  metric_vector:{impressions:1963,reach:1450,likes:4,comments:0}};
const snap={tenant_id:tenantId,post_id:postId,source:'buffer',data_quality:'OBSERVED',
  observed_at:observed,source_event_id:'buffer:'+postId+':2026-09-18T10:58:21.308Z',
  metrics:{Impressions:1963,Reach:1450,likes:4,comments:0}};
const verify=(args={})=>verifiedSocialWindowAck({
  obligation,post,evaluation,snapshots:[snap],...args});

test('exact native historical provider observation + original evaluated window receives measurement ACK only',()=>{
  const result=verify();
  assert.equal(result.status,'MEASUREMENT_VERIFIED');
  assert.equal(result.source_event_id,snap.source_event_id);
  assert.equal(result.evaluation_id,evaluation.evaluation_id);
  assert.equal(result.no_causal_uplift_claim,true);
  assert.equal(result.no_social_republish,true);
});

test('never ACK a partial, unobserved, wrong-age, wrong-tenant or fake post ID window',()=>{
  assert.equal(verify({snapshots:[{...snap,data_quality:'OBSERVED_PARTIAL_SCOPE'}]}),null);
  assert.equal(verify({snapshots:[]}),null);
  assert.equal(verify({snapshots:[{...snap,observed_at:'2026-10-15T10:58:21.308Z'}]}),null);
  assert.equal(verify({snapshots:[{...snap,source_event_id:'buffer:unrelated:2026-09-18'}]}),null);
  assert.equal(verify({post:{...post,external_post_id:'unrelated'}}),null);
  assert.equal(verify({evaluation:{...evaluation,tenant_id:'other-tenant'}}),null);
  assert.equal(verify({evaluation:{...evaluation,evaluation_id:'unrelated-eval'}}),null);
  assert.equal(verify({obligation:{...obligation,status:'MEASUREMENT_VERIFIED'}}),null);
});

test('all provider and evaluation metric values must agree; zero is valid observed value, null is not',()=>{
  assert.equal(verify({snapshots:[{...snap,metrics:{...snap.metrics,likes:7}}]}),null);
  assert.equal(verify({evaluation:{...evaluation,metric_vector:{likes:0}},
    snapshots:[{...snap,metrics:{likes:0}}]}).status,'MEASUREMENT_VERIFIED');
  assert.equal(verify({evaluation:{...evaluation,metric_vector:{impressions:null,likes:null}},
    snapshots:[{...snap,metrics:{likes:null}}]}),null);
  assert.equal(verify({snapshots:[{...snap,data_quality:'PROVIDER_OBSERVED_LINKED'}]}),null);
});

test('one ORIGINAL tenant-scoped hourly executor calls existing store ACK and duplicate obligation cannot reopen',async()=>{
  const edge=await readFile(new URL('../supabase/functions/social-learning-store/index.ts',import.meta.url),'utf8');
  const evaluator=await readFile(new URL('../netlify/functions/social-learning-evaluate.mjs',import.meta.url),'utf8');
  const client=await readFile(new URL('../netlify/functions/_social-learning-store.mjs',import.meta.url),'utf8');
  const agent=await readFile(new URL('../platform/agents/agent-team.mjs',import.meta.url),'utf8');
  assert.match(edge,/verifiedSocialWindowAck/);
  assert.match(edge,/if\(action==='reconcile_verified_obligations'\)/);
  assert.match(edge,/onConflict:'tenant_id,obligation_id',ignoreDuplicates:true/);
  assert.match(edge,/\.eq\('status','OPEN'\)\.select\('obligation_id'\)/);
  assert.match(client,/reconcileVerifiedObligations:.*reconcile_verified_obligations/);
  assert.match(evaluator,/const receipts=store.reconcileVerifiedObligations/);
  assert.match(evaluator,/schedule:'@hourly'/);
  assert.match(agent,/reconcile-original-provider-window-and-evaluation-receipt/);
  assert.doesNotMatch(edge,/cron\.schedule|provider_create|publish_post|buffer\.com\/api/i);
});

test('original hourly social agent executes ACK reconciliation after the same tenant evaluation, no new scheduler',async()=>{
  const calls=[];
  const run=await runScheduledTenants({tenants:['canonical','bedrijfsgeheugen'],
    now:new Date('2026-11-10T10:00:00Z'),storeFactory:({tenantId})=>({
      listDuePosts:async()=>{calls.push(tenantId+':due');return [];},
      reconcileVerifiedObligations:async()=>{calls.push(tenantId+':ack');return {checked:8,resolved:2};}
    })});
  assert.equal(run.healthy,true);
  assert.equal(run.tenants.length,2);
  assert.deepEqual(calls.sort(),['bedrijfsgeheugen:ack','bedrijfsgeheugen:due','canonical:ack','canonical:due']);
  assert.ok(run.tenants.every(x=>x.obligationReceiptsResolved===2));
});

test('one failed tenant source/ACK does not erase the other original tenant receipt',async()=>{
  const run=await runScheduledTenants({tenants:['canonical','bedrijfsgeheugen'],
    now:new Date('2026-11-10T10:00:00Z'),storeFactory:({tenantId})=>({
      listDuePosts:async()=>[],
      reconcileVerifiedObligations:async()=>{
        if(tenantId==='canonical')throw Error('SOURCE_TRUNCATED');
        return {checked:2,resolved:1};
      }
    })});
  assert.equal(run.healthy,false);
  assert.equal(run.totals.failedTenantScopes,1);
  assert.equal(run.tenants.find(x=>x.tenantId==='bedrijfsgeheugen').obligationReceiptsResolved,1);
});
