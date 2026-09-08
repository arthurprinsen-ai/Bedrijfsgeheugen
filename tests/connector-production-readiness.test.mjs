import test from 'node:test';
import assert from 'node:assert/strict';
import { createEnvironmentConnectorProviders } from '../platform/connectors/connector-runtime.mjs';
import { createDocumentExtractorHandler } from '../platform/connectors/document-extractor-provider.mjs';

test('email source can execute a safe test from an explicit webhook sample without mailbox credentials', async () => {
  const providers=createEnvironmentConnectorProviders({env:{}});
  assert.equal(typeof providers.sources.email?.read,'function');
  const source=await providers.sources.email.read({messageId:'m-1',attachments:[{name:'invoice.pdf',mimeType:'application/pdf',content:'pdf-bytes'}]});
  assert.equal(source.messageId,'m-1');
  assert.equal(source.attachments[0].mimeType,'application/pdf');
});

test('document extractor remains fail-closed when neither extracted fields nor a server provider exists', async () => {
  const providers=createEnvironmentConnectorProviders({env:{}});
  await assert.rejects(()=>providers.extractor.extract({sample:{}}),error=>error?.code==='DOCUMENT_EXTRACTION_PROVIDER_NOT_CONFIGURED');
});

test('document extractor uses the configured server safe-test endpoint and reports only capability state', async () => {
  let request=null;
  const fetchFn=async (url,options)=>{
    request={url,options};
    return {
      ok:true,
      headers:{get:name=>name==='x-execution-id'?'extract-123':null},
      async json(){return {type:'invoice',confidence:0.98,fields:{invoiceNumber:{value:'INV-1',confidence:0.99}}};}
    };
  };
  const providers=createEnvironmentConnectorProviders({fetchFn,env:{DOCUMENT_EXTRACTOR_URL:'https://extractor.example/safe-test'}});
  const result=await providers.extractor.extract({sample:{content:'pdf-bytes'}});
  assert.equal(request.url,'https://extractor.example/safe-test');
  assert.equal(request.options.method,'POST');
  assert.equal(request.options.headers['x-bg-safe-test'],'1');
  assert.equal(result.type,'invoice');
  assert.equal(result.fields.invoiceNumber.value,'INV-1');
  assert.deepEqual(providers.readiness.extractor,{configured:true,state:'server-safe-test'});
  assert.equal(JSON.stringify(providers.readiness).includes('https://extractor.example/safe-test'),false);
});

test('provider readiness reports external target as not configured without a safe-test endpoint', () => {
  const providers=createEnvironmentConnectorProviders({env:{}});
  assert.equal(providers.readiness.targets.afas.state,'not-configured');
  assert.equal(providers.readiness.targets.exact.state,'not-configured');
});

test('document extractor provider rejects requests without the safe-test header', async () => {
  const handler=createDocumentExtractorHandler({anthropicApiKey:'test-key',fetchFn:async()=>{throw new Error('must not call provider')}});
  const response=await handler(new Request('https://example.test/api/connectors/document-extractor',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({content:'Invoice 123'})}));
  assert.equal(response.status,403);
});

test('document extractor provider returns normalized fields from Anthropic JSON output', async () => {
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

test('document extractor provider fails closed when provider key is missing', async () => {
  const handler=createDocumentExtractorHandler({anthropicApiKey:'',fetchFn:async()=>{throw new Error('must not call provider')}});
  const response=await handler(new Request('https://example.test/api/connectors/document-extractor',{method:'POST',headers:{'x-bg-safe-test':'1','content-type':'application/json'},body:JSON.stringify({content:'Invoice'})}));
  assert.equal(response.status,503);
  assert.equal((await response.json()).error,'DOCUMENT_EXTRACTION_PROVIDER_NOT_CONFIGURED');
});
