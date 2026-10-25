import { strict as assert } from 'node:assert';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const workflow = readFileSync(
  new URL('../.github/workflows/powerhouse-terminal-writer-lease-closure-guard.yml', import.meta.url),
  'utf8',
);
const runMarker = '        run: |\n';
const markerIndex = workflow.indexOf(runMarker);
assert.notEqual(markerIndex, -1, 'Expected existing terminal guard shell step');
const script = workflow.slice(markerIndex + runMarker.length)
  .split('\n')
  .map(line => line.startsWith('          ') ? line.slice(10) : line)
  .join('\n');

function bashRun(body, args = ['-s']) {
  return spawnSync('bash', args, {
    input: script,
    encoding: 'utf8',
    timeout: 5000,
    env: {
      ...process.env,
      PR_BODY: body,
      PR_NUMBER: '999999',
      GITHUB_REPOSITORY: 'fixture/fixture',
    },
  });
}

test('terminal lease guard has valid bash syntax and one reopening path', () => {
  const parsed = bashRun('', ['-n']);
  assert.equal(parsed.status, 0, parsed.stderr);
  assert.equal((script.match(/gh api --method PATCH/g) || []).length, 1);
  assert.equal((script.match(/lease_owner=/g) || []).length, 1);
  assert.match(script, /grep -Eq '\^Writer-Lease-State: \(TERMINAL_DELIVERY\|MAIN_SYNC\)\$'/);
});

test('unrelated PR close is a safe no-op without requiring GitHub writes', () => {
  const result = bashRun('Writer-Lease-State: CANDIDATE\nObligation-ID: fixture');
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /No active terminal\/main-sync writer lease/);
});

for (const state of ['TERMINAL_DELIVERY', 'MAIN_SYNC']) {
  test('active ' + state + ' with missing lease metadata fails closed before GitHub writes', () => {
    const result = bashRun('Writer-Lease-State: ' + state + '\nObligation-ID: fixture');
    assert.notEqual(result.status, 0);
    assert.match(result.stdout, /metadata is incomplete; fail closed/);
  });
}
