import test from 'node:test';
import assert from 'node:assert/strict';
import { PUBLIC_PAGE_EXCLUDES } from '../../tools/site-shell/contracts.mjs';

test('customer portal test harnesses are excluded from the public SEO/shell estate',()=>{
  for (const file of ['klantenportaal-selftest.html','klantenportaal-test.html']) {
    assert.ok(
      PUBLIC_PAGE_EXCLUDES.has(file),
      `${file} must never enter the public SEO/structured-data pipeline`
    );
  }
});
