import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('original production mobile parity uses the canonical V2 demo entry, never retrying the redirect alias',()=>{
 const source=readFileSync(new URL('./integration/portal-v2-production-full-parity.spec.js',import.meta.url),'utf8');
 const boot=source.split('async function bootDemo(')[1]?.split('async function gotoPortalPage(')[0]||'';
 assert.match(boot,/\/portaal\/demo\?klant=demoAI&bg_full_parity=/);
 assert.doesNotMatch(boot,/page\.goto\([^)]*\/klantportaal/);
 assert.match(source,/PHONE_VIEWPORTS=\[\[320,720\],\[390,844\],\[430,932\]\]/);
 assert.match(source,/all 24 protected capabilities honor the declared 320, 390 and 430 mobile browser contract/);
 assert.match(source,/must not overflow/);
 assert.match(source,/__BG_PORTAL_DOMAIN_STATE__\?\.initialized/);
});
