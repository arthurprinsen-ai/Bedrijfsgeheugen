import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

test('GitHub comment 403 cannot stop other PR Required-gate recovery or become green', () => {
  const first = 'a'.repeat(40), second = 'b'.repeat(40);
  const mock = `
    const when = new Date(Date.now() - 5 * 60_000).toISOString();
    const first = '${first}', second = '${second}';
    const reply = (value, status = 200) => status === 204
      ? new Response(null, { status })
      : new Response(JSON.stringify(value), { status, headers: { 'content-type': 'application/json' } });
    globalThis.fetch = async (input, init = {}) => {
      const u = new URL(input);
      const path = u.pathname;
      if (path.endsWith('/pulls')) return reply([
        { number: 4656, updated_at: when, head: { sha: first, ref: 'writer/a' }, base: { sha: second }, labels: [], body: 'Writer-Lease-Owner: website-original' },
        { number: 4662, updated_at: when, head: { sha: second, ref: 'writer/b' }, base: { sha: first }, labels: [], body: 'Writer-Lease-Owner: ci-original' }
      ]);
      if (path.endsWith('/actions/runs')) return reply({
        workflow_runs: u.searchParams.get('head_sha') === first
          ? [{ id: 101, name: 'Required test', head_sha: first, status: 'completed', conclusion: 'failure', created_at: when }]
          : []
      });
      if (path.endsWith('/issues/4656/comments')) {
        if (init.method === 'POST') return reply({ message: 'Resource not accessible by integration' }, 403);
        return reply([]);
      }
      if (path.endsWith('/actions/runs/101/jobs')) return reply({ jobs: [{ id: 202, name: 'website', conclusion: 'failure' }] });
      if (path.endsWith('/actions/workflows/required-test.yml/dispatches') && init.method === 'POST') return reply(null, 204);
      throw new Error('Unexpected mocked GitHub route: ' + u.href);
    };
  `;
  const result = spawnSync(process.execPath, [
    '--import', 'data:text/javascript;base64,' + Buffer.from(mock).toString('base64'),
    '.github/scripts/required-gate-watchdog.mjs'
  ], {
    cwd: process.cwd(), encoding: 'utf8',
    env: { ...process.env, GITHUB_REPOSITORY: 'arthurprinsen-ai/Bedrijfsgeheugen', GITHUB_TOKEN: 'mock-test-token' }
  });
  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stderr, /OWNER_HANDOFF_NOT_DELIVERED:#4656:required/);
  assert.match(result.stderr, /GitHub API 403/);
  assert.match(result.stdout, /REQUIRED_GATE_WATCHDOG_DISPATCHED:#4662:/);
  assert.match(result.stdout, /OWNER_HANDOFF_FAILURES:1/);
  assert.doesNotMatch(result.stdout, /FAILED_GATE_OWNER_RECOVERY_SIGNAL:#4656/);
});

test('existing watchdog has the narrowly scoped PR comment permissions and fixed bounded fail-closed policy', () => {
  const workflow = readFileSync('.github/workflows/required-gate-watchdog.yml', 'utf8');
  const code = readFileSync('.github/scripts/required-gate-watchdog.mjs', 'utf8');
  assert.match(workflow, /pull-requests: write/);
  assert.match(workflow, /issues: write/);
  assert.ok(workflow.includes("cron: '*/5 * * * *'"));
  assert.ok(code.includes("ownerSignalAttempts++"));
  assert.match(code, /OWNER_HANDOFF_NOT_DELIVERED/);
  assert.ok(code.includes('if (ownerSignalFailures.length) process.exitCode = 1;'));
  assert.doesNotMatch(code, /skipLayoutShift|disableCls|allowCls/i);
});
