import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = p => fs.readFileSync(p, 'utf8');

test('supply-chain workflow owns post-merge SBOM and artifact attestation only', () => {
  const yml = read('.github/workflows/engineering-supply-chain-trust.yml');
  assert.match(yml, /attestations:\s*write/);
  assert.match(yml, /id-token:\s*write/);
  assert.match(yml, /actions\/attest-build-provenance@/);
  assert.match(yml, /spdx/i);
  assert.match(yml, /^  push:/m);
  assert.doesNotMatch(yml, /^  pull_request:/m);
});

test('dependency risk is fail-closed in Required merge-group specialist assurance', () => {
  const required = read('.github/workflows/required-test.yml');
  assert.match(required, /^  merge_group:/m);
  assert.match(required, /dependency_review_required:/);
  assert.match(required, /Verify dependency supply-chain risk/);
  assert.match(required, /npm audit --package-lock-only --audit-level=high/);
  assert.match(required, /\['package\.json','package-lock\.json','npm-shrinkwrap\.json'/);
});

test('consolidated Powerhouse CodeQL is the single security authority on PR and merge queue', () => {
  const yml = read('.github/workflows/codeql.yml');
  assert.match(yml, /security-events:\s*write/);
  assert.match(yml, /github\/codeql-action\/analyze@/);
  assert.match(yml, /^  pull_request:/m);
  assert.match(yml, /^  merge_group:/m);
  assert.match(yml, /language:\s*\[javascript-typescript, python\]/);
  assert.match(yml, /languages:\s*\$\{\{ matrix\.language \}\}/);
});

test('duplicate governance PR fanout is routed through Required', () => {
  for (const path of [
    '.github/workflows/engineering-intelligence-trust.yml',
    '.github/workflows/engineering-supply-chain-trust.yml',
    '.github/workflows/learning-contract-delivery-classifier-tests.yml',
  ]) {
    assert.doesNotMatch(read(path), /^\s*pull_request\s*:/m, path);
  }
  const required = read('.github/workflows/required-test.yml');
  assert.match(required, /^  pull_request:/m);
});

test('supply-chain provenance remains main-only after protected merge', () => {
  const yml = read('.github/workflows/engineering-supply-chain-trust.yml');
  assert.match(yml, /push:\s*\n\s+branches: \[main\]/);
  assert.match(yml, /provenance:\s*\n\s+if: github\.event_name == 'push'/);
  assert.match(yml, /package-lock\.json/);
});

test('Required remains PR-single-flight while exact-head and merge-group proof stay protected', () => {
  const yml = read('.github/workflows/required-test.yml');
  const concurrency = yml.slice(yml.indexOf('concurrency:'), yml.indexOf('\njobs:'));
  assert.match(concurrency, /github\.event\.pull_request\.number/);
  assert.doesNotMatch(concurrency, /github\.event\.pull_request\.head\.sha/);
  assert.match(yml, /cancel-in-progress:\s*true/);
  assert.match(yml, /PR_HEAD_SHA|candidate_sha|change_head_sha/);
  assert.match(yml, /test:\n\s+name:\s+test/);
  assert.match(yml, /merge_specialist/);
  assert.match(yml, /merge_specialist_node24/);
});
