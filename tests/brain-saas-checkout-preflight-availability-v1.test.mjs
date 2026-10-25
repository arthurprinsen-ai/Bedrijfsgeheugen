import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('public checkout fails closed on missing payment readiness before collecting customer information',async()=>{
 const page=await readFile('afsluiten.html','utf8');
 assert.match(page,/fetch\('\/api\/checkout\/readiness',\{cache:'no-store',credentials:'same-origin'\}\)/);
 assert.match(page,/checkoutForm\.querySelectorAll\('input'\)\.forEach\(field=>\{field\.disabled=!checkoutReady\}\)/);
 assert.match(page,/checkoutSubmit\.disabled=!checkoutReady/);
 assert.match(page,/data\?\.selfServeAvailable===true/);
 assert.match(page,/\.catch\(\(\)=>setCheckoutReady\(false\)\)/);
 assert.match(page,/if\(!checkoutReady\)\{setCheckoutReady\(false\);return\}/);
 assert.match(page,/role="status" aria-live="polite"/);
 assert.match(page,/Online betalen is op dit moment niet beschikbaar\. Neem contact met ons op\./);
});
test('existing payment confirmation bypasses new-purchase availability gate, not provider verification',async()=>{
 const page=await readFile('afsluiten.html','utf8');
 assert.match(page,/if\(q\.get\('success'\)!=='1'\)\{/);
 assert.match(page,/\/api\/checkout\/readiness\?session_id=/);
 assert.match(page,/response\.ok&&data\.ready===true/);
 assert.match(page,/checkoutToAccount'\)\.href='https:\/\/www\.bedrijfsgeheugen\.nl\/pages\/mijn-account\.html\?activate=subscription'/);
});
test('existing Playwright fixture covers provider-ready and provider-blocked scenarios on NL/EN mobile and desktop',async()=>{
 const fixture=await readFile('tools/site-shell/checkout-browser-check.mjs','utf8');
 assert.match(fixture,/billingAvailable=true/);
 assert.match(fixture,/billingAvailable=false/);
 assert.match(fixture,/createCountBeforeBlocked/);
 assert.match(fixture,/blocked checkout must not contact create provider/);
 assert.match(fixture,/\/en\/afsluiten/);
 assert.match(fixture,/width:390,height:844/);
});
