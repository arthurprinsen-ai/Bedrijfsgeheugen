import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');

test('Portal V2 BusinessInput modules never cross the redirected portal-next browser boundary', async()=>{
  const [portalState,domainState,compat,redirects]=await Promise.all([
    read('portal-v2/portal-state.js'),
    read('portal-v2/domain-state.js'),
    read('portal-next/portal-business-input-store.js'),
    read('_redirects')
  ]);
  assert.match(redirects,/^\/portal-next\/\*\s+\/portal-v2\/\s+301!/m);
  assert.doesNotMatch(portalState,/\.\.\/portal-next\/portal-business-input-store\.js/);
  assert.doesNotMatch(domainState,/\.\.\/portal-next\/portal-business-input-store\.js/);
  assert.match(portalState,/from '\.\/business-input-store\.js'/);
  assert.match(domainState,/import\('\.\/business-input-store\.js'\)/);
  assert.match(compat,/from '\.\.\/portal-v2\/business-input-store\.js'/);
});
