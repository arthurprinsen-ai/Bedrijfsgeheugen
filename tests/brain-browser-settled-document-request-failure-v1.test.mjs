import test from 'node:test';
import assert from 'node:assert/strict';
import { filterSettledNavigationFailures } from '../tools/site-shell/verify-targeted-website-routes.mjs';

test('settled successful top-level document abort is filtered but hard assets remain', () => {
  assert.deepEqual(
    filterSettledNavigationFailures(
      ['document:/', 'script:/assets/app.js', 'stylesheet:/assets/app.css'],
      { httpOk: true, finalUrl: 'https://deploy-preview.example/' },
    ),
    ['script:/assets/app.js', 'stylesheet:/assets/app.css'],
  );
});

test('document failure remains fail-closed when final navigation is not successful', () => {
  assert.deepEqual(
    filterSettledNavigationFailures(
      ['document:/'],
      { httpOk: false, finalUrl: 'https://deploy-preview.example/' },
    ),
    ['document:/'],
  );
});
