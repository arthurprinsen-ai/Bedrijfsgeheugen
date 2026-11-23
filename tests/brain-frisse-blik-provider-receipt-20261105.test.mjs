import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync('frisse-blik.html','utf8');
const begin=source.indexOf('let _pending=null,_calReady=false,_leadSubmitting=false;');
const end=source.indexOf('function isTrustedCalendlyScheduledMessage(e){',begin);
assert.ok(begin>=0&&end>begin,'lead intake block must be extractable');
const script=source.slice(begin,end);

function setup(reply,calendly='https://calendly.com/example/demo'){
  const fields={
    ldNaam:{value:'Voorbeeld Contact'},
    ldMail:{value:'buyer@example.invalid'},
    ldBedrijf:{value:'Voorbeeld BV'},
    ldRelatie:{value:''},
    ldOk:{checked:true},
    ldErr:{hidden:true,textContent:'Formulier'},
    leadReceiptWarning:{hidden:true}
  };
  const calls={fetch:0,cal:0,book:0};
  const globals={
    $:key=>fields[key],
    scanPayload:lead=>({lead,scan:{niveau:1}}),
    ADO:{pat:'',org:'',project:''},
    WEBHOOK_URL:'https://example.invalid/lead-intake',
    CONTACT:{calendly},
    fetch:async()=>{calls.fetch++;return typeof reply==='function'?reply():reply;},
    showCalStep:()=>{calls.cal++;},
    onBooked:()=>{calls.book++;},
    JSON,Promise
  };
  const context=vm.createContext(globals);
  vm.runInContext(script,context);
  return {fields,calls,context,run:()=>vm.runInContext('submitLead()',context),
    state:()=>vm.runInContext('({ok:_pending?.devopsOk, err:_pending?.devopsErr, submitting:_leadSubmitting})',context)};
}

test('only explicit successful provider JSON receipt closes lead registration',async()=>{
  const t=setup({ok:true,status:200,json:async()=>({ok:true,consultant:null})});
  await t.run();
  assert.equal(t.state().ok,true);
  assert.equal(t.fields.leadReceiptWarning.hidden,true);
  assert.equal(t.calls.cal,1);
  assert.equal(t.calls.book,0);
});

test('HTTP 200 with ok:false never masquerades as a registered commercial lead',async()=>{
  const t=setup({ok:true,status:200,json:async()=>({ok:false,error:'store'})});
  await t.run();
  assert.equal(t.state().ok,false);
  assert.equal(t.fields.leadReceiptWarning.hidden,false);
  assert.equal(t.calls.cal,1,'buyer can still schedule after storage failure');
  assert.equal(t.calls.book,0,'no invented booking');
});

test('upstream 502 remains unconfirmed while independent calendar can continue',async()=>{
  const t=setup({ok:false,status:502,json:async()=>({ok:false,error:'store'})});
  await t.run();
  assert.equal(t.state().ok,false);
  assert.equal(t.state().err,'lead-intake-502');
  assert.equal(t.fields.leadReceiptWarning.hidden,false);
  assert.equal(t.calls.cal,1);
});

test('network rejection is transparent and cannot invent a lead receipt',async()=>{
  const t=setup(()=>Promise.reject(new Error('network unavailable')));
  await t.run();
  assert.equal(t.state().ok,false);
  assert.equal(t.state().err,'lead-intake-network');
  assert.equal(t.fields.leadReceiptWarning.hidden,false);
});

test('in-flight duplicate customer submissions invoke existing provider at most once',async()=>{
  let release;
  const gate=new Promise(resolve=>{release=resolve;});
  const t=setup(async()=>{await gate;return {ok:true,status:200,json:async()=>({ok:true})};});
  const p1=t.run();const p2=t.run();
  release();
  await Promise.all([p1,p2]);
  assert.equal(t.calls.fetch,1);
  assert.equal(t.calls.cal,1);
  assert.equal(t.state().submitting,false);
});

test('missing Calendly config does not claim a booking',async()=>{
  const t=setup({ok:true,status:200,json:async()=>({ok:true})},'');
  await t.run();
  assert.equal(t.calls.book,0);
  assert.equal(t.calls.cal,0);
  assert.equal(t.fields.ldErr.hidden,false);
});

test('live UI never claims a sent report or booking only from CTA intent',()=>{
  assert.match(source,/id="leadReceiptWarning" role="status" hidden/);
  assert.match(source,/const deliveryAccepted=await deliverToContact/);
  assert.match(source,/De registratie van je aanvraag is nog niet bevestigd/);
  assert.doesNotMatch(source,/onBooked\('geen-calendly-geconfigureerd'\)/);
  assert.match(source,/id="leadReceiptWarning"[\s\S]{0,330}href="https:\/\/www\.bedrijfsgeheugen\.nl\/contact"/);
});


test('original SEO agent skill distinguishes click, receipt, confirmed booking and paid sale',()=>{
  const skill=readFileSync('.agents/skills/seo-revenue-growth/SKILL.md','utf8');
  assert.match(skill,/commerciële aanvraag telt uitsluitend na providerbewijs/);
  assert.match(skill,/lead-intake/);
  assert.match(skill,/Calendly-providerboekingsbewijs/);
  assert.ok(skill.includes('tests/brain-frisse-blik-provider-receipt-20261105.test.mjs'));
});
