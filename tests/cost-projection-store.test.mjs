import test from 'node:test';
import assert from 'node:assert/strict';
import { createNotionCostProjectionSource } from '../netlify/functions/_cost-projection-store.mjs';

test('Notion cost source turns the latest BG159 aggregate into a dashboard projection source', async () => {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, options });
    return Response.json({
      results: [{
        properties: {
          Startdatum: { date: { start: '2026-08-30T08:00:00Z' } },
          Bewijs: { rich_text: [{ plain_text: JSON.stringify({
            v: 'BG159-v6-budget',
            total: { centicredits: 250_000, operations: 400, transfer: 2_000 },
            delta: { credits: 25, operations: 40, transfer: 200 },
            budget: { monthly_limit: 10_000, used_credits: 2_500, remaining_credits: 7_500, daily_allowance: 3_750, state: 'GREEN', decision: 'RUN' },
            catalog: [{ id: 159, n: 'BG159', state: 'active', c: 2_000, o: 50, t: 900, dc: 5, dops: 4, dt: 80 }],
          }) }] },
        },
      }],
    });
  };
  const source = createNotionCostProjectionSource({ fetchImpl, token: 'server-token', dataSourceId: 'cost-source' });
  const record = await source.get();

  assert.equal(record.budget.monthlyLimit, 10_000);
  assert.equal(record.components[0].componentKey, 'make:159');
  assert.equal(record.components[0].creditsDelta, 5);
  assert.equal(record.components.some(component => component.componentKey === 'agent:agent-cost'), true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].options.headers.authorization, 'Bearer server-token');
  assert.equal(JSON.stringify(record).includes('server-token'), false);
});

test('Notion cost source fails closed when no server token is configured', async () => {
  const source = createNotionCostProjectionSource({ fetchImpl: async () => { throw new Error('must not call'); }, token: '', dataSourceId: 'cost-source' });
  assert.equal(await source.get(), null);
});
