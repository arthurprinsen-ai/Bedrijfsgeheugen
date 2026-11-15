import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const agents=read('AGENTS.md');
const playbook=read('docs/brain/groen-draaiboek.md');
const registry=read('platform/agents/agent-team.mjs');
const enrichment=read('.agents/skills/powerhouse-daily-full-connection-enrichment/SKILL.md');

test('global chat and agent contract forbids false closure before production, consumer, outcome and learning',()=>{
 assert.ok(agents.slice(0,2500).includes('docs/brain/groen-draaiboek.md'));
 for(const phrase of ['onderliggende probleem','OPEN/DEGRADED','consumer-ACK','provider','regressietest','oorspronkelijke ONE BRAIN','volledig groene keten']){
   assert.ok((agents+' '+playbook).includes(phrase),phrase);
 }
 assert.match(playbook,/TECHNICAL_RELEASE_VERIFIED/);
 assert.match(playbook,/BUSINESS_OUTCOME_VERIFIED/);
 assert.match(playbook,/UNKNOWN ≠ N\/A/);
 assert.match(playbook,/oorzaak, herstel, regressie, preventieregel/);
});
test('existing specialist agents own exact remediation and independent evidence without duplicate executors',()=>{
 for(const task of [
  'complete-original-work-with-independent-production-consumer-provider-outcome-and-learning-proof-or-open-obligation-with-next-due-owner',
  'enforce-original-business-closure-gate-and-reconcile-three-expired-email-handoffs-without-false-green',
  'register-each-intermediate-error-with-original-brain-fingerprint-source-owner-repair-and-replay',
  'audit-source-to-consumer-to-business-outcome-evidence-before-original-terminal-state',
  'reject-commercial-all-green-until-expired-original-handoffs-provider-outcome-and-learning-are-independently-proven'
 ])assert.ok(registry.includes(task),task);
 assert.match(enrichment,/BROKEN_RESEARCH_TO_COMPOSER_EXPIRED/);
 assert.match(enrichment,/EXPIRED_WITHOUT_DELIVERY/);
 assert.match(enrichment,/geen "klaar" vóór echte zakelijke ketensluiting/);
 assert.match(enrichment,/geen parallelle verzender/);
});
