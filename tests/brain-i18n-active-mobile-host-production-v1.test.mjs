import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const runtime = fs.readFileSync('assets/js/i18n.js','utf8');
const proof = fs.readFileSync('tools/site-shell/verify-pricing-i18n-production.mjs','utf8');

test('mobile locale control mounts into every distinct navigation host',()=>{
  assert.match(runtime,/const mobileHosts = \[/);
  assert.match(runtime,/document\.getElementById\('bgkopMob'\)/);
  assert.match(runtime,/for \(const mobileHost of mobileHosts\)/);
  assert.doesNotMatch(runtime,/if \(!mobileRoot && legacyMobile/);
});

test('production locale proof uses active visible mobile control on all mandatory routes',()=>{
  assert.match(proof,/async function getVisibleMobileLanguage\(page\)/);
  assert.match(proof,/#v18MobileDrawer/);
  assert.match(proof,/#mobileToggle/);
  assert.match(proof,/#bgkopMob \[data-bg-language-select\]/);
  assert.match(proof,/\[data-bg-language-select\]:visible/);
  for (const route of ["'/'","'/prijzen'","'/systemen-koppelen'"]) assert.ok(proof.includes(route), 'missing route '+route);
  assert.match(proof,/selectOption\('en'\)/);
  assert.match(proof,/selectOption\('nl'\)/);
});
