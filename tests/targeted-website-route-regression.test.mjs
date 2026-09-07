import test from 'node:test';
import assert from 'node:assert/strict';
import { newPageErrors, summarizeRouteResult, productionPageErrors } from '../tools/site-shell/verify-targeted-website-routes.mjs';

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

test('production readback treats pre-merge-validated console errors as informational', () => {
  const observed = ['Unexpected end of input', 'missing ) after argument list'];
  assert.deepEqual(productionPageErrors(observed, true), []);
  assert.deepEqual(productionPageErrors(observed, false), observed);
  assert.equal(summarizeRouteResult({
    visibleText: 'visible', html: '<main>visible</main>', pageErrors: productionPageErrors(observed, true),
    failedAssets: [], httpOk: true, identityOk: true,
  }).ok, true);
});

test('production readback still fails closed on hard route invariants', () => {
  assert.equal(summarizeRouteResult({
    visibleText: 'visible', html: '<main>visible</main>', pageErrors: [],
    failedAssets: ['script:/assets/broken.js'], httpOk: true, identityOk: true,
  }).ok, false);
  assert.equal(summarizeRouteResult({
    visibleText: 'visible', html: '<main>visible</main>', pageErrors: [],
    failedAssets: [], httpOk: false, identityOk: true,
  }).ok, false);
  assert.equal(summarizeRouteResult({
    visibleText: 'visible', html: '<main>visible</main>', pageErrors: [],
    failedAssets: [], httpOk: true, identityOk: false,
  }).ok, false);
});
