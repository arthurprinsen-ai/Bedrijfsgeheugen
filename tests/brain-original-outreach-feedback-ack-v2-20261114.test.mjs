import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {researchNoSourceFeedback} from '../supabase/functions/_shared/relationship-research-feedback.mjs';

const sql=readFileSync(new URL('../supabase/migrations/20261114142500_original_outreach_feedback_consumer_ack_v2.sql',import.meta.url),'utf8');
const worker=readFileSync(new URL('../supabase/functions/powerhouse-relationship-public-research/index.ts',import.meta.url),'utf8');
const owner='27572918-c809-44c1-8f23-88b8cd24990c';
const researchId='e479eb50-4de9-432c-94ca-f6a514ecd5f3';
const at='2026-11-14T13:20:00.000Z';
const retry='2026-11-15T13:20:00.000Z';
const research={action_id:researchId,person_key:'person-A',company_key:'example ltd',
  evidence:{original_outreach_action_id:owner}};
const origin={action_id:owner,person_key:'person-A',company_key:'example ltd',
  status:'waiting',evidence:{execution_gate:{reason:'SOURCE_SPECIFIC_EVIDENCE_REQUIRED'}}};

test('existing waiting email accepts exact provider NO_SOURCE disposition with retry, never send authority',()=>{
 const x=researchNoSourceFeedback(research,origin,at,retry);
 assert.equal(x?.contract,'ORIGINAL_RELATIONSHIP_RESEARCH_RESULT_ACK_V2');
 assert.equal(x?.research_action_id,researchId);
 assert.equal(x?.original_outreach_action_id,owner);
 assert.equal(x?.source_status,'NO_VERIFIED_SOURCE_RETRY');
 assert.equal(x?.provider_researched_at,at);
 assert.equal(x?.next_research_at,retry);
 assert.equal(x?.recipient_send_authority_inferred,false);
 assert.equal(x?.external_send_executed,false);
});
test('prepared and waiting are valid receivers; terminal or mismatched owner cannot accept',()=>{
 assert.ok(researchNoSourceFeedback(research,{...origin,status:'prepared'},at,retry));
 assert.equal(researchNoSourceFeedback(research,{...origin,status:'done'},at,retry),null);
 assert.equal(researchNoSourceFeedback(research,{...origin,status:'expired'},at,retry),null);
 assert.equal(researchNoSourceFeedback(research,{...origin,company_key:'someone else'},at,retry),null);
 assert.equal(researchNoSourceFeedback({...research,evidence:{original_outreach_action_id:'00000000-0000-0000-0000-000000000000'}},origin,at,retry),null);
});
test('never annotate a possibly sent or ambiguous Gmail action',()=>{
 for(const extra of [
  {autonomous_outbound:{provider_message_id:'p1'}},
  {autonomous_outbound:{needs_readback:true}},
  {autonomous_outbound:{republish_forbidden:true}},
  {native_gmail_executor:{provider_message_id:'p1'}},
  {provider_ambiguity_quarantine:{external_resend_forbidden:true}}
 ]) assert.equal(researchNoSourceFeedback(research,{...origin,evidence:{...origin.evidence,...extra}},at,retry),null);
});
test('no fake provider result or unbounded retries',()=>{
 assert.equal(researchNoSourceFeedback(research,origin,'n/a',retry),null);
 assert.equal(researchNoSourceFeedback(research,origin,at,'2026-11-14T14:20:00Z'),null);
 assert.equal(researchNoSourceFeedback(research,origin,at,'2026-11-22T13:20:00Z'),null);
 assert.equal(researchNoSourceFeedback(research,{...origin,evidence:{}},at,retry),null);
});
test('same canonical worker uses conditional exact-owner CAS for waiting and prepared actions',()=>{
 assert.match(worker,/\.in\('status',\['prepared','waiting'\]\)/);
 assert.match(worker,/\.eq\('status',origin\.status\)/);
 assert.match(worker,/\.eq\('updated_at',origin\.updated_at\)/);
 assert.match(worker,/researchNoSourceFeedback\(action,origin,observedAt,nextResearchAt\)/);
 assert.match(worker,/deferredOwnerAcks\+\+/);
 assert.doesNotMatch(worker,/\.eq\('status','prepared'\)\.maybeSingle\(\)/);
});
test('original #116 reconciler performs source→same original email feedback on missed direct worker CAS',()=>{
 assert.match(sql,/create or replace function public\.powerhouse_reconcile_relationship_research_handoff_v1/);
 assert.match(sql,/a\.dedupe_key='relationship-research:outreach-source:'\|\|o\.action_id::text/);
 assert.match(sql,/a\.person_key=o\.person_key and a\.company_key=o\.company_key/);
 assert.match(sql,/o\.status in \('prepared','waiting'\)/);
 assert.match(sql,/relationship_research_feedback/);
 assert.match(sql,/ORIGINAL_RESEARCH_NO_SOURCE_RECEIVED_RETRY_QUEUED/);
 assert.match(sql,/ORIGINAL_CONSUMER_NO_SOURCE_ACK_MISSING/);
 assert.match(sql,/consumer_no_source_disposition_received/);
 assert.match(sql,/original_consumer_receipt',\(c\.candidate_received or c\.no_source_received\)/);
});
test('provider and recipient security gates fail closed with no extra sender',()=>{
 assert.match(sql,/o\.evidence#>>'\{execution_gate,reason\}'='SOURCE_SPECIFIC_EVIDENCE_REQUIRED'/);
 assert.match(sql,/provider_ambiguity_quarantine,external_resend_forbidden/);
 assert.match(sql,/autonomous_outbound,provider_message_id/);
 assert.match(sql,/UNVERIFIED_SOURCE_CANDIDATE/);
 assert.match(sql,/source_page_independently_read/);
 assert.match(sql,/'recipient_send_authority_inferred',false/);
 assert.match(sql,/'external_send_executed',false/);
 assert.match(sql,/from public,anon,authenticated/);
 assert.match(sql,/to service_role/);
 assert.doesNotMatch(sql,/cron\.schedule\s*\(|net\.http_post\s*\(|GMAIL_SEND_EMAIL|create\s+table\b/i);
});
