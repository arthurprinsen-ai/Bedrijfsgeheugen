import test from 'node:test';
import assert from 'node:assert/strict';
import {createDocumentExtractorHandler} from '../platform/connectors/document-extractor-provider.mjs';

test('document extractor rejects requests without safe-test header', async()=>{
  const handler=createDocumentExtractorHandler({anthropicApiKey:'test-key',fetchFn:async()=>{throw new Error('must not call provider')}});
  const response=await handler(new Request('https://example.test/api/connectors/document-extractor',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({content:'Invoice 123'})}));
  assert.equal(response.status,403);
});

test('document extractor returns normalized fields from Anthropic JSON output', async()=>{
  let outbound;
  const handler=createDocumentExtractorHandler({anthropicApiKey:'test-key',fetchFn:async(url,init)=>{
    outbound={url,init};
    return new Response(JSON.stringify({content:[{type:'text',text:'{"type":"invoice","confidence":0.98,"fields":{"invoiceNumber":{"value":"INV-123","confidence":0.99}}}'}]}),{status:200,headers:{'content-type':'application/json'}});
  }});
  const response=await handler(new Request('https://example.test/api/connectors/document-extractor',{method:'POST',headers:{'content-type':'application/json','x-bg-safe-test':'1'},body:JSON.stringify({content:'Invoice INV-123'})}));
  assert.equal(response.status,200);
  assert.equal(outbound.url,'https://api.anthropic.com/v1/messages');
  assert.equal(outbound.init.method,'POST');
  assert.equal(outbound.init.headers['x-api-key'],'test-key');
  const body=await response.json();
  assert.equal(body.type,'invoice');
  assert.equal(body.fields.invoiceNumber.value,'INV-123');
  assert.equal(body.fields.invoiceNumber.confidence,0.99);
});

test('document extractor fails closed when provider key is missing', async()=>{
  const handler=createDocumentExtractorHandler({anthropicApiKey:'',fetchFn:async()=>{throw new Error('must not call provider')}});
  const response=await handler(new Request('https://example.test/api/connectors/document-extractor',{method:'POST',headers:{'x-bg-safe-test':'1','content-type':'application/json'},body:JSON.stringify({content:'Invoice'})}));
  assert.equal(response.status,503);
  assert.equal((await response.json()).error,'DOCUMENT_EXTRACTION_PROVIDER_NOT_CONFIGURED');
});
