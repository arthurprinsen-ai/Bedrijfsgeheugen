import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const shadow = await readFile('.github/workflows/repo-writer-candidate-shadow.yml','utf8');
const operational = await readFile('.github/workflows/repo-writer-operational-verification.yml','utf8');
const pageSeo = await readFile('.github/workflows/paginacontrole-debug.yml','utf8');
const crossBrowser = await readFile('.github/workflows/website-cross-browser-screenshot-assurance.yml','utf8');

test('writer shadow is explicit-dispatch only and preserves immutable identity inputs', () => {
  assert.doesNotMatch(shadow,/^\s*pull_request:\s*$/m);
  assert.match(shadow,/^\s*workflow_dispatch:\s*$/m);
  for (const input of ['pr_number','base_sha','head_sha','candidate_branch']) {
    assert.match(shadow,new RegExp('^\\s{6}'+input+':\\s*$','m'));
  }
  assert.match(operational,/gh workflow run repo-writer-candidate-shadow\.yml/);
  assert.match(operational,/-f pr_number="\$PR_NUMBER"/);
  assert.match(operational,/-f base_sha="\$PR_BASE_SHA"/);
  assert.match(operational,/-f head_sha="\$PR_HEAD_SHA"/);
  assert.match(operational,/-f candidate_branch="\$PR_HEAD_REF"/);
});

test('page and SEO diagnosis is on-demand rather than automatic PR fanout', () => {
  assert.doesNotMatch(pageSeo,/^\s*pull_request:\s*$/m);
  assert.match(pageSeo,/^\s*workflow_dispatch:\s*$/m);
});

test('cross-browser PR assurance excludes website release-risk control-plane config', () => {
  assert.match(crossBrowser,/- 'site\/\*\*'/);
  assert.match(crossBrowser,/- '!site\/website-release-risk\.json'/);
  assert.match(crossBrowser,/^\s*schedule:\s*$/m);
  assert.match(crossBrowser,/^\s*workflow_dispatch:\s*$/m);
});
