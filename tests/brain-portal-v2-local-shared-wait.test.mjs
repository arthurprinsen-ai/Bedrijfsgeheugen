import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workflow = readFileSync('.github/workflows/portal-v2-production-dom-readback.yml', 'utf8');
const shared = readFileSync('tools/ci/wait-for-url.sh', 'utf8');

test('Portal V2 approved source baseline uses canonical bounded local wait', () => {
  assert.ok(workflow.includes('POGINGEN=30 INTERVAL=1 bash "$GITHUB_WORKSPACE/tools/ci/wait-for-url.sh" "http://127.0.0.1:4173/portaal/demo/"'));
  assert.ok(!workflow.includes('for i in $(seq 1 30)'));
});

test('shared readiness script retains bounded status-driven retry contract', () => {
  assert.ok(shared.includes('POGINGEN="${POGINGEN:-72}"'));
  assert.ok(shared.includes('INTERVAL="${INTERVAL:-10}"'));
  assert.ok(shared.includes('laatste status'));
});

test('approved PR identity, server cleanup and visual assurance remain enforced', () => {
  assert.ok(workflow.includes('verified_head'));
  assert.ok(workflow.includes('pr_head_sha'));
  assert.ok(workflow.includes('kill "$server_pid"'));
  assert.ok(workflow.includes('VISUAL_CAPTURE_PATH'));
  assert.ok(workflow.includes('portal-v2-production-visual-regression.spec.js --workers=1'));
  assert.ok(workflow.includes('test -s artifacts/visual-baseline-pr/portal-v2-canvassen.png'));
});
