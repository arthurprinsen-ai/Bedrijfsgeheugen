import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const src=()=>readFile(new URL('../portal-next/data-sovereignty-panel.js',import.meta.url),'utf8');

test('customer sees open evidence obligations without implied CSRD applicability or raw proof IDs',async()=>{
  const formerHTMLElement=globalThis.HTMLElement,formerCustomElements=globalThis.customElements;
  let Panel;
  try{
    globalThis.HTMLElement=class{constructor(){this.innerHTML='';}querySelectorAll(){return [];}querySelector(){return null;}};
    globalThis.customElements={get:()=>null,define:(_tag,ctor)=>{Panel=ctor;}};
    await import('../portal-next/data-sovereignty-panel.js');
    const panel=new Panel();panel.scope='customer';
    panel.snapshot={
      policy:{mode:'EU_STORAGE',last_change_impact:{contract:'powerhouse-cross-domain-change-v1',status:'REVIEW_REQUIRED',kind:'AI_MODEL'}},
      summary:{flowCount:0,connectorCount:0,activeAiRoutes:0,policySatisfied:false},
      violations:[],
      reviewPortfolio:{contract:'powerhouse-review-portfolio-v1',status:'REVIEW_REQUIRED',tasks:[
        {domain:'privacy',status:'NEEDS_EVIDENCE',label:'Privacy',requiredReview:'Grondslagen controleren'},
        {domain:'csrd_esrs_scope',status:'NEEDS_EVIDENCE',label:'CSRD / ESRS',requiredReview:'Materiële onderwerpen beoordelen',
          candidateEsrs:['ESRS_E1','<svg/onload=alert(1)>']}
      ]}
    };
    panel.render();
    assert.match(panel.innerHTML,/Welke controles volgen uit deze wijziging/);
    assert.match(panel.innerHTML,/Grondslagen controleren/);
    assert.match(panel.innerHTML,/ESRS_E1/);
    assert.match(panel.innerHTML,/Open — bewijs nog niet geverifieerd/);
    assert.match(panel.innerHTML,/niet dat CSRD wettelijk van toepassing is/);
    assert.doesNotMatch(panel.innerHTML,/<svg\/onload=alert/);
    assert.match(panel.innerHTML,/&lt;svg\/onload=alert/);
  }finally{
    if(formerHTMLElement===undefined)delete globalThis.HTMLElement;else globalThis.HTMLElement=formerHTMLElement;
    if(formerCustomElements===undefined)delete globalThis.customElements;else globalThis.customElements=formerCustomElements;
  }
});
test('review list uses escaped values and does not expose internal raw evidence',async()=>{
  const panel=await src();
  assert.match(panel,/reviewPortfolio\?\.tasks/);
  assert.match(panel,/esc\(t\.label/);
  assert.match(panel,/esc\(t\.requiredReview/);
  assert.match(panel,/esc\(t\.candidateEsrs\.join/);
  assert.doesNotMatch(panel,/t\.evidenceIds\.join/);
});
