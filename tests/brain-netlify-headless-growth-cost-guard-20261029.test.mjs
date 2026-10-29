import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import {injectGrowthMeasurement} from '../tools/seo-order-engine/measurement.mjs';

const source=injectGrowthMeasurement('<html><body><main><a href="/frisse-blik" data-bg-conversion="frisse-blik">Plan</a></main></body></html>',
  {canonical:'https://www.bedrijfsgeheugen.nl/prijzen',page_role:'money'});
const script=source.match(/<script id="bg-growth-measurement">([\s\S]*?)<\/script>/i)?.[1];

test('HeadlessChrome webdriver sends no growth-events and does not create an attribution session',()=>{
  assert.ok(script);
  let requests=0,sessions=0,listeners=0;
  const window={__bgGrowthMeasurement:false};
  vm.runInNewContext(script,{window,navigator:{webdriver:true,sendBeacon:()=>{requests++;return true;}},
    fetch:()=>{requests++;return Promise.resolve({ok:true})},
    sessionStorage:{getItem:()=>{sessions++;return ''},setItem:()=>{sessions++}},
    document:{addEventListener:()=>{listeners++}}
  });
  assert.equal(requests,0);
  assert.equal(sessions,0);
  assert.equal(listeners,0);
  assert.equal(window.__bgGrowthMeasurement,true);
});

test('normal browser keeps real visitor pageview instrumentation and event route',()=>{
  const sent=[];
  const location={origin:'https://www.bedrijfsgeheugen.nl',hostname:'www.bedrijfsgeheugen.nl',
    pathname:'/prijzen',href:'https://www.bedrijfsgeheugen.nl/prijzen'};
  const context={window:{location,addEventListener(){}},location,URL,crypto:{randomUUID:()=>String(sent.length+1)},
    navigator:{webdriver:false,sendBeacon:()=>false},
    document:{referrer:'',body:{getAttribute:()=>''},addEventListener(){}},
    sessionStorage:{getItem:()=>'',setItem(){}},setTimeout:()=>{},
    fetch:(url,opts)=>{sent.push({url,body:JSON.parse(opts.body)});return Promise.resolve({ok:true})}};
  vm.runInNewContext(script,context);
  assert.equal(sent.length,1);
  assert.match(sent[0].url,/\/api\/growth-event$/);
  assert.equal(sent[0].body.event_type,'page_view');
  assert.equal(sent[0].body.canonical,'https://www.bedrijfsgeheugen.nl/prijzen');
  assert.ok(!Object.hasOwn(sent[0].body,'email'));
});

test('same canonical CRO lane with no new scheduled job or provider bypass',()=>{
  const module=fs.readFileSync('tools/seo-order-engine/measurement.mjs','utf8');
  assert.match(module,/navigator\.webdriver===true/);
  assert.match(module,/navigator\.sendBeacon/);
  assert.doesNotMatch(module,/setInterval\(/);
});
