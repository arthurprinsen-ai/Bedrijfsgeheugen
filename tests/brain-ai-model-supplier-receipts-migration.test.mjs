import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const migration='supabase/migrations/20261014193000_ai_model_supplier_receipts_keep_in_sync.sql';
const sql=fs.readFileSync(migration,'utf8');

test('receipt synchronization migration is a scoped private invoker trigger',()=>{
 assert.match(sql,/create or replace function private\.ai_model_supplier_receipts_keep_in_sync_20261014\(\)/i);
 assert.match(sql,/security invoker/i);
 assert.match(sql,/on public\.ai_model_supplier_verification_v1/i);
 assert.match(sql,/before insert or update of claim_evidence, catalog_record/i);
 assert.match(sql,/revoke all on function private\.ai_model_supplier_receipts_keep_in_sync_20261014\(\)/i);
 assert.match(sql,/from public, anon, authenticated;/i);
});

test('new and previous receipt copies are retained and reconciled',()=>{
 assert.match(sql,/new\.claim_evidence/i);
 assert.match(sql,/new\.catalog_record\s*#>\s*'\{verification_evidence,claim_evidence\}'/i);
 assert.match(sql,/old\.claim_evidence/i);
 assert.match(sql,/old\.catalog_record\s*#>\s*'\{verification_evidence,claim_evidence\}'/i);
 assert.match(sql,/if not \(merged @> jsonb_build_array\(e\)\)/i);
 assert.match(sql,/CLAIM_RECEIPTS_MUST_BE_ARRAY/i);
 assert.match(sql,/PREVIOUS_CLAIM_RECEIPTS_MUST_BE_ARRAY/i);
 assert.match(sql,/new\.claim_evidence := merged/i);
 assert.match(sql,/new\.catalog_record := jsonb_set/i);
});

test('trigger body only reconciles receipt storage and never promotes supplier/tenant approvals',()=>{
 const body=sql.split('as $fn$')[1]?.split('$fn$')[0]||'';
 assert.ok(body.length>100,'Function implementation must be present');
 assert.doesNotMatch(body,/verification_status|automatic_recommendation_eligible|release_eligible|tenant_evidence|independent_verification_required/i);
 assert.doesNotMatch(body,/execute\s+format\s*\(|execute\s+\w+\s*;/i);
});
