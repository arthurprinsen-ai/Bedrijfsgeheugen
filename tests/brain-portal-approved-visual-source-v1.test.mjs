import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workflow=readFileSync('.github/workflows/portal-v2-production-dom-readback.yml','utf8');
const fixture=readFileSync('tests/integration/portal-v2-production-visual-regression.spec.js','utf8');

test('historical replay: canceled Netlify PR preview cannot skip approved screenshot',()=>{
  assert.match(workflow,/Netlify has no immutable exact-head preview/);
  assert.match(workflow,/git fetch --no-tags origin "\+refs\/pull\/\$\{pr_number\}\/head/);
  assert.match(workflow,/\[ "\$verified_head" != "\$pr_head_sha" \]/);
  assert.match(workflow,/git worktree add --detach "\$source_dir" "\$pr_head_sha"/);
  assert.match(workflow,/VISUAL_CAPTURE_PATH="\$GITHUB_WORKSPACE\/artifacts\/visual-baseline-pr\/portal-v2-canvassen\.png"/);
  assert.match(workflow,/Visual regression against approved PR baseline/);
});

test('shadow: evidence fails if screenshot or immutable Netlify identity missing',()=>{
  assert.match(workflow,/test -s artifacts\/visual-baseline-pr\/portal-v2-canvassen\.png/);
  assert.match(workflow,/Wait for exact deployed SHA and pin immutable deploy/);
  assert.match(workflow,/verified_sha.*pr_head_sha/);
  assert.match(workflow,/expected_id.*verified_id/);
});

test('canary: browser regression retains strict pixel baseline',()=>{
  assert.match(fixture,/maxDiffPixelRatio:0\.001/);
  assert.match(fixture,/expect\(actual\)\.toMatchSnapshot/);
  assert.match(fixture,/\[data-functional-workspace="canvassen"\]/);
});
