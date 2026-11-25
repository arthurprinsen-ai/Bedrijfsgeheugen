import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const meting=readFileSync(new URL('../assets/meting.js',import.meta.url),'utf8');
const begin=meting.indexOf('function tekstVan(el)');
const end=meting.indexOf('function onderdeelVan(el)',begin);

test('original CRO click classifier preserves authored conversion intent and rejects generic A/BUTTON when labeled',()=>{
 assert.ok(begin>=0&&end>begin,'original owner method exists');
 const code=meting.slice(begin,end);
 const run=el=>runInNewContext(code+';tekstVan(el)',{el});
 assert.equal(run({getAttribute(n){return n==='data-bg-conversion'?'frisse-blik':null;},id:'',tagName:'A'}),'frisse-blik');
 assert.equal(run({getAttribute(n){return n==='data-bg-order-cta'?'order-start':null;},id:'',tagName:'BUTTON'}),'order-start');
 assert.equal(run({getAttribute(n){return n==='data-bg-meet'?'source-approved-id':(n==='data-bg-conversion'?'frisse-blik':null);},id:'',tagName:'A'}),'source-approved-id');
 assert.equal(run({getAttribute(){return null;},id:'',tagName:'BUTTON'}),'BUTTON');
 assert.doesNotMatch(code,/innerText|textContent|\.value|outerHTML|form\./);
});

test('commercial event producer separation and no shadow data collection remain unchanged',()=>{
 assert.match(meting,/getElementById\('bg-growth-measurement'\)/);
 assert.match(meting,/if\(!toestemming\(\)\)return/);
 assert.match(meting,/NO_DATABASE_ACK/);
 assert.doesNotMatch(meting,/el\.innerText/);
 assert.doesNotMatch(meting,/el\.value/);
});
