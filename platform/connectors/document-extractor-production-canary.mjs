import { writeFile } from 'node:fs/promises';
import { createDocumentExtractorHandler } from './document-extractor-provider.mjs';

const LOCAL_SAFE_TEST_TOKEN='build-local-canary';
const EVIDENCE_PATH='connector-canary-evidence.json';
const SAMPLE={
  content:'Factuur INV-BG-LIVE-20260908 van Bedrijfsgeheugen B.V. aan Testklant B.V., factuurdatum 2026-09-08, totaal EUR 1210,00 inclusief BTW.',
  fields:['invoiceNumber','invoiceDate','total']
};

async function persistEvidence(evidence){
  await writeFile(EVIDENCE_PATH,`${JSON.stringify(evidence,null,2)}\n`,'utf8');
}

export async function runDocumentExtractorProductionCanary({env=process.env,handlerFactory=createDocumentExtractorHandler,log=console.log,writeEvidence=persistEvidence}={}){
  if(env.DOCUMENT_EXTRACTOR_CANARY_ONCE!=='1'){
    log(JSON.stringify({status:'DOCUMENT_EXTRACTOR_CANARY_SKIPPED'}));
    return {skipped:true};
  }
  if(!env.ANTHROPIC_API_KEY) throw new Error('DOCUMENT_EXTRACTOR_CANARY_ANTHROPIC_KEY_MISSING');

  const handler=handlerFactory({anthropicApiKey:env.ANTHROPIC_API_KEY,safeTestToken:LOCAL_SAFE_TEST_TOKEN});
  const response=await handler(new Request('https://build-canary.local/api/connectors/document-extractor',{
    method:'POST',
    headers:{'content-type':'application/json','x-bg-safe-test':'1','x-bg-safe-test-token':LOCAL_SAFE_TEST_TOKEN},
    body:JSON.stringify(SAMPLE)
  }));
  if(response.status!==200) throw new Error(`DOCUMENT_EXTRACTOR_CANARY_FAILED_${response.status}`);
  const executionId=response.headers.get('x-execution-id');
  if(!executionId) throw new Error('DOCUMENT_EXTRACTOR_CANARY_EXECUTION_ID_MISSING');
  const body=await response.json();
  const invoiceNumber=body?.fields?.invoiceNumber?.value;
  if(String(invoiceNumber||'').trim()!=='INV-BG-LIVE-20260908') throw new Error('DOCUMENT_EXTRACTOR_CANARY_RESULT_MISMATCH');
  const evidence={status:'DOCUMENT_EXTRACTOR_CANARY_OK',providerExecutionId:executionId,type:body.type||'unknown',invoiceNumber};
  await writeEvidence(evidence);
  log(JSON.stringify(evidence));
  return evidence;
}

if(import.meta.url===`file://${process.argv[1]}`){
  await runDocumentExtractorProductionCanary();
}
