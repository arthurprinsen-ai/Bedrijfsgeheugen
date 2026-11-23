import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { injectGrowthMeasurement } from '../tools/seo-order-engine/measurement.mjs';

const ORIGIN='https://www.bedrijfsgeheugen.nl';
function runGeneratedCta(href,{insideMain=true,consented=true}={}){
  const original='<html><body><main><a href="'+href+'">Ontdek de mogelijkheden</a></main></body></html>';
  const html=injectGrowthMeasurement(original,{canonical:ORIGIN+'/aanpak',page_role:'money'});
  const script=html.match(/<script id="bg-growth-measurement">([\s\S]*?)<\/script>/)?.[1];
  assert.ok(script);
  const emitted=[],listeners={};let next=0;
  const location={origin:ORIGIN,hostname:'www.bedrijfsgeheugen.nl',pathname:'/aanpak',
    href:ORIGIN+'/aanpak',search:''};
  const anchor={href,getAttribute:()=>null,hasAttribute:()=>false,
    closest:(selector)=>selector==='main'?(insideMain?{}:null):null};
  const scriptContext={
    window:{location,scrollY:0,addEventListener:()=>{}},location,URL,URLSearchParams,
    navigator:{webdriver:false,sendBeacon:()=>false},
    crypto:{randomUUID:()=>String(++next)},
    sessionStorage:{getItem:()=>'',setItem:()=>{}},
    localStorage:{getItem:key=>key==='bg_consent'&&consented?'granted':null},
    document:{referrer:'',visibilityState:'visible',querySelector:()=>null,
      body:{getAttribute:()=>''},documentElement:{scrollHeight:2100,clientHeight:1000},
      addEventListener:(event,handler)=>{listeners[event]=handler;}},
    fetch:(_url,options)=>{emitted.push(JSON.parse(options.body));return Promise.resolve({ok:true});},
    setTimeout:()=>1,Blob,Date,Math
  };
  vm.runInNewContext(script,scriptContext,{timeout:3000});
  listeners.click({target:{closest:s=>s==='a'?anchor:null}});
  return {events:emitted,html};
}
test('history: every original global contact/signup/pricing CTA path has one generated owner click event',()=>{
 for(const [path,action] of [['/contact','contact'],['/aanmelden','aanmelden'],['/prijzen','prijzen']]){
  for(const suffix of ['', '/']){
   const {events,html}=runGeneratedCta(ORIGIN+path+suffix);
   const cta=events.filter(e=>e.event_type==='primary_cta_click');
   assert.equal(cta.length,1,path+suffix);
   assert.equal(cta[0].cta_action,action);
   assert.equal(cta[0].canonical,ORIGIN+'/aanpak');
   assert.equal(cta[0].target_canonical,ORIGIN+path+suffix);
   assert.ok(html.includes('id="bg-growth-measurement"'));
  }
 }
});
test('canonical original converted routes remain one event, and extra start is only recorded for scan or frisk',()=>{
 for(const [path,action] of [['/zelfscan','zelfscan'],['/frisse-blik','frisse-blik'],['/afsluiten','checkout']]){
   const {events}=runGeneratedCta(ORIGIN+path);
   const cta=events.filter(e=>e.event_type==='primary_cta_click');
   assert.equal(cta.length,1);
   assert.equal(cta[0].cta_action,action);
   if(path==='/zelfscan')assert.equal(events.filter(e=>e.event_type==='selfscan_start').length,1);
   if(path==='/frisse-blik')assert.equal(events.filter(e=>e.event_type==='frisse_blik_start').length,1);
 }
 for(const path of ['/contact','/aanmelden','/prijzen']){
  const {events}=runGeneratedCta(ORIGIN+path);
  assert.equal(events.filter(e=>/start$/.test(e.event_type)).length,0);
 }
});
test('no cross-origin or navigation outside original <main> becomes a buyer intent event',()=>{
 for(const [href,insideMain] of [
   ['https://example.org/contact',true],
   ['https://bad.bedrijfsgeheugen.nl/aanmelden',true],
   [ORIGIN+'/contact',false],['mailto:private@example.org',true]
 ]){
  const {events}=runGeneratedCta(href,{insideMain});
  assert.equal(events.filter(e=>e.event_type==='primary_cta_click').length,0);
 }
});
test('no added network owner, PII, scheduler or side effect',()=>{
 const original=readFileSync('assets/meting.js','utf8');
 const src=readFileSync('tools/seo-order-engine/measurement.mjs','utf8');
 assert.match(original,/getElementById\('bg-growth-measurement'\)/);
 assert.match(src,/window\.__bgGrowthMeasurement/);
 assert.match(src,/navigator\.webdriver===true/);
 assert.doesNotMatch(src,/private@example|setInterval|cron\.schedule|INSERT INTO/);
 const html=injectGrowthMeasurement('<html><body><main></main></body></html>',{canonical:ORIGIN+'/aanpak'});
 assert.equal(injectGrowthMeasurement(html,{canonical:ORIGIN+'/aanpak'}),html);
});
