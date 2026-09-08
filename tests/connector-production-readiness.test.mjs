import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createEnvironmentConnectorProviders } from '../platform/connectors/connector-runtime.mjs';
import { createDocumentExtractorHandler } from '../platform/connectors/document-extractor-provider.mjs';
import { runDocumentExtractorProductionCanary } from '../platform/connectors/document-extractor-production-canary.mjs';

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
  const providers=createEnvironmentConnectorProviders({fetchFn,env:{DOCUMENT_EXTRACTOR_URL:'https://extractor.example/safe-test',CONNECTOR_SAFE_TEST_TOKEN:'server-secret'}});
  const result=await providers.extractor.extract({sample:{content:'pdf-bytes'}});
  assert.equal(request.url,'https://extractor.example/safe-test');
  assert.equal(request.options.method,'POST');
  assert.equal(request.options.headers['x-bg-safe-test'],'1');
  assert.equal(request.options.headers['x-bg-safe-test-token'],'server-secret');
  assert.equal(result.type,'invoice');
  assert.equal(result.fields.invoiceNumber.value,'INV-1');
  assert.deepEqual(providers.readiness.extractor,{configured:true,state:'server-safe-test'});
  assert.equal(JSON.stringify(providers.readiness).includes('https://extractor.example/safe-test'),false);
  assert.equal(JSON.stringify(providers.readiness).includes('server-secret'),false);
});

test('provider readiness reports external target as not configured without a safe-test endpoint', () => {
  const providers=createEnvironmentConnectorProviders({env:{}});
  assert.equal(providers.readiness.targets.afas.state,'not-configured');
  assert.equal(providers.readiness.targets.exact.state,'not-configured');
});

test('document extractor provider rejects requests without valid safe-test authentication', async () => {
  const handler=createDocumentExtractorHandler({anthropicApiKey:'test-key',safeTestToken:'server-secret',fetchFn:async()=>{throw new Error('must not call provider')}});
  const missing=await handler(new Request('https://example.test/api/connectors/document-extractor',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({content:'Invoice 123'})}));
  assert.equal(missing.status,403);
  const wrong=await handler(new Request('https://example.test/api/connectors/document-extractor',{method:'POST',headers:{'content-type':'application/json','x-bg-safe-test':'1','x-bg-safe-test-token':'wrong'},body:JSON.stringify({content:'Invoice 123'})}));
  assert.equal(wrong.status,403);
});

test('document extractor provider returns normalized fields from Anthropic JSON output', async () => {
  let outbound;
  const handler=createDocumentExtractorHandler({anthropicApiKey:'test-key',safeTestToken:'server-secret',fetchFn:async(url,init)=>{
    outbound={url,init};
    return new Response(JSON.stringify({content:[{type:'text',text:'{"type":"invoice","confidence":0.98,"fields":{"invoiceNumber":{"value":"INV-123","confidence":0.99}}}'}]}),{status:200,headers:{'content-type':'application/json','request-id':'anthropic-123'}});
  }});
  const response=await handler(new Request('https://example.test/api/connectors/document-extractor',{method:'POST',headers:{'content-type':'application/json','x-bg-safe-test':'1','x-bg-safe-test-token':'server-secret'},body:JSON.stringify({content:'Invoice INV-123'})}));
  assert.equal(response.status,200);
  assert.equal(outbound.url,'https://api.anthropic.com/v1/messages');
  assert.equal(outbound.init.method,'POST');
  assert.equal(outbound.init.headers['x-api-key'],'test-key');
  assert.equal(outbound.init.headers['anthropic-version'],'2023-06-01');
  assert.equal(response.headers.get('x-execution-id'),'anthropic-123');
  const body=await response.json();
  assert.equal(body.type,'invoice');
  assert.equal(body.fields.invoiceNumber.value,'INV-123');
  assert.equal(body.fields.invoiceNumber.confidence,0.99);
});

test('document extractor provider fails closed when provider configuration is missing', async () => {
  const handler=createDocumentExtractorHandler({anthropicApiKey:'',safeTestToken:'',fetchFn:async()=>{throw new Error('must not call provider')}});
  const response=await handler(new Request('https://example.test/api/connectors/document-extractor',{method:'POST',headers:{'x-bg-safe-test':'1','content-type':'application/json'},body:JSON.stringify({content:'Invoice'})}));
  assert.equal(response.status,503);
  assert.equal((await response.json()).error,'DOCUMENT_EXTRACTION_PROVIDER_NOT_CONFIGURED');
});

test('production extractor canary skips by default and exposes only provider execution evidence when enabled', async () => {
  const logs=[];
  const skipped=await runDocumentExtractorProductionCanary({env:{},log:value=>logs.push(value)});
  assert.deepEqual(skipped,{skipped:true});
  let factoryConfig=null;
  const handlerFactory=config=>{
    factoryConfig=config;
    return async request=>{
      assert.equal(request.headers.get('x-bg-safe-test'),'1');
      return new Response(JSON.stringify({type:'invoice',fields:{invoiceNumber:{value:'INV-BG-LIVE-20260908',confidence:0.99}}}),{status:200,headers:{'content-type':'application/json','x-execution-id':'anthropic-live-123'}});
    };
  };
  const evidence=await runDocumentExtractorProductionCanary({env:{DOCUMENT_EXTRACTOR_CANARY_ONCE:'1',ANTHROPIC_API_KEY:'server-only-key'},handlerFactory,log:value=>logs.push(value)});
  assert.equal(factoryConfig.anthropicApiKey,'server-only-key');
  assert.equal(evidence.providerExecutionId,'anthropic-live-123');
  assert.equal(JSON.stringify(evidence).includes('server-only-key'),false);
});

test('production release readback fails closed unless live document extraction is server-configured', async () => {
  const workflow=await readFile(new URL('../.github/workflows/production-release-readback.yml',import.meta.url),'utf8');
  assert.match(workflow,/body\.extractor\.configured\s*!==\s*true/);
  assert.match(workflow,/body\.extractor\.state\s*!==\s*'server-safe-test'/);
  assert.match(workflow,/Live document extractor is not server-configured/);
});
