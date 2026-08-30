import test from 'node:test';
import assert from 'node:assert/strict';
import { createCostDashboardHandler } from '../platform/api/cost-dashboard-handler.mjs';

const request = (method = 'GET') => new Request('https://example.test/api/powerhouse-costs', { method });

test('anonymous requests are unauthorized with fail-closed security headers', async () => {
  const handler = createCostDashboardHandler({ getUser: async () => null, store: { get: async () => null } });
  const response = await handler(request());

  assert.equal(response.status, 401);
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  assert.equal(response.headers.get('x-frame-options'), 'DENY');
  assert.match(response.headers.get('content-security-policy'), /default-src 'none'/);
});

test('wrong server-controlled role is forbidden', async () => {
  const handler = createCostDashboardHandler({
    getUser: async () => ({ id: 'U1', app_metadata: { roles: ['viewer'] }, user_metadata: { roles: ['powerhouse-cost-admin'] } }),
    store: { get: async () => ({}) },
  });

  assert.equal((await handler(request())).status, 403);
});

test('correct role receives only the sanitized current projection', async () => {
  const handler = createCostDashboardHandler({
    getUser: async () => ({ id: 'U1', roles: ['powerhouse-cost-admin'], appMetadata: { roles: ['powerhouse-cost-admin'] } }),
    store: { get: async () => ({
      schemaVersion: 1,
      sourceUpdatedAt: '2026-08-30T08:00:00Z',
      budget: { monthlyLimit: 10_000, usedCredits: 2_000, state: 'GREEN', dailyAllowance: 300, monthlyTokenLimit: 10_000, usedTokens: 370, remainingTokens: 9_630, tokensToday: 120, tokenCoverage: 'RECORDED_PROVIDER_CALLS_ONLY' },
      components: [{ componentKey: 'make:159', name: 'BG159', kind: 'MAKE_SCENARIO', creditsDelta: 20, tokensToday: null, tokensMonth: null, tokenCoverage: 'UNMETERED', runDecision: 'RUN' }],
      savings: [{ componentKey: 'make:159', creditsSaved: 10, verified: true }],
      rawPrompt: 'SECRET',
      crmContact: 'PRIVATE',
    }) },
    now: () => '2026-08-30T08:05:00Z',
  });
  const response = await handler(request());
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.budget.monthlyLimit, 10_000);
  assert.equal(body.budget.usedTokens, 370);
  assert.equal(body.budget.tokenCoverage, 'RECORDED_PROVIDER_CALLS_ONLY');
  assert.equal(body.components[0].tokenCoverage, 'UNMETERED');
  assert.equal(body.components[0].componentKey, 'make:159');
  assert.equal(body.freshness, 'CURRENT');
  assert.equal(JSON.stringify(body).includes('SECRET'), false);
  assert.equal(JSON.stringify(body).includes('PRIVATE'), false);
});

test('dashboard API is read-only', async () => {
  const handler = createCostDashboardHandler({
    getUser: async () => ({ id: 'U1', app_metadata: { roles: ['powerhouse-cost-admin'] } }),
    store: { get: async () => ({}) },
  });

  const response = await handler(request('POST'));
  assert.equal(response.status, 405);
  assert.equal(response.headers.get('allow'), 'GET');
});
