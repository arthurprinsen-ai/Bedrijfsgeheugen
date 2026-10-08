import test from 'node:test';
import assert from 'node:assert/strict';

test('customer AI/CSRD status follows existing tenant Brain review without claiming compliance',async()=>{
 const earlierElement=globalThis.HTMLElement,earlierElements=globalThis.customElements;
 let Panel;
 try{
  globalThis.HTMLElement=class {constructor(){this.innerHTML='';}querySelectorAll(){return [];}querySelector(){return null;}};
  globalThis.customElements={get:()=>null,define:(_name,constructor)=>{Panel=constructor;}};
  await import('../portal-next/data-sovereignty-panel.js');
  const panel=new Panel();panel.scope='customer';
  const base={policy:{mode:'EU_ONLY',last_change_impact:{
   contract:'powerhouse-cross-domain-change-v1',status:'REVIEW_REQUIRED',kind:'DATA_LOCATION',actor:'internal-reviewer-private',
   esrsReview:[{standard:'ESRS_E1',reviewRequired:true,materiality:'UNDETERMINED'}]
  }},summary:{},violations:[]};
  panel.snapshot={...base,brainReview:{status:'OPEN',verifiedOutcome:false,aiRuntimeApproved:false}};
  panel.render();
  assert.match(panel.innerHTML,/Opvolging door het Brein:/);
  assert.match(panel.innerHTML,/Open — bewijs en beoordeling nodig/);
  assert.match(panel.innerHTML,/niet dat CSRD voor jouw organisatie verplicht is/);
  assert.doesNotMatch(panel.innerHTML,/internal-reviewer-private/);
  panel.snapshot={...base,brainReview:{status:'FULFILLED'}};
  panel.render();
  assert.match(panel.innerHTML,/Administratief afgerond; inhoudelijk bewijs blijft vereist/);
  assert.doesNotMatch(panel.innerHTML,/>CSRD-compliant</);
  panel.snapshot={...base,brainReview:{status:'<img src=x onerror=alert(1)>'}};
  panel.render();
  assert.match(panel.innerHTML,/Nog geen bevestigde Brain-status/);
  assert.doesNotMatch(panel.innerHTML,/onerror=alert/);
 }finally{
  if(earlierElement===undefined)delete globalThis.HTMLElement;else globalThis.HTMLElement=earlierElement;
  if(earlierElements===undefined)delete globalThis.customElements;else globalThis.customElements=earlierElements;
 }
});
