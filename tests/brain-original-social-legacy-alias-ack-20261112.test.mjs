import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const sql=fs.readFileSync(new URL('../supabase/migrations/20261112144500_original_social_legacy_alias_acks_v1.sql',import.meta.url),'utf8');
test('original #171 has a bounded exact source-bound legacy alias ACK, not a parallel worker',()=>{
 for(const x of [
   'powerhouse_content_handoff_receipts_v1','original-content-handoff-no-aging-gap-v2',
   'ORIGINAL_SOCIAL_WINDOW_EVIDENCE_ACK_V1','ORIGINAL_SOCIAL_WINDOW_LEGACY_ALIAS_ACK_V1',
   "'POST_MEASUREMENT'","'post_dispatch_readback'",
   "'linkedin-personal-identity-hard-gate-v3'",
   "'linkedin-content-ready-dispatch-watchdog-v1'",
   's.source_event_id=v.payload#>>','e.evaluation_id=v.payload#>>',
   "jsonb_typeof(s.metrics->'impressions')='number'",
   "s.observed_at BETWEEN p.published_at+interval '18 hours'",
   "AND p.published_at+interval '30 hours'",
   "AND b.state='OPEN'","ORDER BY o.due_at,o.tenant_id,o.obligation_id LIMIT 24",
   'no_new_measurement','no_new_provider_write',
   'measurement_only', 'no_causal_effect_or_revenue_inferred',
   "RETURNING b.id","legacy_source_acks","legacy_brain_consumer_acks"
 ]) assert.ok(sql.includes(x),'missing exact guard '+x);
 assert.match(sql,/REVOKE ALL ON FUNCTION public\.powerhouse_content_handoff_receipts_v1/);
 assert.match(sql,/TO service_role/);
 assert.doesNotMatch(sql,/CREATE TABLE|CREATE TRIGGER|cron\.schedule|net\.http_post/i);
});
test('pre-existing original complete window & newer incomplete windows remain distinct',()=>{
 assert.match(sql,/v\.window_hours=24 AND v\.status='MEASUREMENT_VERIFIED'/);
 assert.match(sql,/e\.window_hours=24/);
 assert.match(sql,/o\.window_hours=24/);
 assert.match(sql,/b\.state='OPEN'/);
 assert.match(sql,/o\.status='OPEN'/);
 assert.match(sql,/status='MEASUREMENT_VERIFIED'/);
 assert.match(sql,/v_learning_overdue/);
 assert.match(sql,/social_learning_obligations/);
});
