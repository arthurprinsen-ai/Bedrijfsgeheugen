import test from 'node:test';
import assert from 'node:assert/strict';
import { createConnectorDraft, normalizeConnectorDraft, validateConnectorDraft, activationEligibility } from '../portal-next/connector-model.js';

test('blank template supports arbitrary tenant-defined extraction fields',()=>{
  const draft=createConnectorDraft('blank');
  draft.documentSchema.fields.push({key:'certificate_owner',label:'Eigenaar',type:'string',required:true,confidenceThreshold:0.9});
  assert.equal(validateConnectorDraft(draft).errors.length,0);
});

test('activation fails closed without passing runtime evidence',()=>{
  const draft=createConnectorDraft('email-pdf-afas');
  assert.deepEqual(activationEligibility(draft,null),{eligible:false,reason:'TEST_EVIDENCE_REQUIRED'});
});

test('source and target are independent choices',()=>{
  const draft=createConnectorDraft('purchase-invoice');
  draft.source.type='upload';
  draft.target.type='exact';
  assert.equal(validateConnectorDraft(draft).errors.length,0);
});

test('duplicate extraction field keys are rejected',()=>{
  const draft=createConnectorDraft('blank');
  draft.documentSchema.fields=[
    {key:'invoice_number',label:'Factuurnummer',type:'string',required:true,confidenceThreshold:.9},
    {key:'invoice_number',label:'Nummer',type:'string',required:false,confidenceThreshold:.8}
  ];
  const result=validateConnectorDraft(draft);
  assert.equal(result.errors.some(e=>e.code==='DUPLICATE_FIELD_KEY'),true);
});

test('secret-looking configuration keys are rejected client-side',()=>{
  const draft=createConnectorDraft('blank');
  draft.source.config={mailbox:'invoices@example.nl',password:'never-here'};
  const result=validateConnectorDraft(draft);
  assert.equal(result.errors.some(e=>e.code==='CLIENT_SECRET_FORBIDDEN'),true);
});

test('arbitrary transformation code is rejected',()=>{
  const draft=createConnectorDraft('blank');
  draft.documentSchema.fields=[{key:'name',label:'Naam',type:'string',required:false,confidenceThreshold:.8}];
  draft.mappings=[{sourceField:'name',targetField:'Subject',required:false,transformation:{type:'javascript',code:'return process.env.SECRET'}}];
  const result=validateConnectorDraft(draft);
  assert.equal(result.errors.some(e=>e.code==='UNSUPPORTED_TRANSFORMATION'),true);
});

test('normalizeConnectorDraft returns an isolated normalized copy',()=>{
  const input=createConnectorDraft('blank');
  const normalized=normalizeConnectorDraft(input);
  normalized.name='Changed';
  assert.notEqual(input.name,normalized.name);
});

test('activation requires complete successful evidence',()=>{
  const draft=createConnectorDraft('email-pdf-afas');
  const evidence={
    configVersion:draft.version,
    testExecutionId:'exec-1',
    sourceReadSuccess:true,
    extractionResult:{ok:true},
    validationResult:{ok:true},
    targetSafeTestResult:{ok:true},
    activationTimestamp:'2026-09-07T20:00:00Z',
    actor:'user-1'
  };
  assert.deepEqual(activationEligibility(draft,evidence),{eligible:true,reason:'ELIGIBLE'});
});
