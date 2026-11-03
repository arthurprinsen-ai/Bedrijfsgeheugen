import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const sql=readFileSync(new URL('../supabase/migrations/20261030072000_p0_4215_auto_research_contact_approval_economics_proof.sql', import.meta.url),'utf8');
const learning=JSON.parse(readFileSync(new URL('../brain/learning/2026-10-30-auto-research-contact-approval-economics-proof-v1.json', import.meta.url),'utf8'));

test('original economics backfill retains exact identity, bounded idempotent source and server-only privilege',()=>{
  assert.match(sql,/CREATE OR REPLACE FUNCTION public\.powerhouse_backfill_internal_research_economics_v1\(/);
  for(const term of ["a.status='done'","a.executed_at is not null","a.action_type='research_enrichment'","a.channel='internal'","e.action_id=a.action_id","limit 50","'economics:'||r.action_id::text","powerhouse_record_action_economics_v1","SECURITY DEFINER","SET search_path TO 'public', 'pg_catalog'"]){
    assert.ok(sql.includes(term),term);
  }
  assert.match(sql,/REVOKE ALL ON FUNCTION[^]*FROM PUBLIC, anon, authenticated/);
  assert.match(sql,/GRANT EXECUTE ON FUNCTION[^]*TO service_role/);
  assert.doesNotMatch(sql,/\b(?:DELETE|TRUNCATE|DROP|UNSCHEDULE)\b/i);
  assert.doesNotMatch(sql,/\bcron\./i);
});

test('human-approved contact cannot infer human research labour without original same-action independent receipt',()=>{
  for (const required of [
    "coalesce((a.evidence->>'human_approved')::boolean,false)=false",
    "coalesce((a.evidence->>'human_approved')::boolean,false)=true",
    "a.evidence->>'source'='powerhouse-commercial-next-best-action-v5'",
    "a.dedupe_key like 'relationship-research:%'",
    "a.evidence->'public_research_execution'->>'contract'=",
    "re.dedupe_key='relationship-research-evidence:'||a.action_id::text",
    "re.occurred_at=a.executed_at",
    "re.evidence->>'action_id'=a.action_id::text",
    "re.evidence->>'evidence_only'='true'",
    "re.evidence->>'vendor_used'='false'",
    "re.context->>'external_side_effects'='false'",
    "'contact_approval_not_execution',r.contact_human_approved",
  ]) assert.ok(sql.includes(required),required);
  assert.match(sql,/and exists\s*\(\s*select 1\s*from public\.powerhouse_runtime_events re/);
});

test('provider and external money stay explicitly unknown, not falsely zero',()=>{
  assert.match(sql,/r\.action_id,\s*null,\s*null,\s*0,/);
  assert.match(sql,/'provider_cost_eur','UNOBSERVED'/);
  assert.match(sql,/'external_cost_eur','UNOBSERVED'/);
  assert.match(sql,/'no_zero_cost_claim',true/);
  assert.match(sql,/'independent_research_receipt_required_for_contact_approved',r.contact_human_approved/);
});

test('record only verified source proof; no global green from schema, tests or row count',()=>{
  assert.equal(learning.maturity,'OBSERVED');
  assert.equal(learning.evidence.independent_auto_receipts,17);
  assert.equal(learning.evidence.measured_provider_cost_eur,false);
  assert.equal(learning.evidence.original_mux_natural_run_verified_after_patch,false);
  assert.equal(learning.evidence.customer_revenue_outcome_verified,false);
  assert.ok(learning.evaluation.historical_replay.includes('tests/brain-p0-4215-auto-research-contact-approval-economics-proof.test.mjs'));
});
