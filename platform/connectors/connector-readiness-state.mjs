const configuredState=configured=>({configured:Boolean(configured),state:configured?'configured':'not-configured'});

export function connectorReadinessFromEnv(getEnv=()=>undefined){
  const documentExtractorUrl=getEnv('DOCUMENT_EXTRACTOR_URL');
  const connectorSafeTestToken=getEnv('CONNECTOR_SAFE_TEST_TOKEN');
  const afasSafeTestUrl=getEnv('AFAS_SAFE_TEST_URL');
  const exactSafeTestUrl=getEnv('EXACT_SAFE_TEST_URL');

  return {
    sources:{
      upload:{configured:true,state:'native-safe-test'},
      email:{configured:true,state:'native-safe-test'}
    },
    extractor:documentExtractorUrl&&connectorSafeTestToken
      ?{configured:true,state:'server-safe-test'}
      :{configured:false,state:'sample-only'},
    targets:{
      datahub:{configured:true,state:'native-safe-test'},
      afas:configuredState(Boolean(afasSafeTestUrl)),
      exact:configuredState(Boolean(exactSafeTestUrl))
    }
  };
}
