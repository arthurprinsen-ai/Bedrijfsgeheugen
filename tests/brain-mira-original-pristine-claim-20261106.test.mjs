import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const sql=readFileSync(new URL('../supabase/migrations/20261106160000_mira_original_pristine_waiting_asset_claim_v1.sql',import.meta.url),'utf8');

test('preserves original exclusive atomic claim RPC, current-day scope and privileged owner',()=>{
 for(const anchor of [
  'powerhouse_claim_instagram_media_job_v1(text,timestamp with time zone)',
  "status in ('QUEUED','RETRY')",
  "status='WAITING_ASSET'",
  "and coalesce(attempts,0)=0",
  'for update skip locked',
  'and republish_forbidden=false',
  'MIRA_ORIGINAL_CLAIM_SOURCE_DRIFT',
  'MIRA_ORIGINAL_CLAIM_POSTWRITE_SECURITY_DRIFT',
  "has_function_privilege('service_role'",
  "NOT has_function_privilege('anon'",
  "NOT has_function_privilege('authenticated'"
 ]) assert.ok(sql.includes(anchor),anchor);
});
test('rejects nonvirgin, vetoed, mismatched winner, existing provider effects',()=>{
 for(const anchor of [
 "and last_error is null",
 "and selected_provider='openart'",
 "and required_provider='openart'",
 "and o.last_error='MEDIA_ASSET_REQUIRED'",
 "and o.status='BLOCKED'",
 "and o.external_id is null",
 "and o.live_proven_at is null",
 "nullif(asset_manifest->>'asset_url','') is null",
 "nullif(asset_manifest->>'openart_history_id','') is null",
 "nullif(asset_manifest->>'openart_resource_id','') is null",
 "coalesce(proof_manifest,'{}'::jsonb)='{}'::jsonb",
 "w.recommendation_id::text",
 "o.evidence->>'daily_winner_recommendation_id'",
 "coalesce(o.evidence #>> '{veto,active}','false')<>'true'"
 ]) assert.ok(sql.includes(anchor),anchor);
});
test('no second publisher, cron, secret or direct status promotion',()=>{
 assert.ok(!sql.includes('cron.schedule('));
 assert.ok(!sql.includes('cron.unschedule('));
 assert.ok(!sql.includes('OPENART_API_KEY'));
 assert.ok(!sql.includes('META_ACCESS_TOKEN'));
 assert.ok(!sql.includes('SERVICE_ROLE_KEY'));
 assert.ok(!sql.includes("set status='LIVE_PROVEN'"));
});
