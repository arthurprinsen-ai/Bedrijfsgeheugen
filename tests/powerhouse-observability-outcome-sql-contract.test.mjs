import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const migrationUrl = new URL('../supabase/migrations/20260915203000_powerhouse_observability_outcome_calibration_closure_v1.sql', import.meta.url);

async function sql() {
  return readFile(migrationUrl, 'utf8');
}

test('creates fail-closed action evidence maturity and NBA v5 projections', async () => {
  const text = await sql();
  assert.match(text, /powerhouse_action_evidence_maturity_v1/i);
  assert.match(text, /powerhouse_commercial_next_best_action_v5/i);
  assert.match(text, /security_invoker\s*=\s*true/i);
  assert.match(text, /powerhouse_action_business_value_v1/i);
  assert.match(text, /powerhouse_commercial_next_best_action_v4/i);
  assert.match(text, /powerhouse_forecast_calibration/i);
  assert.match(text, /minimum_comparable_outcomes/i);
  assert.match(text, /\b5\b/);
});

test('evidence maturity is dimension-level, includes human feedback, and uses explicit lineage only', async () => {
  const text = await sql();
  assert.match(text, /resource_evidence_status/i);
  assert.match(text, /economics_evidence_status/i);
  assert.match(text, /outcome_evidence_status/i);
  assert.match(text, /forecast_evidence_status/i);
  assert.match(text, /human_feedback_observations/i);
  assert.match(text, /powerhouse_human_feedback_events/i);
  assert.match(text, /calibration_eligible/i);
  assert.match(text, /action_id/i);
  assert.match(text, /opportunity_key/i);
  assert.match(text, /forecast_id/i);
  assert.doesNotMatch(text, /similarity\s*\(/i);
  assert.doesNotMatch(text, /levenshtein/i);
});

test('unknown evidence remains null and browser roles gain no access', async () => {
  const text = await sql();
  assert.match(text, /then\s+null/i);
  assert.match(text, /revoke\s+all\s+on\s+public\.powerhouse_action_evidence_maturity_v1\s+from\s+public\s*,\s*anon\s*,\s*authenticated/i);
  assert.match(text, /revoke\s+all\s+on\s+public\.powerhouse_commercial_next_best_action_v5\s+from\s+public\s*,\s*anon\s*,\s*authenticated/i);
  assert.match(text, /grant\s+select\s+on\s+public\.powerhouse_action_evidence_maturity_v1\s+to\s+service_role/i);
  assert.match(text, /grant\s+select\s+on\s+public\.powerhouse_commercial_next_best_action_v5\s+to\s+service_role/i);
});

test('NBA v5 preserves v4 decision output and keeps insufficient evidence neutral', async () => {
  const text = await sql();
  assert.match(text, /from\s+public\.powerhouse_commercial_next_best_action_v4/i);
  assert.match(text, /business_efficiency_evidence_status/i);
  assert.match(text, /insufficient_comparable_outcomes/i);
  assert.match(text, /cost_resource_efficiency_evidence/i);
  assert.match(text, /else\s+null/i);
});

test('canonical sales outcome writer never fabricates zero revenue and gates no-response evidence', async () => {
  const text = await sql();
  assert.match(text, /create\s+or\s+replace\s+function\s+public\.powerhouse_record_outcome/i);
  assert.match(text, /p_revenue_eur\s+numeric\s+default\s+null/i);
  assert.doesNotMatch(text, /coalesce\s*\(\s*p_revenue_eur\s*,\s*0\s*\)/i);
  assert.match(text, /no_response/i);
  assert.match(text, /observation_window_closed/i);
  assert.match(text, /proposal.*revenue.*not allowed|revenue.*proposal.*not allowed/i);
  assert.match(text, /revoke\s+all\s+on\s+function\s+public\.powerhouse_record_outcome/i);
});
