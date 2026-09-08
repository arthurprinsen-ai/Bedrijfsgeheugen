import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(path, 'utf8');

for (const path of [
  '.github/workflows/homepage-pricing-boundary-regression.yml',
  '.github/workflows/bg168-materiality-promotion-tests.yml',
  '.github/workflows/shared-agent-memory-tests.yml',
  '.github/workflows/paginacontrole-debug.yml',
]) {
  test(`${path} scopes pull-request execution with paths`, () => {
    const workflow = read(path);
    const start = workflow.indexOf('pull_request:');
    const dispatch = workflow.indexOf('workflow_dispatch:', start);
    const pr = workflow.slice(start, dispatch > -1 ? dispatch : undefined);
    assert.match(pr, /paths:/, `${path} must not run on every PR`);
  });
}
