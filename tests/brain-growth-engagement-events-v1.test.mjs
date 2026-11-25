import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { injectGrowthMeasurement } from '../tools/seo-order-engine/measurement.mjs';
import { normalizeBehaviorEvent } from '../tools/seo-growth/normalize-observation.mjs';

const ORIGIN='https://www.bedrijfsgeheugen.nl';

function boot(){
  const script=injectGrowthMeasurement('<html><body><main></main></body></html>',{canonical:ORIGIN+'/prijzen'}).match(/<script id="bg-growth-measurement">([\s\S]*?)<\/script>/)[1];
  const sent=[],docL={},winL={};let now=1000000;
  const doc={referrer:'',visibilityState:'visible',body:{getAttribute:()=>''},addEventListener:(n,f)=>{(docL[n]=docL[n]||[]).push(f);},
    documentElement:{scrollHeight:2000,clientHeight:1000},querySelector:()=>null};
  const win={scrollY:0,location:{origin:ORIGIN,href:ORIGIN+'/prijzen',pathname:'/prijzen',hostname:'www.bedrijfsgeheugen.nl'},addEventListener:(n,f)=>{(winL[n]=winL[n]||[]).push(f);}};
  vm.runInNewContext(script,{window:win,location:win.location,document:doc,URL,crypto:{randomUUID:()=>String(sent.length+1)},
    navigator:{sendBeacon:()=>false},sessionStorage:{getItem:()=>'',setItem:()=>{}},
    fetch:(_u,o)=>{sent.push(JSON.parse(o.body));return Promise.resolve({ok:true});},setTimeout:()=>{},
    Date:class extends Date{static now(){return now;}}});
  return {sent,doc,win,advance:ms=>{now+=ms;},fireWin:n=>(winL[n]||[]).forEach(f=>f()),fireDoc:n=>(docL[n]||[]).forEach(f=>f())};
}

test('historical replay: scroll milestones are sent once each with their depth',()=>{
  const e=boot();
  for(const y of [300,520,800,1000,1000]){e.win.scrollY=y;e.fireWin('scroll');}
  const depths=e.sent.filter(x=>x.event_type==='scroll_depth').map(x=>x.value);
  assert.deepEqual(depths,[25,50,75,100]);
});

test('shadow: exactly one page_exit with visible seconds and max scroll, no matter how often the page is hidden',()=>{
  const e=boot();
  e.win.scrollY=500;e.fireWin('scroll');
  e.advance(42000);
  e.doc.visibilityState='hidden';e.fireDoc('visibilitychange');
  e.doc.visibilityState='visible';e.fireDoc('visibilitychange');
  e.advance(10000);
  e.doc.visibilityState='hidden';e.fireDoc('visibilitychange');e.fireWin('pagehide');
  const exits=e.sent.filter(x=>x.event_type==='page_exit');
  assert.equal(exits.length,1);
  assert.equal(exits[0].value,42);
  assert.match(exits[0].engagement_reason,/^hidden_scroll_50$/);
});

test('canary: server accepts the new types and bounded values, rejects personal fields, and forwards value',()=>{
  const base={event_id:'e1',occurred_at:'2026-10-28T08:00:00.000Z',canonical:ORIGIN+'/prijzen',attribution_root:'r1'};
  assert.equal(normalizeBehaviorEvent({...base,event_type:'scroll_depth',value:50}).value,50);
  assert.equal(normalizeBehaviorEvent({...base,event_type:'page_exit',value:90000}).value,undefined);
  assert.equal(normalizeBehaviorEvent({...base,event_type:'page_exit',value:-5}).value,undefined);
  assert.throws(()=>normalizeBehaviorEvent({...base,event_type:'page_exit',email:'a@b.c'}),/PII/);
  assert.throws(()=>normalizeBehaviorEvent({...base,event_type:'unknown_thing'}),/unsupported/);
  const fn=readFileSync(new URL('../netlify/functions/growth-event.mjs',import.meta.url),'utf8');
  assert.match(fn,/value:observation\.value,/);
});
