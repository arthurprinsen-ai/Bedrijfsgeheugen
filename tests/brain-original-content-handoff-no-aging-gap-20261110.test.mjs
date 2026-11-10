import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const sql=readFileSync(new URL('../supabase/migrations/20261110084500_original_content_handoff_no_aging_gap_v2.sql',import.meta.url),'utf8');

test('original one-owner PR contains NO new cron, publisher, Gmail sender or unrelated table',()=>{
 assert.match(sql,/CREATE OR REPLACE FUNCTION public\.powerhouse_content_handoff_receipts_v1/);
 assert.match(sql,/CREATE OR REPLACE FUNCTION public\.powerhouse_refresh_loop_assurance_v1/);
 assert.match(sql,/v_handoff:=public\.powerhouse_content_handoff_receipts_v1\(p_now\)/);
 assert.doesNotMatch(sql,/cron\.schedule|net\.http_post|drop table|delete from supabase_migrations|create table/i);
 assert.match(sql,/REVOKE ALL ON FUNCTION public\.powerhouse_content_handoff_receipts_v1\(timestamptz\)/);
 assert.match(sql,/TO service_role/);
});

test('historical publications cannot age out of original 8-day receiver window',()=>{
 assert.match(sql,/WITH recent AS/);
 assert.match(sql,/publication_date BETWEEN v_day-8 AND v_day/);
 assert.match(sql,/historic AS/);
 assert.match(sql,/c\.publication_date<v_day-8/);
 assert.match(sql,/coalesce\(b\.state,'OPEN'\)<>'FULFILLED'/);
 assert.match(sql,/coalesce\(b\.updated_at,'epoch'::timestamptz\)/);
 assert.match(sql,/LIMIT 48/);
 assert.match(sql,/SELECT \* FROM recent[\s\S]*?UNION ALL[\s\S]*?SELECT \* FROM historic/);
 assert.match(sql,/v_unregistered_old/);
 assert.match(sql,/'historical_unregistered_publications',v_unregistered_old/);
});

test('each original historical publication keeps the exact stable date and channel and owner',()=>{
 for(const key of [
  "'CONTENT_HANDOFF','content:'||r.channel",
  "r.publication_date::text,'Europe/Amsterdam'",
  "WHEN 'instagram' THEN 'powerhouse-mira-problem-radar / original media router'",
  "WHEN 'blog' THEN 'powerhouse-blog-queue / original protected blog writer'",
  "r.channel='linkedin_company'",
  "r.evidence->>'provider_truth_verified'='true'",
  "s.source='windsor-linkedin-company'",
  "e.evidence->>'source_event_id'=v_event",
  "a2.learning_id=v_learning_id",
  "a2.applied_at>v_eval_at",
  "n.evidence->>'learning_source_evaluation_id'=v_eval",
 ])assert.ok(sql.includes(key),'missing '+key);
 assert.match(sql,/WHERE public\.brain_obligations\.owner IS DISTINCT FROM excluded\.owner/);
 assert.match(sql,/public\.brain_obligations\.updated_at < p_now-interval '6 hours'/);
 assert.match(sql,/CASE WHEN v_reuse THEN 'FULFILLED' ELSE 'OPEN' END/);
});

test('one original social obligation has durable distinct owner and bounded replay',()=>{
 for(const key of [
  'FOR slo IN',
  'FROM public.social_learning_obligations x',
  "WHERE x.status='OPEN'",
  "'social-learning:'||substr(md5(slo.tenant_id||':'||slo.obligation_id),1,32)",
  "'original_obligation_id',slo.obligation_id",
  "'original_post_id',slo.post_id",
  "'original_source_status',slo.status",
  "'next_owner',coalesce(nullif(slo.owner,''),'POWERHOUSE_SOCIAL_LEARNING')",
  "'no_synthetic_experiment_winner',true",
  "'no_claimed_provider_approval',true",
  "'learning_detail_reinspected',v_learning_scanned"
 ])assert.ok(sql.includes(key),'missing '+key);
 assert.match(sql,/ORDER BY coalesce\(b\.updated_at,'epoch'::timestamptz\),[\s\S]*?x\.due_at,x\.tenant_id,x\.obligation_id\s+LIMIT 48/);
 assert.match(sql,/IS DISTINCT FROM \(excluded\.evidence-'recheck_requested_at'\)/);
 assert.match(sql,/public\.brain_obligations\.updated_at<p_now-interval '6 hours'/);
});

test('no source ACK alone promotes received content, Gmail delivery, or causal growth',()=>{
 assert.match(sql,/'OVERDUE_INDEPENDENT_LEARNING_EVIDENCE'/);
 assert.match(sql,/'OVERDUE_AUTHORIZED_EMAIL_SEND'/);
 assert.match(sql,/'no_sending_without_optin',true/);
 assert.match(sql,/'content_handoff',case when r\.loop_key='content-closed-loop' then v_handoff else null end/);
 assert.match(sql,/v_status:='RED'; v_reason:='independent source-to-consumer handoff overdue'/);
 assert.match(sql,/r\.evidence->>'learning_applied_verified'='true'/);
 assert.match(sql,/'no_mass_closure_without_source_proof',true/);
});
