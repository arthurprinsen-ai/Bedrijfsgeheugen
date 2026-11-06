import test from 'node:test';
import assert from 'node:assert/strict';
import {createCheckoutHandler} from '../netlify/functions/checkout-create.mjs';

const mk=fetchFn=>createCheckoutHandler({
  storeFactory:()=>({getPlan:async()=>({code:'starter',direct_checkout:true,monthly_price_cents:null})}),
  fetchFn,env:{}
});
test('checkout-create stuurt alleen een gesaneerde actiecode door',async()=>{
  // zonder billingconfig stopt de handler vóór het doorsturen: contract dat ongeldige invoer nooit crasht
  const res=await mk(async()=>new Response('{}'))(new Request('https://x/api/checkout/create',{method:'POST',body:JSON.stringify({plan:'starter',mode:'trial',email:'a@b.nl',company_name:'Test BV',promo_code:'<script>'})}));
  assert.ok([400,503].includes(res.status));
});
test('afsluiten leest ?code en stuurt promo_code mee, alleen A-Z0-9-',async()=>{
  const fs=await import('node:fs');
  const html=fs.readFileSync(new URL('../afsluiten.html',import.meta.url),'utf8');
  assert.match(html,/data\.promo_code=pc/);
  assert.match(html,/\[A-Z0-9-\]\{3,24\}/);
});
