import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const redirects=readFileSync(new URL('../_redirects',import.meta.url),'utf8');

test('public Portal V2 demo keeps its clean URL through a rewrite',()=>{
  assert.match(redirects,/^\/portaal\/demo\s+\/portal-v2\/\s+200!$/m);
});

test('Ijsselmonde clean route enters Portal V2 but grants no tenant access by itself',()=>{
  assert.match(redirects,/^\/portaal\/ijsselmonde\s+\/portal-v2\/\s+200!$/m);
});

test('specific Portal V2 customer routes are ordered before generic /portaal redirect',()=>{
  const demo=redirects.indexOf('/portaal/demo  /portal-v2/  200!');
  const customer=redirects.indexOf('/portaal/ijsselmonde  /portal-v2/  200!');
  const generic=redirects.indexOf('/portaal  /portal-v2/  301!');
  assert.ok(demo>=0&&customer>=0&&generic>=0);
  assert.ok(demo<generic);
  assert.ok(customer<generic);
});
