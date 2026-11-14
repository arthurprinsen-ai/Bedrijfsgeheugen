import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {projectOriginalInnovationHandoff,projectPowerhouseIntegrationReadback}
  from '../platform/portal/powerhouse-existing-integration-read-model.mjs';
import {powerhouseIntegrationMarkup}
  from '../portal-v2/control-plane-cockpit.js';

const id='f838763f-8deb-4603-972f-a06d0b3a16a6';
const key='quality-learning-v1:media-preproof';
const sha='a'.repeat(64);
const revision='v-1';
const candidate=()=>({candidate_id:id,source_key:key,owner_agent:'engineering',status:'candidate',safety_class:'review_required'});
const obligation=()=>({business_entity:id,change_id:key,owner:'original-agent:engineering',state:'OPEN',payload_sha256:sha,evidence:{source_revision:revision}});
const operation=()=>({operation_type:'INNOVATION_INTAKE',capability_id:'agent:agent-integration-engineer',
  status:'PLANNED',correlation_id:'innovation-delivery:'+id,idempotency_key:'innovation-delivery:'+id+':'+sha.slice(0,16),
  change_id:key,payload_sha256:sha,remote_ref:null,evidence:{execution_resilience:{state:'WAITING_ORIGINAL_AGENT_INTAKE',readback_result:'NO_SIDE_EFFECT_STARTED'}}});
const model=(c=[candidate()],b=[obligation()],o=[operation()])=>
  projectOriginalInnovationHandoff({candidates:c,obligations:b,intakes:o,at:'2026-11-14T20:00:00Z'});

test('14 historical source-bound PLANNED repairs are still unclaimed, not verified innovations',()=>{
  const a=model();
  assert.equal(a.state,'CONSUMER_ACK_DUE');
  assert.equal(a.candidates,1);assert.equal(a.sourceBound,1);
  assert.equal(a.awaitingAgentAck,1);assert.equal(a.verifiedConsumerAcks,0);
  assert.equal(a.entries[0].nextSafeAction,'ORIGINAL_AGENT_SOURCE_BOUND_REVIEW_AND_RECEIPT');
  assert.equal(a.independentlyVerifiedInnovations,null);
  assert.equal(a.entries[0].reviewRequired,true);
});

test('VERIFIED without exact independent receipt, source revision and remote ref is never ACK',()=>{
  const cases=[
    {...operation(),status:'VERIFIED'},
    {...operation(),status:'VERIFIED',remote_ref:'runtime:1'},
    {...operation(),status:'VERIFIED',remote_ref:'runtime:1',evidence:{consumer_owner:'agent:agent-integration-engineer',source_revision:'stale',independent_consumer_readback:true}},
    {...operation(),status:'VERIFIED',remote_ref:'runtime:1',evidence:{consumer_owner:'agent:other',source_revision:revision,independent_consumer_readback:true}},
  ];
  for(const item of cases)assert.equal(model([candidate()],[obligation()],[item]).verifiedConsumerAcks,0);
  const signed={...operation(),status:'VERIFIED',remote_ref:'runtime:independently-confirmed',
    evidence:{consumer_owner:'agent:agent-integration-engineer',source_revision:revision,independent_consumer_readback:true}};
  const result=model([candidate()],[obligation()],[signed]);
  assert.equal(result.verifiedConsumerAcks,1);
  assert.equal(result.state,'CONSUMER_ACK_PROVEN_OUTCOME_DUE');
  assert.equal(result.independentlyVerifiedInnovations,null);
});

test('source/owner/sha, extra operations or orphan obligations cannot silently vanish',()=>{
  const wrong=[
    model([candidate()],[{...obligation(),change_id:'wrong'}],[operation()]),
    model([candidate()],[obligation()],[{...operation(),capability_id:'agent:wrong'}]),
    model([candidate()],[obligation()],[{...operation(),payload_sha256:'b'.repeat(64)}]),
    model([candidate()],[obligation()],[operation(),operation()]),
    model([candidate(),candidate()],[obligation()],[operation()]),
  ];
  for(const result of wrong)assert.notEqual(result.state,'CONSUMER_ACK_PROVEN_OUTCOME_DUE');
  assert.equal(model([candidate()],[obligation(),{...obligation(),business_entity:'other'}],[operation()]).state,'SOURCE_IDENTITY_CONFLICT');
  assert.equal(model([{...candidate(),owner_agent:'unregistered'}],[obligation()],[operation()]).sourceBound,0);
  assert.equal(model([],[],[]).state,'NO_SOURCE_CANDIDATES');
});

test('incomplete source gives NO readback, not false zero or green',()=>{
  const d={innovationCandidates:[candidate()],innovationObligations:[obligation()],innovationIntakes:[operation()]};
  const bad=projectPowerhouseIntegrationReadback({datasets:d,
    readStates:{innovationCandidates:'LIVE',innovationObligations:'UNAVAILABLE',innovationIntakes:'LIVE'}});
  assert.equal(bad.innovationHandoff,null);
  assert.ok(bad.gapCodes.includes('SOURCE_UNAVAILABLE:innovationObligations'));
  assert.equal(bad.sourceState,'PARTIAL');
  const good=projectPowerhouseIntegrationReadback({datasets:d,
    readStates:{innovationCandidates:'LIVE',innovationObligations:'LIVE',innovationIntakes:'LIVE'}});
  assert.equal(good.innovationHandoff.awaitingAgentAck,1);
  assert.ok(good.gapCodes.includes('INNOVATION_CONSUMER_ACK_DUE'));
  assert.equal(good.integrationState,'END_TO_END_UNPROVEN');
});

test('same original admin cockpit shows owner and gap, escapes hostile source labels',()=>{
  const evil=model([{...candidate(),source_key:'<script>doNotRun()</script>'}],
    [{...obligation(),change_id:'<script>doNotRun()</script>'}],
    [{...operation(),change_id:'<script>doNotRun()</script>'}]);
  const html=powerhouseIntegrationMarkup({sourceState:'PARTIAL',sourceReadStates:{},
    innovationHandoff:evil,gapCodes:['INNOVATION_CONSUMER_ACK_DUE']});
  assert.match(html,/data-bg-original-innovation-intakes="true"/);
  assert.match(html,/agent-integration-engineer/);
  assert.match(html,/ACK ontbreekt/);
  assert.match(html,/NIET BEWEZEN/);
  assert.doesNotMatch(html,/<script>doNotRun/);
  assert.match(html,/&lt;script&gt;/);
});

test('existing source projection is read only, admin-guarded, no new worker or scheduler',()=>{
 const src=fs.readFileSync('platform/portal/powerhouse-existing-integration-read-model.mjs','utf8');
 const route=fs.readFileSync('netlify/functions/powerhouse-control-plane.mjs','utf8');
 const ui=fs.readFileSync('portal-v2/control-plane-cockpit.js','utf8');
 const skill=fs.readFileSync('.agents/skills/powerhouse-self-improvement-layer/SKILL.md','utf8');
 assert.match(src,/brain_operations/);assert.match(src,/brain_obligations/);
 assert.match(src,/powerhouse_optimization_candidate_v1/);
 assert.match(src,/original-agent:/);
 assert.doesNotMatch(src,/method\s*:\s*['"](?:POST|PATCH|PUT|DELETE)/);
 assert.ok(route.indexOf('if(!hasAdminRole(user))')<route.indexOf('readPowerhouseIntegrationReadback('));
 assert.match(route,/private, no-store/);
 assert.match(ui,/INNOVATIE|Innovatie/);
 assert.match(skill,/original_agent|original-agent|agent-integration-engineer/);
});
