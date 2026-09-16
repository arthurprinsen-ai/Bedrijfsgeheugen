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
  '20260914074356_powerhouse_channel_decisions_v1.sql',
  '20260914074533_powerhouse_content_artifacts_v1.sql',
  '20260914074405_powerhouse_execution_status_v1.sql',
  '20260914074413_powerhouse_completion_gate_v1.sql',
  '20260914074434_powerhouse_execution_guard_cron_v1.sql',
  '20260914074504_powerhouse_completion_gate_compatible_v2.sql',
  '20260914081052_predictive_intelligence_first_mover_v1.sql',
  '20260914081911_predictive_first_mover_contract_v1_hardening.sql',
  '20260914082435_predictive_first_mover_obligations_and_guard_v1.sql',
  '20260914082625_predictive_first_mover_daily_schedule_v1.sql',
  '20260914084525_powerhouse_execution_status_due_time_guard_v1.sql',
  '20260914084630_powerhouse_social_delivery_reconciliation_v1.sql',
  '20260915091805_powerhouse_publication_live_proof_guard.sql',
  '20260915094213_linkedin_personal_identity_hard_gate_v3.sql',
  '20260915101047_harden_security_definer_views_and_internal_rpcs.sql',
  '20260915101246_pin_function_search_paths.sql',
  '20260915102437_powerhouse_revenue_flywheel_v1.sql',
  '20260915102851_powerhouse_autonomous_growth_revenue_v1.sql',
  '20260915102925_powerhouse_autonomous_growth_revenue_v1.sql',
  '20260915123725_powerhouse_full_cycle_production_proof_v1.sql',
];

const DRIFTED_ALIASES = [
  '20260915122500_harden_security_definer_views_and_internal_rpcs.sql',
  '20260915122500_powerhouse_full_cycle_production_proof_v1.sql',
  '20260915123000_pin_function_search_paths.sql',
  '20260915123000_powerhouse_autonomous_growth_revenue_v1.sql',
  '20260915123000_powerhouse_revenue_flywheel_views_v1.sql',
  '20260915111000_powerhouse_publication_live_proof_guard.sql',
];

test('exact production migration identities are source controlled', () => {
  for (const name of CANONICAL) assert.equal(fs.existsSync(path.join(MIGRATIONS, name)), true, name);
});

test('obsolete PR 1481 timestamp alias is absent', () => {
  const aliases = fs.readdirSync(MIGRATIONS).filter(name => name.startsWith('20260914152000') && name.toLowerCase().includes('predictive'));
  assert.deepEqual(aliases, []);
});

test('production migrations have unique versions and no drifted replay aliases', () => {
  const files = fs.readdirSync(MIGRATIONS).filter(name => name.endsWith('.sql'));
  const versions = files.map(name => name.split('_', 1)[0]);
  assert.equal(new Set(versions).size, versions.length, 'Supabase migration versions must be unique');
  for (const name of DRIFTED_ALIASES) assert.equal(files.includes(name), false, name);
});

test('search-path hardening tolerates only absent non-ledger baseline helpers', () => {
  const sql = fs.readFileSync(path.join(MIGRATIONS, '20260915101246_pin_function_search_paths.sql'), 'utf8');
  assert.match(sql, /to_regprocedure\('public\.bg_brein_regels_check\(text,text,text\)'\)/i);
  assert.match(sql, /to_regprocedure\('public\.bg_actualiseer_connecties_via_lessen\(\)'\)/i);
  assert.match(sql, /alter function public\.powerhouse_execution_status\(date\)/i);
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
