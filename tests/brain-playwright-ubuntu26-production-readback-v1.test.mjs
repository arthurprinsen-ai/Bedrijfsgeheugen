import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';

// Chromium installed for production proof must have a Playwright release that
// officially understands the CI host OS. Browser verification is never skipped.
const root=new URL('../',import.meta.url);
const source=path=>readFileSync(new URL(path,root),'utf8');
const contexts=[
 {path:'.github/workflows/portal-v2-production-dom-readback.yml',pkg:'@playwright/test'},
 {path:'.github/workflows/production-source-snapshot.yml',pkg:'playwright'},
 {path:'.github/workflows/production-release-readback.yml',pkg:'playwright'},
];
const pinned='1.61.0'; // Playwright's first stable Ubuntu 26.04-supported release.

test('common Chromium installer pins officially Ubuntu 26.04-compatible Playwright',()=>{
 const script=source('tools/ci/install-chromium.sh');
 assert.match(script,/PLAYWRIGHT_PACKAGE="\$\{PLAYWRIGHT_PACKAGE:-@playwright\/test@1\.61\.0\}"/);
 assert.match(script,/\$PLAYWRIGHT_CLI install --with-deps chromium/);
 assert.doesNotMatch(script,/1\.55\.0/);
 assert.match(script,/exit 1/,'installation failures must fail the gate, never be skipped');
});
for(const {path,pkg} of contexts){
 test(path+' uses the same verified browser major/minor',()=>{
  const file=source(path);
  assert.ok(file.includes('PLAYWRIGHT_PACKAGE='+pkg+'@'+pinned+' bash tools/ci/install-chromium.sh'),path+' should use same pinned runtime');
  assert.ok(!file.includes('PLAYWRIGHT_PACKAGE='+pkg+'@1.55.0'));
  assert.match(file,/install.*(?:production.*browser|Chromium)/i);
 });
}
