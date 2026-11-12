import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const source=fs.readFileSync(new URL('../supabase/migrations/20261112131500_original_no_publish_provider_side_effect_fence_v1.sql',import.meta.url),'utf8');

test('original no-publish state recorder cannot erase an actual provider side effect',()=>{
 assert.match(source,/CREATE OR REPLACE FUNCTION public\.record_content_publication_skip/i);
 assert.match(source,/NO_PUBLISH_PROVIDER_REFERENCE_MUST_RECONCILE/);
 const veto=source.indexOf('NO_PUBLISH_PROVIDER_REFERENCE_MUST_RECONCILE');
 const skip=source.indexOf("set status = 'SKIPPED'");
 assert.ok(veto>0&&skip>veto,'provider veto must execute before SKIPPED update');
 for(const exact of ["v_row.external_id","v_row.published_at","v_row.live_proven_at",
   "'provider_create_success'","'provider_publication_ack_verified'",
   "'provider_truth_verified'","'terminal_provider_side_effect'"]){
   assert.ok(source.includes(exact),'must test '+exact);
 }
 assert.match(source,/using errcode='23514'/i);
});

test('source still permits true no-publish decisions and keeps original service role protection',()=>{
 assert.match(source,/NO_PUBLISH_REASON_REQUIRED/);
 assert.match(source,/NO_PUBLISH_DECISION_TOO_LATE/);
 assert.match(source,/for update/i);
 assert.match(source,/v_row.status in \('DISPATCHED','PUBLISHED','LIVE_PROVEN','MEASURED','LEARNED'\)/);
 assert.match(source,/GRANT EXECUTE ON FUNCTION public\.record_content_publication_skip\(text,date,text,text,jsonb\)\s+TO service_role/i);
 assert.match(source,/REVOKE ALL ON FUNCTION public\.record_content_publication_skip\(text,date,text,text,jsonb\)\s+FROM PUBLIC,anon,authenticated/i);
 assert.doesNotMatch(source,/CREATE (EXTENSION|TRIGGER|TABLE)|cron\.schedule|net\.http_post/i);
});
