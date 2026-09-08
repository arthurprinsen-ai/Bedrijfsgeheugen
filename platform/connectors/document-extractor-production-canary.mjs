export async function runDocumentExtractorProductionCanary({log=console.log}={}){
  const result={skipped:true,retired:true};
  log(JSON.stringify({status:'DOCUMENT_EXTRACTOR_CANARY_RETIRED'}));
  return result;
}

if(import.meta.url===`file://${process.argv[1]}`){
  await runDocumentExtractorProductionCanary();
}
