import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const redirects=await readFile(new URL('../_redirects',import.meta.url),'utf8');
const index=await readFile(new URL('../portal/index.html',import.meta.url),'utf8');
const app=await readFile(new URL('../portal/app.mjs',import.meta.url),'utf8');

test('customer portal entrypoints preserve explicit demos and keep real scan customers on the full legacy portal',()=>{
 assert.match(redirects,/^\/klantportaal\s+klant=demo1\s+\/klantportaal-demo\.html\s+200!$/m);
 assert.match(redirects,/^\/klantportaal\s+klant=demoAI\s+\/portal\/\s+200!$/m);
 assert.match(redirects,/^\/klantportaal\s+klant=:klant\s+\/klantportaal\.html\s+200!$/m);
 assert.match(redirects,/^\/klantportaal\s+\/klantportaal-demo\.html\s+200!$/m);
 assert.match(redirects,/^\/portaal\s+\/portal\/\s+302!$/m);
 assert.match(redirects,/^\/portaal\.html\s+\/portal\/\s+302!$/m);
});

test('legacy html remains directly addressable for the same-origin parity bridge',()=>{
 assert.doesNotMatch(redirects,/^\/klantportaal\.html\s+/m);
});

test('new portal entry keeps identity, secure app runtime and additive legacy runtime',()=>{
 assert.match(index,/netlify-identity-widget\.js/);
 assert.match(index,/\.\/app\.mjs/);
 assert.match(index,/\.\/legacy-runtime\.mjs/);
});

test('portal only schedules a background refresh when the initial cache is stale',()=>{
 assert.match(app,/if\s*\(initial\.stale\)\s*queueMicrotask/);
});
