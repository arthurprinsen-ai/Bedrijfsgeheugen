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

test('CodeQL workflow is present with security-events permission', () => {
  const yml = read('.github/workflows/codeql.yml');
  assert.match(yml, /security-events:\s*write/);
  assert.match(yml, /github\/codeql-action\/analyze@/);
});

test('GitHub runner fanout stays bounded and stale non-required runs are cancelled', () => {
  const workflows = [
    ['engineering intelligence', read('.github/workflows/engineering-intelligence-trust.yml')],
    ['supply chain', read('.github/workflows/engineering-supply-chain-trust.yml')],
    ['learning classifier', read('.github/workflows/learning-contract-delivery-classifier-tests.yml')],
  ];
  for (const [name, yml] of workflows) {
    assert.match(yml, /pull_request:[\s\S]*?paths:/, `${name} must be path-scoped for pull requests`);
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
