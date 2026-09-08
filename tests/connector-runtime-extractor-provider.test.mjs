import test from 'node:test';
import assert from 'node:assert/strict';
import {createEnvironmentConnectorProviders} from '../platform/connectors/connector-runtime.mjs';

test('runtime uses configured server document extractor and exposes capability state only',async()=>{
  const calls=[];
  const fetchFn=async(url,options)=>{
    calls.push({url,options});
    return {
      ok:true,
      status:200,
      json:async()=>({type:'invoice',confidence:.96,fields:{factuurnummer:{value:'F-42',confidence:.99},bedrag:{value:125,confidence:.95}}})
    };
  };
  const runtime=createEnvironmentConnectorProviders({fetchFn,env:{DOCUMENT_EXTRACTOR_URL:'https://internal.example/extract',CONNECTOR_SAFE_TEST_TOKEN:'server-only'}});

  assert.deepEqual(runtime.readiness.extractor,{configured:true,state:'server-safe-test'});
  const result=await runtime.extractor.extract({sample:{content:'pdf-bytes',documentType:'invoice'}});
  assert.equal(calls.length,1);
  assert.equal(calls[0].url,'https://internal.example/extract');
  assert.equal(calls[0].options.headers['x-bg-safe-test'],'1');
  assert.ok(calls[0].options.headers['x-bg-safe-test-token']);
  assert.equal(result.type,'invoice');
  assert.equal(result.fields.factuurnummer.value,'F-42');
  assert.equal(result.mode,'server-safe-test');
  assert.equal(JSON.stringify(runtime.readiness).match(/secret|token|password|api_key/i),null);
});

test('runtime keeps deterministic extractedFields safe-test when no provider is configured',async()=>{
  const runtime=createEnvironmentConnectorProviders({env:{}});
  assert.deepEqual(runtime.readiness.extractor,{configured:false,state:'sample-only'});
  const result=await runtime.extractor.extract({sample:{documentType:'invoice',extractedFields:{factuurnummer:'F-1'}}});
  assert.equal(result.fields.factuurnummer.value,'F-1');
  assert.equal(result.mode,'safe-test-sample');
});
