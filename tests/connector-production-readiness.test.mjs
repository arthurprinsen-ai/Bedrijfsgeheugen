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

test('provider readiness reports external target as not configured without a safe-test endpoint', () => {
  const providers=createEnvironmentConnectorProviders({env:{}});
  assert.equal(providers.readiness.targets.afas.state,'not-configured');
  assert.equal(providers.readiness.targets.exact.state,'not-configured');
});
