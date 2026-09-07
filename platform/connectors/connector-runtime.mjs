import {runConnectorTest,evaluateActivationEvidence,classifyConnectorError} from './connector-engine.mjs';

const notConfigured=name=>Object.assign(new Error(`${name} runtime is not configured`),{code:'ADAPTER_NOT_CONFIGURED'});
export function createConnectorRuntime({providers={}}={}){
  return Object.freeze({
    async runTest({connector,input}){
      const sourceProvider=providers.sources?.[connector?.source?.type],extractorProvider=providers.extractor,targetProvider=providers.targets?.[connector?.target?.type],lookupProvider=providers.lookups;
      if(!sourceProvider)throw notConfigured(`Source ${connector?.source?.type||'unknown'}`);
      if(!extractorProvider)throw notConfigured('Document extraction');
      if(!targetProvider)throw notConfigured(`Target ${connector?.target?.type||'unknown'}`);
      return runConnectorTest({connector,input,adapters:{source:sourceProvider,extractor:extractorProvider,lookups:lookupProvider||{resolve:async()=>({status:'not-found'})},target:targetProvider}});
    },
    activationEligibility:evaluateActivationEvidence,
    classifyError:classifyConnectorError
  });
}
export function createEnvironmentConnectorProviders({fetchFn=globalThis.fetch,env=process.env}={}){
  const sources={upload:{read:async input=>{if(!input?.content&&!input?.extractedFields)throw Object.assign(new Error('Safe-test sample is required'),{code:'SAFE_TEST_SAMPLE_REQUIRED'});return {content:input.content||'',hash:input.hash||`sample-${Date.now()}`,sample:input};}}};
  const extractor={extract:async source=>{const sample=source?.sample||{};if(!sample.extractedFields)throw Object.assign(new Error('Document extraction provider is not configured; provide explicit safe-test extractedFields or configure a server extractor.'),{code:'DOCUMENT_EXTRACTION_PROVIDER_NOT_CONFIGURED'});return {type:sample.documentType||'custom',confidence:Number(sample.classificationConfidence??1),fields:Object.fromEntries(Object.entries(sample.extractedFields).map(([key,value])=>[key,typeof value==='object'&&value&&'value'in value?value:{value,confidence:1}]))};}};
  const targets={datahub:{safeTest:async payload=>({ok:true,reference:'datahub-safe-test',payload})}};
  if(env.AFAS_SAFE_TEST_URL)targets.afas={safeTest:async payload=>{const response=await fetchFn(env.AFAS_SAFE_TEST_URL,{method:'POST',headers:{'content-type':'application/json','x-bg-safe-test':'1'},body:JSON.stringify(payload)});return {ok:response.ok,reference:response.headers.get('x-execution-id')||null};}};
  if(env.EXACT_SAFE_TEST_URL)targets.exact={safeTest:async payload=>{const response=await fetchFn(env.EXACT_SAFE_TEST_URL,{method:'POST',headers:{'content-type':'application/json','x-bg-safe-test':'1'},body:JSON.stringify(payload)});return {ok:response.ok,reference:response.headers.get('x-execution-id')||null};}};
  return {sources,extractor,targets,lookups:null};
}
