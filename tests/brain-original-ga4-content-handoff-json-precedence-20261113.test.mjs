import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const originalPath='../supabase/migrations/20261113082500_original_cancelled_social_learning_source_ack_v1.sql';
const fixedPath='../supabase/migrations/20261113121500_original_ga4_handoff_json_operator_precedence_v1.sql';
const original=readFileSync(new URL(originalPath,import.meta.url),'utf8');
const fixed=readFileSync(new URL(fixedPath,import.meta.url),'utf8');

const before="v_event:='ga4:'||r.metrics->>'window_start'||':'||r.metrics->>'window_end';";
const after="v_event:='ga4:'||(r.metrics->>'window_start')||':'||(r.metrics->>'window_end');";

const functionSql=x=>x.slice(x.indexOf('CREATE OR REPLACE FUNCTION public.powerhouse_content_handoff_receipts_v1('));

test('original P0 content receipt redefines exactly the previously deployed SQL function, with only GA4 JSON precedence changed',()=>{
 assert.equal(original.split(before).length-1,1,'one original broken GA4 expression');
 assert.equal(fixed.split(after).length-1,1,'one repaired GA4 expression');
 assert.doesNotMatch(fixed,/v_event:='ga4:'\|\|r\.metrics->>/);
 assert.equal(functionSql(fixed),functionSql(original).replace(before,after),
  'every other original obligation, source revision, provider proof, tenant scope and SQL grant must stay byte-identical');
});

test('GA4 source event requires both exact canonical window_start and window_end from JSON, never a JSON cast of literal ga4',()=>{
 assert.match(fixed,/v_event:='ga4:'\|\|\(r\.metrics->>'window_start'\)\|\|':'\|\|\(r\.metrics->>'window_end'\);/);
 assert.match(fixed,/v_metric:=coalesce\(r\.measured_at IS NOT NULL/);
 assert.match(fixed,/r\.metrics \? 'window_start' AND r\.metrics \? 'window_end'/);
 assert.match(fixed,/r\.metrics->>'data_quality' NOT IN\('UNVERIFIED','INSUFFICIENT_DATA'\)/);
 assert.match(fixed,/v_eval:=nullif\(r\.evidence->>'analysis_receipt_id',''\)/);
 // This is source/analysis evidence only; never close measurement or learning because text concatenation worked.
 assert.match(fixed,/'no_synthetic_experiment_winner',true/);
 assert.match(fixed,/'publication_side_effect_must_not_repeat',true/);
});

test('same single original owner and immutable terminal guard remain intact',()=>{
 assert.match(fixed,/CREATE OR REPLACE FUNCTION public\.powerhouse_content_handoff_receipts_v1\(p_now timestamp with time zone DEFAULT now\(\)\)/);
 assert.match(fixed,/SECURITY DEFINER/);
 assert.match(fixed,/SET search_path TO 'pg_catalog', 'public'/);
 assert.match(fixed,/REVOKE ALL ON FUNCTION public\.powerhouse_content_handoff_receipts_v1\(timestamptz\)\s+FROM PUBLIC,anon,authenticated;/);
 assert.match(fixed,/GRANT EXECUTE ON FUNCTION public\.powerhouse_content_handoff_receipts_v1\(timestamptz\)\s+TO service_role;/);
 assert.match(fixed,/'ORIGINAL_SOURCE_STATE_ONLY_NOT_PROVIDER_OUTCOME'/);
 assert.match(fixed,/INSERT INTO public\.brain_obligations/);
 assert.match(fixed,/FROM public\.social_learning_obligations/);
 assert.doesNotMatch(fixed,/\bcreate\s+(?:or\s+replace\s+)?(?:trigger|schedule|extension)\b|net\.http_post|LINKEDIN_CREATE_LINKED_IN_POST|INSTAGRAM_CREATE_MEDIA/i);
});

test('original terminal guard migration is preserved, not bypassed',()=>{
 const guard=readFileSync(new URL('../supabase/migrations/20261113083000_original_one_chain_content_terminal_proof_guard_v1.sql',import.meta.url),'utf8');
 assert.match(guard,/CONTENT_HANDOFF_TERMINAL_EXACT_ACK_REQUIRED/);
 assert.match(guard,/CONTENT_HANDOFF_TERMINAL_VETO_PROOF_REQUIRED/);
 assert.match(guard,/CONTENT_HANDOFF_TERMINAL_OUTCOME_PROOF_REQUIRED/);
 assert.doesNotMatch(fixed,/DROP TRIGGER|DISABLE TRIGGER|ALTER TABLE public\.brain_obligations/i);
});

test('source proof and consumer ACK remain distinct from GA4 string formatting',()=>{
 const sample={window_start:'2026-11-01',window_end:'2026-11-08'};
 const sourceEvent='ga4:'+sample.window_start+':'+sample.window_end;
 assert.equal(sourceEvent,'ga4:2026-11-01:2026-11-08');
 assert.equal(sourceEvent.split(':').length,3);
 assert.ok(!sourceEvent.includes('undefined'));
 assert.match(fixed,/'measurement_consumer',jsonb_build_object\('accepted',v_metric/);
 assert.match(fixed,/'experiment_consumer',jsonb_build_object\('accepted',v_reuse/);
});
