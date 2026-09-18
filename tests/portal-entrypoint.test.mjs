import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const redirects=await readFile(new URL('../_redirects',import.meta.url),'utf8');
const index=await readFile(new URL('../portal/index.html',import.meta.url),'utf8');

test('customer portal entrypoints converge on Portal V2 while preserving tenant slugs',()=>{
 assert.match(redirects,/^\/klantportaal\s+klant=demo1\s+\/portaal\/demo\s+301!$/m);
 assert.match(redirects,/^\/klantportaal\s+klant=demoAI\s+\/portaal\/demo\s+301!$/m);
 assert.match(redirects,/^\/klantportaal\s+klant=:klant\s+\/portaal\/:klant\s+301!$/m);
 assert.match(redirects,/^\/klantportaal\s+\/portaal\s+301!$/m);
 assert.match(redirects,/^\/portaal\/demo\s+\/portal-v2\/\s+200!$/m);
 assert.match(redirects,/^\/portaal\/\*\s+\/portal-v2\/:splat\s+200!$/m);
 assert.match(redirects,/^\/portaal\s+\/portal-v2\/\s+301!$/m);
 assert.match(redirects,/^\/portaal\.html\s+\/portal-v2\/\s+301!$/m);
});

test('legacy html remains directly addressable for the same-origin parity bridge',()=>{
 assert.doesNotMatch(redirects,/^\/klantportaal\.html\s+/m);
});

test('new portal entry keeps identity, secure app runtime and additive legacy runtime',()=>{
 assert.match(index,/netlify-identity-widget\.js/);
 assert.match(index,/\.\/app\.mjs/);
 assert.match(index,/\.\/legacy-runtime\.mjs/);
});
