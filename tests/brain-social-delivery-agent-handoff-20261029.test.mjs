import test from 'node:test';
import assert from 'node:assert/strict';
import { createDefaultAgentRegistry, DEFAULT_AGENT_TEAM } from '../platform/agents/agent-team.mjs';
import { createAgentFabric } from '../platform/agents/agent-fabric.mjs';
import { readFileSync } from 'node:fs';

test('a stalled social publication routes through the canonical agent fabric and collaborating specialists',()=>{
 const registry=createDefaultAgentRegistry();
 const route=registry.route({domains:['Social','Content','Integration','Reliability','Security'],capabilities:['analyze','recover','verify']});
 assert.equal(route.primaryAgentId,'agent-social-delivery-recovery');
 assert.ok(route.supportAgentIds.includes('agent-reliability'));
 assert.ok(route.supportAgentIds.includes('agent-security'));
 assert.ok(route.supportAgentIds.includes('agent-integration-composio'));
 const fabric=createAgentFabric({registry,eventSink:{append:e=>e}});
 const signal={tenantId:'canonical',problemClass:'social-source-exhaustion',domains:['Social','Content','Integration','Reliability','Security'],capabilities:['analyze','recover','verify'],affectedObjectIds:['obligation:2026-10-29:linkedin_personal'],evidence:['no-provider-id']};
 const a=fabric.intake(signal),b=fabric.intake(signal);
 assert.equal(a.id,b.id,'repeat intake never duplicates a live obligation');
 assert.equal(a.primaryAgentId,'agent-social-delivery-recovery');
 assert.ok(a.supportAgentIds.includes('agent-security'));
});
test('the registry contains no active Make executor, no alternative social sender and no second writer',()=>{
 const ids=DEFAULT_AGENT_TEAM.map(a=>a.id);
 assert.equal(ids.includes('agent-integration-make'),false);
 assert.equal(ids.includes('agent-integration-composio'),true);
 assert.equal(ids.filter(id=>id==='agent-integration-engineer').length,1);
 assert.equal(ids.filter(id=>id==='agent-social-delivery-recovery').length,1);
 for(const a of DEFAULT_AGENT_TEAM){
   assert.equal(a.domains.includes('Make'),false,'retired Make may not receive new work');
   assert.equal(a.playbooks.some(p=>/^make-/i.test(p)),false);
 }
 const skill=readFileSync('.agents/skills/powerhouse-social-recovery-cooperation/SKILL.md','utf8');
 for(const gate of ['same canonical obligation','duplicate','0.940','one integration writer','provider ID','independent readback','security boundary','no new scheduler']) assert.ok(skill.toLowerCase().includes(gate.toLowerCase()),gate);
});

test('incident skills guarantee private audit, last-writer authorization and truthful historical closure',()=>{
 const security=readFileSync('.agents/skills/powerhouse-security-trust-center/SKILL.md','utf8');
 const social=readFileSync('.agents/skills/powerhouse-social-recovery-cooperation/SKILL.md','utf8');
 const policy=JSON.parse(readFileSync('brain/policies/powerhouse-incident-register-and-self-fix-v1.json','utf8'));
 for(const skill of [security,social]) {
   assert.ok(skill.includes('INCIDENT_PROTOCOL: agents-skills-register-and-self-fix-v1'));
   assert.match(skill,/approved_at/);
   assert.match(skill,/ONE BRAIN/);
   assert.match(skill,/Netlify/);
   assert.match(skill,/GitHub/);
 }
 assert.match(security,/HISTORIC_PUBLIC_COPIES_UNRESOLVED/);
 assert.match(security,/last egress writer/);
 assert.match(social,/one deduplicated audit receipt/);
 assert.match(social,/independently observed readback/);
 assert.ok(!policy.loop_debt_baseline.includes('powerhouse-security-trust-center'));
 assert.equal(policy.skill_protocol.marker,'INCIDENT_PROTOCOL: agents-skills-register-and-self-fix-v1');
});
