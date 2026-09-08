import test from 'node:test';
import assert from 'node:assert/strict';
import {createDocumentExtractor} from '../platform/connectors/document-extractor.mjs';

test('extractor stays fail-closed without provider', async () => {
  const extractor=createDocumentExtractor({provider:null});
  await assert.rejects(
    ()=>extractor.extract({content:'pdf-bytes'}),
    e=>e?.code==='DOCUMENT_EXTRACTION_PROVIDER_NOT_CONFIGURED'
  );
});

test('extractor preserves deterministic extractedFields safe-test', async () => {
  const extractor=createDocumentExtractor({provider:null});
  const result=await extractor.extract({extractedFields:{invoiceNumber:'F-1',amount:125}});
  assert.equal(result.fields.invoiceNumber,'F-1');
  assert.equal(result.fields.amount,125);
  assert.equal(result.reviewRequired,false);
  assert.equal(result.mode,'safe-test-sample');
});

test('low-confidence provider result requires review', async () => {
  const provider={extract:async()=>({documentType:'invoice',confidence:.62,fields:{amount:{value:125,confidence:.58}}})};
  const extractor=createDocumentExtractor({provider,confidenceThreshold:.8});
  const result=await extractor.extract({content:'pdf-bytes'});
  assert.equal(result.reviewRequired,true);
  assert.equal(result.mode,'provider');
});
