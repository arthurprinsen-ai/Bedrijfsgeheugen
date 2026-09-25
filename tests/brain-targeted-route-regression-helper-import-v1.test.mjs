import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { isHardAssetFailure } from '../tools/site-shell/verify-targeted-website-routes.mjs';

test('targeted route regression helper is explicitly imported and preserves fail-closed asset semantics', async () => {
  const source = await readFile('tests/targeted-website-route-regression.test.mjs', 'utf8');
  assert.match(
    source,
    /import \{[^}]*isHardAssetFailure[^}]*\} from '\.\.\/tools\/site-shell\/verify-targeted-website-routes\.mjs';/
  );
  assert.equal(isHardAssetFailure({ type:'document', errorText:'net::ERR_ABORTED' }), false);
  assert.equal(isHardAssetFailure({ type:'document', errorText:'net::ERR_CONNECTION_RESET' }), true);
  assert.equal(isHardAssetFailure({ type:'script', errorText:'net::ERR_ABORTED' }), true);
  assert.equal(isHardAssetFailure({ type:'stylesheet', errorText:'net::ERR_ABORTED' }), true);
});
