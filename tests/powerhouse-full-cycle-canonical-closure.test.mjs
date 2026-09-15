import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (p) => fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';

const orchestratorPath = 'supabase/functions/powerhouse-content-orchestrator/index.ts';
const publisherPath = 'supabase/functions/powerhouse-social-publisher/index.ts';
const revenuePath = 'supabase/migrations/20260915142504_powerhouse_revenue_calibration_projection_v1.sql';
const contractPath = 'docs/powerhouse-full-cycle-canonical-closure-v1.md';

const orchestrator = read(orchestratorPath);
const publisher = read(publisherPath);
const revenue = read(revenuePath);
const contract = read(contractPath);

const lanes = [
  'email_newsletter',
  'linkedin_personal',
  'linkedin_company',
  'linkedin_article_personal',
  'linkedin_article_company',
  'instagram_company',
  'blog',
];

test('production content orchestrator is source-controlled with exact seven-lane decision contract', () => {
  assert.ok(orchestrator, `${orchestratorPath} must exist on main`);
  for (const lane of lanes) assert.match(orchestrator, new RegExp(`'${lane}'`));
  assert.match(orchestrator, /decision_count:7/);
  assert.match(orchestrator, /personal_fail_closed/);
  assert.doesNotMatch(orchestrator, /make\.com|integromat/i);
});

test('production social publisher is source-controlled and fail-closed on identity/readback', () => {
  assert.ok(publisher, `${publisherPath} must exist on main`);
  assert.match(publisher, /channel-identity-hard-gate-v3/);
  assert.match(publisher, /arthur-personal-linkedin-identity-v4/);
  assert.match(publisher, /pre_publish_gate/);
  assert.match(publisher, /provider_immediate_readback/);
  assert.match(publisher, /deletePost/);
  assert.doesNotMatch(publisher, /make\.com|integromat/i);
});

test('canonical Brain revenue prediction-to-outcome projection is source-controlled', () => {
  assert.ok(revenue, `${revenuePath} must exist on main`);
  assert.match(revenue, /powerhouse_project_brain_revenue_learning/);
  for (const table of ['powerhouse_forecasts','powerhouse_sales_actions','powerhouse_sales_outcomes','powerhouse_forecast_calibration']) {
    assert.match(revenue, new RegExp(table));
  }
  assert.match(revenue, /POWERHOUSE_ORIGINATING_FORECAST_REQUIRED/);
  assert.doesNotMatch(revenue, /create table/i);
});

test('closure contract binds execution, revenue, learning and production proof without parallel truth', () => {
  assert.ok(contract, `${contractPath} must exist on main`);
  for (const invariant of [
    'powerhouse_full_cycle_production_proof',
    'powerhouse_autonomous_gap_closer',
    'powerhouse_commercial_learning_loop',
    'powerhouse_daily_executive_cockpit',
    'powerhouse_project_brain_revenue_learning',
    'EXISTING-STATE-FIRST',
    'NO PARALLEL TRUTH',
    'REALIZED REVENUE',
  ]) assert.match(contract, new RegExp(invariant, 'i'));
});