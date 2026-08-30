import test from 'node:test';
import assert from 'node:assert/strict';
import { runWebsiteAnswer } from '../netlify/functions/_brain-ai.mjs';

const providerResponse = () => Response.json({
  content: [{ type: 'text', text: 'Brongebonden antwoord.' }],
  usage: {
    input_tokens: 90,
    output_tokens: 15,
    cache_read_input_tokens: 20,
    cache_creation_input_tokens: 0,
  },
});

test('records exact provider token usage under the governed Brain component', async () => {
  const recorded = [];
  const result = await runWebsiteAnswer({
    question: 'Wat doet Bedrijfsgeheugen?',
    fragments: 'Bedrijfsgeheugen borgt kennis.',
    apiKey: 'server-key',
    system: 'Antwoord uitsluitend uit de bron.',
    fetchImpl: async () => providerResponse(),
    usageStore: { record: async event => recorded.push(event) },
    requestId: 'REQ-TOKEN-1',
  });

  assert.equal(result.text, 'Brongebonden antwoord.');
  assert.equal(result.tokenMetering, 'RECORDED');
  assert.equal(result.tokenUsage.totalTokens, 125);
  assert.equal(recorded.length, 1);
  assert.equal(recorded[0].componentKey, 'agent:website-qa');
  assert.equal(recorded[0].requestId, 'REQ-TOKEN-1');
  assert.equal(JSON.stringify(recorded[0]).includes('server-key'), false);
  assert.equal(JSON.stringify(recorded[0]).includes('Bedrijfsgeheugen borgt kennis'), false);
});

test('token telemetry failure never discards a valid user answer', async () => {
  const result = await runWebsiteAnswer({
    question: 'Wat doet Bedrijfsgeheugen?',
    fragments: 'Bedrijfsgeheugen borgt kennis.',
    apiKey: 'server-key',
    system: 'Antwoord uitsluitend uit de bron.',
    fetchImpl: async () => providerResponse(),
    usageStore: { record: async () => { throw new Error('blob unavailable'); } },
    requestId: 'REQ-TOKEN-2',
  });

  assert.equal(result.text, 'Brongebonden antwoord.');
  assert.equal(result.tokenMetering, 'UNAVAILABLE');
  assert.equal(result.tokenUsage.totalTokens, 125);
});
