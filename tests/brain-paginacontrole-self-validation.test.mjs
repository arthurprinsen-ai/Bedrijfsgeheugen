import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const workflow = fs.readFileSync('.github/workflows/paginacontrole.yml', 'utf8');
const selfPath = "      - '.github/workflows/paginacontrole.yml'";

function assertCanonicalTriggers(source) {
  const start = source.indexOf('\non:\n');
  const end = source.indexOf('\npermissions:');
  assert.ok(start >= 0 && end > start, 'workflow trigger source must exist');
  const triggers = source.slice(start + 1, end);
  assert.match(triggers, /^  push:\s*$/m, 'main push must still verify public page changes');
  assert.match(triggers, /^    branches: \[main\]\s*$/m, 'push must target main');
  const push = triggers.split(/^  push:\s*$/m)[1]?.split(/^  [a-z_]+:\s*$/m)[0] ?? '';
  assert.equal(push.split('\n').filter(line => line === selfPath).length, 1,
    'source path must be included exactly once in the push path filter');
  assert.doesNotMatch(triggers, /^  pull_request:/m,
    'standalone pull_request trigger must stay removed to prevent duplicate PR fanout');
  assert.match(triggers, /^  workflow_dispatch:/m, 'manual candidate invocation must remain');
  assert.match(triggers, /^  schedule:/m, 'scheduled page verification must remain');
  assert.match(source, /concurrency:\s*\n\s*group:\s*repo-schrijven\s*\n\s*cancel-in-progress:\s*false/,
    'non-cancellable repository writer lock must remain');
}

test('paginacontrole self-validates its main push path without duplicate PR fanout', () => {
  assertCanonicalTriggers(workflow);
});

test('removing the paginacontrole self-path is rejected by the canonical oracle', () => {
  assert.ok(workflow.includes(selfPath), 'baseline has the source path');
  assert.throws(() => assertCanonicalTriggers(workflow.replace(selfPath, "      - '.github/workflows/unrelated.yml'")),
    /source path must be included exactly once/);
});

test('reintroducing standalone PR fanout or weakening writer serialization is rejected', () => {
  assert.throws(() => assertCanonicalTriggers(workflow.replace('  workflow_dispatch:', '  pull_request:\n  workflow_dispatch:')),
    /standalone pull_request trigger must stay removed/);
  assert.throws(() => assertCanonicalTriggers(workflow.replace('cancel-in-progress: false', 'cancel-in-progress: true')),
    /non-cancellable repository writer lock must remain/);
});
