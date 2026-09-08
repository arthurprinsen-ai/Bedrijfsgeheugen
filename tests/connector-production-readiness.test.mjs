import test from 'node:test';
import assert from 'node:assert/strict';
import { createEnvironmentConnectorProviders } from '../platform/connectors/connector-runtime.mjs';

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
