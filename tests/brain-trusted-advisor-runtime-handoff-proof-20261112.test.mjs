import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createDefaultAgentRegistry} from '../platform/agents/agent-team.mjs';

const policy=JSON.parse(readFileSync('brain/policies/trusted-advisor-assurance-v1.json','utf8'));
const skill=readFileSync('.agents/skills/powerhouse-cms-editorial/SKILL.md','utf8');

test('existing governance agent owns Trusted Advisor one-loop assurance without a new executor',()=>{
 const registry=createDefaultAgentRegistry();
 assert.equal(registry.all().length,14);
 assert.equal(registry.get('agent-trusted-advisor'),null);
 const owner=registry.get('agent-governance-ai-act');
 assert.ok(owner.tasks.includes('distinguish-live-code-from-current-tenant-consumer-processed-ack-and-verified-outcome'));
 assert.ok(owner.playbooks.includes('trusted-advisor-runtime-closed-loop-evidence-not-deploy-only'));
 assert.equal(policy.agent.new_scheduler,false);
 assert.equal(policy.agent.new_writer,false);
 assert.equal(policy.agent.may_publish,false);
});

test('no release-only verdict can pretend to be a completed tenant handoff',()=>{
 const p=policy.original_handoff_contract;
 assert.deepEqual(Object.keys(p.terminal_proof_gates),['release','source','consumer','execution','effect','learning','truth_status']);
 assert.match(p.terminal_proof_gates.release,/release alone is not tenant completion/);
 assert.match(p.terminal_proof_gates.source,/authenticated same-tenant BusinessInput/);
 assert.match(p.terminal_proof_gates.source,/freshness/);
 assert.match(p.terminal_proof_gates.consumer,/ACK_PROCESSED/);
 assert.match(p.terminal_proof_gates.consumer,/tenant, source revision, obligation and idempotency/);
 assert.match(p.terminal_proof_gates.execution,/provider\/runtime execution\/readback/);
 assert.match(p.terminal_proof_gates.effect,/7\/14\/28-day/);
 assert.match(p.terminal_proof_gates.learning,/original fingerprint/);
 assert.match(p.terminal_proof_gates.truth_status,/Do not label ALL_GREEN/);
 assert.equal(p.independent_verification,true);
 assert.match(p.failure_recovery,/same identical obligation fingerprint|reuse identical obligation fingerprint/);
});

test('existing editorial skill still guards provider consent and source-to-learning evidence',()=>{
 assert.match(skill,/Trusted Advisor production-versus-customer completion/);
 for(const token of ['BusinessInput','ONE BRAIN','Heartbeat','ACK','7\/14\/28-day','EVIDENCE_DUE','idempotency key']){
   assert.ok(skill.includes(token.replaceAll('\\/','/')),token);
 }
 assert.match(skill,/not an independent monitoring job/);
 assert.match(skill,/suppression and consent/);
});
