import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const path = '.github/workflows/required-gate-watchdog.yml';
const sourcePath = '.github/scripts/required-gate-watchdog.mjs';
const workflow = readFileSync(path, 'utf8');
const script = readFileSync(sourcePath, 'utf8');
const hasWrite = (text, key) => new RegExp('^\\s+' + key + ': write\\s*$', 'm').test(text);

test('watchdog job token has both PR and Issue write for existing PR timeline comment', () => {
  assert.equal(hasWrite(workflow, 'pull-requests'), true);
  assert.equal(hasWrite(workflow, 'issues'), true);
  assert.equal(hasWrite(workflow.replace('pull-requests: write', 'pull-requests: read'), 'pull-requests'), false);
  assert.equal(hasWrite(workflow.replace('issues: write', 'issues: read'), 'issues'), false);
  assert.match(script, /\/issues\/\$\{pr\.number\}\/comments/);
});

test('permission repair cannot broaden source, security or repository code writes', () => {
  assert.equal(hasWrite(workflow, 'actions'), true);
  assert.match(workflow, /^\s+contents: read\s*$/m);
  assert.doesNotMatch(workflow, /^\s+(contents|security-events|administration|id-token): write\s*$/m);
  assert.doesNotMatch(workflow, /secrets\.|personal_access_token|pull_request_target/);
});

test('same existing five-minute schedule, owner marker, bounded fanout and do-not-rerun gate retained', () => {
  assert.match(workflow, /cron: '\*\/5 \* \* \* \*'/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /required-gate-watchdog/);
  assert.match(script, /MAX_OWNER_SIGNALS_PER_TICK = 2/);
  assert.match(script, /hasOwnerSignal\(pr\.number, marker\)/);
  assert.match(script, /gateDecision\(required\) !== 'MISSING'/);
  assert.match(script, /SAME_OWNER_REPAIR_REQUIRED/);
  assert.doesNotMatch(script, /skipLayoutShift|disableCls|allowCls|forceGreen/);
});
