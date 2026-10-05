import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateFullCommitCheckSet } from '../tools/delivery/github-delivery-state-machine.mjs';

test('learning replay: full exact-head checkset blocks partial-green delivery', () => {
  const result=evaluateFullCommitCheckSet({
    checkRuns:[
      {name:'Required test',status:'completed',conclusion:'success',app:'github-actions'},
      {name:'CodeQL',status:'completed',conclusion:'neutral',app:'github-advanced-security'},
      {name:'Netlify',status:'in_progress',conclusion:'',app:'netlify'}
    ],
    legacyStatuses:[{context:'netlify/bedrijfsgeheugen/deploy-preview',state:'pending'}]
  });
  assert.equal(result.ok,false);
  assert.match(result.reasons.join(','),/SECURITY_CHECKS_NEUTRAL|CHECK_RUNS_PENDING|LEGACY_STATUSES_PENDING/);
});

test('learning canary: success requires every blocking check on the exact head to be terminal-green', () => {
  const result=evaluateFullCommitCheckSet({
    checkRuns:[
      {name:'Required test',status:'completed',conclusion:'success',app:'github-actions'},
      {name:'CodeQL',status:'completed',conclusion:'success',app:'github-advanced-security'},
      {name:'Netlify',status:'completed',conclusion:'success',app:'netlify'}
    ],
    legacyStatuses:[{context:'netlify/bedrijfsgeheugen/deploy-preview',state:'success'}]
  });
  assert.equal(result.ok,true);
});
