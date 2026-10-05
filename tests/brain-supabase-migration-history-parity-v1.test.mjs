import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';

test('recovered Supabase production migrations remain represented in the canonical repository history', async () => {
  const files = await readdir('supabase/migrations');
  for (const version of [
    '20260913133014',
    '20261005142034',
    '20261005142118',
  ]) {
    assert.ok(files.some(name => name.startsWith(version + '_') && name.endsWith('.sql')), 'missing recovered migration ' + version);
  }
});

test('migration parity learning keeps the provider parity gate fail-closed', async () => {
  const learning = JSON.parse(await readFile('brain/learning/supabase-migration-history-parity-20261005-v1.json', 'utf8'));
  assert.equal(learning.fingerprint, 'powerhouse|supabase-migration-history|remote-repo-parity|required|v1');
  assert.equal(learning.compiler.failure_class, 'GITHUB_DELIVERY');
  assert.ok(learning.prevention.some(rule => rule.includes('Supabase Preview')));
  assert.equal(learning.evidence.remote_only_after_recovery, 0);
});

test('delivery hygiene can inspect bounded large recovery patches without Node default-buffer failure', async () => {
  const workflow = await readFile('.github/workflows/powerhouse-delivery-hygiene.yml', 'utf8');
  assert.match(workflow, /LOCAL_COMMAND_MAX_BUFFER\s*=\s*64\s*\*\s*1024\s*\*\s*1024/);
  assert.match(workflow, /execFileSync\(args\[0\],\s*args\.slice\(1\),\s*\{encoding:'utf8',maxBuffer:LOCAL_COMMAND_MAX_BUFFER\}\)/);
});

test('historical surface discovery ignores quoted CREATE TABLE AS tags and transient probe tables', async () => {
  const { discoverQualitySurfaces } = await import('../scripts/brain/quality/surface-discovery.mjs');
  const discovered = discoverQualitySurfaces({ files: [{ path: 'supabase/migrations/example.sql', content: "when tag in ('CREATE TABLE', 'CREATE TABLE AS'); create table public.__probe(id bigint); drop table public.__probe;" }] });
  assert.ok(!discovered.some(item => item.id === 'table:AS'));
  assert.ok(!discovered.some(item => item.id === 'table:public.__probe'));
});

test('surface discovery reuses exact reviewed historical mirror blobs from the security gate', async () => {
  const surface = await readFile('scripts/brain/quality/surface-discovery-check.mjs', 'utf8');
  assert.match(surface, /check_powerhouse_supabase_security\.py/);
  assert.match(surface, /git', \['hash-object', file\]/);
  assert.match(surface, /actual === expected/);
  assert.match(surface, /!exactHistoricalMirror\(file, reviewed\)/);
});

test('historical autonomous trigger repair is replay-idempotent but still fail-closed on an unpatched bad call', async () => {
  const sql = await readFile('supabase/migrations/20260915103324_powerhouse_autonomous_growth_revenue_trigger_fix.sql', 'utf8');
  assert.match(sql, /if v_after <> v_before then\s+execute v_after;/);
  assert.match(sql, /elsif v_before ~\* 'powerhouse_sync_forecast_calibration_obligation/);
  assert.match(sql, /raise exception 'autonomy calibration trigger-call patch did not match current function body'/);
});
