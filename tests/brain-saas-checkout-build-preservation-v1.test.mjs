import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {applyCanonicalShell} from '../tools/site-shell/apply-shell.mjs';

const source=readFileSync('afsluiten.html','utf8');
const shell={voor:'<!doctype html><html><head><title>Shell</title></head><body><main data-bg-component="main">',na:'</main></body></html>'};
test('real checkout retains payment verification and live targets through canonical shell projection',()=>{
 const html=applyCanonicalShell(source,shell,'afsluiten.html');
 assert.ok(html.includes('/api/checkout/readiness?session_id='),'provider-verified completion runtime');
 assert.ok(html.includes('/api/checkout/create'),'checkout submit runtime');
 for(const id of ['checkoutResultTitle','checkoutResultText','checkoutContinue','sources','freshness','automation','status','plan','billingCycle'])assert.match(html,new RegExp('id="'+id+'"'),id);
 assert.match(html,/<h2[^>]*id="checkoutResultTitle"/);
});
test('checkout preservation runs around destructive builders and validates the final artifact',()=>{
 const entry=readFileSync('tools/ci/netlify-build-entry.mjs','utf8');
 assert.ok(entry.indexOf("['checkout-capture'")<entry.indexOf("['v18-chrome'"));
 assert.ok(entry.indexOf("['checkout-restore'")>entry.indexOf("['site-ui'"));
 assert.ok(entry.indexOf("['checkout-restore'")<entry.indexOf("['localized-routes'"));
 assert.ok(entry.indexOf("['checkout-final-contract'")>entry.indexOf("['locale-validation'"));
});

import vm from 'node:vm';
test('preserved runtime selects yearly Pro and never unlocks a pending payment',async()=>{
 const runtime=source.match(/<script data-bg-page-runtime="saas-checkout">([\s\S]*?)<\/script>/)[1];
 const elements=new Map();
 const contextFor=(search,ready)=>{
  elements.clear();
  const get=id=>{if(!elements.has(id))elements.set(id,{hidden:true,style:{},textContent:'',addEventListener(){},appendChild(){}});return elements.get(id)};
  return {location:{search},URLSearchParams,document:{getElementById:get,createElement:()=>({remove(){}})},fetch:async()=>({ok:true,json:async()=>({ready})}),setTimeout(){},console};
 };
 vm.runInNewContext(runtime,contextFor('?plan=pro&billing=yearly',false));
 assert.equal(elements.get('plan').value,'pro');
 assert.equal(elements.get('billingCycle').value,'yearly');
 assert.equal(elements.get('price').textContent,'€ 2.990');
 vm.runInNewContext(runtime,contextFor('?success=1&session_id=cs_fixture',false));
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(elements.get('success').hidden,false);
 assert.notEqual(elements.get('checkoutContinue')?.hidden,false);
 vm.runInNewContext(runtime,contextFor('?success=1&session_id=cs_fixture',true));
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(elements.get('checkoutContinue').hidden,false);
});

import {assertCheckoutContract} from '../tools/site-shell/checkout-build-integrity.mjs';
test('final artifact guard rejects missing payment runtime and duplicate targets',()=>{
 assert.equal(assertCheckoutContract(source),true);
 assert.throws(()=>assertCheckoutContract(source.replace('/api/checkout/readiness?session_id=','/removed?session_id=')),/CHECKOUT_RUNTIME_MISSING/);
 assert.throws(()=>assertCheckoutContract(source+'<div id="status"></div>'),/CHECKOUT_TARGET_INVALID/);
 assert.match(source,/<form\b[^>]*method="post"/);
});

test('checkout hidden grid beats author display styles and CI proves real rendering',()=>{
 assert.match(source,/#checkout\[hidden\]\s*\{\s*display\s*:\s*none\s*!important\s*;?\s*\}/);
 const workflow=readFileSync('.github/workflows/lane-website.yml','utf8');
 assert.ok(workflow.includes('node tools/site-shell/checkout-browser-check.mjs'));
});
