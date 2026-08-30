import test from 'node:test';
import assert from 'node:assert/strict';
import { aggregateTokenUsage, normalizeProviderTokenUsage } from '../platform/cost/ai-token-usage.mjs';

test('normalizes Anthropic usage without retaining prompts or provider payloads', () => {
  const record = normalizeProviderTokenUsage({
    provider: 'Anthropic',
    providerModelId: 'ANTHROPIC-SONNET',
    componentKey: 'agent:website-qa',
    requestId: 'REQ-1',
    at: '2026-08-30T08:00:00Z',
    usage: {
      input_tokens: 120,
      output_tokens: 40,
      cache_read_input_tokens: 30,
      cache_creation_input_tokens: 10,
      raw_prompt: 'NEVER STORE',
    },
  });

  assert.deepEqual(record, {
    schemaVersion: 1,
    requestId: 'REQ-1',
    componentKey: 'agent:website-qa',
    provider: 'Anthropic',
    providerModelId: 'ANTHROPIC-SONNET',
    inputTokens: 120,
    outputTokens: 40,
    cacheReadTokens: 30,
    cacheWriteTokens: 10,
    totalTokens: 200,
    at: '2026-08-30T08:00:00.000Z',
  });
  assert.equal(JSON.stringify(record).includes('NEVER STORE'), false);
});

test('rejects malformed, negative or identity-free usage records', () => {
  const base = {
    provider: 'Anthropic', providerModelId: 'M1', componentKey: 'agent:a', requestId: 'R1',
    at: '2026-08-30T08:00:00Z', usage: { input_tokens: 1, output_tokens: 1 },
  };
  assert.throws(() => normalizeProviderTokenUsage({ ...base, requestId: '' }), /requestId/);
  assert.throws(() => normalizeProviderTokenUsage({ ...base, usage: { input_tokens: -1, output_tokens: 1 } }), /token/i);
  assert.throws(() => normalizeProviderTokenUsage({ ...base, at: 'invalid' }), /timestamp/i);
});

test('aggregates idempotently and reports exact monthly and daily token budget state', () => {
  const rows = [
    { requestId: 'A', componentKey: 'agent:a', inputTokens: 100, outputTokens: 20, cacheReadTokens: 0, cacheWriteTokens: 0, totalTokens: 120, at: '2026-08-30T08:00:00Z' },
    { requestId: 'A', componentKey: 'agent:a', inputTokens: 100, outputTokens: 20, cacheReadTokens: 0, cacheWriteTokens: 0, totalTokens: 120, at: '2026-08-30T08:00:00Z' },
    { requestId: 'B', componentKey: 'agent:b', inputTokens: 200, outputTokens: 30, cacheReadTokens: 20, cacheWriteTokens: 0, totalTokens: 250, at: '2026-08-29T08:00:00Z' },
  ];
  const summary = aggregateTokenUsage(rows, {
    monthlyLimitTokens: 10_000,
    now: '2026-08-30T12:00:00+02:00',
    timezone: 'Europe/Amsterdam',
  });

  assert.equal(summary.usedTokens, 370);
  assert.equal(summary.tokensToday, 120);
  assert.equal(summary.remainingTokens, 9_630);
  assert.equal(summary.coverage, 'RECORDED_PROVIDER_CALLS_ONLY');
  assert.deepEqual(summary.components.map(row => [row.componentKey, row.totalTokens]), [['agent:b', 250], ['agent:a', 120]]);
});
