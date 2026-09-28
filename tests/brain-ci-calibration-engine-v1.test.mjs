import test from 'node:test';
import assert from 'node:assert/strict';
import policy from '../config/powerhouse-ci-calibration-v1.json' with { type:'json' };
import { calibrateCi } from '../tools/delivery/ci-calibration-engine.mjs';

function report(metrics={},sampled_jobs=100){
  return {sampled_jobs,metrics:{failed_jobs:0,cancelled_jobs:0,...metrics},jobs:[]};
}

test('high queue pressure recommends bounded preview parallelism',()=>{
  const result=calibrateCi({report:report({queue_wait_seconds_p95:240}),policy});
  const rec=result.recommendations.find(x=>x.id==='reduce-preview-parallelism');
  assert.ok(rec);
  assert.equal(rec.suggested.preview_route_concurrency,2);
  assert.equal(rec.suggested.preview_viewport_concurrency,1);
  assert.equal(result.safe_to_apply_automatically,false);
});

test('high fanout recommends consolidation without bypassing Required',()=>{
  const result=calibrateCi({report:report({workflow_fanout_per_sha_p95:12}),policy});
  const rec=result.recommendations.find(x=>x.id==='reduce-workflow-fanout');
  assert.equal(rec.suggested.preserve_single_required_authority,true);
});

test('high execution time tightens impact routing but preserves full suite for R2-R4',()=>{
  const result=calibrateCi({report:report({execution_seconds_p95:1200}),policy});
  const rec=result.recommendations.find(x=>x.id==='tighten-impact-routing');
  assert.equal(rec.suggested.preserve_full_suite_for_r2_r4,true);
});

test('failure rate recommends bounded pattern memory',()=>{
  const result=calibrateCi({report:report({failed_jobs:20},100),policy});
  const rec=result.recommendations.find(x=>x.id==='increase-regression-memory-weight');
  assert.equal(rec.suggested.max_historical_tests,12);
});

test('calibration never grants direct mutation authority',()=>{
  const result=calibrateCi({report:report({queue_wait_seconds_p95:999,failed_jobs:90},100),policy});
  assert.equal(result.safe_to_apply_automatically,false);
  assert.equal(result.mutation_authority,'PROTECTED_CANDIDATE_ONLY');
});
