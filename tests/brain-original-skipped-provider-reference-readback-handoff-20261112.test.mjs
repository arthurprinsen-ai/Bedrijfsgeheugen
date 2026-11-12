import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const sql=readFileSync(new URL('../supabase/migrations/20261112211000_original_skipped_provider_reference_readback_handoff_v1.sql',import.meta.url),'utf8');

test('original handoff classifies historical conflicting provider IDs before missing-publication fallback',()=>{
 const guard=sql.indexOf("IF NOT v_pub\\n       AND r.status='SKIPPED'".replace('\\n','\n'));
 const fallback=sql.indexOf('ELSIF NOT v_pub THEN');
 assert.ok(guard>0&&fallback>guard,'conflict gate must precede publication recovery');
 for(const token of [
   "r.status='SKIPPED'",
   "r.evidence->>'source_state_conflict'='SKIPPED_WITH_ORIGINAL_PROVIDER_REFERENCE'",
   "r.evidence->>'reconciliation_required'='true'",
   "r.evidence->>'republish_forbidden'='true'",
   "r.published_at IS NOT NULL OR r.live_proven_at IS NOT NULL",
   "v_stage:='OVERDUE_PROVIDER_READBACK'",
   "v_owner:='powerhouse-social-publisher / original provider account'",
   "v_stage:=CASE WHEN p_now>v_pub_due THEN 'OVERDUE_PUBLICATION'"
 ]) assert.ok(sql.includes(token),token);
});
test('source remains honest and original per-tenant consumer ACK stays open',()=>{
 for(const gate of [
   "v_pub:=coalesce(r.live_proven_at IS NOT NULL",
   "r.status IN ('LIVE_PROVEN','MEASURED','LEARNED')",
   "r.evidence->>'provider_truth_verified'='true'",
   "s.data_quality='PROVIDER_OBSERVED_LINKED'",
   "CASE WHEN v_reuse THEN 'FULFILLED' ELSE 'OPEN' END",
   "'provider_readback_verified',false",
   "'producer',jsonb_build_object('verified',v_pub",
   "'provider_reference_reconciliation',jsonb_build_object(",
   "ORIGINAL_EXACT_PROVIDER_OWNER_AND_POST_READBACK_REQUIRED:",
   "'publication_side_effect_must_not_repeat',true"
 ]) assert.ok(sql.includes(gate),gate);
 assert.match(sql,/r\.channel IN \('instagram','linkedin_company','linkedin_personal'\)/);
 assert.match(sql,/INSERT INTO public\.brain_obligations/);
 assert.match(sql,/ON CONFLICT\(obligation_type,capability_id,business_entity,business_period,business_timezone\)/);
 assert.match(sql,/GRANT EXECUTE ON FUNCTION public\.powerhouse_content_handoff_receipts_v1\(timestamptz\)\s+TO service_role/);
 assert.doesNotMatch(sql,/cron\.schedule|net\.http_post|GMAIL_SEND_EMAIL|INSTAGRAM_PUBLISH|linkedin_create_post|DELETE FROM public\.content_publication_obligations/i);
});
