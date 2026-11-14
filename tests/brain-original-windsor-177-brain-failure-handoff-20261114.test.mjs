import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {
 originalProviderPollReceiptIdentity,
 originalProviderPollAuditEvent,
 originalCompanySourceBrainFailureInput
} from '../supabase/functions/_shared/original-provider-poll-receipt.mjs';
const id=originalProviderPollReceiptIdentity({
 startedAt:'2026-11-14T20:53:11Z',
 runId:'133e1618-b80c-42dd-8f9d-b0b845f2c913'
});
const failed={state:'ORIGINAL_COMPANY_SOURCE_REFRESH_UNAVAILABLE',
 failure_class:'WINDSOR_PROVIDER_HTTP_403',
 recovery_owner:'existing bg-social-metrics-source-6h-v1/#177'};
test('one ORIGINAL #177 source poll produces exactly one stable ONE BRAIN failed-provider receipt',()=>{
 const x=originalCompanySourceBrainFailureInput({identity:id,sourceRefresh:failed});
 assert.equal(x.p_occurrence_id,'provider-social-metrics:original-177:run:'+id.runId);
 assert.equal(x.p_fingerprint,
  'powerhouse|original-177-windsor-company-provider-source-not-consumed|20261114-v1');
 assert.equal(x.p_evidence.source_poll_receipt_key,id.dedupeKey);
 assert.equal(x.p_evidence.original_cron_id,177);
 assert.equal(x.p_evidence.original_consumer_cron_id,171);
 assert.equal(x.p_evidence.failure_class,'WINDSOR_PROVIDER_HTTP_403');
 assert.equal(x.p_evidence.provider_authorization_verified,false);
 assert.equal(x.p_evidence.no_new_scheduler,true);
 assert.deepEqual(originalCompanySourceBrainFailureInput({identity:id,sourceRefresh:failed}),x);
 assert.doesNotMatch(JSON.stringify(x),/api_key=|WINDSOR_API_KEY|decrypted_secret|Bearer |https:\/\/connectors.windsor.ai/);
});
test('a successful original provider fetch must not create failure evidence',()=>{
 assert.equal(originalCompanySourceBrainFailureInput({
   identity:id,sourceRefresh:{state:'PROVIDER_ACCOUNT_SOURCE_REFRESHED_AND_STAGED',
   original_cron:177,provider:'windsor.ai',authorized_account:'18234216'}
 }),null);
});
test('wrong owner, malformed run and untrusted error content fail closed',()=>{
 assert.throws(()=>originalCompanySourceBrainFailureInput({
   identity:{...id,sourceJobId:900},sourceRefresh:failed
 }),/ORIGINAL_177_BRAIN_OBSERVER_IDENTITY_UNVERIFIED/);
 assert.throws(()=>originalCompanySourceBrainFailureInput({
   identity:{...id,dedupeKey:'not-an-original-run'},sourceRefresh:failed
 }),/ORIGINAL_177_BRAIN_OBSERVER_IDENTITY_UNVERIFIED/);
 assert.throws(()=>originalCompanySourceBrainFailureInput({
   identity:id,sourceRefresh:{...failed,failure_class:'WINDSOR_HTTP_403?api_key=SECRET'}
 }),/ORIGINAL_177_BRAIN_OBSERVER_FAILURE_CLASS_UNSAFE/);
});
test('real ORIGINAL Edge must write, independently read and publish the same source-bound ONE BRAIN ACK',async()=>{
 const source=await readFile('supabase/functions/bg-social-metrics-sync/index.ts','utf8');
 const audit=source.indexOf('assertOriginalProviderPollReceipt(independentReceipt,audit);');
 const proof=source.indexOf('originalCompanySourceBrainFailureInput({');
 const observe=source.indexOf("db.rpc('brain_observe_failure'");
 const reread=source.indexOf(".from('brain_failure_occurrences')");
 const summary=source.indexOf("dedupe_key:'provider-social-metrics:'+day");
 assert.ok(audit>=0&&proof>audit&&observe>proof&&reread>observe&&summary>reread);
 assert.match(source,/original_company_source_brain_failure_ack:originalBrainFailureAck/);
 assert.match(source,/p_payload_sha256:payloadSha256/);
 assert.match(source,/ONE_BRAIN_ORIGINAL_FAILURE_OCCURRENCE_READBACK_VERIFIED/);
 assert.match(source,/ORIGINAL_BRAIN_FAILURE_WRITE_NOT_ACKED/);
 assert.match(source,/ORIGINAL_BRAIN_FAILURE_READBACK_NOT_PROVEN/);
 assert.doesNotMatch(source,/supabase\.cron\.schedule|cron\.schedule\(/);
});
test('same existing original immutable poll event remains source-only not a provider delivery nor learning ACK',()=>{
 const e=originalProviderPollAuditEvent({identity:id,outcome:{
   healthy:false,company_source_refresh:failed}});
 assert.equal(e.context.original_source_job_id,177);
 assert.equal(e.evidence.original_source_only_not_learning_ack,true);
 assert.equal(e.evidence.original_causal_learning_proven,false);
 assert.equal(e.state,'error');
});
