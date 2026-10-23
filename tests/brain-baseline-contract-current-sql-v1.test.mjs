import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');

test('current-state contract test binds to present canonical SQL without weakening mutation safety', async () => {
  const spec = await read('tests/brain-autonomous-improvement-currentstate-record-type.test.mjs');
  const sql = await read('supabase/migrations/20260916161635_autonomous_improvement_currentstate_record_type_fix_v1.sql');
  assert.match(spec, /20260916161635_autonomous_improvement_currentstate_record_type_fix_v1\.sql/);
  assert.doesNotMatch(spec, /20260916182000_autonomous_improvement_currentstate_record_type_fix_v1\.sql/);
  assert.match(sql, /''CurrentState'',''current_state''/);
  assert.match(sql, /''improvement'',''current_state''/);
  assert.match(sql, /refusing unsafe rewrite/);
  assert.doesNotMatch(sql, /drop constraint|alter table\s+public\.brain_records/i);
});

test('tenant-identity review contract binds to present SQL preserving browser-role denial', async () => {
  const spec = await read('tests/supabase-tenant-identity-review-semantics-v2.test.mjs');
  const sql = await read('supabase/migrations/20260918085708_tenant_identity_review_semantics_v2.sql');
  assert.match(spec, /20260918085708_tenant_identity_review_semantics_v2\.sql/);
  assert.doesNotMatch(spec, /20260918105000_tenant_identity_review_semantics_v2\.sql/);
  assert.match(sql, /branche[\s\S]*like '%smoke%'/i);
  assert.match(sql, /anonymous_unattributable/);
  assert.match(sql, /no_organisatie_slug_match/);
  assert.match(sql, /revoke all on public\.powerhouse_tenant_identity_review_v1 from anon, authenticated/i);
  assert.match(sql, /grant select on public\.powerhouse_tenant_identity_review_v1 to service_role/i);
});
