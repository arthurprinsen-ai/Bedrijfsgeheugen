import test from 'node:test';
import assert from 'node:assert/strict';
import { PUBLIC_PAGE_EXCLUDES } from '../../tools/site-shell/contracts.mjs';

test('customer portal selftest is excluded from the public SEO/shell estate',()=>{
  assert.ok(
    PUBLIC_PAGE_EXCLUDES.has('klantenportaal-selftest.html'),
    'klantenportaal-selftest.html must never enter the public SEO/structured-data pipeline'
  );
});
