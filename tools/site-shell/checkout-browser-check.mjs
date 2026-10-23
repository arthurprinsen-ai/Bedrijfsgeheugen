import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const base=String(process.env.UI_VR_BASE_URL||'').replace(/\/$/,'');
if(!base)throw Error('UI_VR_BASE_URL_REQUIRED');
const browser=await chromium.launch({headless:true});
try{
 for(const viewport of [{width:1440,height:1000},{width:390,height:844}]){
  for(const path of ['/afsluiten','/en/afsluiten']){
   const page=await browser.newPage({viewport});
   let ready=false,billingAvailable=true,createCalls=0;
   // Fixture-only API responses: never create a payment, growth event or customer record.
   await page.route('**/api/**',async route=>{
    const url=new URL(route.request().url());
    const create=url.pathname==='/api/checkout/create';
    if(create)createCalls++;
    const readiness=url.pathname==='/api/checkout/readiness';
    const result=create?{error:'billing_not_configured'}:readiness
      ?(url.searchParams.has('session_id')?{ready}:{selfServeAvailable:billingAvailable,state:billingAvailable?'ready':'blocked'})
      :{};
    await route.fulfill({status:create?503:200,contentType:'application/json',body:JSON.stringify(result)});
   });
   await page.goto(`${base}${path}?plan=pro&billing=yearly`,{waitUntil:'domcontentloaded',timeout:45000});
   await page.waitForFunction(()=>document.querySelector('#plan')?.value==='pro');
   assert.equal(await page.locator('#billingCycle').inputValue(),'yearly');
   assert.match(await page.locator('#price').textContent(),/2\.990/);
   assert.equal(await page.locator('#checkout').isVisible(),true);
   await page.waitForFunction(()=>document.querySelector('#submit')?.disabled===false);
   await page.locator('#company').fill('Checkout fixture');
   await page.locator('#email').fill('checkout-fixture@example.invalid');
   await page.locator('#form input[type="checkbox"]').check({force:true});
   await page.locator('#form').evaluate(form=>form.requestSubmit());
   await page.waitForFunction(()=>(document.querySelector('#status')?.textContent.trim().length||0)>0);
   assert.equal(await page.locator('#status').isVisible(),true);
   assert.equal(await page.locator('#submit').isDisabled(),false);
   await page.goto(`${base}${path}?success=1&session_id=cs_fixture`,{waitUntil:'domcontentloaded',timeout:45000});
   await page.waitForFunction(()=>document.querySelector('#checkout')?.hidden===true);
   assert.equal(await page.locator('#checkout').isVisible(),false,'pending payment must hide the purchase grid');
   assert.equal(await page.locator('#success').isVisible(),true);
   assert.equal(await page.locator('#checkoutContinue').isVisible(),false,'query string alone cannot prove payment');
   ready=true;
   await page.reload({waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>document.querySelector('#checkoutContinue')?.hidden===false);
   assert.equal(await page.locator('#checkoutContinue a').isVisible(),true);
   assert.equal(await page.locator('#checkout').isVisible(),false);
   // An unavailable provider must block personal input and all create attempts.
   billingAvailable=false;
   const createCountBeforeBlocked=createCalls;
   await page.goto(`${base}${path}?plan=pro&billing=yearly`,{waitUntil:'domcontentloaded',timeout:45000});
   await page.waitForFunction(()=>document.querySelector('#status')?.textContent.includes('Online betalen is op dit moment niet beschikbaar'));
   assert.equal(await page.locator('#status').isVisible(),true);
   assert.equal(await page.locator('#submit').isDisabled(),true);
   assert.equal(await page.locator('#email').isDisabled(),true);
   assert.equal(createCalls,createCountBeforeBlocked,'blocked checkout must not contact create provider');
   await page.close();
  }
 }
 console.log('CHECKOUT_BROWSER_FIXTURES_OK desktop/mobile NL/EN; no provider purchase');
}finally{await browser.close();}
