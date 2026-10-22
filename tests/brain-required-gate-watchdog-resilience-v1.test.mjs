import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { retryableGitHubReadError } from '../tools/delivery/failed-gate-owner-routing.mjs';

const shouldRetry = (method, status, name) => retryableGitHubReadError({ method, status, name });

test('bounded transient GET only; 403/404 and all ambiguous writes fail closed', () => {
  for (const code of [429, 500, 502, 503, 504]) assert.equal(shouldRetry('GET', code), true);
  for (const name of ['AbortError', 'TimeoutError', 'TypeError'])
    assert.equal(shouldRetry('GET', 0, name), true);
  for (const code of [400, 401, 403, 404, 422])
    assert.equal(shouldRetry('GET', code), false);
  for (const method of ['POST', 'PATCH', 'DELETE', 'PUT'])
    assert.equal(shouldRetry(method, 503, 'TimeoutError'), false);
});

test('existing five minute watchdog isolates PR failures but does not report green', () => {
  const s = readFileSync('.github/scripts/required-gate-watchdog.mjs', 'utf8');
  const workflow = readFileSync('.github/workflows/required-gate-watchdog.yml', 'utf8');
  assert.match(workflow, /cron: '\*\/5 \* \* \* \*'/);
  assert.match(s, /MAX_READ_ATTEMPTS = 2/);
  assert.match(s, /READ_TIMEOUT_MS = 8_000/);
  assert.match(s, /AbortSignal\.timeout\(READ_TIMEOUT_MS\)/);
  assert.match(s, /method === 'GET' \? MAX_READ_ATTEMPTS : 1/);
  assert.match(s, /MAX_FAILED_PRS_PER_TICK = 3/);
  assert.match(s, /REQUIRED_GATE_WATCHDOG_PR_FAILURE/);
  assert.match(s, /if \(failedPrs > 0\) process\.exitCode = 1/);
  assert.match(s, /hasOwnerSignal\(pr\.number, marker\)/);
  assert.match(s, /MAX_OWNER_SIGNALS_PER_TICK = 2/);
  assert.match(s, /required-test\.yml\/dispatches/);
  assert.doesNotMatch(s, /skipLayoutShift|disableCls|allowCls/i);
});
