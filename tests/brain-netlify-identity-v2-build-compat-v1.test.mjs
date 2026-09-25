import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('identity build no longer hard-requires undocumented package internals',()=>{
  const src=fs.readFileSync('tools/bouw-powerhouse-auth.mjs','utf8');
  assert.match(src,/skipping obsolete vendoring/);
  assert.match(src,/repairCustomerPortalAuth/);
  assert.match(src,/transformIdentityTokenFlow/);
});

test('production locale verifier covers all mandatory routes',()=>{
  const src=fs.readFileSync('tools/site-shell/verify-pricing-i18n-production.mjs','utf8');
  for (const route of ["'/'","'/prijzen'","'/systemen-koppelen'"]) assert.ok(src.includes(route), 'missing '+route);
  assert.match(src,/switchPublicLocale\(page, 'en'/);
  assert.match(src,/switchPublicLocale\(page, 'nl'/);
});
