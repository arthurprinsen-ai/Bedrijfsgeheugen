import test from 'node:test';
import assert from 'node:assert/strict';
import {renderConnectorBuilder,renderConnectorOverview} from '../portal-next/connector-builder-view.js';
import {createConnectorDraft} from '../portal-next/connector-model.js';

const passingEvidence={configVersion:1,testExecutionId:'exec-1',sourceReadSuccess:true,extractionResult:{ok:true,documentType:'purchase-invoice'},validationResult:{ok:true},targetSafeTestResult:{ok:true,reference:'dry-1'}};

test('overview separates planned integrations, built connectors and templates',()=>{
  const html=renderConnectorOverview({planned:[{name:'GA4',purpose:'Analytics'}],connectors:[{id:'c1',name:'Invoice intake',state:'Draft'}]});
  assert.match(html,/Geplande koppelingen/);assert.match(html,/Gebouwde koppelingen/);assert.match(html,/Templates/);assert.match(html,/Koppeling bouwen/);
  assert.doesNotMatch(html,/Invoice intake[\s\S]{0,100}>Actief</);
});

test('overview never presents configured server-required adapters as active',()=>{
  const html=renderConnectorOverview({connectors:[{id:'c1',name:'AFAS intake',state:'Configured',runtime:{adapterState:'not-configured'}}]});
  assert.match(html,/Configured/);
  assert.doesNotMatch(html,/AFAS intake[\s\S]{0,120}>Actief</);
});

test('builder exposes all ten approved stages and custom fields',()=>{
  const draft=createConnectorDraft('purchase-invoice');
  const html=renderConnectorBuilder({draft,stage:3,testResult:null});
  for(const label of ['Bron','Document/data type','Velden','Database & matching','Mapping','Doel','Review & regels','Test','Activeren','Monitoren'])assert.match(html,new RegExp(label));
  assert.match(html,/Factuurnummer/);assert.match(html,/data-add-field/);assert.match(html,/data-builder-next/);
});

test('email AFAS template visibly preserves Document Intake lineage without client secrets',()=>{
  const draft=createConnectorDraft('email-pdf-afas');
  const html=renderConnectorBuilder({draft,stage:2,testResult:null});
  assert.match(html,/AFAS Document Intake/);assert.match(html,/PA - Intake - Loonbeslag Email to AFAS/);assert.match(html,/KnSubject/);
  assert.doesNotMatch(JSON.stringify(draft),/password|authorization|apiKey|token/i);
});

test('safe-test stage accepts explicit fixture input and renders evidence instead of simulated success',()=>{
  const result={status:'TEST_PASSED',proposedPayload:{InvoiceNumber:'INV-1',Amount:121},extraction:{fields:{invoice_number:{value:'INV-1',confidence:.99}}},evidence:passingEvidence};
  const html=renderConnectorBuilder({draft:createConnectorDraft('purchase-invoice'),stage:8,testResult:result});
  assert.match(html,/data-test-sample/);
  assert.match(html,/Veilige test uitvoeren/);
  assert.match(html,/TEST_PASSED/);
  assert.match(html,/InvoiceNumber/);
  assert.match(html,/0\.99/);
});

test('review-required test result renders reasons and proposed payload before approval',()=>{
  const result={status:'REVIEW_REQUIRED',reviewReasons:[{code:'LOOKUP_AMBIGUOUS',lookupId:'supplier'}],proposedPayload:{InvoiceNumber:'INV-2'},evidence:{...passingEvidence,validationResult:{ok:false}}};
  const html=renderConnectorBuilder({draft:createConnectorDraft('purchase-invoice'),stage:8,testResult:result});
  assert.match(html,/REVIEW_REQUIRED/);
  assert.match(html,/LOOKUP_AMBIGUOUS/);
  assert.match(html,/InvoiceNumber/);
});

test('activation button is disabled without passing evidence and enabled only for complete passing evidence',()=>{
  const draft=createConnectorDraft('blank');
  let html=renderConnectorBuilder({draft,stage:9,testResult:null});
  assert.match(html,/data-activate[^>]*disabled/);
  assert.match(html,/Testbewijs vereist/);
  html=renderConnectorBuilder({draft,stage:9,testResult:{status:'TEST_PASSED',evidence:passingEvidence}});
  assert.match(html,/Klaar voor activatie/);
  assert.doesNotMatch(html,/data-activate[^>]*disabled/);
});

test('monitoring stage shows only persisted executions and exposes pause for active connector',()=>{
  const draft=createConnectorDraft('blank');draft.state='Active';
  const html=renderConnectorBuilder({draft,stage:10,testResult:{status:'TEST_PASSED',evidence:passingEvidence},executions:[{id:'e1',status:'TEST_PASSED',gestart_op:'2026-09-07T21:00:00Z'},{id:'e2',status:'REVIEW_REQUIRED',gestart_op:'2026-09-07T21:05:00Z'}],reviewQueue:[{id:'r1',status:'pending'}]});
  assert.match(html,/TEST_PASSED/);
  assert.match(html,/REVIEW_REQUIRED/);
  assert.match(html,/1 open review/);
  assert.match(html,/data-pause/);
});
