import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(path, 'utf8');

for (const path of [
  '.github/workflows/homepage-pricing-boundary-regression.yml',
  '.github/workflows/bg168-materiality-promotion-tests.yml',
  '.github/workflows/shared-agent-memory-tests.yml',
]) {
  test(`${path} scopes pull-request execution with paths`, () => {
    const workflow = read(path);
    const pr = workflow.slice(workflow.indexOf('pull_request:'), workflow.indexOf('workflow_dispatch:', workflow.indexOf('pull_request:')) > -1 ? workflow.indexOf('workflow_dispatch:', workflow.indexOf('pull_request:')) : undefined);
    assert.match(pr, /paths:/, `${path} must not run on every PR`);
  });
}
