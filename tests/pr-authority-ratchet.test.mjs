import test from 'node:test';
import assert from 'node:assert/strict';
import { eventBlock, removeEventBlock, isDirectPullRequestWorkflow, hasRunnableTrigger, validatePolicy } from '../scripts/brain/pr-authority-ratchet.mjs';

test('pull_request event parsing is bounded to the event block',()=>{
  const source=`name: Example

on:
  pull_request:
    branches: [main]
    paths:
      - 'src/**'
  push:
    branches: [main]
`;
  assert.match(eventBlock(source),/pull_request/);
  assert.equal(isDirectPullRequestWorkflow(source),true);
  const retired=removeEventBlock(source);
  assert.doesNotMatch(retired,/^  pull_request:/m);
  assert.match(retired,/^  push:/m);
});

test('retirement cannot leave a workflow without any trigger',()=>{
  const onlyPr=`on:
  pull_request:
    branches: [main]
`;
  const withPush=`on:
  pull_request:
    branches: [main]
  push:
    branches: [main]
`;
  assert.equal(hasRunnableTrigger(removeEventBlock(onlyPr)),false);
  assert.equal(hasRunnableTrigger(removeEventBlock(withPush)),true);
});

test('closed-only PR workflows are not counted as direct PR authorities',()=>{
  const source=`on:
  pull_request:
    types: [closed]
`;
  assert.equal(isDirectPullRequestWorkflow(source),false);
});

test('repository PR authority policy is monotonic and fail-closed',async()=>{
  const result=await validatePolicy('.');
  assert.equal(result.ok,true,result.errors.join('\n'));
  assert.equal(result.target,2);
  assert.equal(result.budget,55);
  assert.ok(result.direct.length<=55);
  assert.deepEqual(result.canonical,['powerhouse-codeql.yml','required-test.yml']);
  assert.ok(result.direct.includes('required-test.yml'));
  assert.ok(result.direct.includes('powerhouse-codeql.yml'));
  for(const retired of ['codeql.yml','portal-parity.yml','error-learning-contract.yml','universal-event-retention-contract.yml']){
    assert.equal(result.direct.includes(retired),false,`${retired} must stay retired from direct PR ingress`);
  }
});
