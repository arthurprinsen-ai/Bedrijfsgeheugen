import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import handler from '../netlify/functions/frisse-blik-lead-intake.mjs';
const html=readFileSync(new URL('../frisse-blik.html',import.meta.url),'utf8');
const url='https://www.bedrijfsgeheugen.nl/.netlify/functions/frisse-blik-lead-intake';
const input={
  idempotency_key:'8be37b28-6880-4b29-b957-7789b031d16f',contact_name:'Test Contact',
  company_name:'Voorbeeld BV',email:'test@example.invalid',
  scan_followup_consent:true,marketing_consent:false,website:'',
  scan_score:60,attribution:{session_id:'f7316d44-80cb-4566-a87b-d05e44e7a677',utm_source:'organic'}
};
const req=(data,origin='https://www.bedrijfsgeheugen.nl')=>new Request(url,{
  method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify(data)
});
test('voluntary CTA with distinct unchecked marketing consent and fail-closed capture',()=>{
  assert.match(html,/id="scan-next-step-booking"/);
  assert.match(html,/id="ldMarketing"/);
  assert.doesNotMatch(html,/id="ldMarketing"[^>]*checked/);
  assert.match(html,/await captureScanLead\(lead\)/);
  assert.match(html,/LEAD_NOT_STORED/);
  assert.doesNotMatch(html,/if\(!dashUnlocked && !PREVIEW\) openLead\(\)/);
  assert.match(html,/utm_content/);
});
test('rejects passive anonymous scan and third-party form posts without writing',async()=>{
  const missing=await handler(req({...input,scan_followup_consent:false}));
  assert.equal(missing.status,422);
  const crossSite=await handler(req(input,'https://other.example'));
  assert.equal(crossSite.status,403);
  const marketingMissing=await handler(req({...input,marketing_consent:undefined}));
  assert.equal(marketingMissing.status,422);
});
test('stores only with first-party explicit followup permission and checks DB readback',async()=>{
  const priorNetlify=globalThis.Netlify,priorFetch=globalThis.fetch;
  const calls=[];
  globalThis.Netlify={env:{get(name){
    return {BG_PORTAL_EU_SUPABASE_URL:'https://adhjwmvyoixzjtmiroln.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY:'stub-secret'}[name]||'';
  }}};
  globalThis.fetch=async(resource,options)=>{
    calls.push({resource,options});
    if(options.method==='POST')return new Response('[]',{status:201});
    const row=JSON.parse(calls[0].options.body);
    return new Response(JSON.stringify([{lead_id:'simulated-db-id',email:row.email,
      source:row.source,attribution_root_key:row.attribution_root_key,metadata:row.metadata}]),{status:200});
  };
  try{
    const response=await handler(req(input));
    assert.equal(response.status,201);
    const receipt=await response.json();
    assert.equal(receipt.stored,true);
    assert.equal(receipt.lead_id,'simulated-db-id');
    assert.equal(calls.length,2);
    assert.equal(new URL(calls[0].resource).pathname,'/rest/v1/commercial_leads');
    const row=JSON.parse(calls[0].options.body);
    assert.equal(row.metadata.consent.scan_followup.granted,true);
    assert.equal(row.metadata.consent.marketing_email.granted,false);
    assert.equal(row.attribution_root_key,input.attribution.session_id);
    assert.equal(row.metadata.booking.status,'NOT_PROVIDER_VERIFIED');
    assert.equal(row.source,'frisse_blik_voluntary_postscan');
  }finally{globalThis.Netlify=priorNetlify;globalThis.fetch=priorFetch;}
});