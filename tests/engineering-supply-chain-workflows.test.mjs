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

test('supply-chain PR work is dependency-scoped while provenance remains main-only', () => {
  const yml = read('.github/workflows/engineering-supply-chain-trust.yml');
  assert.match(yml, /pull_request:\s*\n\s+paths:\s*\n\s+- 'package\.json'\s*\n\s+- 'package-lock\.json'/);
  assert.match(yml, /provenance:\s*\n\s+if: github\.event_name == 'push'/);
  assert.match(yml, /push:\s*\n\s+branches: \[main\]/);
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
  assert.match(supply, /pull_request:[\s\S]*?paths:/);
  for (const [name, yml] of [['engineering intelligence', intelligence], ['supply chain', supply], ['learning classifier', classifier]]) {
    assert.match(yml, /concurrency:[\s\S]*?cancel-in-progress:\s*true/, `${name} must cancel stale runs`);
  }
});

test('supply-chain provenance is post-merge while dependency review remains fail-closed on dependency PRs', () => {
  const yml = read('.github/workflows/engineering-supply-chain-trust.yml');
  assert.match(yml, /dependency-review:[\s\S]*?if:\s*github\.event_name == 'pull_request'/);
  assert.match(yml, /provenance:[\s\S]*?if:\s*github\.event_name == 'push'/);
  assert.match(yml, /package-lock\.json/);
});

test('Required test remains the protected SHA-specific admission authority', () => {
  const yml = read('.github/workflows/required-test.yml');
  assert.match(yml, /group:\s*required-test-\$\{\{[\s\S]*?github\.event\.pull_request\.head\.sha/);
  assert.match(yml, /cancel-in-progress:\s*true/);
  assert.match(yml, /test:\n\s+name:\s*test/);
  assert.match(yml, /needs:\s*\[hygiene, preflight, backend, portal, automation, website\]/);
});
