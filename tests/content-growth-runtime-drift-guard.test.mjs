import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (p) => fs.readFileSync(p, 'utf8');

test('canonical daily cockpit keeps unified content read path', () => {
  const source = read('supabase/functions/bg-dagoverzicht/index.ts');
  assert.match(source, /body\?\.actie === 'content'/);
  assert.match(source, /content_operations_cockpit/);
  assert.match(source, /blog_komt/);
  assert.match(source, /LIVE_PROVEN/);
});

test('canonical content operations endpoint remains in repo contract', () => {
  const source = read('supabase/functions/content-operations/index.ts');
  assert.match(source, /content_operations_cockpit/);
  assert.match(source, /blogComing/);
  assert.match(source, /x-powerhouse-token/);
  assert.match(source, /Europe\/Amsterdam/);
});

test('unified content migration keeps hard complete-calendar invariant', () => {
  const migration = read('supabase/migrations/20260914093000_unified_content_publication_operations.sql');
  assert.match(migration, /BLOG_CALENDAR_INCOMPLETE/);
  assert.match(migration, /v_blog_count <> 109/);
  assert.match(migration, /unique \(tenant_id, publication_date, channel\)/i);
  assert.match(migration, /LIVE_PROOF_REQUIRED/);
});
