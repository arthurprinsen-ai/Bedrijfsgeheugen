import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workflow = readFileSync('.github/workflows/portal-v2-production-dom-readback.yml', 'utf8');
const shared = readFileSync('tools/ci/wait-for-url.sh', 'utf8');

test('Portal V2 approved source baseline uses canonical bounded local wait', () => {
  assert.match(workflow, /POGINGEN=30 INTERVAL=1 bash "\\$GITHUB_WORKSPACE\\/tools\\/ci\\/wait-for-url\\.sh" "http:\\/\\/127\\.0\\.0\\.1:4173\\/portaal\\/demo\\/"/);
  assert.doesNotMatch(workflow, /for\\s+i\\s+in\\s+\\$\\(seq 1 30\\)/);
});

test('shared readiness script retains bounded status-driven retry contract', () => {
  assert.match(shared, /POGINGEN="\\$\\{POGINGEN:-72\\}"/);
  assert.match(shared, /INTERVAL="\\$\\{INTERVAL:-10\\}"/);
  assert.match(shared, /laatste status/);
});

test('approved PR identity, source server cleanup and visual assurance remain enforced', () => {
  assert.match(workflow, /verified_head.*pr_head_sha/);
  assert.match(workflow, /trap 'kill "\\$server_pid"/);
  assert.match(workflow, /VISUAL_CAPTURE_PATH/);
  assert.match(workflow, /portal-v2-production-visual-regression\\.spec\\.js --workers=1/);
  assert.match(workflow, /test -s artifacts\\/visual-baseline-pr\\/portal-v2-canvassen\\.png/);
});
