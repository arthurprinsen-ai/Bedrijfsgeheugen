import test from 'node:test';
import assert from 'node:assert/strict';
import {runConnectorTest,evaluateActivationEvidence,classifyConnectorError} from '../platform/connectors/connector-engine.mjs';

const draft=()=>({id:'c1',version:2,source:{type:'upload'},documentSchema:{fields:[{key:'supplier_name',required:true,confidenceThreshold:.8},{key:'invoice_number',required:true,confidenceThreshold:.8},{key:'total_amount',required:true,confidenceThreshold:.8}]},lookups:[],validationRules:[],mappings:[{sourceField:'invoice_number',targetField:'InvoiceNumber',transformation:{type:'none'}},{sourceField:'total_amount',targetField:'Amount',transformation:{type:'none'}}],target:{type:'afas'},reviewPolicy:{requiredBelowConfidence:.8},dedupe:{strategy:'content-hash'}});

const baseAdapters=({hash='h1',extraction,lookup=async()=>({status:'matched',values:{}}),target=async payload=>({ok:true,payload})}={})=>({
  source:{read:async()=>({content:'pdf',hash})},
  extractor:{extract:async()=>extraction||({type:'purchase-invoice',confidence:.97,fields:{supplier_name:{value:'ACME',confidence:.96},invoice_number:{value:'INV-1',confidence:.99},total_amount:{value:121,confidence:.99}}})},
  lookups:{resolve:lookup},
  target:{safeTest:target}
});

test('safe test executes source extraction validation mapping and target dry-run without production write',async()=>{
  let wrote=false;
  const adapters=baseAdapters();
  adapters.target.write=async()=>{wrote=true;};
  const result=await runConnectorTest({connector:draft(),input:{file:'invoice.pdf'},adapters});
  assert.equal(result.status,'TEST_PASSED');
  assert.equal(wrote,false);
  assert.equal(result.evidence.sourceReadSuccess,true);
  assert.equal(result.evidence.targetSafeTestResult.ok,true);
  assert.equal(result.proposedPayload.InvoiceNumber,'INV-1');
});

test('ambiguous lookup forces review and never calls target',async()=>{
  let targetCalled=false;
  const c=draft();c.lookups=[{id:'supplier',sourceField:'supplier_name',match:'fuzzy'}];
  const result=await runConnectorTest({connector:c,input:{},adapters:baseAdapters({hash:'h2',lookup:async()=>({status:'ambiguous',matches:[1,2]}),target:async()=>{targetCalled=true;return{ok:true};}})});
  assert.equal(result.status,'REVIEW_REQUIRED');
  assert.equal(targetCalled,false);
});

test('field confidence below configured threshold forces review',async()=>{
  const extraction={type:'purchase-invoice',confidence:.95,fields:{supplier_name:{value:'ACME',confidence:.5},invoice_number:{value:'1',confidence:.95},total_amount:{value:10,confidence:.95}}};
  const result=await runConnectorTest({connector:draft(),input:{},adapters:baseAdapters({hash:'h3',extraction})});
  assert.equal(result.status,'REVIEW_REQUIRED');
  assert.equal(result.reviewReasons.some(r=>r.code==='LOW_FIELD_CONFIDENCE'),true);
});

test('dedupe collision fails safely before target call',async()=>{
  let targetCalled=false;
  const result=await runConnectorTest({connector:draft(),input:{},seenDedupeKeys:new Set(['h4']),adapters:baseAdapters({hash:'h4',target:async()=>{targetCalled=true;return{ok:true};}})});
  assert.equal(result.status,'DUPLICATE');assert.equal(targetCalled,false);
});

test('duplicate invoice validation rule blocks target safe-test',async()=>{
  let targetCalled=false;
  const c=draft();
  c.lookups=[{id:'invoice_duplicate',sourceField:'invoice_number',match:'exact'}];
  c.validationRules=[{type:'block_lookup_match',lookupId:'invoice_duplicate',code:'DUPLICATE_INVOICE'}];
  const result=await runConnectorTest({connector:c,input:{},adapters:baseAdapters({hash:'h5',lookup:async({rule})=>rule.id==='invoice_duplicate'?{status:'matched',values:{existingInvoiceId:'I-1'}}:{status:'not-found'},target:async()=>{targetCalled=true;return{ok:true};}})});
  assert.equal(result.status,'REVIEW_REQUIRED');
  assert.equal(result.reviewReasons.some(r=>r.code==='DUPLICATE_INVOICE'),true);
  assert.equal(targetCalled,false);
});

test('unresolved purchase order validation rule blocks target safe-test',async()=>{
  let targetCalled=false;
  const c=draft();
  c.documentSchema.fields.push({key:'purchase_order_number',required:false,confidenceThreshold:.8});
  c.lookups=[{id:'purchase_order',sourceField:'purchase_order_number',match:'exact'}];
  c.validationRules=[{type:'require_lookup_match_when_present',lookupId:'purchase_order',field:'purchase_order_number',code:'PO_NOT_RESOLVED'}];
  const extraction={type:'purchase-invoice',confidence:.99,fields:{supplier_name:{value:'ACME',confidence:.99},invoice_number:{value:'INV-2',confidence:.99},total_amount:{value:121,confidence:.99},purchase_order_number:{value:'PO-9',confidence:.99}}};
  const result=await runConnectorTest({connector:c,input:{},adapters:baseAdapters({hash:'h6',extraction,lookup:async()=>({status:'not-found'}),target:async()=>{targetCalled=true;return{ok:true};}})});
  assert.equal(result.status,'REVIEW_REQUIRED');
  assert.equal(result.reviewReasons.some(r=>r.code==='PO_NOT_RESOLVED'),true);
  assert.equal(targetCalled,false);
});

test('subtotal plus VAT mismatch is evidence-backed validation failure',async()=>{
  let targetCalled=false;
  const c=draft();
  c.documentSchema.fields.push({key:'subtotal',required:true,confidenceThreshold:.8},{key:'vat_amount',required:true,confidenceThreshold:.8});
  c.validationRules=[{type:'sum_matches',fields:['subtotal','vat_amount'],totalField:'total_amount',tolerance:.02,code:'AMOUNT_VAT_MISMATCH'}];
  const extraction={type:'purchase-invoice',confidence:.99,fields:{supplier_name:{value:'ACME',confidence:.99},invoice_number:{value:'INV-3',confidence:.99},subtotal:{value:100,confidence:.99},vat_amount:{value:19,confidence:.99},total_amount:{value:121,confidence:.99}}};
  const result=await runConnectorTest({connector:c,input:{},adapters:baseAdapters({hash:'h7',extraction,target:async()=>{targetCalled=true;return{ok:true};}})});
  assert.equal(result.status,'REVIEW_REQUIRED');
  assert.equal(result.reviewReasons.some(r=>r.code==='AMOUNT_VAT_MISMATCH'),true);
  assert.equal(targetCalled,false);
});

test('ISO expiry and arbitrary tenant field survive generic extraction and mapping without claiming alerts',async()=>{
  const c={...draft(),documentSchema:{fields:[{key:'standard',required:true,confidenceThreshold:.8},{key:'certificate_number',required:true,confidenceThreshold:.8},{key:'expiry_date',required:true,confidenceThreshold:.8},{key:'certificate_owner',required:false,confidenceThreshold:.8}]},lookups:[],validationRules:[],mappings:[{sourceField:'standard',targetField:'standard',transformation:{type:'none'}},{sourceField:'certificate_number',targetField:'certificate_number',transformation:{type:'none'}},{sourceField:'expiry_date',targetField:'expiry_date',transformation:{type:'none'}},{sourceField:'certificate_owner',targetField:'owner',transformation:{type:'trim'}}],target:{type:'datahub'}};
  const extraction={type:'iso-document',confidence:.99,fields:{standard:{value:'ISO 27001',confidence:.99},certificate_number:{value:'CERT-1',confidence:.99},expiry_date:{value:'2027-01-31',confidence:.99},certificate_owner:{value:' Quality ',confidence:.99}}};
  const result=await runConnectorTest({connector:c,input:{},adapters:baseAdapters({hash:'h8',extraction})});
  assert.equal(result.status,'TEST_PASSED');
  assert.equal(result.proposedPayload.expiry_date,'2027-01-31');
  assert.equal(result.proposedPayload.owner,'Quality');
  assert.equal(result.evidence.alertScheduled,undefined);
});

test('activation evaluator refuses incomplete evidence and accepts complete test evidence only',()=>{
  assert.deepEqual(evaluateActivationEvidence({version:2},{configVersion:2,testExecutionId:'x'}),{eligible:false,reason:'TEST_EVIDENCE_INCOMPLETE'});
  assert.deepEqual(evaluateActivationEvidence({version:2},{configVersion:2,testExecutionId:'x',sourceReadSuccess:true,extractionResult:{ok:true},validationResult:{ok:true},targetSafeTestResult:{ok:true}}),{eligible:true,reason:'ELIGIBLE'});
});

test('connector error classification allows one controlled retry only for transient transport failures',()=>{
  assert.deepEqual(classifyConnectorError({code:'ETIMEDOUT'}),{retryable:true,maxAttempts:1,recoveryRequired:false,class:'transport'});
  assert.deepEqual(classifyConnectorError({code:'UNAUTHORIZED'}),{retryable:false,maxAttempts:0,recoveryRequired:true,class:'auth'});
  assert.deepEqual(classifyConnectorError({code:'LOOKUP_AMBIGUOUS'}),{retryable:false,maxAttempts:0,recoveryRequired:true,class:'validation'});
});
