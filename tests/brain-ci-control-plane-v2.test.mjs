import test from 'node:test';
import assert from 'node:assert/strict';
import { auditCiControlPlane, parseOnBlock, pullRequestMode } from '../scripts/brain/powerhouse-ci-control-plane-v2.mjs';

test('detects pull_request head and closed-only modes',()=>{
  assert.equal(pullRequestMode('on:\n  pull_request:\n    branches: [main]\n\njobs:\n  x:\n'),'head');
  assert.equal(pullRequestMode('on:\n  pull_request:\n    types: [closed]\n\njobs:\n  x:\n'),'closed-only');
  assert.equal(pullRequestMode('on:\n  push:\n    branches: [main]\n'),'none');
});

test('parses merge_group as a first-class event',()=>{
  assert.deepEqual(parseOnBlock('on:\n  pull_request:\n  merge_group:\n    types: [checks_requested]\n').map(x=>x.name),['pull_request','merge_group']);
});

test('repository CI control plane has one PR-head ingress', async()=>{
  const result=await auditCiControlPlane();
  assert.equal(result.ok,true,result.errors.join('\n'));
  assert.deepEqual(result.headTriggers,['.github/workflows/required-test.yml']);
  assert.ok(result.workflowCount>=1);
});
