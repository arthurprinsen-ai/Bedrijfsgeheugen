import test from 'node:test';
import assert from 'node:assert/strict';
import {createConnectorRuntime,createEnvironmentConnectorProviders} from '../platform/connectors/connector-runtime.mjs';
import {createWizardState,applyAnswer,toConnectorDefinition} from '../assets/js/koppelingen/wizard.js';
import {findTemplate} from '../assets/js/koppelingen/templates.js';

test('wizard definition safely flows Outlook PDF sample through extraction to Datahub',async()=>{
  let state=createWizardState(findTemplate('outlook-pdf-facturen'));
  state=applyAnswer(state,'connection','m365-test');
  state=applyAnswer(state,'confirmSchedule',true);
  const connector={...toConnectorDefinition(state),version:1};
  const runtime=createConnectorRuntime({providers:createEnvironmentConnectorProviders({env:{}})});

  const result=await runtime.runTest({
    connector,
    input:{
      messageId:'mail-safe-1',
      subject:'Testfactuur',
      attachments:[{name:'factuur.pdf'}],
      documentType:'invoice',
      extractedFields:{
        factuurnummer:'F-2026-001',
        factuurdatum:'2026-09-08',
        leverancier:'Test BV',
        bedrag:100,
        btw:21,
        valuta:'EUR'
      }
    }
  });

  assert.equal(result.status,'TEST_PASSED');
  assert.deepEqual(result.proposedPayload,{
    factuurnummer:'F-2026-001',
    factuurdatum:'2026-09-08',
    leverancier:'Test BV',
    bedrag:100,
    btw:21,
    valuta:'EUR'
  });
  assert.equal(result.extraction.mode,'safe-test-sample');
  assert.equal(result.evidence.sourceReadSuccess,true);
  assert.equal(result.evidence.extractionResult.ok,true);
  assert.equal(result.evidence.validationResult.ok,true);
  assert.equal(result.evidence.targetSafeTestResult.ok,true);
  assert.ok(result.evidence.testExecutionId);
  assert.deepEqual(runtime.activationEligibility(connector,result.evidence),{eligible:true,reason:'ELIGIBLE'});
});

test('real document bytes stay fail-closed without a configured extractor provider',async()=>{
  const runtime=createConnectorRuntime({providers:createEnvironmentConnectorProviders({env:{}})});
  const connector={
    version:1,
    source:{type:'upload'},
    documentSchema:{type:'invoice',fields:[]},
    mappings:[],
    reviewPolicy:{requiredBelowConfidence:.8},
    target:{type:'datahub'}
  };
  await assert.rejects(
    ()=>runtime.runTest({connector,input:{content:'real-pdf-bytes'}}),
    error=>error?.code==='DOCUMENT_EXTRACTION_PROVIDER_NOT_CONFIGURED'
  );
});
