import test from 'node:test';
import assert from 'node:assert/strict';
import {auditFailureBacklog} from '../brain/observability/failure-backlog-assurance-v1.mjs';
const now='2026-11-03T11:00:00Z';
const row={fingerprint:'brein-status|cron|FOUT',maturity:'OBSERVED',occurrence_count:1250,last_seen_at:'2026-11-03T10:00:00Z',root_cause:null,prevention_rule:null,regression_ref:null};
const run=extra=>auditFailureBacklog({rows:[row],expectedTotal:1,readbackComplete:true,observedAt:now,...extra});
test('readback completeness is mandatory, including truncated and duplicate results',()=>{
  for(const extra of [{readbackComplete:false},{expectedTotal:2},{rows:[row,row],expectedTotal:2},{rows:[{...row,fingerprint:''}]}])
    assert.equal(run(extra).status,'SOURCE_COVERAGE_UNVERIFIED');
});
test('all missing fields are counted once per fingerprint, repeated failures receive first priority',()=>{
  const x=run();
  assert.deepEqual([x.totals.missing_cause,x.totals.missing_prevention,x.totals.missing_regression],[1,1,1]);
  assert.equal(x.obligations[0].classification,'RECURRENT_SOURCE_OWNER_RECOVERY_DUE');
  assert.equal(x.obligations[0].production_verified,false);
  assert.equal(x.global_green,false);
});
test('placeholder text cannot close evidence debt',()=>{
  const x=run({rows:[{...row,root_cause:'OPEN_RCA',prevention_rule:'pending',regression_ref:'none yet'}]});
  assert.equal(x.totals.incomplete_patterns,1);
  assert.equal(x.totals.missing_cause,1);
});
test('historical observed does not automatically mean live outage',()=>{
  const x=run({rows:[{...row,last_seen_at:'2026-10-01T01:00:00Z'}]});
  assert.equal(x.obligations[0].classification,'SOURCE_EVIDENCE_TRIAGE_DUE');
});
test('documentation complete is not automatically production green',()=>{
  const x=run({rows:[{...row,root_cause:'Verified code cause',prevention_rule:'Require test guard',regression_ref:'tests/brain-regression.test.mjs'}]});
  assert.equal(x.status,'NO_DOCUMENTATION_GAPS_IN_OBSERVED_PATTERNS');
  assert.equal(x.global_green,false);
});
test('maturity changes require original owner; no mutation in projection',()=>{
  const input=[{...row}];
  const before=JSON.stringify(input);
  const x=auditFailureBacklog({rows:input,expectedTotal:1,readbackComplete:true,observedAt:now});
  assert.equal(JSON.stringify(input),before);
  assert.equal(x.authority,'public.brain_failure_registry');
});
