import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';

const file=new URL('../supabase/migrations/20261113190000_original_seo_heartbeat_cro_consumer_receipt_v1.sql',import.meta.url);
const sql=readFileSync(file,'utf8');
const exact='ORIGINAL_SEO_TO_HEARTBEAT_CRO_RECEIPT_V1';

test('same original #140 Heartbeat receives already verified exact SEO source->site, never new scheduler',()=>{
  assert.equal(existsSync(file),true);
  assert.match(sql,/CREATE OR REPLACE FUNCTION public\.powerhouse_commercial_intelligence_heartbeat_v1\(p_run_date date/);
  assert.match(sql,/security definer/i);
  assert.match(sql,/v_source_ack_at IS NOT NULL/);
  assert.match(sql,/v_current_source_count>=8/);
  assert.match(sql,/JOIN public\.brain_obligations b/);
  assert.match(sql,/b\.business_period=r\.run_date::text/);
  assert.match(sql,/b\.evidence->>'source_revision'=v_current_table_revision/);
  assert.match(sql,/b\.evidence#>>'\{consumer_ack,consumed_revision\}'=v_current_table_revision/);
  assert.match(sql,/b\.evidence#>>'\{consumer_ack,consumer\}'='original powerhouse-content-orchestrator-140'/);
  assert.match(sql,/b\.state='OPEN'/);
  assert.match(sql,/r\.status='done'/);
  assert.match(sql,/r\.evidence#>>'\{original_delivery_crosslink,original_obligation_id\}'=b\.id::text/);
  assert.match(sql,/r\.evidence#>>'\{original_delivery_crosslink,source_revision\}'=v_current_table_revision/);
  assert.match(sql,/r\.evidence#>>'\{original_delivery_crosslink,original_ack_revision\}'=v_current_table_revision/);
});

test('consumer verifies independent public provider site SHA and route, not recommendation status alone',()=>{
  assert.match(sql,/jsonb_array_elements\(COALESCE\(b\.evidence->'source_manifest','\[\]'::jsonb\)\)/);
  assert.match(sql,/manifest\.source_row->>'quality'='VERIFIED_PRODUCTION_RELEASE'/);
  assert.match(sql,/manifest\.source_row#>>'\{metrics,published_commit_ref\}'=r\.evidence->>'owner_change_merge_sha'/);
  assert.match(sql,/manifest\.source_row#>'\{metrics,routes\}' \? \(r\.evidence->>'canonical_owner'\)/);
  assert.match(sql,/r\.evidence->>'public_canonical_readback'=r\.evidence->>'canonical_owner'/);
  assert.match(sql,/r\.evidence->>'public_frisse_blik_cta_readback'='true'/);
  assert.match(sql,/r\.evidence#>>'\{original_delivery_crosslink,independent_page_provider_request_id\}'=r\.evidence->>'public_provider_request_id'/);
  assert.match(sql,/r\.evidence->>'netlify_deploy_state'='READY'/);
});

test('only site receipt is ACKed; original CRO experiment, orders and learning remain pending',()=>{
  assert.match(sql,new RegExp(exact));
  assert.match(sql,/'original_site_to_cro_handoff',jsonb_build_object\(/);
  assert.match(sql,/'original_owner','original-commercial-intelligence-heartbeat-140'/);
  assert.match(sql,/'site_receipt_count',v_site_receipt_count/);
  assert.match(sql,/'verified_site_receipts',v_site_receipts/);
  assert.match(sql,/'next_stage',CASE WHEN v_site_receipt_count>0/);
  for(const guard of ["cro_treatment_executed","controlled_outcome_proven","paid_order_proven","next_run_learning_proven"]){
    assert.match(sql,new RegExp("'"+guard+"',false"));
  }
  assert.match(sql,/'no_new_scheduler_or_queue',true/);
  assert.doesNotMatch(sql,/\bcron\.schedule\b|\bnet\.http_post\b|\bINSERT INTO public\.brain_obligations\b/i);
});

test('service role only and one canonical heartbeat event is updated idempotently',()=>{
  assert.match(sql,/REVOKE ALL ON FUNCTION public\.powerhouse_commercial_intelligence_heartbeat_v1\(date\) FROM PUBLIC, anon, authenticated;/);
  assert.match(sql,/GRANT EXECUTE ON FUNCTION public\.powerhouse_commercial_intelligence_heartbeat_v1\(date\) TO service_role;/);
  assert.match(sql,/'commercial-intelligence-heartbeat:'\|\|p_run_date/);
  assert.match(sql,/on conflict\(dedupe_key\) do update set/i);
  const creates=(sql.match(/CREATE OR REPLACE FUNCTION/g)||[]).length;
  assert.equal(creates,1);
  assert.equal((sql.match(/insert into public\.powerhouse_runtime_events/gi)||[]).length,1);
});
