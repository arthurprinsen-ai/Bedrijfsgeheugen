import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateProductionReadback } from '../tools/verify-production-release.mjs';

test('matching merge and deployed SHA can become LIVE_VERIFIED', () => {
  assert.equal(evaluateProductionReadback({mergeSha:'a'.repeat(40), deployedSha:'a'.repeat(40), deployStatus:'ready', routesOk:true}).status, 'LIVE_VERIFIED');
});

test('SHA mismatch is never live success', () => {
  const result = evaluateProductionReadback({mergeSha:'a'.repeat(40), deployedSha:'b'.repeat(40), deployStatus:'ready', routesOk:true});
  assert.equal(result.status, 'RELEASE_INCOMPLETE');
  assert.equal(result.reason, 'production_sha_mismatch');
});

test('route regression keeps release non-green', () => {
  assert.equal(evaluateProductionReadback({mergeSha:'a'.repeat(40), deployedSha:'a'.repeat(40), deployStatus:'ready', routesOk:false}).status, 'PRODUCTION_RED');
});

test('non-ready production is release incomplete', () => {
  assert.equal(evaluateProductionReadback({mergeSha:'a'.repeat(40), deployedSha:'a'.repeat(40), deployStatus:'building', routesOk:true}).reason, 'production_not_ready');
});
