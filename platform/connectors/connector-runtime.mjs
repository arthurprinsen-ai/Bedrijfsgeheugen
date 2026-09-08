import {runConnectorTest,evaluateActivationEvidence,classifyConnectorError} from './connector-engine.mjs';
import {createDocumentExtractor} from './document-extractor.mjs';

const notConfigured=name=>Object.assign(new Error(`${name} runtime is not configured`),{code:'ADAPTER_NOT_CONFIGURED'});
const configuredState=configured=>({configured:Boolean(configured),state:configured?'configured':'not-configured'});
const normalizeFields=fields=>Object.fromEntries(Object.entries(fields||{}).map(([key,value])=>[
  key,
  typeof value==='object'&&value!==null&&'value' in value
    ? value
    : {value,confidence:1}
]));

export function createConnectorRuntime({providers={}}={}){
  return Object.freeze({
    readiness:providers.readiness||{sources:{},extractor:{configured:false,state:'not-configured'},targets:{}},
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

export function createEnvironmentConnectorProviders({fetchFn=globalThis.fetch,env=process.env,documentExtractorProvider=null,confidenceThreshold=.8}={}){
  const upload={read:async input=>{if(!input?.content&&!input?.extractedFields)throw Object.assign(new Error('Safe-test sample is required'),{code:'SAFE_TEST_SAMPLE_REQUIRED'});return {content:input.content||'',hash:input.hash||`sample-${Date.now()}`,sample:input};}};
  const email={read:async input=>{if(!input?.messageId&&!input?.attachments?.length&&!input?.extractedFields)throw Object.assign(new Error('Email safe-test sample is required'),{code:'SAFE_TEST_SAMPLE_REQUIRED'});return {messageId:input.messageId||null,subject:input.subject||'',from:input.from||null,attachments:Array.isArray(input.attachments)?input.attachments:[],hash:input.hash||input.messageId||`email-sample-${Date.now()}`,sample:input};}};
  const sources={upload,email};

  const serverExtractor=createDocumentExtractor({provider:documentExtractorProvider,confidenceThreshold});
  const extractor={extract:async source=>{
    const sample=source?.sample||{};
    const extraction=await serverExtractor.extract({...sample,content:source?.content||sample.content||''});
    return {
      type:extraction.documentType||sample.documentType||'custom',
      confidence:Number.isFinite(extraction.confidence)?extraction.confidence:1,
      fields:normalizeFields(extraction.fields),
      reviewRequired:Boolean(extraction.reviewRequired),
      mode:extraction.mode
    };
  }};

  const targets={datahub:{safeTest:async payload=>({ok:true,reference:'datahub-safe-test',payload})}};
  if(env.AFAS_SAFE_TEST_URL)targets.afas={safeTest:async payload=>{const response=await fetchFn(env.AFAS_SAFE_TEST_URL,{method:'POST',headers:{'content-type':'application/json','x-bg-safe-test':'1'},body:JSON.stringify(payload)});return {ok:response.ok,reference:response.headers.get('x-execution-id')||null};}};
  if(env.EXACT_SAFE_TEST_URL)targets.exact={safeTest:async payload=>{const response=await fetchFn(env.EXACT_SAFE_TEST_URL,{method:'POST',headers:{'content-type':'application/json','x-bg-safe-test':'1'},body:JSON.stringify(payload)});return {ok:response.ok,reference:response.headers.get('x-execution-id')||null};}};
  const readiness={
    sources:{upload:{configured:true,state:'native-safe-test'},email:{configured:true,state:'native-safe-test'}},
    extractor:documentExtractorProvider?{configured:true,state:'native-provider'}:{configured:false,state:'sample-only'},
    targets:{datahub:{configured:true,state:'native-safe-test'},afas:configuredState(Boolean(env.AFAS_SAFE_TEST_URL)),exact:configuredState(Boolean(env.EXACT_SAFE_TEST_URL))}
  };
  return {sources,extractor,targets,lookups:null,readiness};
}
