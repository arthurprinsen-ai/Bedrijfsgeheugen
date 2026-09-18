import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { classifyTurboDelivery, MAX_TURBO_PATHS } from '../tools/delivery/turbo-classifier.mjs';

test('Fast Development rolling-lane policy has hard low-latency recovery SLOs', async () => {
  const p=JSON.parse(await readFile(new URL('../config/powerhouse-fast-development-protocol-v2.json', import.meta.url),'utf8'));
  assert.equal(p.revision,4);
  assert.equal(p.delivery_mode,'PREDICTIVE_ROLLING_LANE_FAST_PATH');
  assert.equal(p.execution.rolling_lane_per_conflict_contract,true);
  assert.equal(p.execution.one_active_candidate_per_conflict_contract,true);
  assert.equal(p.execution.auto_cancel_superseded_runs,true);
  assert.equal(p.execution.auto_recover_zero_run_heads,true);
  assert.equal(p.latency_slo.first_ci_signal_seconds,60);
  assert.equal(p.latency_slo.turbo_blocking_budget_seconds,240);
  assert.equal(p.promotion.auto_promote_when_blocking_profile_green,true);
  assert.equal(p.predictive_control.enabled,true);
  assert.equal(p.adaptive_gates.enabled,true);
  assert.equal(p.supervisor.zero_run_auto_dispatch,true);
});

test('safe turbo envelope supports useful multi-file changes without admitting protected surfaces', () => {
  assert.equal(MAX_TURBO_PATHS,24);
  assert.equal(classifyTurboDelivery({changedPaths:Array.from({length:24},(_,i)=>`portal-v2/x-${i}.js`)}).turbo,true);
  assert.equal(classifyTurboDelivery({changedPaths:['.github/workflows/x.yml']}).turbo,false);
  assert.equal(classifyTurboDelivery({changedPaths:['supabase/migrations/x.sql']}).turbo,false);
  assert.equal(classifyTurboDelivery({changedPaths:['netlify/functions/auth-login.mjs']}).turbo,false);
});

test('BRAIN delivery reuses turbo risk profile instead of duplicating full-suite work for safe deltas', async () => {
  const yml=await readFile(new URL('../.github/workflows/unified-brain-delivery.yml', import.meta.url),'utf8');
  assert.match(yml,/classifyTurboDelivery/);
  assert.match(yml,/FAST_PATH: risk-scoped verification/);
  assert.match(yml,/tests\/delivery-turbo-classifier\.test\.mjs/);
  assert.match(yml,/tests\/brain-fast-development-protocol-v2\.test\.mjs/);
});

test('broad unrelated assurance runs after merge and cannot queue-block a PR', async () => {
  const yml=await readFile(new URL('../.github/workflows/powerhouse-post-merge-assurance.yml', import.meta.url),'utf8');
  assert.match(yml,/push:\n\s+branches: \[main\]/);
  assert.doesNotMatch(yml,/pull_request:/);
  assert.match(yml,/cancel-in-progress: true/);
  assert.match(yml,/POST_MERGE_ASYNC_ASSURANCE/);
});

test('parallel engineering fabric uses one rolling integration candidate per conflict contract', async () => {
  const f=JSON.parse(await readFile(new URL('../config/powerhouse-parallel-engineering-fabric.json', import.meta.url),'utf8'));
  assert.equal(f.version,4);
  assert.equal(f.scheduling.agent_workspaces,'isolated_ephemeral_worktrees');
  assert.equal(f.scheduling.integration_unit,'rolling_conflict_contract_lane');
  assert.equal(f.scheduling.one_active_integration_candidate_per_conflict_contract,true);
  assert.equal(f.rolling_lanes.duplicate_prs_for_same_obligation,'forbidden');
});
