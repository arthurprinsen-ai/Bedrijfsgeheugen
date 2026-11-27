import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {waitForRenderedBody} from '../tools/site-shell/verify-targeted-website-routes.mjs';

function pageSpy(){
 const calls=[];
 const page={async waitForFunction(predicate,arg,options){
  calls.push({predicate,arg,options});
  return predicate();
 }};
 return {page,calls};
}
const visible=(text='Rendered')=>({
 innerText:text,style:{display:'block',visibility:'visible',opacity:'1'},
 getBoundingClientRect:()=>({width:340,height:100})
});
const wrapper=()=>({
 innerText:'',style:{display:'contents',visibility:'visible',opacity:'1'},
 getBoundingClientRect:()=>({width:0,height:0})
});
async function withBody(body,run){
 const prevDoc=globalThis.document,prevStyle=globalThis.getComputedStyle;
 globalThis.document={body};
 globalThis.getComputedStyle=el=>el.style;
 try{return await run();}
 finally{
  if(prevDoc===undefined)delete globalThis.document;else globalThis.document=prevDoc;
  if(prevStyle===undefined)delete globalThis.getComputedStyle;else globalThis.getComputedStyle=prevStyle;
 }
}
test('Playwright visibility timeout is the THIRD argument; default 30s is not silently used',async()=>{
 const {page,calls}=pageSpy();
 await withBody({innerText:'visible',children:[visible()],querySelectorAll:()=>[]},async()=>{
  assert.equal(await waitForRenderedBody(page,{timeout:10_000}),true);
 });
 assert.equal(calls.length,1);
 assert.equal(calls[0].arg,undefined);
 assert.deepEqual(calls[0].options,{timeout:10_000});
});
test('display:contents app wrapper with visible main descendant is a genuine rendered page',async()=>{
 const main=visible('Real main content');
 const {page}=pageSpy();
 await withBody({innerText:'Real main content',children:[wrapper()],
  querySelectorAll:()=>[main]},async()=>{
  assert.equal(await waitForRenderedBody(page),true);
 });
});
test('HTML text alone never proves visibility: hidden or zero-box descendants fail closed',async()=>{
 const cases=[
  {innerText:'',children:[visible()],querySelectorAll:()=>[visible()]},
  {innerText:'in DOM',children:[wrapper()],querySelectorAll:()=>[]},
  {innerText:'Hidden text',children:[wrapper()],querySelectorAll:()=>[
   {...visible('Hidden'),style:{display:'none',visibility:'visible',opacity:'1'}}
  ]},
  {innerText:'Transparent text',children:[wrapper()],querySelectorAll:()=>[
   {...visible('Transparent'),style:{display:'block',visibility:'visible',opacity:'0'}}
  ]}
 ];
 const {page}=pageSpy();
 for(const body of cases)await withBody(body,async()=>{
  assert.equal(await waitForRenderedBody(page),false);
 });
 await withBody(null,async()=>assert.equal(await waitForRenderedBody(page),false));
});
test('bounded timeout input refuses infinite or weakened route checks',async()=>{
 const {page,calls}=pageSpy();
 for(const timeout of [0,-1,100,30_001,Infinity,'10000',NaN]){
  await assert.rejects(waitForRenderedBody(page,{timeout}),/TARGETED_ROUTE_VISIBLE_TIMEOUT_INVALID/);
 }
 assert.equal(calls.length,0);
});
test('natural original production readback keeps exact route and viewport evidence after retries',()=>{
 const source=readFileSync('tools/site-shell/verify-targeted-website-routes.mjs','utf8');
 const workflow=readFileSync('.github/workflows/production-release-readback.yml','utf8');
 assert.match(source,/await waitForRenderedBody\(page,\{timeout:10_000\}\)/);
 assert.match(source,/TARGETED_ROUTE_READINESS_ATTEMPT/);
 assert.match(source,/route,viewport_width:viewport\.width,attempt,attempts/);
 assert.match(source,/if \(attempt >= attempts \|\| error\?\.name !== 'TimeoutError'\) throw error/);
 assert.match(workflow,/timeout --signal=TERM --kill-after=30s 8m node tools\/site-shell\/verify-targeted-website-routes\.mjs/);
});
