import test from 'node:test';
import assert from 'node:assert/strict';
import { newPageErrors, summarizeRouteResult } from '../tools/site-shell/verify-targeted-website-routes.mjs';

test('existing baseline page errors do not become a release regression', () => {
  const baseline = ['Unexpected end of input', 'missing ) after argument list'];
  const preview = ['Unexpected end of input', 'missing ) after argument list'];
  assert.deepEqual(newPageErrors(preview, baseline), []);
  assert.equal(summarizeRouteResult({
    visibleText: 'visible', html: '<main>visible</main>', pageErrors: newPageErrors(preview, baseline),
    failedAssets: [], httpOk: true, identityOk: true,
  }).ok, true);
});

test('a page error introduced by the preview still fails closed', () => {
  const errors = newPageErrors(['Unexpected end of input', 'new regression'], ['Unexpected end of input']);
  assert.deepEqual(errors, ['new regression']);
  assert.equal(summarizeRouteResult({
    visibleText: 'visible', html: '<main>visible</main>', pageErrors: errors,
    failedAssets: [], httpOk: true, identityOk: true,
  }).ok, false);
});
