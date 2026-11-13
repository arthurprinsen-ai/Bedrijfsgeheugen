import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const get = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const lock = JSON.parse(get('supabase/migration-history.lock.json'));
const migration = get('supabase/migrations/20261113071500_original_content_handoff_source_revision_receipt_v1.sql');
const agent = get('platform/agents/agent-team.mjs');
const skill = get('.agents/skills/release-deployment-readback/SKILL.md');

test('original provider 841 stays in the one immutable 840-prefix migration history exactly once', () => {
  const ids = lock.applied.map((r) => r.version);
  assert.equal(new Set(ids).size, ids.length, 'all applied migration versions must remain unique');
  const i = ids.indexOf('20261113071500');
  assert.ok(i >= 840, 'observed provider 841 must follow the exact original 840 migrations');
  assert.equal(ids.filter((v) => v === '20261113071500').length, 1);
  assert.deepEqual(lock.applied[i], {
    version: '20261113071500',
    name: 'original_content_handoff_source_revision_receipt_v1',
  });
  assert.equal(lock.applied[i - 1].version, '20261113062500');
  assert.match(lock.captured_at, /^2026-11-13T\d\d:\d\d:\d\d\.\d+Z$/);
  assert.match(migration, /CREATE OR REPLACE FUNCTION public\.powerhouse_content_handoff_receipts_v1/);
});

test('existing agent and release skill require exact original provider and consumer receipts without a parallel executor', () => {
  const task = 'reconcile-native-applied-supabase-migration-lock-before-postmerge-brain-green';
  assert.equal(agent.split(task).length - 1, 1, 'one existing data-quality owner');
  assert.match(skill, /SOURCE_LOCK_DRIFT/);
  assert.ok(skill.includes(task));
  assert.match(skill, /source-revision tenant\/correlation consumer ACK/);
  assert.match(skill, /never implies Instagram publish/);
});
