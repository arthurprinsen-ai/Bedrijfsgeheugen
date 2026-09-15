import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';

async function migrationSql() {
  const dir = 'supabase/migrations';
  const files = await readdir(dir);
  const name = files.find((file) => file.endsWith('_powerhouse_evidence_first_market_learning_calibration_gate_v2.sql'));
  assert.ok(name, 'evidence-first market learning v2 migration missing');
  return readFile(`${dir}/${name}`, 'utf8');
}

test('experiment learning v2 requires prospective treatment and holdout evidence before promotion', async () => {
  const sql = await migrationSql();
  assert.match(sql, /create\s+or\s+replace\s+view\s+public\.powerhouse_experiment_learning_v2/i);
  assert.match(sql, /powerhouse_experiment_assignments/i);
  assert.match(sql, /matured_treatment/i);
  assert.match(sql, /matured_holdout/i);
  assert.match(sql, /assignment_before_treatment/i);
  assert.match(sql, /ready_for_estimation/i);
  assert.match(sql, /promotion_eligible/i);
});

test('proven promotion requires observed economics, market outcomes and calibration evidence', async () => {
  const sql = await migrationSql();
  assert.match(sql, /powerhouse_action_economics/i);
  assert.match(sql, /powerhouse_sales_outcomes/i);
  assert.match(sql, /powerhouse_forecast_calibration/i);
  assert.match(sql, /economics_coverage/i);
  assert.match(sql, /calibration_samples/i);
  assert.match(sql, /commercial_outcomes/i);
  assert.match(sql, /then\s+'proven'/i);
  assert.match(sql, /else\s+'insufficient_evidence'/i);
});

test('market learning v2 remains service-role only and security-invoker', async () => {
  const sql = await migrationSql();
  assert.match(sql, /alter\s+view\s+public\.powerhouse_experiment_learning_v2\s+set\s*\(security_invoker\s*=\s*true\)/i);
  assert.match(sql, /revoke\s+all\s+on\s+public\.powerhouse_experiment_learning_v2\s+from\s+anon\s*,\s*authenticated/i);
  assert.match(sql, /grant\s+select\s+on\s+public\.powerhouse_experiment_learning_v2\s+to\s+service_role/i);
});
