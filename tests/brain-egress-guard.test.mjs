import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { scanText, scanRepo } from '../tools/ci/egress-guard.mjs';

const rules = (t, wf = true) => scanText('x.yml', t, wf).map((v) => v.rule);

test('the repository itself has zero egress violations', () => {
  assert.deepEqual(scanRepo('.'), []);
});

test('blocks writes to a foreign repository via API, flag or clone URL', () => {
  assert.ok(rules('permissions:\n  contents: read\n  run: gh api repos/someone-else/their-repo/issues').includes('FOREIGN_REPO_API'));
  assert.ok(rules('permissions: {}\nrun: gh issue create --repo acme/other -t x').includes('FOREIGN_REPO_FLAG'));
  assert.ok(rules('permissions: {}\nrun: git push https://github.com/acme/other.git main').includes('FOREIGN_CLONE_URL'));
});

test('allows the home repo and the runner-provided repository variable', () => {
  assert.deepEqual(rules('permissions:\n  contents: read\nrun: gh api repos/${GITHUB_REPOSITORY}/pulls'), []);
  assert.deepEqual(rules('permissions:\n  contents: read\nrun: gh api repos/arthurprinsen-ai/Bedrijfsgeheugen/pulls'), []);
});

test('blocks personal access tokens and missing or write-all permissions', () => {
  assert.ok(rules('permissions: {}\nenv: ${{ secrets.PERSONAL_GITHUB_PAT }}').includes('SECRET_NOT_ALLOWLISTED'));
  assert.ok(rules('jobs: {}').includes('NO_PERMISSIONS_BLOCK'));
  assert.ok(rules('permissions: write-all\n').includes('WRITE_ALL'));
});

test('the external-recipient incident is registered where every agent and skill preflight looks', () => {
  const fp = 'agents|external-recipient|internal-content-leak|20261029-v1';
  const learning = JSON.parse(readFileSync('brain/learning/2026-10-29-github-schoon-egress-guard-v1.json', 'utf8'));
  assert.equal(learning.fingerprint, fp);
  assert.equal(learning.mandatory_preflight, true);
  assert.match(learning.root_cause, /OPEN RCA/);
  for (const f of ['AGENTS.md', '.agents/skills/powerhouse-continuity/SKILL.md', 'docs/learning/known-error-preflight-contract.md']) {
    assert.ok(readFileSync(f, 'utf8').includes(fp), f);
  }
  assert.match(readFileSync('.github/workflows/powerhouse-autonomous-engineering-optimizer.yml', 'utf8'), /egress-guard\.mjs/);
});
