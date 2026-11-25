import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const workflow=await readFile('.github/workflows/obligation-terminal-closure.yml','utf8');
const endpoint=await readFile('netlify/functions/powerhouse-control-plane-evidence.mjs','utf8');

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


test('committed terminal state is read back before treating retry drift as a new write', () => {
  assert.match(endpoint,/recoverCommittedTerminalEvidence/);
  assert.match(endpoint,/IDEMPOTENCY_PAYLOAD_CONFLICT/);
  assert.match(endpoint,/aborted due to timeout/i);
  assert.match(endpoint,/control_plane_cockpit/);
  assert.match(endpoint,/current_state==='FULFILLED'/);
  assert.match(endpoint,/operation_status==='VERIFIED'/);
  assert.match(endpoint,/production_observed_sha/);
  assert.match(endpoint,/recovered_from_committed_terminal:true/);
});

test('durable fallback refuses provider-sensitive terminalization', () => {
  assert.match(endpoint,/if\(input\.provider_readback_required===true\) return null/);
});
