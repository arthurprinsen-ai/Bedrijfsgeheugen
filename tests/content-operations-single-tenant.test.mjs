import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const migration = await readFile('supabase/migrations/20260914125000_single_content_operations_tenant.sql', 'utf8');
const operationsApi = await readFile('supabase/functions/content-operations/index.ts', 'utf8');
const dailyApi = await readFile('supabase/functions/bg-dagoverzicht/index.ts', 'utf8');

test('content operations has one canonical execution tenant', () => {
  assert.match(migration, /delete from public\.content_publication_obligations where tenant_id = 'bedrijfsgeheugen'/i);
  assert.match(migration, /new\.tenant_id\s*:=\s*'canonical'/i);
  assert.match(migration, /e\.tenant_id\s*=\s*'canonical'/i);
  assert.match(migration, /v_alias_count\s*<>\s*0/i);
  assert.match(migration, /CONTENT_OPERATIONS_ALIAS_DUPLICATION/);
});

test('legacy bedrijfsgeheugen state writes normalize to canonical', () => {
  assert.match(migration, /p_tenant_id in \('canonical','bedrijfsgeheugen'\)/i);
  assert.match(migration, /then 'canonical'/i);
  assert.match(migration, /record_content_publication_state/);
});

test('both content read surfaces use the same canonical tenant', () => {
  assert.match(operationsApi, /tenant.*'canonical'/);
  assert.match(dailyApi, /\.eq\('tenant_id',\s*'canonical'\)/);
  assert.doesNotMatch(operationsApi, /\|\|\s*'bedrijfsgeheugen'/);
  assert.doesNotMatch(dailyApi, /\.eq\('tenant_id',\s*'bedrijfsgeheugen'\)/);
});
