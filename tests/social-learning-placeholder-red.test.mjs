import test from 'node:test';
import assert from 'node:assert/strict';

test('Powerhouse learning implementation is not present before RED proof', async()=>{
  await assert.rejects(import('../netlify/functions/_social-learning-model.mjs'));
});
