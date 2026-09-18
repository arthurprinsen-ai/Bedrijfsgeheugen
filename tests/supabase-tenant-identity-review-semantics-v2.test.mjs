import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const sql=fs.readFileSync('supabase/migrations/20260918105000_tenant_identity_review_semantics_v2.sql','utf8');

test('smoke scans are classified as test evidence',()=>{
  assert.match(sql,/branche[\s\S]*like '%smoke%'/i);
  assert.match(sql,/then 'demo_or_test'/);
});

test('anonymous scans without slug and company key are explicitly non-attributable',()=>{
  assert.match(sql,/nullif\(btrim\(s\.klant_slug\),''\) is null/);
  assert.match(sql,/nullif\(btrim\(s\.company_key\),''\) is null/);
  assert.match(sql,/anonymous_unattributable/);
  assert.match(sql,/no_identity_evidence/);
});

test('production rows remain fail-closed when identity evidence exists but does not resolve',()=>{
  assert.match(sql,/production_or_unknown/);
  assert.match(sql,/no_organisatie_slug_match/);
  assert.match(sql,/ambiguous_organisatie_slug_match/);
});

test('browser roles cannot query identity review directly',()=>{
  assert.match(sql,/revoke all on public\.powerhouse_tenant_identity_review_v1 from anon, authenticated/i);
  assert.match(sql,/grant select on public\.powerhouse_tenant_identity_review_v1 to service_role/i);
});
