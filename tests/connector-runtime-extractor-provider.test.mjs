import test from 'node:test';
import assert from 'node:assert/strict';
import {createEnvironmentConnectorProviders} from '../platform/connectors/connector-runtime.mjs';

test('runtime uses configured server document extractor and exposes capability state only',async()=>{
  const calls=[];
  const provider={extract:async input=>{
    calls.push(input);
    return {documentType:'invoice',confidence:.96,fields:{factuurnummer:{value:'F-42',confidence:.99},bedrag:{value:125,confidence:.95}}};
  }};
  const runtime=createEnvironmentConnectorProviders({env:{},documentExtractorProvider:provider});

  assert.deepEqual(runtime.readiness.extractor,{configured:true,state:'native-provider'});
  const result=await runtime.extractor.extract({content:'pdf-bytes',sample:{documentType:'invoice'}});
  assert.equal(calls.length,1);
  assert.equal(result.type,'invoice');
  assert.equal(result.fields.factuurnummer.value,'F-42');
  assert.equal(result.reviewRequired,false);
  assert.equal(JSON.stringify(runtime.readiness).match(/secret|token|password|api_key/i),null);
});

test('runtime keeps deterministic extractedFields safe-test when no provider is configured',async()=>{
  const runtime=createEnvironmentConnectorProviders({env:{}});
  assert.deepEqual(runtime.readiness.extractor,{configured:false,state:'sample-only'});
  const result=await runtime.extractor.extract({sample:{documentType:'invoice',extractedFields:{factuurnummer:'F-1'}}});
  assert.equal(result.fields.factuurnummer.value,'F-1');
  assert.equal(result.mode,'safe-test-sample');
});
