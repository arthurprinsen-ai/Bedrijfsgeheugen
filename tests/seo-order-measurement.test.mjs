import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { injectGrowthMeasurement, hasGrowthMeasurement } from '../tools/seo-order-engine/measurement.mjs';

test('growth measurement is idempotent and contains non-blocking event delivery',()=>{const base='<html><body data-bg-page-role="money"><main><a href="https://www.bedrijfsgeheugen.nl/frisse-blik" data-bg-conversion="frisse-blik">Plan</a></main></body></html>';const out=injectGrowthMeasurement(base,{canonical:'https://www.bedrijfsgeheugen.nl/prijzen',page_role:'money',funnel_stage:'decide',intent:'kosten digitalisering mkb',keyword_cluster:'kosten digitalisering mkb'});assert.ok(hasGrowthMeasurement(out));assert.match(out,/navigator\.sendBeacon/);assert.match(out,/keepalive:true/);assert.match(out,/page_view/);assert.match(out,/organic_landing/);assert.match(out,/engaged_view/);assert.match(out,/primary_cta_click/);assert.match(out,/\/api\/growth-event/);assert.equal(injectGrowthMeasurement(out,{}),out);});

test('synthetic webdriver pageviews and interaction hooks never send paid Netlify growth events',()=>{
  const base='<html><body><main><a data-bg-conversion="frisse-blik" href="/frisse-blik">Plan</a></main></body></html>';
  const html=injectGrowthMeasurement(base,{canonical:'https://www.bedrijfsgeheugen.nl/prijzen',page_role:'money'});
  const script=html.match(/<script id="bg-growth-measurement">([\s\S]*?)<\/script>/i)?.[1];
  assert.ok(script);
  let eventCalls=0,sessionCalls=0,networkCalls=0;
  const window={__bgGrowthMeasurement:false,location:{origin:'https://www.bedrijfsgeheugen.nl'},addEventListener:()=>{eventCalls++;}};
  const context={window,navigator:{webdriver:true,sendBeacon:()=>{networkCalls++;return true;}},
    sessionStorage:{getItem:()=>{sessionCalls++;return '';},setItem:()=>{sessionCalls++;}},
    document:{addEventListener:()=>{eventCalls++;}},
    fetch:()=>{networkCalls++;return Promise.resolve({ok:true});}};
  assert.doesNotThrow(()=>vm.runInNewContext(script,context));
  assert.equal(window.__bgGrowthMeasurement,true);
  assert.equal(networkCalls,0,'automation must not invoke /api/growth-event');
  assert.equal(eventCalls,0,'automation must not install CRO event handlers');
  assert.equal(sessionCalls,0,'automation must not create visitor attribution sessions');
  assert.match(script,/navigator\.webdriver===true/);
});

test('generated growth measurement inline script is valid JavaScript',()=>{
  const base='<html><body><a href="https://www.bedrijfsgeheugen.nl/zelfscan" data-bg-conversion="zelfscan">Start</a><a href="https://www.bedrijfsgeheugen.nl/frisse-blik" data-bg-conversion="frisse-blik">Plan</a></body></html>';
  const out=injectGrowthMeasurement(base,{canonical:'https://www.bedrijfsgeheugen.nl/'});
  const match=out.match(/<script id="bg-growth-measurement">([\s\S]*?)<\/script>/i);
  assert.ok(match,'growth measurement script ontbreekt');
  assert.doesNotThrow(()=>new vm.Script(match[1]));
});


test('unmarked dynamic in-content CTA is measured once without collecting form or visitor details',()=>{
  const ORIGIN='https://www.bedrijfsgeheugen.nl';
  const source=injectGrowthMeasurement('<html><body><main></main></body></html>',{canonical:ORIGIN+'/prijzen',page_role:'money'});
  const script=source.match(/<script id="bg-growth-measurement">([\s\S]*?)<\/script>/i)?.[1];
  assert.ok(script);
  const sent=[],listeners={};
  const location={origin:ORIGIN,href:ORIGIN+'/prijzen',pathname:'/prijzen',hostname:'www.bedrijfsgeheugen.nl'};
  const context={
    window:{location,addEventListener:()=>{}},location,
    document:{referrer:'',body:{getAttribute:()=>''},addEventListener:(name,fn)=>{listeners[name]=fn;}},
    navigator:{sendBeacon:()=>false},sessionStorage:{getItem:()=>'',setItem:()=>{}},
    fetch:(_url,options)=>{sent.push(JSON.parse(options.body));return Promise.resolve({ok:true});},
    crypto:{randomUUID:()=>String(sent.length+1)},setTimeout:()=>{},URL
  };
  vm.runInNewContext(script,context);
  const anchor={href:ORIGIN+'/zelfscan',getAttribute:()=>null,
    closest:selector=>selector==='main'?{}:null,hasAttribute:()=>false};
  listeners.click({target:{closest:selector=>selector==='a'?anchor:null}});
  assert.equal(sent.filter(e=>e.event_type==='primary_cta_click').length,1);
  assert.equal(sent.find(e=>e.event_type==='primary_cta_click').cta_action,'zelfscan');
  assert.equal(sent.filter(e=>e.event_type==='selfscan_start').length,1);
  assert.equal(sent.some(e=>Object.hasOwn(e,'email')||Object.hasOwn(e,'name')),false);
});

test('unmarked external and non-content links do not become commercial conversions',()=>{
  const ORIGIN='https://www.bedrijfsgeheugen.nl';
  const source=injectGrowthMeasurement('<html><body><main></main></body></html>',{canonical:ORIGIN+'/prijzen'});
  const script=source.match(/<script id="bg-growth-measurement">([\s\S]*?)<\/script>/i)?.[1];
  const sent=[],listeners={};const location={origin:ORIGIN,href:ORIGIN+'/prijzen',pathname:'/prijzen',hostname:'www.bedrijfsgeheugen.nl'};
  vm.runInNewContext(script,{
    window:{location,addEventListener:()=>{}},location,URL,crypto:{randomUUID:()=>String(sent.length+1)},
    document:{referrer:'',body:{getAttribute:()=>''},addEventListener:(n,h)=>{listeners[n]=h;}},
    navigator:{sendBeacon:()=>false},sessionStorage:{getItem:()=>'',setItem:()=>{}},
    fetch:(_url,o)=>{sent.push(JSON.parse(o.body));return Promise.resolve({ok:true});},setTimeout:()=>{}
  });
  const mk=(href,inside)=>({href,getAttribute:()=>null,closest:s=>s==='main'?(inside?{}:null):null,hasAttribute:()=>false});
  for(const el of [mk('https://example.com/zelfscan',true),mk(ORIGIN+'/frisse-blik',false)]){
    listeners.click({target:{closest:s=>s==='a'?el:null}});
  }
  assert.equal(sent.filter(e=>e.event_type==='primary_cta_click').length,0);
});

test('explicit button CTA and first-party form intents use safe non-PII events',()=>{
  const ORIGIN='https://www.bedrijfsgeheugen.nl';
  const source=injectGrowthMeasurement('<html><body><main><button data-bg-conversion="zelfscan">Start</button><form data-bg-conversion="advies"><input type="email"><button type="submit">Verstuur</button></form></main></body></html>',{canonical:ORIGIN+'/prijzen'});
  const script=source.match(/<script id="bg-growth-measurement">([\s\S]*?)<\/script>/i)?.[1];
  assert.ok(script);
  const sent=[],listeners={},location={origin:ORIGIN,href:ORIGIN+'/prijzen',pathname:'/prijzen',hostname:'www.bedrijfsgeheugen.nl'};
  vm.runInNewContext(script,{
    window:{location,addEventListener:()=>{}},location,URL,crypto:{randomUUID:()=>String(sent.length+1)},
    document:{referrer:'',body:{getAttribute:()=>''},addEventListener:(n,h)=>{listeners[n]=h;}},
    navigator:{sendBeacon:()=>false},sessionStorage:{getItem:()=>'',setItem:()=>{}},
    fetch:(_url,o)=>{sent.push(JSON.parse(o.body));return Promise.resolve({ok:true});},setTimeout:()=>{}
  });
  const button={href:'',getAttribute:n=>n==='data-bg-conversion'?'zelfscan':null,closest:s=>s==='main'?{}:null,hasAttribute:()=>false};
  listeners.click({target:{closest:s=>s==='button,[role="button"]'?button:null}});
  const form={getAttribute:n=>n==='data-bg-conversion'?'advies':null,closest:s=>s==='main'?{}:null};
  const field={value:'private@example.com',closest:s=>s==='form'?form:null};
  listeners.focusin({target:field});listeners.focusin({target:field});
  listeners.submit({target:{closest:s=>s==='form'?form:null}});
  assert.equal(sent.filter(e=>e.event_type==='primary_cta_click').length,1);
  assert.equal(sent.filter(e=>e.event_type==='form_start').length,1);
  assert.equal(sent.filter(e=>e.event_type==='form_submit_intent').length,1);
  assert.equal(sent.find(e=>e.event_type==='form_submit_intent').cta_action,'advies');
  assert.ok(sent.every(e=>!Object.hasOwn(e,'email')&&!Object.hasOwn(e,'form_fields')&&!JSON.stringify(e).includes('private@example.com')));
});
test('first-party form intent types are accepted without accepting form contents or fake outcomes',async()=>{
  const {normalizeBehaviorEvent}=await import('../tools/seo-growth/normalize-observation.mjs');
  const canonical='https://www.bedrijfsgeheugen.nl/prijzen';
  for(const type of ['form_start','form_submit_intent']) {
    const e=normalizeBehaviorEvent({event_id:'safe-'+type,event_type:type,canonical});
    assert.equal(e.event_type,type);
  }
  assert.throws(()=>normalizeBehaviorEvent({event_id:'not-safe',event_type:'form_start',canonical,form_fields:{email:'private@example.com'}}),/PII fields/);
  assert.throws(()=>normalizeBehaviorEvent({event_id:'no-outcome',event_type:'paid_order',canonical}),/unsupported behavior event/);
});

test('one canonical growth producer measures NL and EN pricing, scan and checkout routes without duplicate start events',()=>{
 const ORIGIN='https://www.bedrijfsgeheugen.nl';
 const html=injectGrowthMeasurement('<html><body><main></main></body></html>',
   {canonical:ORIGIN+'/prijzen',page_role:'money',funnel_stage:'decide'});
 const script=html.match(/<script id="bg-growth-measurement">([\\s\\S]*?)<\\/script>/)?.[1];
 assert.ok(script);
 const cases=[
   ['/zelfscan','zelfscan','selfscan_start'],['/en/zelfscan','zelfscan','selfscan_start'],
   ['/frisse-blik','frisse-blik','frisse_blik_start'],['/en/frisse-blik','frisse-blik','frisse_blik_start'],
   ['/prijzen','prijzen',null],['/en/prijzen','prijzen',null],
   ['/afsluiten?plan=starter','checkout',null],['/en/afsluiten?plan=starter','checkout',null],
   ['/contact','contact',null],['/en/contact','contact',null],
   ['/aanmelden','aanmelden',null],['/en/aanmelden','aanmelden',null]
 ];
 for(const [route,action,startType] of cases){
  const sent=[],listeners={};let next=0;
  const location={origin:ORIGIN,hostname:'www.bedrijfsgeheugen.nl',pathname:'/prijzen',href:ORIGIN+'/prijzen'};
  const href=ORIGIN+route;
  vm.runInNewContext(script,{
   window:{location,addEventListener:()=>{}},location,URL,URLSearchParams,
   navigator:{webdriver:false,sendBeacon:()=>false},
   crypto:{randomUUID:()=>String(++next)},
   sessionStorage:{getItem:()=>'',setItem:()=>{}},localStorage:{getItem:()=>null},
   document:{referrer:'',visibilityState:'visible',querySelector:()=>null,body:{getAttribute:()=>''},
    documentElement:{scrollHeight:2100,clientHeight:1000},
    addEventListener:(name,fn)=>{listeners[name]=fn;}},
   fetch:(_url,options)=>{sent.push(JSON.parse(options.body));return Promise.resolve({ok:true});},
   setTimeout:()=>0,Blob,Date,Math
  });
  const el={href,getAttribute:()=>null,hasAttribute:()=>false,closest:selector=>selector==='main'?{}:null};
  listeners.click({target:{closest:selector=>selector==='a'?el:null}});
  const clicks=sent.filter(e=>e.event_type==='primary_cta_click');
  assert.equal(clicks.length,1,route);
  assert.equal(clicks[0].cta_action,action,route);
  assert.equal(clicks[0].target_canonical,href,route);
  assert.equal(clicks[0].source,'website',route);
  assert.equal(clicks[0].medium,'unattributed',route);
  const starts=sent.filter(e=>e.event_type==='selfscan_start'||e.event_type==='frisse_blik_start');
  assert.equal(starts.length,startType?1:0,route);
  if(startType)assert.equal(starts[0].event_type,startType,route);
  assert.ok(sent.every(e=>!Object.hasOwn(e,'email')&&!Object.hasOwn(e,'phone')));
 }
});

test('even an explicitly marked cross-origin EN scan link cannot create a false scan-start event',()=>{
 const ORIGIN='https://www.bedrijfsgeheugen.nl';
 const html=injectGrowthMeasurement('<html><body><main></main></body></html>',{canonical:ORIGIN+'/prijzen'});
 const script=html.match(/<script id="bg-growth-measurement">([\\s\\S]*?)<\\/script>/)?.[1];
 const sent=[],listeners={};let next=0;
 const location={origin:ORIGIN,hostname:'www.bedrijfsgeheugen.nl',pathname:'/prijzen',href:ORIGIN+'/prijzen'};
 vm.runInNewContext(script,{
  window:{location,addEventListener:()=>{}},location,URL,URLSearchParams,
  navigator:{webdriver:false,sendBeacon:()=>false},
  crypto:{randomUUID:()=>String(++next)},
  sessionStorage:{getItem:()=>'',setItem:()=>{}},localStorage:{getItem:()=>null},
  document:{referrer:'',visibilityState:'visible',querySelector:()=>null,body:{getAttribute:()=>''},
   documentElement:{scrollHeight:2100,clientHeight:1000},
   addEventListener:(name,fn)=>{listeners[name]=fn;}},
  fetch:(_url,options)=>{sent.push(JSON.parse(options.body));return Promise.resolve({ok:true});},
  setTimeout:()=>0,Blob,Date,Math
 });
 const el={href:'https://untrusted.example/en/zelfscan',
  getAttribute:n=>n==='data-bg-conversion'?'bedrijfslek':null,
  hasAttribute:()=>false,closest:selector=>selector==='main'?{}:null};
 listeners.click({target:{closest:selector=>selector==='a'?el:null}});
 assert.equal(sent.filter(e=>e.event_type==='primary_cta_click').length,1);
 assert.equal(sent.filter(e=>e.event_type==='selfscan_start').length,0);
});
