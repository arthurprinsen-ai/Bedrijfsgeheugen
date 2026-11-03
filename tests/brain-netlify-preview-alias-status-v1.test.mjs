import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {immutableNetlifyPreviewUrl} from '../tools/ci/netlify-immutable-preview-target.mjs';

// Fingerprint ci|netlify-preview-status-alias|portal-v2-live-preview|20261029-v1
// Netlify reports the numbered PR alias as commit status target. The live-preview check failed
// for 180 consecutive runs with "Untrusted Netlify provider status URL" and nobody saw it, because
// the check is not a required status. Both consumers of the contract must accept the same forms.
const read = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const livePreview = read('.github/workflows/portal-v2-live-preview.yml');
const domReadback = read('.github/workflows/portal-v2-production-dom-readback.yml');

test('historical replay: live preview accepts the exact numbered PR alias and pins the immutable deploy', () => {
  assert.match(livePreview, /PR_NUMBER: \$\{\{ github\.event\.workflow_run\.pull_requests\[0\]\.number \}\}/);
  assert.match(livePreview, /"\$target" = "https:\/\/deploy-preview-\$\{PR_NUMBER\}--bedrijfsgeheugen\.netlify\.app"/);
  assert.match(livePreview, /\$alias_sha" != "\$HEAD_SHA"/);
  assert.match(livePreview, /\^\[a-f0-9\]\{24\}\$/);
  assert.match(livePreview, /immutable="https:\/\/\$\{alias_id\}--bedrijfsgeheugen\.netlify\.app"/);
});

test('shadow: the helper contract is unchanged, so no other alias is ever accepted', () => {
  assert.throws(() => immutableNetlifyPreviewUrl('https://deploy-preview-4236--bedrijfsgeheugen.netlify.app'), /NETLIFY_PREVIEW_TARGET_/);
  assert.throws(() => immutableNetlifyPreviewUrl('https://deploy-preview-1--other.netlify.app'), /NETLIFY_PREVIEW_TARGET_/);
  // only this PR's number, never a wildcard alias pattern
  assert.doesNotMatch(livePreview, /deploy-preview-\[0-9\]|deploy-preview-\.\*|deploy-preview-\$\{[A-Z_]*\}-\*/);
  // the dashboard form still goes through the helper
  assert.match(livePreview, /netlify-immutable-preview-target\.mjs "\$target"/);
  // the second check on the immutable host stays in place
  assert.match(livePreview, /\$deployed_sha" = "\$HEAD_SHA"/);
});

test('canary: both consumers of the Netlify status contract accept the same two forms', () => {
  for (const [name, wf] of [['portal-v2-live-preview', livePreview], ['portal-v2-production-dom-readback', domReadback]]) {
    assert.match(wf, /deploy-preview-\$\{(PR_NUMBER|pr_number)\}--bedrijfsgeheugen\.netlify\.app/, name + ' must accept the exact numbered alias');
    assert.match(wf, /netlify-immutable-preview-target\.mjs/, name + ' must keep the dashboard form via the helper');
    assert.match(wf, /\^\[a-f0-9\]\{24\}\$/, name + ' must require a 24-hex deploy id');
  }
});

// Fingerprint ci|netlify-preview-closed-pr-race|portal-v2-live-preview|20261029-v1
// Auto-merge closes the PR within minutes; the workflow_run then starts after the merge, the numbered
// alias no longer serves the PR head, and the wait loop ended red after 9 minutes.
test('replay: a closed or merged PR ends the wait without failing and skips every later step', () => {
  assert.match(livePreview, /pulls\/\$\{PR_NUMBER\}"[^\n]*jq -r '\.state'/);
  assert.match(livePreview, /\[ "\$pr_state" != "open" \]/);
  assert.match(livePreview, /echo "PREVIEW_PR_CLOSED=1" >> "\$GITHUB_ENV"/);
  const stepsAfterWait = livePreview.split('Wait for exact Netlify preview SHA')[1].split('\n      - name: ').slice(1);
  assert.ok(stepsAfterWait.length >= 10);
  for (const step of stepsAfterWait) {
    const name = step.split('\n')[0];
    if (name === 'Upload visual evidence') continue;
    assert.match(step, /\n {8}if: env\.PREVIEW_PR_CLOSED != '1'/, 'step must be skipped for a closed PR: ' + name);
  }
});

test('shadow: an open PR still waits and still fails on a real provider failure or timeout', () => {
  assert.match(livePreview, /Timed out waiting for immutable Netlify preview on exact head SHA"\n\s+exit 1/);
  assert.match(livePreview, /Netlify preview failed for \$HEAD_SHA: \$state/);
  assert.doesNotMatch(livePreview, /actions: write/);
});
