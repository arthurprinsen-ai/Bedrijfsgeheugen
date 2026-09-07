import {validateExtractedFields,extractedValues} from './document-extraction.mjs';
import {requireAdapter} from './connector-adapters.mjs';

const now=()=>new Date().toISOString();
function applyTransform(value,transformation={type:'none'}){
  switch(transformation.type||'none'){
    case 'none': return value;
    case 'trim': return typeof value==='string'?value.trim():value;
    case 'lowercase': return typeof value==='string'?value.toLowerCase():value;
    case 'uppercase': return typeof value==='string'?value.toUpperCase():value;
    case 'constant': return transformation.value;
    case 'default': return value??transformation.value;
    default: return value;
  }
}
function buildPayload(connector,values,lookupValues={}){
  const out={};
  for(const mapping of connector?.mappings||[]){
    const raw=lookupValues[mapping.sourceField]??values[mapping.sourceField];
    if(mapping.targetField)out[mapping.targetField]=applyTransform(raw,mapping.transformation);
  }
  return out;
}

export function evaluateActivationEvidence(connector,evidence){
  const complete=Boolean(evidence&&evidence.configVersion===connector?.version&&evidence.testExecutionId&&evidence.sourceReadSuccess===true&&evidence.extractionResult?.ok===true&&evidence.validationResult?.ok===true&&evidence.targetSafeTestResult?.ok===true);
  return complete?{eligible:true,reason:'ELIGIBLE'}:{eligible:false,reason:'TEST_EVIDENCE_INCOMPLETE'};
}

export async function runConnectorTest({connector,input,adapters,seenDedupeKeys=new Set(),executionId=`test-${Date.now()}`}={}){
  const startedAt=now();
  const source=await requireAdapter(adapters,'source').read(input,connector?.source||{});
  const dedupeKey=source?.hash||source?.messageId||null;
  if(dedupeKey&&seenDedupeKeys.has(dedupeKey))return {status:'DUPLICATE',dedupeKey,startedAt,completedAt:now(),evidence:{configVersion:connector?.version,testExecutionId:executionId,sourceReadSuccess:true,extractionResult:{ok:false},validationResult:{ok:false},targetSafeTestResult:{ok:false}}};

  const extraction=await requireAdapter(adapters,'extractor').extract(source,connector?.documentSchema||{},connector);
  const validation=validateExtractedFields(connector?.documentSchema,extraction);
  const reviewReasons=[...validation.reasons];
  const values=extractedValues(extraction);
  const lookupValues={};

  for(const rule of connector?.lookups||[]){
    const lookup=await requireAdapter(adapters,'lookups').resolve({rule,value:values[rule.sourceField],values,connector});
    if(lookup?.status==='ambiguous')reviewReasons.push({code:'LOOKUP_AMBIGUOUS',lookupId:rule.id||null});
    else if(lookup?.status==='not-found')reviewReasons.push({code:'LOOKUP_NOT_FOUND',lookupId:rule.id||null});
    else if(lookup?.values&&typeof lookup.values==='object')Object.assign(lookupValues,lookup.values);
  }

  if(Number(extraction?.confidence??1)<Number(connector?.reviewPolicy?.requiredBelowConfidence??0))reviewReasons.push({code:'LOW_CLASSIFICATION_CONFIDENCE',confidence:extraction?.confidence});

  const proposedPayload=buildPayload(connector,values,lookupValues);
  if(reviewReasons.length){
    return {status:'REVIEW_REQUIRED',reviewReasons,proposedPayload,dedupeKey,startedAt,completedAt:now(),extraction,evidence:{configVersion:connector?.version,testExecutionId:executionId,sourceReadSuccess:true,extractionResult:{ok:true,documentType:extraction?.type||null},validationResult:{ok:false,reasons:reviewReasons},targetSafeTestResult:{ok:false,skipped:true}}};
  }

  const safeResult=await requireAdapter(adapters,'target').safeTest(proposedPayload,{connector,input,source,extraction});
  const evidence={configVersion:connector?.version,testExecutionId:executionId,sourceReadSuccess:true,extractionResult:{ok:true,documentType:extraction?.type||null},validationResult:{ok:true},targetSafeTestResult:{ok:safeResult?.ok===true,reference:safeResult?.reference||null}};
  return {status:safeResult?.ok===true?'TEST_PASSED':'TEST_FAILED',reviewReasons:[],proposedPayload,dedupeKey,startedAt,completedAt:now(),extraction,evidence};
}
