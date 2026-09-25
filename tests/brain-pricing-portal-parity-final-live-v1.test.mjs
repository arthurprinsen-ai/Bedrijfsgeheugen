import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('pricing Portal parity promotion carries exact-source trigger and closure artifacts',async()=>{
  const workflow=await readFile('.github/workflows/production-source-snapshot.yml','utf8');
  const learning=JSON.parse(await readFile('brain/learning/pricing-portal-parity-final-live-v1.json','utf8'));
  const docs=await readFile('docs/changes/pricing-portal-parity-final-live-v1.md','utf8');
  const ledger=await readFile('docs/development-ledger-events/2026-09-25-pricing-portal-parity-final-live-v1.md','utf8');
  assert.match(workflow,/pricing-portal-parity-final-live-v1/);
  assert.equal(learning.fingerprint,'pricing-portal-parity-final-live-v1');
  assert.ok(Array.isArray(learning.evaluation.historical_replay));
  assert.match(docs,/exact-production/i);
  assert.match(ledger,/exact-production/i);
});
