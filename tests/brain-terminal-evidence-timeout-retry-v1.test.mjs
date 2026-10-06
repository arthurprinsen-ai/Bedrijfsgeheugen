import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const workflow=await readFile('.github/workflows/obligation-terminal-closure.yml','utf8');

test('terminal evidence retries exactly once only after timeout-after-commit signature', () => {
  assert.match(workflow,/for evidence_attempt in 1 2; do/);
  assert.match(workflow,/\[ "\$evidence_attempt" = "1" \].*\[ "\$http_status" = "422" \]/s);
  assert.match(workflow,/test\("aborted due to timeout"; "i"\)/);
  assert.match(workflow,/CONTROL_PLANE_EVIDENCE_TIMEOUT_AFTER_COMMIT_RETRY/);
});

test('non-timeout evidence failures remain fail-closed', () => {
  assert.match(workflow,/CONTROL_PLANE_EVIDENCE_HTTP_\$\{http_status\}/);
  assert.match(workflow,/exit 78/);
  assert.match(workflow,/CONTROL_PLANE_DURABLE_READBACK_REJECTED/);
});
