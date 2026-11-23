import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createDefaultAgentRegistry,DEFAULT_AGENT_TEAM} from '../platform/agents/agent-team.mjs';
import {providerUncertaintyNoResend} from '../supabase/functions/_shared/outreach-composer-hold.mjs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const skill=read('.agents/skills/powerhouse-daily-full-connection-enrichment/SKILL.md');
const learning=JSON.parse(read('brain/learning/2026-11-15-original-email-source-handoff-reliability-v1.json'));
const research=read('supabase/functions/powerhouse-relationship-public-research/index.ts');
const composer=read('supabase/functions/powerhouse-commercial-message-composer/index.ts');
const sender=read('supabase/functions/powerhouse-autonomous-outreach/index.ts');

const duties={
 'agent-integration-engineer':'protect-original-email-four-workstream-code-and-skill-parity-through-single-writer-ci',
 'agent-reliability':'reconcile-original-ten-public-email-source-debts-and-four-broken-handoffs-on-natural-116-138-171-without-noop-green',
 'agent-data-quality':'verify-source-bound-public-email-original-138-consumer-processed-ack-before-contact-promotion',
 'agent-integration-composio':'enforce-original-email-pinned-gmail-atomic-send-intent-and-independent-provider-readback-no-resend',
 'agent-growth-market':'measure-original-email-new-send-versus-prior-readback-replies-meetings-revenue-and-applied-learning'
};
test('five existing agents own the same original source->provider->business loop without any duplicate agent or executor',()=>{
 const reg=createDefaultAgentRegistry();
 const all=reg.all();
 assert.equal(new Set(all.map(a=>a.id)).size,all.length);
 assert.equal(new Set(DEFAULT_AGENT_TEAM.map(a=>a.id)).size,DEFAULT_AGENT_TEAM.length);
 for(const [id,task] of Object.entries(duties)){
  const agent=reg.get(id);
  assert.ok(agent, id+' missing');
  assert.equal(agent.tasks.filter(x=>x===task).length,1,id+' duplicated/forgot task');
 }
 assert.ok(reg.get('agent-integration-composio').playbooks.includes('idempotent-integration-delivery'));
 assert.ok(!all.some(a=>a.id==='agent-email-sender'||a.id==='agent-email-enrichment-scheduler'));
});

test('skill enforces one original owner, original crons, source/consumer ACK and no false business closure',()=>{
 assert.match(skill,/powerhouse\|email\|four-workstream-agent-skill-guard\|20261115-v1/);
 for(const fragment of [
  'agent-integration-engineer','agent-reliability','agent-data-quality','agent-integration-composio','agent-growth-market',
  'public_email_next_attempt_at','#116','#138','#171','source_revision','CONSUMER_PROCESSED',
  'Gmail-SENT','NO_RESEND','prior_readbacks_settled','powerhouse_commercial_handoff_scorecard_v1',
  'TECHNICAL_RELEASE_VERIFIED','COMMERCIAL_EXECUTION=COMPLETED','LEARNING_APPLIED'
 ])assert.ok(skill.includes(fragment),fragment+' missing from skill');
 assert.ok(skill.includes('geen')||skill.includes('Geen'));
});

test('technical release receipt does not erase original open debt or invent commercial impact',()=>{
 assert.match(learning.fingerprint,/four-workstream-source-handoff-safe-send-measurement/);
 assert.notEqual(learning.evaluation?.business_outcome_status,'COMPLETED');
 assert.notEqual(learning.business_terminal_state,'COMPLETED');
 assert.equal(learning.evidence.external_emails_sent_by_this_change,0);
 assert.equal(learning.evidence.verified_new_emails_from_this_change,0);
 assert.ok(learning.evidence.unresolved_original_source_retries>=10);
 assert.ok(learning.evidence.broken_or_unproven_handoffs_7d>=4);
 assert.equal(learning.evaluation?.historical_replay?.includes('tests/brain-original-email-atomic-send-and-outcome-20261115.test.mjs'),true);
});

test('original source, composer and sender preserve constraints while agents learn',()=>{
 assert.match(research,/SOURCE_HTML_TRUNCATED_UNVERIFIED/);
 assert.match(research,/public_email_next_attempt_at/);
 assert.match(composer,/sourceVerifiedComposerHandoff\(action,research,news,now\)/);
 assert.match(composer,/pageSize=50,maxPages=4/);
 assert.match(sender,/delivery_state:'PROVIDER_OUTCOME_UNKNOWN'/);
 assert.match(sender,/GMAIL_PINNED_ACCOUNT_NOT_ACTIVE/);
 assert.match(sender,/RECIPIENT_CONTACT_PRESSURE_14D/);
 assert.match(sender,/ORIGINAL_PROVIDER_OUTCOME_READBACK_CONFLICT/);
 assert.match(sender,/ignoreDuplicates:true/);
 assert.match(sender,/prior_readbacks_settled:priorReadbacksSettled/);
 assert.equal(providerUncertaintyNoResend({autonomous_outbound:{needs_readback:true,republish_forbidden:true}}),true);
});
