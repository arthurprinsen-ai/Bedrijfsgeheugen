import test from 'node:test';
import assert from 'node:assert/strict';
import policy from '../config/powerhouse-ci-calibration-v1.json' with { type:'json' };
import { calibrateCi, isRequiredCiRun, selectCiRunsForMeasurement, describeCiObservationCoverage } from '../tools/delivery/ci-calibration-engine.mjs';

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

test('Required test with a PR run-name is recognized; unrelated and non-PR runs are excluded',()=>{
  assert.equal(isRequiredCiRun({name:'Required test PR #4174 997cf35826aba8b60a2b17d0356240f3ecb885fe',event:'pull_request'}),true);
  assert.equal(isRequiredCiRun({name:'Required test',event:'pull_request'}),true);
  assert.equal(isRequiredCiRun({name:'Required testing docs',event:'pull_request'}),false);
  assert.equal(isRequiredCiRun({name:'Required test PR #4174 abcd',event:'push'}),false);
});

test('bounded selection reserves real Required runs beyond first fifty other workflows',()=>{
  const other=Array.from({length:75},(_,i)=>({id:i+1,name:'CI other '+i,event:'push'}));
  const required=Array.from({length:16},(_,i)=>({id:i+101,name:'Required test PR #'+(4300+i)+' abcd',event:'pull_request'}));
  const rows=[...other,...required];
  const selected=selectCiRunsForMeasurement(rows,{maxRuns:60,reservedRequired:12});
  assert.equal(selected.length,60);
  assert.equal(selected.filter(isRequiredCiRun).length,12);
  assert.equal(new Set(selected.map(x=>x.id)).size,60);
  assert.deepEqual(selected.map(x=>rows.indexOf(x)),[...selected.map(x=>rows.indexOf(x))].sort((a,b)=>a-b));
});

test('seven-day completeness requires evidence that pagination reached the window boundary',()=>{
  const base={requestedSince:'2026-10-01T00:00:00Z',observedAt:'2026-10-08T00:00:00Z',pagesFetched:3,fetchedRuns:300,sampledRuns:60};
  const truncated=describeCiObservationCoverage({...base,oldestFetchedAt:'2026-10-08T00:00:00Z',complete:false});
  assert.equal(truncated.seven_day_coverage_complete,false);
  assert.equal(truncated.bounded_sample_only,true);
  const complete=describeCiObservationCoverage({...base,oldestFetchedAt:'2026-09-30T22:00:00Z',complete:true});
  assert.equal(complete.seven_day_coverage_complete,true);
  assert.equal(complete.bounded_sample_only,false);
});

test('CI intelligence uses the run name and explicit window coverage rather than false seven-day proof',async()=>{
  const {readFile}=await import('node:fs/promises');
  const source=await readFile('scripts/brain/powerhouse-ci-intelligence.mjs','utf8');
  assert.match(source,/runs\.filter\(isRequiredCiRun\)/);
  assert.match(source,/selectCiRunsForMeasurement/);
  assert.match(source,/observation_coverage: observationCoverage/);
  assert.match(source,/seven_day_coverage_complete/);
  assert.doesNotMatch(source,/run\.name === 'Required test'/);
});
