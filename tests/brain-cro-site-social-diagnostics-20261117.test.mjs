import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const sql=readFileSync('supabase/migrations/20261117162500_powerhouse_cro_site_social_diagnostics_v1.sql','utf8');
test('diagnostics use existing evidence and no competing collector',()=>{
 for(const x of ['bg_interacties','growth_events','social_metric_snapshots','social_posts'])assert.ok(sql.includes(x));
 assert.doesNotMatch(sql,/\bCREATE TABLE\b|\bCREATE TRIGGER\b|cron\.schedule/i);
});
test('source-level privacy: invoker and service-only roles',()=>{
 assert.equal((sql.match(/security_invoker=true/g)||[]).length,2);
 assert.equal((sql.match(/REVOKE ALL ON/g)||[]).length,2);
 assert.equal((sql.match(/TO service_role/g)||[]).length,2);
});
test('measurement gaps, provider scope and no false GREEN/revenue',()=>{
 for(const token of ['LOW_CONSENTED_SAMPLE','CTA_MAPPING_GAP_REQUIRES_VERIFICATION',
 'PARTIAL_SCOPE_NO_COMPARABLE_IMPRESSIONS','OBSERVATIONAL_ONLY_NO_CAUSAL_CLAIM',
 'nullif(p.external_post_id'])assert.ok(sql.includes(token),token);
 assert.doesNotMatch(sql,/GREEN_VERIFIED|PAID_ORDER_VERIFIED/);
});