import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('production mobile parity boots through existing canonical public demo, not a 301 portal alias',()=>{
 const source=readFileSync(new URL('./integration/portal-v2-production-full-parity.spec.js',import.meta.url),'utf8');
 const redirects=readFileSync(new URL('../_redirects',import.meta.url),'utf8');
 assert.match(source,/\$\{BASE_URL\}\/portaal\/demo\?klant=demoAI&bg_full_parity=/);
 assert.doesNotMatch(source,/\$\{BASE_URL\}\/klantportaal\?klant=demoAI&bg_full_parity=/);
 assert.match(redirects,/\/klantportaal\s+klant=demoAI\s+\/portaal\/demo\s+301!/);
 assert.match(redirects,/\/portaal\/demo\s+\/portal-v2\/\s+200!/);
});

test('the old entry remains covered by separate route contract, without corrupting the live-browser parity test',()=>{
 const source=readFileSync(new URL('./integration/portal-v2-production-full-parity.spec.js',import.meta.url),'utf8');
 assert.match(source,/const retryableStatuses=new Set/);
 assert.match(source,/await page\.waitForFunction/);
 assert.match(source,/const PHONE_VIEWPORTS=\[\[320,720\],\[390,844\],\[430,932\]\]/);
});
