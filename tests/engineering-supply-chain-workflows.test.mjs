import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = p => fs.readFileSync(p, 'utf8');

test('supply-chain workflow creates SBOM and GitHub artifact attestation', () => {
  const yml = read('.github/workflows/engineering-supply-chain-trust.yml');
  assert.match(yml, /attestations:\s*write/);
  assert.match(yml, /id-token:\s*write/);
  assert.match(yml, /actions\/attest-build-provenance@/);
  assert.match(yml, /spdx/i);
  assert.match(yml, /dependency-review-action@/);
});

test('supply-chain provenance remains main-only and dependency review moved into Required', () => {
  const supply = read('.github/workflows/engineering-supply-chain-trust.yml');
  const required = read('.github/workflows/required-test.yml');
  assert.doesNotMatch(supply, /^  pull_request:/m);
  assert.match(supply, /provenance:\s*\n\s+if: github\.event_name == 'push'/);
  assert.match(required, /actions\/dependency-review-action@v4/);
  assert.match(required, /dependency_review_required/);
});

test('CodeQL workflow is present with security-events permission', () => {
  const yml = read('.github/workflows/codeql.yml');
  assert.match(yml, /security-events:\s*write/);
  assert.match(yml, /github\/codeql-action\/analyze@/);
});

test('duplicate governance PR fanout is routed through Required while supply-chain security stays narrow', () => {
  const intelligence = read('.github/workflows/engineering-intelligence-trust.yml');
  const supply = read('.github/workflows/engineering-supply-chain-trust.yml');
  const classifier = read('.github/workflows/learning-contract-delivery-classifier-tests.yml');
  assert.doesNotMatch(intelligence, /^\s*pull_request\s*:/m);
  assert.doesNotMatch(classifier, /^\s*pull_request\s*:/m);
  assert.doesNotMatch(supply, /^  pull_request:/m);
  for (const [name, yml] of [['engineering intelligence', intelligence], ['supply chain', supply], ['learning classifier', classifier]]) {
    assert.doesNotMatch(yml, /^  pull_request:/m, `${name} must not own PR HEAD ingress`);
  }
});

test('dependency review remains fail-closed inside Required while provenance is post-merge', () => {
  const supply = read('.github/workflows/engineering-supply-chain-trust.yml');
  const required = read('.github/workflows/required-test.yml');
  assert.match(required, /dependency_review:[\s\S]*?fail-on-severity: high/);
  assert.match(required, /npm audit --package-lock-only --audit-level=high/);
  assert.match(supply, /provenance:[\s\S]*?if:\s*github\.event_name == 'push'/);
});

test('Required test remains the only protected PR admission authority and owns merge security', () => {
  const yml = read('.github/workflows/required-test.yml');
  assert.doesNotMatch(yml, /^concurrency:/m);
  assert.match(yml, /test:\n\s+name:\s*test/);
  assert.match(yml, /dependency_review/);
  assert.match(yml, /security_codeql/);
  assert.match(yml, /merge_group:/);
});
