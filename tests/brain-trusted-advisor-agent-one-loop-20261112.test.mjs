import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createDefaultAgentRegistry} from '../platform/agents/agent-team.mjs';
import {buildEditorialCouncilBrief} from '../supabase/functions/_shared/editorial-council-context.mjs';

const read=path=>readFileSync(path,'utf8');
const policy=JSON.parse(read('brain/policies/trusted-advisor-assurance-v1.json'));

test('trusted advisor is a real registered existing-fabric specialist, not a second writer',()=>{
 const registry=createDefaultAgentRegistry();
 const advisor=registry.get('agent-trusted-advisor');
 assert.ok(advisor);
 assert.ok(advisor.capabilities.includes('advise'));
 assert.ok(advisor.tasks.includes('require-same-tenant-source-revision-obligation-id-idempotency-key-owner-and-consumer-processed-ack'));
 assert.ok(advisor.playbooks.includes('one-brain-same-owner-handoff-cas-retry-and-evidence-readback'));
 assert.ok(advisor.learningContracts.includes('outcome.v1'));
 assert.equal(registry.route({domains:['Trust','Content','UX'],capabilities:['advise']}).primaryAgentId,'agent-trusted-advisor');
 assert.equal(policy.agent.new_scheduler,false);
 assert.equal(policy.agent.new_writer,false);
 assert.equal(policy.agent.may_publish,false);
});

test('original editorial council includes advisory role across existing channels without sender privilege',()=>{
 for(const channel of ['linkedin_personal','linkedin_company','instagram_company','blog','email_outreach','email_newsletter']){
  const brief=buildEditorialCouncilBrief({channel});
  assert.ok(brief.roles.includes('trusted-advisor-specialist'),channel);
  assert.equal(brief.trust_policy,'one-brain-trusted-advisor-external-quality-v1');
  assert.match(brief.instruction,/geen eigen publicatierechten of tweede planner/);
  assert.match(brief.instruction,/ook niets doen/);
 }
});

test('original one-loop policy disallows success on received-only or generic transport receipt',()=>{
 const h=policy.original_handoff_contract;
 assert.deepEqual(h.chain,[
  'Portal V2 or public consented customer signal',
  'existing tenant BusinessInput',
  'ONE BRAIN original obligation',
  'Powerhouse and Heartbeat original consumers',
  'eligible reversible CRO/editorial decision',
  'original authorized execution owner',
  'independent effect/provider readback',
  'same fingerprint learning'
 ]);
 for(const k of ['tenant_id','source_revision','obligation_id','source_ref','original_owner','idempotency_key','consumer_processed_ack','outcome_evidence_ref']){
  assert.ok(h.required_consumer_proof.includes(k),k);
 }
 assert.match(h.acceptance,/ACK_RECEIVED is not ACK_PROCESSED/);
 assert.match(h.failure_recovery,/reuse identical obligation fingerprint/);
 assert.equal(h.independent_verification,true);
});
