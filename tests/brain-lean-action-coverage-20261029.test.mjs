import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {summarizeCycleEvidenceCoverage,loadCycleEvidenceCoverage}
  from '../brain/observability/cycle-evidence-coverage.mjs';

const row=(n,payload={})=>({
  event_id:'event-'+n,tenant_id:'canonical',entity_type:'sales_action',
  occurred_at:'2026-10-29T10:00:00Z',
  evidence_ref:'source-proof-'+n,idempotency_key:'once-'+n,payload
});

test('counts only real field presence; a measured numeric zero is valid',()=>{
  const result=summarizeCycleEvidenceCoverage([
    row(1,{agent_id:'worker-1',skill_version:'v2',before_metric:0,after_metric:3,internal_private:'do-not-leak'}),
    row(2,{agent_id:' ',skill_version:null,before_metric:null,after_metric:null})
  ],2,'2026-10-29T11:00:00Z');
  assert.equal(result.status,'READBACK_COMPLETE');
  assert.deepEqual(result.totals,{
    events:2,evidenceRefs:2,idempotencyKeys:2,agentIds:1,
    skillVersions:1,beforeMetrics:1,afterMetrics:1,allFour:1,salesActionEvents:2,channelDecisionEvents:0,runtimeSignalEvents:0,otherEvents:0
  });
  assert.equal(result.tenantScope,'canonical');
  assert.doesNotMatch(JSON.stringify(result),/do-not-leak|source-proof-1|worker-1/);
});
test('SQL-originated sales and channel cycles are not silently reported as autonomous agents',()=>{
  const events=[
    {...row(1),entity_type:'powerhouse_sales_actions'},
    {...row(2),entity_type:'sales_action'},
    {...row(3),entity_type:'channel_decision'},
    {...row(4),entity_type:'powerhouse_runtime_events'},
    {...row(5),entity_type:'other_verified_event'}
  ];
  const result=summarizeCycleEvidenceCoverage(events,events.length,'2026-10-29T11:00:00Z');
  assert.equal(result.status,'READBACK_COMPLETE');
  assert.equal(result.totals.events,5);
  assert.equal(result.totals.salesActionEvents,2);
  assert.equal(result.totals.channelDecisionEvents,1);
  assert.equal(result.totals.runtimeSignalEvents,1);
  assert.equal(result.totals.otherEvents,1);
  assert.equal(result.totals.agentIds,0);
  assert.match(result.caveat,/not agent identity/i);
});

test('truncated, duplicate, wrong-tenant and malformed data are never marked complete',()=>{
  assert.equal(summarizeCycleEvidenceCoverage([row(1)],2).status,'UNVERIFIED');
  assert.equal(summarizeCycleEvidenceCoverage([row(1),row(1)],2).status,'UNVERIFIED');
  assert.equal(summarizeCycleEvidenceCoverage([{...row(1),tenant_id:'another'}],1).status,'UNVERIFIED');
  assert.equal(summarizeCycleEvidenceCoverage([{...row(1),payload:null}],1).status,'UNVERIFIED');
  assert.equal(summarizeCycleEvidenceCoverage([{...row(1),entity_type:''}],1).status,'UNVERIFIED');
});
test('bounded source pagination reads exactly the canonical tenant and returns aggregates',async()=>{
  const rows=Array.from({length:1001},(_,n)=>row(n,{agent_id:'a',skill_version:'s',before_metric:0,after_metric:1}));
  const calls=[];
  const fetchImpl=async(url,opts)=>{
    calls.push({url,opts});
    const offset=Number(new URL(url).searchParams.get('offset'));
    const page=rows.slice(offset,offset+1000);
    return {ok:true,headers:{get:()=>`${offset}-${offset+page.length-1}/1001`},json:async()=>page};
  };
  const result=await loadCycleEvidenceCoverage({baseUrl:'https://example.supabase.co',key:'secret-key',
    observedAt:'2026-10-29T12:00:00Z',fetchImpl});
  assert.equal(result.status,'READBACK_COMPLETE');
  assert.equal(result.totals.events,1001);
  assert.equal(result.totals.allFour,1001);
  assert.equal(calls.length,2);
  assert.equal(result.totals.salesActionEvents,1001);
  for (const call of calls) {
    const uri=new URL(call.url);
    assert.equal(uri.searchParams.get('tenant_id'),'eq.canonical');
    assert.match(uri.searchParams.get('select'),/entity_type/);
    assert.equal(uri.searchParams.getAll('occurred_at').length,2);
    assert.equal(call.opts.headers.prefer,'count=exact');
  }
  assert.doesNotMatch(JSON.stringify(result),/secret-key|event-1|source-proof-1/);
});
test('missing config, denied access, incomplete provider count or excess window fails closed',async()=>{
  assert.equal((await loadCycleEvidenceCoverage()).status,'UNAVAILABLE');
  assert.equal((await loadCycleEvidenceCoverage({baseUrl:'https://example.test',key:'k',
    fetchImpl:async()=>({ok:false,status:403})})).status,'UNAVAILABLE');
  assert.equal((await loadCycleEvidenceCoverage({baseUrl:'https://example.test',key:'k',
    fetchImpl:async()=>({ok:true,headers:{get:()=>null},json:async()=>[]})})).status,'UNVERIFIED');
  assert.equal((await loadCycleEvidenceCoverage({baseUrl:'https://example.test',key:'k',
    fetchImpl:async()=>({ok:true,headers:{get:()=> '0-999/4500'},json:async()=>[]})})).status,'UNVERIFIED');
});
test('existing admin gate and portal surface expose only verified aggregate availability',()=>{
  const api=fs.readFileSync('netlify/functions/powerhouse-observability.mjs','utf8');
  const ui=fs.readFileSync('portal-v2/modules/powerhouse-observability.js','utf8');
  assert.match(api,/isPowerhouseAdmin\(user/);
  assert.match(api,/loadCycleEvidenceCoverage\(/);
  assert.match(api,/releaseEvidence,agentCycleCoverage/);
  assert.match(ui,/data-agent-cycle-coverage/);
  assert.match(ui,/agentCoverage\.status==='READBACK_COMPLETE'/);
  assert.match(ui,/UNKNOWN · bron niet compleet/);
  assert.doesNotMatch(api,/console\.log\(.*payload/);
});
