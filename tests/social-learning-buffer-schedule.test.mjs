import test from 'node:test';
import assert from 'node:assert/strict';
import bufferCollect, { config, runBufferCollection } from '../netlify/functions/buffer-social-collect.mjs';

test('Buffer collector is scheduled natively and not through Make', () => {
  assert.equal(config.schedule, '15 */6 * * *');
});

test('missing Buffer credential records one fail-closed obligation', async () => {
  const obligations=[];
  const store={recordObligation:async obligation=>obligations.push(obligation)};
  const result=await runBufferCollection({apiKey:null,store,now:new Date('2026-09-09T10:00:00Z')});
  assert.equal(result.ok,false);
  assert.equal(result.reason,'BUFFER_API_KEY_REQUIRED');
  assert.equal(obligations.length,1);
  assert.equal(obligations[0].id,'buffer-social-learning:credential');
});

test('scheduled handler returns 503 when credential is absent instead of false green', async () => {
  const response=await bufferCollect({apiKey:null,store:{recordObligation:async()=>{}}});
  assert.equal(response.status,503);
});
