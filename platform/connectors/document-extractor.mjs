export function createDocumentExtractor({provider,confidenceThreshold=.8}={}){
  return {
    async extract(input={}){
      if(input.extractedFields&&typeof input.extractedFields==='object'){
        return {
          documentType:input.documentType||'sample',
          fields:input.extractedFields,
          confidence:1,
          reviewRequired:false,
          mode:'safe-test-sample'
        };
      }

      if(!provider?.extract){
        const error=new Error('Document extraction provider not configured');
        error.code='DOCUMENT_EXTRACTION_PROVIDER_NOT_CONFIGURED';
        throw error;
      }

      const result=await provider.extract(input);
      const fieldConfidences=Object.values(result?.fields||{}).map(value=>
        typeof value==='object'&&value!==null&&Number.isFinite(value.confidence)
          ? value.confidence
          : (Number.isFinite(result?.confidence)?result.confidence:0)
      );
      const minConfidence=fieldConfidences.length
        ? Math.min(...fieldConfidences)
        : (Number.isFinite(result?.confidence)?result.confidence:0);

      return {
        ...result,
        reviewRequired:minConfidence<confidenceThreshold,
        mode:'provider'
      };
    }
  };
}
