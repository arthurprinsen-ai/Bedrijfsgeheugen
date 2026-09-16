import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIGRATIONS = path.join(ROOT, 'supabase', 'migrations');
const ENGINE = path.join(ROOT, 'supabase', 'functions', 'powerhouse-predictive-engine', 'index.ts');
const CALIBRATOR = path.join(ROOT, 'supabase', 'functions', 'powerhouse-forecast-calibrator', 'index.ts');

const CANONICAL = [
  '20260914081052_predictive_intelligence_first_mover_v1.sql',
  '20260914081911_predictive_first_mover_contract_v1_hardening.sql',
  '20260914082435_predictive_first_mover_obligations_and_guard_v1.sql',
  '20260914082625_predictive_first_mover_daily_schedule_v1.sql',
];

test('exact production migration identities are source controlled', () => {
  for (const name of CANONICAL) assert.equal(fs.existsSync(path.join(MIGRATIONS, name)), true, name);
});

test('obsolete PR 1481 timestamp alias is absent', () => {
  const aliases = fs.readdirSync(MIGRATIONS).filter(name => name.startsWith('20260914152000') && name.toLowerCase().includes('predictive'));
  assert.deepEqual(aliases, []);
});

test('live predictive sources are fail closed and are not publishers', () => {
  const engine = fs.readFileSync(ENGINE, 'utf8');
  const calibrator = fs.readFileSync(CALIBRATOR, 'utf8');
  for (const source of [engine, calibrator]) {
    assert.match(source, /x-powerhouse-token/);
    assert.match(source, /powerhouse_daily_scheduler_token/);
    assert.match(source, /UNAUTHORIZED/);
    assert.doesNotMatch(source.toLowerCase(), /buffer/);
  }
  assert.match(engine, /brain_ai_governance_registry/);
  assert.match(engine, /evidence_keys/);
  assert.match(calibrator, /revenue_learning_obligations/);
  assert.match(calibrator, /uncertain/);
});
