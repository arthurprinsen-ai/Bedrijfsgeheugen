import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { newPageErrors, summarizeRouteResult, productionPageErrors, filterSettledNavigationFailures, isHardAssetFailure, shouldRetryTransientAssetObservation, navigateWithRetry } from '../tools/site-shell/verify-targeted-website-routes.mjs';

test('navigation recovers from one connection reset and requires a real response', async () => {
  let calls = 0;
  const response = { status: () => 200 };
  const page = {
    async goto() {
      calls += 1;
      if (calls === 1) throw new Error('page.goto: net::ERR_CONNECTION_RESET at https://preview.example/ai-act');
      return response;
    },
    async waitForTimeout() {},
  };
  assert.equal(await navigateWithRetry(page, 'https://preview.example/ai-act'), response);
  assert.equal(calls, 2);
});

test('persistent connection reset exhausts the existing navigation budget', async () => {
  let calls = 0;
  const failure = new Error('page.goto: net::ERR_CONNECTION_RESET');
  const page = {
    async goto() { calls += 1; throw failure; },
    async waitForTimeout() {},
  };
  await assert.rejects(navigateWithRetry(page, 'https://preview.example/ai-act'), error => error === failure);
  assert.equal(calls, 2);
});

test('certificate and application errors are never retried as transient transport', async () => {
  for (const message of ['net::ERR_CERT_AUTHORITY_INVALID', 'application syntax error']) {
    let calls = 0;
    const failure = new Error(message);
    const page = {
      async goto() { calls += 1; throw failure; },
      async waitForTimeout() {},
    };
    await assert.rejects(navigateWithRetry(page, 'https://preview.example/'), error => error === failure);
    assert.equal(calls, 1);
  }
});

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

test('website preview selection probes every affected route before trusting Netlify', async () => {
  const workflow = await readFile('.github/workflows/lane-website.yml', 'utf8');
  assert.match(workflow, /ROUTES_JSON: \$\{\{ needs\.classify\.outputs\.routes \}\}/);
  assert.match(workflow, /const routes=JSON\.parse\(process\.env\.ROUTES_JSON/);
  assert.match(workflow, /routes\.map\(route=>routeReady\(route\)\)/);
  assert.match(workflow, /readiness\.every\(Boolean\)/);
  assert.match(workflow, /AbortSignal\.timeout\(/);
  assert.match(workflow, /preview_mode=local-exact-candidate/);
});


test('settled successful document navigation does not fail on an aborted duplicate document request', () => {
  assert.deepEqual(filterSettledNavigationFailures(
    ['document:/', 'script:/assets/app.js'],
    { httpOk: true, finalUrl: 'https://deploy-preview.example/' },
  ), ['script:/assets/app.js']);
});

test('document failures remain hard failures without a successful final response', () => {
  assert.deepEqual(filterSettledNavigationFailures(
    ['document:/'],
    { httpOk: false, finalUrl: 'https://deploy-preview.example/' },
  ), ['document:/']);
});


test('benign aborted document request is not treated as a hard asset failure', () => {
  assert.equal(isHardAssetFailure({ type:'document', errorText:'net::ERR_ABORTED' }), false);
  assert.equal(isHardAssetFailure({ type:'document', errorText:'net::ERR_CONNECTION_RESET' }), true);
  assert.equal(isHardAssetFailure({ type:'script', errorText:'net::ERR_ABORTED' }), true);
  assert.equal(isHardAssetFailure({ type:'stylesheet', errorText:'net::ERR_ABORTED' }), true);
});


test('successful route with only failed assets gets a bounded fresh-page retry', () => {
  assert.equal(shouldRetryTransientAssetObservation({
    httpOk:true,
    identity:{ok:true},
    observedPageErrors:[],
    failedAssets:['script:/assets/app.js'],
  }), true);
  assert.equal(shouldRetryTransientAssetObservation({
    httpOk:true,
    identity:{ok:true},
    observedPageErrors:[],
    failedAssets:[],
  }), false);
  assert.equal(shouldRetryTransientAssetObservation({
    httpOk:false,
    identity:{ok:true},
    observedPageErrors:[],
    failedAssets:['script:/assets/app.js'],
  }), false);
  assert.equal(shouldRetryTransientAssetObservation({
    httpOk:true,
    identity:{ok:true},
    observedPageErrors:['runtime regression'],
    failedAssets:['script:/assets/app.js'],
  }), false);
});
