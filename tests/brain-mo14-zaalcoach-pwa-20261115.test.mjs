import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
const base='pw-mo14-1/zaalplanner/';
test('mobile app keeps existing lineup and export controls intact',()=>{
 const html=readFileSync(base+'index.html','utf8');
 for(const id of ['match','keeper','roster','pitchPlayers','bench','upcoming','timeline','minutes','pdfGame','pdfSummary','pngBlock','pngSummary','pdfAll']){
   assert.match(html,new RegExp('id="'+id+'"'),'missing '+id);
 }
 for(const screen of ['plan','team','stats','export'])assert.ok(html.includes('data-view-panel="'+screen+'"'));
 assert.match(html,/function rotationsFor/);
 assert.match(html,/function bestAssignment/);
 assert.match(html,/function createPdf/);
 assert.match(html,/beforeinstallprompt/);
 assert.match(html,/serviceWorker\.register/);
});
test('standalone app declares scoped offline resources and actual icons',()=>{
 const m=JSON.parse(readFileSync(base+'manifest.webmanifest','utf8'));
 assert.equal(m.display,'standalone');
 assert.equal(m.scope,'./');
 assert.equal(m.start_url,'./');
 for(const icon of m.icons){
   const name=icon.src.replace(/^\.\//,'');
   const data=readFileSync(base+name);
   assert.equal(data.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
   assert.ok(data.length>1000);
 }
 const sw=readFileSync(base+'sw.js','utf8');
 assert.match(sw,/mo14-zaalcoach-v3/);
 assert.match(sw,/self\.registration\.scope/);
 assert.doesNotMatch(sw,/make\.com|buffer\.com/);
});
