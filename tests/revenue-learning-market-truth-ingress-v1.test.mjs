import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const edgePath = 'supabase/functions/powerhouse-revenue-intelligence/index.ts';
const migrationPath = 'supabase/migrations/20260915181636_powerhouse_market_truth_ingress_v1.sql';

const read = (path) => readFile(path, 'utf8');

test('revenue intelligence exposes authenticated market-truth ingress routes', async () => {
  const src = await read(edgePath);
  for (const route of ['experiment-assign','experiment-link','economics','feedback','market-truth-health']) {
    assert.match(src, new RegExp(`['\"]${route}['\"]`));
  }
  assert.match(src, /['"]experiment-assign['"]\s*:\s*['"]learning['"]/i);
  assert.match(src, /['"]?economics['"]?\s*:\s*['"]learning['"]/i);
  assert.match(src, /['"]?feedback['"]?\s*:\s*['"]learning['"]/i);
  assert.match(src, /['"]market-truth-health['"]\s*:\s*['"]learning['"]/i);
});

test('ingress delegates only to canonical market-truth RPCs', async () => {
  const src = await read(edgePath);
  assert.match(src, /rpc\/powerhouse_assign_experiment_v1/i);
  assert.match(src, /rpc\/powerhouse_link_experiment_action_v1/i);
  assert.match(src, /rpc\/powerhouse_record_action_economics_v1/i);
  assert.match(src, /rpc\/powerhouse_record_human_feedback_v1/i);
  assert.match(src, /powerhouse_market_truth_health_v1/i);
  assert.doesNotMatch(src, /assignmentArm\s*[:=]/i, 'public ingress must not accept a caller-selected experiment arm');
});

test('economics and feedback ingress validate observed truth before RPC writes', async () => {
  const src = await read(edgePath);
  assert.match(src, /providerCostEur/i);
  assert.match(src, /externalCostEur/i);
  assert.match(src, /humanMinutes/i);
  assert.match(src, /NONNEGATIVE|nonnegative/i);
  assert.match(src, /approve.*edit.*skip.*cancel.*override.*alternative_action/is);
  assert.match(src, /recommendedVariant/i);
  assert.match(src, /actualVariant/i);
});

test('maturity helper only matures eligible expired assignments and remains server-only', async () => {
  const sql = await read(migrationPath);
  assert.match(sql, /powerhouse_mature_experiment_assignments_v1/i);
  assert.match(sql, /measurement_horizon_end\s*<=/i);
  assert.match(sql, /assignment_arm\s*=\s*'holdout'/i);
  assert.match(sql, /treatment_action_id\s+is\s+not\s+null/i);
  assert.match(sql, /state\s*=\s*'matured'/i);
  assert.match(sql, /security\s+definer/i);
  assert.match(sql, /set\s+search_path\s*=\s*public/i);
  assert.match(sql, /revoke\s+execute[\s\S]*from\s+public\s*,\s*anon\s*,\s*authenticated/i);
  assert.match(sql, /grant\s+execute[\s\S]*to\s+service_role/i);
  assert.doesNotMatch(sql, /insert\s+into\s+public\.powerhouse_sales_outcomes/i, 'maturity may never synthesize outcomes');
});

test('edge runtime version and daily evidence include market-truth maturity/readback', async () => {
  const src = await read(edgePath);
  assert.match(src, /version:'1\.3\.0'/);
  assert.match(src, /powerhouse_mature_experiment_assignments_v1/i);
  assert.match(src, /market_truth_learning/i);
});
