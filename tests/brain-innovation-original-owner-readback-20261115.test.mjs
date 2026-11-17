import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
  AUDIT_FILE,CONTRACT,readCanonicalRows,evaluateOriginalOwnerHandoff,
  runOriginalInnovationOwnerAudit,summarizeOriginalOwnerAudit
} from '../scripts/brain/innovation-original-owner-readback.mjs';

const NOW='2026-11-15T09:00:00.000Z';
const SHA='a'.repeat(64);
const candidate=(id,owner='engineering')=>({
  candidate_id:id,source_key:'quality-learning-v1:'+id,owner_agent:owner,
  status:'candidate',safety_class:'review_required',created_at:'2026-10-10T03:02:00Z'
});
const obligation=c=>({
  business_entity:c.candidate_id,change_id:c.source_key,
  owner:'original-agent:'+c.owner_agent,state:'OPEN',payload_sha256:SHA,
  evidence:{source_revision:'real-revision-'+c.candidate_id}
});
const intake=c=>({
  id:'source-operation-'+c.candidate_id,operation_type:'INNOVATION_INTAKE',
  capability_id:c.owner_agent==='cro'?'agent:agent-growth-market':'agent:agent-integration-engineer',
  status:'PLANNED',correlation_id:'innovation-delivery:'+c.candidate_id,
  idempotency_key:'innovation-delivery:'+c.candidate_id+':'+SHA.slice(0,16),
  payload_sha256:SHA,change_id:c.source_key,remote_ref:null,
  evidence:{},version:3
});
const makeSource=(n=2)=>{
  const candidates=Array.from({length:n},(_,i)=>candidate('00000000-0000-4000-8000-'+String(i+1).padStart(12,'0'),
    i===n-1?'cro':'engineering'));
  return {candidates,obligations:candidates.map(obligation),intakes:candidates.map(intake)};
};
const config={origin:'https://adhjwmvyoixzjtmiroln.supabase.co',key:'test-secret-not-real'};
const sourceTable={
  powerhouse_optimization_candidate_v1:'candidates',
  brain_obligations:'obligations',brain_operations:'intakes'
};
const mockPostgrest=(snapshot,{providerPageCap=250,missingHeader=false,drift=false}={})=>{
  const requested=[];
  const fetchImpl=async(url,options={})=>{
    requested.push({url,options});
    const u=new URL(url),name=sourceTable[u.pathname.split('/').at(-1)];
    const rows=snapshot[name]||[];
    const [,low,high]=/^(\d+)-(\d+)$/.exec(options.headers?.Range||'')||[];
    const start=Number(low),end=Number(high);
    const page=rows.slice(start,Math.min(end+1,start+providerPageCap));
    const total=drift&&start>0?rows.length+1:rows.length;
    const header=missingHeader?null:rows.length===0?'*/0':
      start+'-'+(start+page.length-1)+'/'+total;
    return {ok:true,status:page.length===rows.length?200:206,
      headers:{get:(key)=>key.toLowerCase()==='content-range'?header:null},
      json:async()=>page};
  };
  return {fetchImpl,requested};
};

test('canonical two-agent source produces real identity-bound review work, never fake execution',()=>{
  const snapshot=makeSource();
  const report=evaluateOriginalOwnerHandoff(snapshot,{now:NOW});
  assert.equal(report.contract,CONTRACT);
  assert.equal(report.health,'OWNER_ACK_PENDING');
  assert.equal(report.counts.candidates,2);
  assert.equal(report.counts.owner_ack_pending,2);
  assert.deepEqual(report.assigned_original_agents,{engineering:1,cro:1});
  assert.equal(report.terminal_innovation_success,false);
  assert.equal(report.read_only,true);
  assert.equal(report.no_new_queue,true);
  assert.ok(report.tasks.every(x=>x.consumer_ack_verified===false&&x.result_proven===false));
  assert.ok(report.tasks.every(x=>x.original_operation_id&&x.source_revision&&x.source_key));
  assert.equal(AUDIT_FILE,'artifacts/quality/original-innovation-owner-readback.json');
});

test('missing source, duplicate obligations, unknown agent, forged verified ACK, hash and key mismatch fail closed',()=>{
  const {candidates,obligations,intakes}=makeSource();
  const first={candidates,obligations,intakes};
  assert.throws(()=>evaluateOriginalOwnerHandoff({...first,intakes:[intakes[0]]},{now:NOW}),/HANDOFF_MISSING/);
  assert.throws(()=>evaluateOriginalOwnerHandoff({...first,obligations:[...obligations,obligations[0]]},{now:NOW}),/SOURCE_DUPLICATE_IDENTITY/);
  assert.throws(()=>evaluateOriginalOwnerHandoff({...first,candidates:[{...candidates[0],owner_agent:'ghost'},candidates[1]]},{now:NOW}),/OWNER_UNMAPPED/);
  assert.throws(()=>evaluateOriginalOwnerHandoff({...first,intakes:[{...intakes[0],status:'VERIFIED'},intakes[1]]},{now:NOW}),/UNVERIFIED_CONSUMER_CLAIM/);
  assert.throws(()=>evaluateOriginalOwnerHandoff({...first,obligations:[{...obligations[0],payload_sha256:'bad'},obligations[1]]},{now:NOW}),/SOURCE_HASH_INVALID/);
  assert.throws(()=>evaluateOriginalOwnerHandoff({...first,intakes:[{...intakes[0],idempotency_key:'invented'},intakes[1]]},{now:NOW}),/SOURCE_BOUND_IDENTITY_MISMATCH/);
  assert.equal(evaluateOriginalOwnerHandoff(makeSource(0),{now:NOW}).health,'NO_SOURCE_CANDIDATES');
});

test('provider exact counts and multi-page ranges prove complete original owner corpus',async()=>{
  const mock=mockPostgrest(makeSource(257),{providerPageCap:101});
  const result=await readCanonicalRows({config,fetchImpl:mock.fetchImpl});
  assert.equal(result.candidates.length,257);
  assert.equal(result.obligations.length,257);
  assert.equal(result.intakes.length,257);
  assert.ok(mock.requested.length>=9);
  assert.ok(mock.requested.every(x=>x.options.headers.Prefer==='count=exact'));
  assert.ok(mock.requested.every(x=>x.options.method==='GET'));
  assert.ok(mock.requested.every(x=>x.url.startsWith(config.origin+'/rest/v1/')));
  assert.ok(mock.requested.every(x=>!('body' in x.options)));
});

test('missing exact counts, provider count drift and unrelated output never silently count as zero',async()=>{
  for(const opts of [{missingHeader:true},{drift:true}]){
    const mock=mockPostgrest(makeSource(257),{providerPageCap:101,...opts});
    await assert.rejects(readCanonicalRows({config,fetchImpl:mock.fetchImpl}),/ORIGINAL_INNOVATION_/);
  }
  await assert.rejects(readCanonicalRows({config:{...config,origin:'http://evil.invalid'}}),/SOURCE_HOST_UNTRUSTED/);
  await assert.rejects(readCanonicalRows({config:{}}),/SOURCE_AUTH_UNAVAILABLE/);
});

test('genuine exact owner revision and independently read-back remote ID prove ONLY ACK, not innovation impact',()=>{
  const snapshot=makeSource(1);
  // This one-item fixture otherwise defaults to CRO; deliberately verify the
  // original engineering owner identity rather than accepting the wrong agent.
  snapshot.candidates[0].owner_agent='engineering';
  snapshot.obligations[0].owner='original-agent:engineering';
  const op={...snapshot.intakes[0],capability_id:'agent:agent-integration-engineer'};
  snapshot.intakes[0]={...op,status:'VERIFIED',remote_ref:'provider:source-review:123',
    evidence:{consumer_owner:'agent:agent-growth-market',
      source_revision:'real-revision-'+snapshot.candidates[0].candidate_id,
      independent_consumer_readback:true}};
  assert.throws(()=>evaluateOriginalOwnerHandoff(snapshot,{now:NOW}),/UNVERIFIED_CONSUMER_CLAIM/);
  snapshot.intakes[0].evidence.consumer_owner='agent:agent-integration-engineer';
  const result=evaluateOriginalOwnerHandoff(snapshot,{now:NOW});
  assert.equal(result.counts.owner_ack_verified,1);
  assert.equal(result.counts.measured_outcomes_verified,0);
  assert.equal(result.health,'INNOVATION_OUTCOME_UNVERIFIED');
  assert.equal(result.terminal_innovation_success,false);
});

test('trusted main-only real provider reader uses existing canonical auth and does not write or dispatch',async()=>{
  const mock=mockPostgrest(makeSource(),{providerPageCap:100});
  const report=await runOriginalInnovationOwnerAudit({
    env:{GITHUB_ACTIONS:'true',GITHUB_REF:'refs/heads/main',
      SUPABASE_URL:config.origin,SUPABASE_SERVICE_ROLE_KEY:config.key},
    fetchImpl:mock.fetchImpl,now:NOW
  });
  assert.equal(report.counts.owner_ack_pending,2);
  assert.ok(mock.requested.every(x=>x.options.method==='GET'));
  await assert.rejects(runOriginalInnovationOwnerAudit({
    env:{GITHUB_ACTIONS:'true',GITHUB_REF:'refs/heads/feature',
      SUPABASE_URL:config.origin,SUPABASE_SERVICE_ROLE_KEY:config.key},
    fetchImpl:mock.fetchImpl,now:NOW
  }),/REVIEW_AUDIT_TRUSTED_MAIN_REQUIRED/);
});

test('single existing daily schedule retains independently failing source check and identical artifact authority',()=>{
  const w=readFileSync('.github/workflows/powerhouse-daily-self-evolution.yml','utf8');
  assert.equal((w.match(/schedule:/g)||[]).length,1);
  assert.match(w,/node scripts\/brain\/innovation-original-owner-readback\.mjs/);
  assert.match(w,/if: always\(\)/);
  assert.match(w,/path: artifacts\/quality\//);
  assert.doesNotMatch(w,/innovation.*cron\.schedule|new-innovation-scheduler/i);
});

test('GitHub artifact redacts all original candidate, operation and source identities',()=>{
  const detailed=evaluateOriginalOwnerHandoff(makeSource(),{now:NOW});
  const summary=summarizeOriginalOwnerAudit(detailed);
  const serialized=JSON.stringify(summary);
  assert.equal(summary.original_owner_packet_redacted,true);
  assert.equal(summary.counts.candidates,2);
  assert.equal(summary.owner_ack_due,2);
  assert.equal(summary.terminal_innovation_success,false);
  assert.equal('tasks' in summary,false);
  for(const item of detailed.tasks){
    assert.ok(!serialized.includes(item.candidate_id));
    assert.ok(!serialized.includes(item.original_operation_id));
    assert.ok(!serialized.includes(item.source_key));
    assert.ok(!serialized.includes(item.source_revision));
  }
  const unknown=summarizeOriginalOwnerAudit({contract:CONTRACT,health:'SOURCE_UNAVAILABLE',error_code:'SOURCE_AUTH_UNAVAILABLE'});
  assert.equal(unknown.health,'SOURCE_UNAVAILABLE');
  assert.equal(unknown.counts,null);
});
