import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const sql=fs.readFileSync('supabase/migrations/20260918113000_prospective_autonomous_commercial_experiment_v1.sql','utf8');

test('experiment activation is prospective and only for positive-value autonomous commercial actions',()=>{
  assert.match(sql,/new\.dedupe_key not like 'autonomy:%'/);
  assert.match(sql,/coalesce\(new\.expected_value_eur,0\) <= 0/);
  assert.match(sql,/requires_positive_expected_value/);
  assert.match(sql,/no_retroactive_assignment/);
  assert.match(sql,/before insert on public\.powerhouse_sales_actions/i);
});

test('holdout is created before action and cannot receive the treatment row',()=>{
  assert.match(sql,/powerhouse_prepare_experiment_action_v1/);
  assert.match(sql,/if v_assignment\.assignment_arm='holdout' then\s+return null;/s);
  assert.match(sql,/assigned_before_action/);
  assert.match(sql,/powerhouse_attach_treatment_action_v1/);
  assert.match(sql,/after insert on public\.powerhouse_sales_actions/i);
});

test('existing experiment contamination is fail closed for holdouts and never double enrolls',()=>{
  assert.match(sql,/experiment_key<>v_experiment_key/);
  assert.match(sql,/measurement_horizon_end>now\(\)/);
  assert.match(sql,/v_conflict\.assignment_arm='holdout'/);
  assert.match(sql,/return null/);
});

test('policy promotion remains evidence gated by the existing canonical authority',()=>{
  assert.match(sql,/min_matured_per_arm,primary_metric/);
  assert.match(sql,/'realized_revenue_per_assignment'/);
  assert.match(sql,/promotion_authority','powerhouse_promote_policy_if_proven_v1'/);
  assert.match(sql,/sample_floor_calibration_actionability_no_contamination_and_positive_uplift/);
});

test('policy activation is latent rather than fake-active before eligible evidence exists',()=>{
  assert.doesNotMatch(sql,/^insert into public\.powerhouse_experiment_policies/im);
  assert.match(sql,/LATENT_WAITING_FOR_ELIGIBLE_ACTION/);
  assert.match(sql,/ACTIVE_WAITING_FOR_FIRST_ASSIGNMENT/);
});
