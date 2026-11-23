import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const lock = JSON.parse(readFileSync(new URL('../supabase/migration-history.lock.json', import.meta.url), 'utf8'));
const files = readdirSync(new URL('../supabase/migrations/', import.meta.url)).filter(f => f.endsWith('.sql'));

test('lock contains the provider-applied tags migration exactly once and equals the source files', () => {
  const rows = lock.applied.filter(r => r.version === '20261105165702');
  assert.deepEqual(rows, [{ version: '20261105165702', name: 'original_linkedin_tags_learning_v1' }]);
  const fromFiles = files.map(f => { const m = /^(\d{14})_(.+)\.sql$/.exec(f); return `${m[1]}_${m[2]}`; }).sort();
  const fromLock = lock.applied.map(r => `${r.version}_${r.name}`).sort();
  assert.deepEqual(fromLock, fromFiles);
});

test('this change adds no SQL and no new migration', () => {
  assert.ok(files.includes('20261105165702_original_linkedin_tags_learning_v1.sql'));
  assert.equal(lock.applied.length, files.length);
});
