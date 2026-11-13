import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const prior=readFileSync(new URL('../supabase/migrations/20261112131500_original_no_publish_provider_side_effect_fence_v1.sql',import.meta.url),'utf8');
const current=readFileSync(new URL('../supabase/migrations/20261113140500_original_no_publish_immutable_provider_receipt_v1.sql',import.meta.url),'utf8');
const fn=sql=>sql.slice(sql.indexOf('CREATE OR REPLACE FUNCTION public.record_content_publication_skip('));

test('original provider skip owner retained; old JSON overlay vulnerability distinguished from immutable predicate',()=>{
 assert.match(prior,/powerhouse_jsonb_true\(coalesce\(v_row\.evidence,'\{\}'::jsonb\) \|\| coalesce\(p_evidence,'\{\}'::jsonb\),'provider_create_success'\)/);
 assert.doesNotMatch(current,/powerhouse_jsonb_true\(coalesce\(v_row\.evidence,'\{\}'::jsonb\) \|\| coalesce\(p_evidence,'\{\}'::jsonb\)/);
 assert.match(current,/v_original_evidence := coalesce\(v_row\.evidence,'\{\}'::jsonb\);/);
 assert.match(current,/v_incoming_evidence jsonb := coalesce\(p_evidence,'\{\}'::jsonb\);/);
 assert.match(current,/public\.powerhouse_jsonb_true\(v_original_evidence,k\)\s+or public\.powerhouse_jsonb_true\(v_incoming_evidence,k\)/);
 assert.match(current,/if nullif\(btrim\(coalesce\(v_row\.external_id,''\)\),''\) is not null\s+or v_row\.published_at is not null\s+or v_row\.live_proven_at is not null\s+or v_provider_side_effect/);
});

test('all six independent original provider/conflict indicators veto regardless of untrusted incoming false values',()=>{
 const source=fn(current);
 for(const field of [
  'provider_create_success','provider_publication_ack_verified','provider_truth_verified',
  'terminal_provider_side_effect','possible_provider_side_effect','reconciliation_required'
 ])assert.ok(source.includes("'"+field+"'"),'provider side effect can no longer be masked: '+field);
 assert.match(source,/v_original_evidence->>'source_state_conflict'/);
 assert.match(source,/v_incoming_evidence->>'source_state_conflict'/);
 assert.match(source,/raise exception 'NO_PUBLISH_PROVIDER_REFERENCE_MUST_RECONCILE'/);
 assert.match(source,/using errcode='23514'/);
});

test('an existing true veto cannot be downgraded by false, null, or nested nonobject payload',()=>{
 assert.match(current,/v_original_evidence#>>'\{veto,active\}'='true'/);
 assert.match(current,/v_incoming_evidence \? 'veto'/);
 assert.match(current,/jsonb_typeof\(v_incoming_evidence->'veto'\) <> 'object'/);
 assert.match(current,/v_incoming_evidence#>>'\{veto,active\}' is distinct from 'true'/);
 assert.match(current,/NO_PUBLISH_EXISTING_VETO_CANNOT_BE_DOWNGRADED/);
 assert.match(current,/\(v_original_evidence->'veto'\) \|\| \(v_incoming_evidence->'veto'\)/);
 assert.match(current,/NO_PUBLISH_EVIDENCE_OBJECT_REQUIRED/);
});

test('missing original decision code or active veto remains SKIPPED without fake terminal proof or resend',()=>{
 assert.match(current,/v_combined_evidence#>>'\{veto,active\}'='true'/);
 assert.match(current,/v_combined_evidence->>'decision_code'/);
 assert.match(current,/v_source_decision_complete :=/);
 assert.match(current,/set status = 'SKIPPED'/);
 assert.match(current,/ORIGINAL_NO_PUBLISH_DECISION_CODE_VETO_DATE_REASON_REQUIRED_NO_RESEND/);
 assert.match(current,/NO_PUBLISH_SOURCE_DECISION_PROOF_INCOMPLETE/);
 assert.match(current,/case when v_source_decision_complete then null/);
 assert.doesNotMatch(current,/LINKEDIN_CREATE_LINKED_IN_POST|INSTAGRAM_CREATE_MEDIA|net\.http_post|cron\.schedule/i);
 assert.doesNotMatch(current,/write_off.*->>.*reason.*decision_code/i);
});

test('exact same original RPC, RLS grants, fixed search path and one original status writer',()=>{
 for(const clause of [
  'CREATE OR REPLACE FUNCTION public.record_content_publication_skip(p_tenant_id text, p_publication_date date, p_channel text, p_reason text, p_evidence jsonb',
  'SECURITY DEFINER',
  "SET search_path TO 'public'",
  'REVOKE ALL ON FUNCTION public.record_content_publication_skip(text,date,text,text,jsonb)',
  'FROM PUBLIC,anon,authenticated;',
  'GRANT EXECUTE ON FUNCTION public.record_content_publication_skip(text,date,text,text,jsonb)',
  'TO service_role;',
  'for update;',
  'PUBLICATION_OBLIGATION_NOT_FOUND',
  'NO_PUBLISH_DECISION_TOO_LATE'
 ]) assert.ok(current.includes(clause),'original scope changed unexpectedly: '+clause);
 assert.equal(fn(current).split('update public.content_publication_obligations').length-1,1);
 const guard=readFileSync(new URL('../supabase/migrations/20261113083000_original_one_chain_content_terminal_proof_guard_v1.sql',import.meta.url),'utf8');
 for(const p of ['CONTENT_HANDOFF_TERMINAL_EXACT_ACK_REQUIRED','CONTENT_HANDOFF_TERMINAL_VETO_PROOF_REQUIRED','CONTENT_HANDOFF_TERMINAL_OUTCOME_PROOF_REQUIRED'])assert.ok(guard.includes(p));
 assert.doesNotMatch(current,/drop trigger|disable trigger|grant execute.*to authenticated|grant execute.*to anon/i);
});

test('nonmasquable provider evidence is checked before source JSON is merged/persisted',()=>{
 const x=fn(current);
 const protectedPredicate=x.indexOf('v_provider_side_effect boolean := false');
 const actualCheck=x.indexOf('if nullif(btrim(coalesce(v_row.external_id');
 const merge=x.indexOf('v_combined_evidence := v_original_evidence || v_incoming_evidence');
 const update=x.indexOf('update public.content_publication_obligations');
 assert.ok(protectedPredicate>=0&&actualCheck>protectedPredicate&&merge>actualCheck&&update>merge);
});
