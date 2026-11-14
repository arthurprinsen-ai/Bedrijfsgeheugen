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
  assert.equal(i, 840, 'original provider 841 must remain at exact immutable index after 840 predecessors');
  assert.equal(ids.filter((v) => v === '20261113071500').length, 1);
  assert.deepEqual(lock.applied[i], {
    version: '20261113071500',
    name: 'original_content_handoff_source_revision_receipt_v1',
  });
  assert.equal(lock.applied[i - 1].version, '20261113062500');
  // The 841 receipt is immutable; the single native provider lock may advance
  // captured_at as later legitimate migrations are appended.
  assert.match(lock.captured_at, /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d+Z$/);
  assert.ok(Date.parse(lock.captured_at)>=Date.parse('2026-11-13T00:00:00Z'),
    'latest native recapture cannot predate the original 841 proof');
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

test('provider 841 remains fixed under an in-memory later append and fails historical tampering',()=>{
  const exact841={version:'20261113071500',
    name:'original_content_handoff_source_revision_receipt_v1'};
  const later=[...lock.applied,{version:'20991231000000',name:'future_provider_append'}];
  assert.deepEqual(later[840],exact841);
  assert.equal(later.filter(x=>x.version===exact841.version).length,1);
  assert.equal(new Set(later.map(x=>x.version)).size,later.length);
  const tampered=[...later];
  tampered[840]={...tampered[840],name:'WRONG_ORIGINAL_RECEIPT'};
  assert.notDeepEqual(tampered[840],exact841);
  assert.deepEqual(lock.applied[840],exact841);
});
