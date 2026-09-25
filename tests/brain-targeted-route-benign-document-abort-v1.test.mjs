import test from 'node:test';
import assert from 'node:assert/strict';
import { isHardAssetFailure } from '../tools/site-shell/verify-targeted-website-routes.mjs';

test('browser evidence ignores only benign aborted document navigation', () => {
  assert.equal(isHardAssetFailure({ type:'document', errorText:'net::ERR_ABORTED' }), false);
  assert.equal(isHardAssetFailure({ type:'document', errorText:'net::ERR_FAILED' }), true);
  assert.equal(isHardAssetFailure({ type:'script', errorText:'net::ERR_ABORTED' }), true);
});
