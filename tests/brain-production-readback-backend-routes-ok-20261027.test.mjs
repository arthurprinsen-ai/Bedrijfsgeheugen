import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { evaluateProductionReadback } from '../tools/site-shell/verify-production-release.mjs';

const workflow = readFileSync(new URL('../.github/workflows/production-release-readback.yml', import.meta.url), 'utf8');

function stepBlock(name) {
  const start = workflow.indexOf(`- name: ${name}`);
  assert.notEqual(start, -1, `step ${name} must exist`);
  const next = workflow.indexOf('\n      - ', start + 1);
  return workflow.slice(start, next === -1 ? undefined : next);
}

test('backend-only production truth does not require browser route verification', () => {
  const block = stepBlock('Evaluate immutable Netlify backend production truth');
  assert.match(block, /--routes-ok '\$\{\{ steps\.scope\.outputs\.browser_required != 'true' \|\| steps\.routes\.outcome == 'success' \}\}'/);
  assert.doesNotMatch(block, /--routes-ok '\$\{\{ steps\.routes\.outcome == 'success' \}\}'/);
});

test('website production truth still requires successful route verification', () => {
  const block = stepBlock('Evaluate immutable website production truth');
  assert.match(block, /--routes-ok '\$\{\{ steps\.routes\.outcome == 'success' \}\}'/);
});

test('exact ready deploy with routes not applicable is verified, a route regression stays red', () => {
  const sha = '8572034a51b064e1f896a7caa90d18caa29757ac';
  const base = { mergeSha: sha, deployedSha: sha, deployStatus: 'ready', deployId: '6ae0a31b2e94dd3e8c1d351c', deploymentRequired: true };
  assert.equal(evaluateProductionReadback({ ...base, routesOk: true }).status, 'LIVE_VERIFIED');
  assert.equal(evaluateProductionReadback({ ...base, routesOk: false }).reason, 'production_route_regression');
});
