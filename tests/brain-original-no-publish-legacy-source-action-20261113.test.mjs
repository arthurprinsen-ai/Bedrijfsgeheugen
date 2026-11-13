import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const sql=readFileSync(new URL('../supabase/migrations/20261113153000_original_no_publish_legacy_source_action_reconcile_v1.sql',import.meta.url),'utf8');
const original=readFileSync(new URL('../supabase/migrations/20261113140500_original_no_publish_immutable_provider_receipt_v1.sql',import.meta.url),'utf8');
test('legacy no-publish source action backfill is bounded, idempotent and no-send',()=>{
 assert.match(sql,/v_count > 64/);
 assert.match(sql,/GET DIAGNOSTICS v_count = ROW_COUNT/);
 assert.match(sql,/p\.status = 'SKIPPED'/);
 assert.match(sql,/IS DISTINCT FROM 'ORIGINAL_NO_PUBLISH_DECISION_CODE_VETO_DATE_REASON_REQUIRED_NO_RESEND'/);
 assert.match(sql,/IS DISTINCT FROM 'NO_PUBLISH_SOURCE_DECISION_PROOF_INCOMPLETE'/);
 assert.match(sql,/jsonb_typeof\(p\.evidence\) = 'object'/);
 assert.match(sql,/p\.evidence#>>'\{veto,active\}' IS DISTINCT FROM 'true'/);
 assert.match(sql,/p\.evidence->>'decision_code'/);
 assert.match(sql,/p\.external_id IS NULL/);
 assert.match(sql,/p\.published_at IS NULL/);
 assert.match(sql,/p\.live_proven_at IS NULL/);
 for(const flag of ['provider_create_success','provider_publication_ack_verified','provider_truth_verified','terminal_provider_side_effect','possible_provider_side_effect','reconciliation_required'])assert.ok(sql.includes(flag),flag);
 assert.match(sql,/public\.powerhouse_jsonb_true\(p\.evidence,flag\.k\)/);
 assert.match(sql,/updated_at = now\(\)/);
 assert.doesNotMatch(sql,/set\s+(?:status|evidence|external_id|published_at|live_proven_at|tenant_id|channel|publication_date)\s*=/i);
 assert.doesNotMatch(sql,/cron\.schedule|net\.http_post|insert\s+into|delete\s+from|grant\s+execute|drop\s+trigger/i);
});
test('original producer decision and provider fences remain the only authority',()=>{
 for(const marker of ['NO_PUBLISH_PROVIDER_REFERENCE_MUST_RECONCILE','NO_PUBLISH_EXISTING_VETO_CANNOT_BE_DOWNGRADED','NO_PUBLISH_SOURCE_DECISION_PROOF_INCOMPLETE','NO_PUBLISH_DECISION_TOO_LATE'])assert.ok(original.includes(marker),marker);
 assert.doesNotMatch(sql,/CREATE OR REPLACE FUNCTION|CREATE TRIGGER|CREATE TABLE|CREATE VIEW/i);
});
