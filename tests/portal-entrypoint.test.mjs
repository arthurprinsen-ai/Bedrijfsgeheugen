import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const redirects=await readFile(new URL('../_redirects',import.meta.url),'utf8');
const index=await readFile(new URL('../portal/index.html',import.meta.url),'utf8');

test('customer portal entrypoints canonicalize demos and real customers into Portal V2',()=>{
 assert.match(redirects,/^\/klantportaal\s+klant=demo1\s+\/portaal\/demo\s+301!$/m);
 assert.match(redirects,/^\/klantportaal\s+klant=demoAI\s+\/portaal\/demo\s+301!$/m);
 assert.match(redirects,/^\/klantportaal\s+klant=:klant\s+\/portaal\/:klant\s+301!$/m);
 assert.match(redirects,/^\/klantportaal\s+\/portaal\s+301!$/m);
 assert.match(redirects,/^\/portaal\/demo\s+\/portal-v2\/\s+200!$/m);
 assert.match(redirects,/^\/portaal\/\*\s+\/portal-v2\/:splat\s+200!$/m);
 assert.match(redirects,/^\/portaal\s+\/portal-v2\/\s+301!$/m);
 assert.match(redirects,/^\/portaal\.html\s+\/portal-v2\/\s+301!$/m);
});

test('legacy html remains directly addressable only as retained parity artifact',()=>{
 assert.doesNotMatch(redirects,/^\/klantportaal\.html\s+/m);
 assert.doesNotMatch(redirects,/^\/klantportaal\s+.*\/klantportaal\.html\s+200!$/m);
});

test('new portal entry keeps identity, secure app runtime and additive legacy runtime',()=>{
 assert.match(index,/netlify-identity-widget\.js/);
 assert.match(index,/\.\/app\.mjs/);
 assert.match(index,/\.\/legacy-runtime\.mjs/);
});
