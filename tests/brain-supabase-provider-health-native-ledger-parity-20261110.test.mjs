import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const migrationDir = new URL('../supabase/migrations/', import.meta.url);
const migratedVersion = '20261110160055';
const name = 'linkedin_org_readback_sticky_provider_health_v1';
const current = new URL(`${migratedVersion}_${name}.sql`, migrationDir);
const proposal = new URL(`20261110153331_${name}.sql`, migrationDir);
const lock = JSON.parse(readFileSync(new URL('../supabase/migration-history.lock.json', import.meta.url), 'utf8'));

test('no duplicate old proposal migration: exactly provider assigned native version', () => {
  assert.ok(existsSync(current), 'provider-assigned 824th migration source missing');
  assert.equal(existsSync(proposal), false, 'unapplied original proposal alias must not be replayed');
  const sql = readFileSync(current, 'utf8');
  assert.match(sql, /create or replace view public\.powerhouse_provider_health_v1/i);
  assert.match(sql, /unresolved_capability_denials/);
  assert.match(sql, /revoke all on table public\.powerhouse_provider_health_v1\s+from public, anon, authenticated;/i);
  assert.equal(Buffer.byteLength(sql), 3834, 'live provider has exactly 3834 native SQL bytes');
});

test('original source lock is append-only and matches exact official native identity', () => {
  assert.equal(lock.source, 'supabase_migration_history');
  assert.equal(lock.project_ref, 'adhjwmvyoixzjtmiroln');
  assert.equal(lock.applied.length, 824);
  for (let i=1;i<lock.applied.length;i++)
    assert.ok(lock.applied[i-1].version < lock.applied[i].version, 'provider versions must be monotonic unique');
  assert.deepEqual(lock.applied.at(-1), {version:migratedVersion,name});
  assert.equal(lock.applied.filter(x=>x.name===name).length, 1);
  assert.equal(lock.applied.some(x=>x.version==='20261110153331'), false);
});

test('code and learning all point to one protected, actual applied migration identity', () => {
  const sourceTest=readFileSync(new URL('./brain-provider-readback-sticky-health-20261110.test.mjs', import.meta.url),'utf8');
  const learning=JSON.parse(readFileSync(new URL('../brain/learning/2026-11-10-linkedin-org-readback-sticky-health-v1.json', import.meta.url),'utf8'));
  assert.match(sourceTest,/20261110160055_linkedin_org_readback_sticky_provider_health_v1\.sql/);
  assert.match(learning.evaluation.canonical_sql,/20261110160055_linkedin_org_readback_sticky_provider_health_v1\.sql/);
  assert.equal(learning.production_readback.schema_applied,true);
  assert.equal(learning.production_readback.applied_migration_version,migratedVersion);
  assert.equal(learning.production_readback.provider_permission_recovered,false);
});

test('original protected admission retains all ordinary history guards and requires exact native one-time receipt', () => {
  const code=readFileSync(new URL('../tools/ci/protected-supabase-pr-migration-tests.mjs',import.meta.url),'utf8');
  const helper=readFileSync(new URL('../tools/ci/verified-provider-health-native-version-reconciliation.mjs',import.meta.url),'utf8');
  assert.match(code,/verifyNativeProviderHealthVersionReconciliation/);
  assert.match(code,/if\(!nativeProviderHealthVersionReconciliation\)/);
  assert.match(code,/Applied historical migrations must never be modified or deleted in an ordinary PR/);
  assert.match(helper,/NATIVE_PROVIDER_HISTORY_IS_NOT_EXACT_APPEND_ONLY_824/);
  assert.match(helper,/NATIVE_SQL_MUST_EQUAL_PROTECTED_AND_PROVIDER_READBACK_BYTES/);
  assert.match(helper,/hostedPreviewRequired:true,providerHistoryAttestedByCandidate:false/);
});
