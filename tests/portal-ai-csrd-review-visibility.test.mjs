import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
test('customer portal shows pending AI/CSRD cross-domain review without internal audit details',async()=>{
 const formerElement=globalThis.HTMLElement,formerRegistry=globalThis.customElements;
 let Panel;
 try{
  globalThis.HTMLElement=class {constructor(){this.innerHTML='';}querySelectorAll(){return [];}querySelector(){return null;}};
  globalThis.customElements={get:()=>null,define:(_tag,klass)=>{Panel=klass;}};
  await import('../portal-next/data-sovereignty-panel.js');
  assert.equal(typeof Panel,'function');
  const panel=new Panel();
  panel.scope='customer';
  panel.snapshot={policy:{
   mode:'EU_STORAGE',
   last_change_impact:{
    contract:'powerhouse-cross-domain-change-v1',status:'REVIEW_REQUIRED',kind:'AI_MODEL',
    changeId:'sensitive-reference',actor:'internal-user-private',
    esrsReview:[{standard:'ESRS_E1',reviewRequired:true,materiality:'UNDETERMINED',measuredImpact:null}]
   }
  },summary:{flowCount:0,connectorCount:0,activeAiRoutes:0,policySatisfied:false},violations:[]};
  panel.render();
  assert.match(panel.innerHTML,/Gevolgen van je AI- of datakeuze worden beoordeeld/);
  assert.match(panel.innerHTML,/AI-model of AI-provider/);
  assert.match(panel.innerHTML,/ESRS_E1/);
  assert.match(panel.innerHTML,/niet dat CSRD voor jouw organisatie verplicht is/);
  assert.doesNotMatch(panel.innerHTML,/internal-user-private|sensitive-reference/);
 }finally{
  if(formerElement===undefined)delete globalThis.HTMLElement;else globalThis.HTMLElement=formerElement;
  if(formerRegistry===undefined)delete globalThis.customElements;else globalThis.customElements=formerRegistry;
 }
});
test('review UI escapes untrusted ESRS labels before rendering',async()=>{
 const src=await readFile(new URL('../portal-next/data-sovereignty-panel.js',import.meta.url),'utf8');
 assert.match(src,/esrsCandidates\.map\(esc\)/);
 assert.match(src,/esc\(impactTypeLabel\[impact.kind\]/);
 assert.match(src,/p\.last_change_impact/);
});
