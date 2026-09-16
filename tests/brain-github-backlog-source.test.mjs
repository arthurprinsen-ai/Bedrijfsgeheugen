import test from 'node:test';
import assert from 'node:assert/strict';
import { reconcileGitHubBacklog, resolveRuntimeBacklog } from '../scripts/brain/continuous-improvement/github-backlog-source.mjs';

test('live GitHub projection keeps non-PR obligations and only open known PRs', () => {
  const registry = {
    items: [
      { id: 'stale-obligation', kind: 'obligation', component: 'brain', problemClass: 'authority' },
      { id: '1774', kind: 'pull_request', component: 'engineering-os-learning', problemClass: 'closed-loop-runtime' },
      { id: '1582', kind: 'pull_request', component: 'commercial', problemClass: 'activation' }
    ]
  };
  const projected = reconcileGitHubBacklog(registry, [
    { number: 1774, title: 'known open', draft: false, head: { sha: 'abc' }, user: { login: 'arthur' } },
    { number: 2000, title: 'new unknown', draft: false, head: { sha: 'def' }, user: { login: 'dependabot[bot]' } }
  ]);
  assert.deepEqual(projected.items.map(item => item.id), ['stale-obligation','1774','2000']);
  assert.equal(projected.source_state.open_pull_requests, 2);
  assert.equal(projected.source_state.unknown_pull_requests, 1);
  assert.deepEqual(projected.source_state.registry_pull_requests_not_open, ['1582']);
  assert.equal(projected.items.find(item => item.id === '2000').component, '');
});

test('runtime backlog source falls back deterministically without credentials', async () => {
  const registry = { fingerprint: 'x', items: [] };
  const resolved = await resolveRuntimeBacklog(registry, { repository: null, token: null });
  assert.equal(resolved.fingerprint, 'x');
  assert.equal(resolved.source_state.mode, 'registry-fallback');
});
