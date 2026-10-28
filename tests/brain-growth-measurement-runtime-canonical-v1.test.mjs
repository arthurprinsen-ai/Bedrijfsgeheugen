import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { injectGrowthMeasurement } from '../tools/seo-order-engine/measurement.mjs';

const ORIGIN='https://www.bedrijfsgeheugen.nl';

function run(bakedMeta,{linkHref,bodyAttrs={}}){
  const html=injectGrowthMeasurement('<html><body><main></main></body></html>',bakedMeta);
  const script=html.match(/<script id="bg-growth-measurement">([\s\S]*?)<\/script>/)?.[1];
  assert.ok(script);
  const sent=[];
  const location={origin:ORIGIN,href:ORIGIN+'/prijzen',pathname:'/prijzen',hostname:'www.bedrijfsgeheugen.nl'};
  vm.runInNewContext(script,{
    window:{location,addEventListener:()=>{}},location,URL,
    crypto:{randomUUID:()=>String(sent.length+1)},
    document:{referrer:'',body:{getAttribute:n=>bodyAttrs[n]||''},addEventListener:()=>{},
      querySelector:s=>(s==='link[rel=canonical]'&&linkHref)?{href:linkHref}:null},
    navigator:{sendBeacon:()=>false},sessionStorage:{getItem:()=>'',setItem:()=>{}},
    fetch:(_u,o)=>{sent.push(JSON.parse(o.body));return Promise.resolve({ok:true});},setTimeout:()=>{}
  });
  return sent;
}

test('historical replay: stale baked canonical/role from build order must not win over the final page',()=>{
  const stale={canonical:ORIGIN+'/over-ons',page_role:'support',funnel_stage:'discover',intent:'over ons',keyword_cluster:'over ons'};
  const [view]=run(stale,{linkHref:ORIGIN+'/prijzen',bodyAttrs:{'data-bg-page-role':'money','data-bg-funnel-stage':'decide','data-bg-intent':'kosten digitalisering mkb','data-bg-keyword-cluster':'kosten digitalisering mkb'}});
  assert.equal(view.event_type,'page_view');
  assert.equal(view.canonical,ORIGIN+'/prijzen');
  assert.equal(view.landing_canonical,ORIGIN+'/prijzen');
  assert.equal(view.page_role,'money');
  assert.equal(view.funnel_stage,'decide');
  assert.equal(view.intent_id,'kosten digitalisering mkb');
});

test('shadow: baked values remain the fallback when the page offers no canonical link or body attributes',()=>{
  const [view]=run({canonical:ORIGIN+'/zelfscan',page_role:'money',funnel_stage:'decide'},{});
  assert.equal(view.canonical,ORIGIN+'/zelfscan');
  assert.equal(view.page_role,'money');
});

test('canary: a canonical link on another host is ignored and no personal data is added',()=>{
  const [view]=run({canonical:ORIGIN+'/prijzen'},{linkHref:'https://example.com/prijzen'});
  assert.equal(view.canonical,ORIGIN+'/prijzen');
  assert.equal(Object.keys(view).some(k=>/email|name|phone|password/i.test(k)),false);
});
