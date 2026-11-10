import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const sql=readFileSync(new URL('../supabase/migrations/20261110073500_original_content_handoff_receipts_v1.sql',import.meta.url),'utf8');

test('one original loop assurance owner, no new scheduler or social/email sender',()=>{
 assert.match(sql,/CREATE OR REPLACE FUNCTION public\.powerhouse_content_handoff_receipts_v1/);
 assert.match(sql,/CREATE OR REPLACE FUNCTION public\.powerhouse_refresh_loop_assurance_v1/);
 assert.match(sql,/perform public\.powerhouse_sync_loop_assurance_receipts_v1\(p_now\);/);
 assert.match(sql,/perform public\.powerhouse_content_handoff_receipts_v1\(p_now\);/);
 assert.doesNotMatch(sql,/cron\.schedule|net\.http_post|create table|delete from supabase_migrations/i);
 assert.match(sql,/REVOKE ALL ON FUNCTION public\.powerhouse_content_handoff_receipts_v1\(timestamptz\)/);
 assert.match(sql,/FROM PUBLIC,anon,authenticated/);
 assert.match(sql,/TO service_role/);
});

test('each canonical date/channel handoff is its own durable receiver obligation',()=>{
 assert.match(sql,/FOR r IN[\s\S]*?content_publication_obligations[\s\S]*?channel IN \('blog','instagram','linkedin_company','linkedin_personal'\)/);
 assert.match(sql,/INSERT INTO public\.brain_obligations/);
 assert.match(sql,/'CONTENT_HANDOFF','content:'\|\|r\.channel/);
 assert.match(sql,/r\.publication_date::text,'Europe\/Amsterdam'/);
 assert.match(sql,/ON CONFLICT\(obligation_type,capability_id,business_entity,business_period,business_timezone\)/);
 assert.match(sql,/WHERE public\.brain_obligations\.owner IS DISTINCT FROM excluded\.owner/);
 assert.match(sql,/CASE WHEN v_reuse THEN 'FULFILLED' ELSE 'OPEN' END/);
 assert.match(sql,/r\.publication_date BETWEEN v_day-8 AND v_day/);
});

test('no one cron success, generic state or fake metrics can mark a downstream recipient accepted',()=>{
 for(const gate of [
 "r.live_proven_at IS NOT NULL","nullif(r.external_id,'') IS NOT NULL",
 "r.evidence->>'provider_truth_verified'='true'",
 "r.evidence->>'public_http_status'='200'",
 "r.evidence->>'netlify_deploy_id'",
 "s.data_quality='PROVIDER_OBSERVED_LINKED'",
 "s.metrics->>'provider_post_urn'=r.external_id",
 "s.metrics->>'provider_organization_urn'='urn:li:organization:18234216'",
 "s.metrics->>'independent_proof'='EXACT_CANONICAL_LIVE_PROVEN_AUTHOR_AND_PROVIDER_ACCOUNT'",
 "e.evidence->>'source_event_id'=v_event",
 "e.evidence->>'application_id'=a.application_id",
 "r.learned_at IS NOT NULL",
 "r.evidence->>'learning_applied_verified'='true'",
 "n.live_proven_at>r.live_proven_at",
 ])assert.ok(sql.includes(gate),'missing receiver gate '+gate);
 assert.match(sql,/v_pub:=coalesce\(/);
 assert.match(sql,/v_metric:=coalesce\(/);
 assert.match(sql,/v_stage:='WAIT_NEXT_PROVIDER_PROVEN_EXPERIMENT'/);
 assert.match(sql,/v_stage:='PROVEN_NEXT_EXPERIMENT_HANDOFF'/);
 assert.doesNotMatch(sql,/v_metric:=true|v_analysis:=true|v_reuse:=true/);
});

test('missing stage is assigned one original owner and is never silently fulfilled',()=>{
 for(const x of [
  'OVERDUE_PUBLICATION','OVERDUE_MEASUREMENT','OVERDUE_ANALYSIS',
  'powerhouse-blog-queue / original protected blog writer',
  'powerhouse-mira-problem-radar / original media router',
  'bg-social-metrics-sync / original channel metric owner',
  'powerhouse-runtime-scheduler-mux-v1 / original BRAIN learning owner',
  'powerhouse-content-orchestrator / original CRO experiment owner'
 ])assert.ok(sql.includes(x),x);
 assert.match(sql,/WHEN p_now>v_pub_due/);
 assert.match(sql,/WHEN p_now>v_metric_due/);
 assert.match(sql,/WHEN p_now>v_metric_due\+interval '48 hours'/);
});

test('email approval and historical backlog never count as fake publication or learning',()=>{
 assert.match(sql,/channel='email' AND status='prepared' AND due_at<=p_now/);
 assert.match(sql,/'WAIT_AUTHORIZED_EMAIL_SENDER'/);
 assert.match(sql,/'send_proven',false/);
 assert.match(sql,/'no_sending_without_optin',true/);
 assert.match(sql,/FROM public\.social_learning_obligations WHERE status='OPEN' AND due_at<p_now/);
 assert.match(sql,/'no_mass_closure_without_source_proof',true/);
 assert.match(sql,/'social-learning-backlog'/);
 assert.match(sql,/'no_fake_close',true/);
});
