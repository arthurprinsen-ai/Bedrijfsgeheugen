import test from 'node:test';
import assert from 'node:assert/strict';
import {runConnectorTest,evaluateActivationEvidence} from '../platform/connectors/connector-engine.mjs';

const draft=()=>({id:'c1',version:2,source:{type:'upload'},documentSchema:{fields:[{key:'supplier_name',required:true,confidenceThreshold:.8},{key:'invoice_number',required:true,confidenceThreshold:.8},{key:'total_amount',required:true,confidenceThreshold:.8}]},lookups:[],mappings:[{sourceField:'invoice_number',targetField:'InvoiceNumber',transformation:{type:'none'}},{sourceField:'total_amount',targetField:'Amount',transformation:{type:'none'}}],target:{type:'afas'},reviewPolicy:{requiredBelowConfidence:.8},dedupe:{strategy:'content-hash'}});

test('safe test executes source extraction validation mapping and target dry-run without production write',async()=>{
  let wrote=false;
  const result=await runConnectorTest({connector:draft(),input:{file:'invoice.pdf'},adapters:{source:{read:async()=>({content:'pdf',hash:'h1'})},extractor:{extract:async()=>({type:'purchase-invoice',confidence:.97,fields:{supplier_name:{value:'ACME',confidence:.96},invoice_number:{value:'INV-1',confidence:.99},total_amount:{value:121,confidence:.99}}})},lookups:{resolve:async()=>({status:'matched',values:{}})},target:{safeTest:async payload=>({ok:true,payload}),write:async()=>{wrote=true;}}}});
  assert.equal(result.status,'TEST_PASSED');
  assert.equal(wrote,false);
  assert.equal(result.evidence.sourceReadSuccess,true);
  assert.equal(result.evidence.targetSafeTestResult.ok,true);
  assert.equal(result.proposedPayload.InvoiceNumber,'INV-1');
});

test('ambiguous lookup forces review and never calls target',async()=>{
  let targetCalled=false;
  const c=draft();c.lookups=[{id:'supplier',sourceField:'supplier_name',match:'fuzzy'}];
  const result=await runConnectorTest({connector:c,input:{},adapters:{source:{read:async()=>({content:'x',hash:'h2'})},extractor:{extract:async()=>({type:'purchase-invoice',confidence:.95,fields:{supplier_name:{value:'ACME',confidence:.95},invoice_number:{value:'1',confidence:.95},total_amount:{value:10,confidence:.95}}})},lookups:{resolve:async()=>({status:'ambiguous',matches:[1,2]})},target:{safeTest:async()=>{targetCalled=true;return{ok:true}}}}});
  assert.equal(result.status,'REVIEW_REQUIRED');
  assert.equal(targetCalled,false);
});

test('field confidence below configured threshold forces review',async()=>{
  const result=await runConnectorTest({connector:draft(),input:{},adapters:{source:{read:async()=>({content:'x',hash:'h3'})},extractor:{extract:async()=>({type:'purchase-invoice',confidence:.95,fields:{supplier_name:{value:'ACME',confidence:.5},invoice_number:{value:'1',confidence:.95},total_amount:{value:10,confidence:.95}}})},lookups:{resolve:async()=>({status:'matched',values:{}})},target:{safeTest:async()=>({ok:true})}}});
  assert.equal(result.status,'REVIEW_REQUIRED');
  assert.equal(result.reviewReasons.some(r=>r.code==='LOW_FIELD_CONFIDENCE'),true);
});

test('dedupe collision fails safely before target call',async()=>{
  let targetCalled=false;
  const result=await runConnectorTest({connector:draft(),input:{},seenDedupeKeys:new Set(['h4']),adapters:{source:{read:async()=>({content:'x',hash:'h4'})},extractor:{extract:async()=>({fields:{}})},lookups:{resolve:async()=>({status:'matched'})},target:{safeTest:async()=>{targetCalled=true;return{ok:true}}}}});
  assert.equal(result.status,'DUPLICATE');assert.equal(targetCalled,false);
});

test('activation evaluator refuses incomplete evidence',()=>{
  assert.deepEqual(evaluateActivationEvidence({version:2},{configVersion:2,testExecutionId:'x'}),{eligible:false,reason:'TEST_EVIDENCE_INCOMPLETE'});
});
