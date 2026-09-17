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
