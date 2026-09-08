import {validateExtractedFields,extractedValues} from './document-extraction.mjs';
import {requireAdapter} from './connector-adapters.mjs';

const now=()=>new Date().toISOString();
const stage=(executionId,name,ok,extra={})=>Object.freeze({name,ok,at:now(),evidenceId:`${executionId}:${name}`,...extra});
function applyTransform(value,transformation={type:'none'}){
  switch(transformation.type||'none'){
    case 'none':return value;
    case 'trim':return typeof value==='string'?value.trim():value;
    case 'lowercase':return typeof value==='string'?value.toLowerCase():value;
    case 'uppercase':return typeof value==='string'?value.toUpperCase():value;
    case 'constant':return transformation.value;
    case 'default':return value??transformation.value;
    default:throw Object.assign(new Error(`Unsupported transformation: ${transformation.type}`),{code:'UNSUPPORTED_TRANSFORMATION'});
  }
}
function buildPayload(connector,values,lookupValues={}){const out={};for(const mapping of connector?.mappings||[]){const raw=lookupValues[mapping.sourceField]??values[mapping.sourceField];if(mapping.targetField)out[mapping.targetField]=applyTransform(raw,mapping.transformation);}return out;}
function numeric(value){const n=Number(value);return Number.isFinite(n)?n:null;}
function evaluateValidationRules(connector,values,lookupResults){
  const reasons=[];
  for(const rule of connector?.validationRules||[]){
    const code=rule.code||'VALIDATION_FAILED';
    if(rule.type==='block_lookup_match'){
      const result=lookupResults.get(rule.lookupId);if(result?.status==='matched')reasons.push({code,lookupId:rule.lookupId});
    }else if(rule.type==='require_lookup_match_when_present'){
      const value=values[rule.field];const present=value!==undefined&&value!==null&&String(value).trim()!=='';const result=lookupResults.get(rule.lookupId);
      if(present&&result?.status!=='matched')reasons.push({code,lookupId:rule.lookupId,field:rule.field});
    }else if(rule.type==='sum_matches'){
      const parts=(rule.fields||[]).map(field=>numeric(values[field]));const total=numeric(values[rule.totalField]);
      if(total!==null&&parts.every(value=>value!==null)){const delta=Math.abs(parts.reduce((a,b)=>a+b,0)-total);if(delta>Number(rule.tolerance??.01))reasons.push({code,fields:rule.fields,totalField:rule.totalField,delta});}
    }
  }
  return reasons;
}

export function classifyConnectorError(error={}){
  const code=String(error?.code||error?.status||'').toUpperCase();
  if(['ETIMEDOUT','ECONNRESET','EAI_AGAIN','408','429','502','503','504'].includes(code))return {retryable:true,maxAttempts:1,recoveryRequired:false,class:'transport'};
  if(/UNAUTHORIZED|FORBIDDEN|AUTH|401|403/.test(code))return {retryable:false,maxAttempts:0,recoveryRequired:true,class:'auth'};
  if(/LOOKUP|MAPPING|VALIDATION|AMBIGUOUS|DUPLICATE|UNSUPPORTED/.test(code))return {retryable:false,maxAttempts:0,recoveryRequired:true,class:'validation'};
  return {retryable:false,maxAttempts:0,recoveryRequired:true,class:'runtime'};
}

export function evaluateActivationEvidence(connector,evidence){
  const complete=Boolean(evidence&&evidence.configVersion===connector?.version&&evidence.testExecutionId&&evidence.sourceReadSuccess===true&&evidence.extractionResult?.ok===true&&evidence.validationResult?.ok===true&&evidence.targetSafeTestResult?.ok===true);
  return complete?{eligible:true,reason:'ELIGIBLE'}:{eligible:false,reason:'TEST_EVIDENCE_INCOMPLETE'};
}

export async function runConnectorTest({connector,input,adapters,seenDedupeKeys=new Set(),executionId=`test-${Date.now()}`}={}){
  const startedAt=now(),stages=[];
  const source=await requireAdapter(adapters,'source').read(input,connector?.source||{});
  stages.push(stage(executionId,'source',true));
  const dedupeKey=source?.hash||source?.messageId||null;
  if(dedupeKey&&seenDedupeKeys.has(dedupeKey)){
    const evidence={configVersion:connector?.version,testExecutionId:executionId,sourceReadSuccess:true,extractionResult:{ok:false},validationResult:{ok:false},targetSafeTestResult:{ok:false}};
    return {status:'DUPLICATE',executionId,stages,dedupeKey,startedAt,completedAt:now(),evidence};
  }
  const extraction=await requireAdapter(adapters,'extractor').extract(source,connector?.documentSchema||{},connector);
  stages.push(stage(executionId,'extractor',true,{mode:extraction?.mode||null}));
  const validation=validateExtractedFields(connector?.documentSchema,extraction);
  const reviewReasons=[...validation.reasons],values=extractedValues(extraction),lookupValues={},lookupResults=new Map();
  for(const rule of connector?.lookups||[]){
    const lookup=await requireAdapter(adapters,'lookups').resolve({rule,value:values[rule.sourceField],values,connector});lookupResults.set(rule.id,lookup||{});
    if(lookup?.status==='ambiguous')reviewReasons.push({code:'LOOKUP_AMBIGUOUS',lookupId:rule.id||null});
    else if(lookup?.status==='not-found'&&rule.required===true)reviewReasons.push({code:'LOOKUP_NOT_FOUND',lookupId:rule.id||null});
    else if(lookup?.values&&typeof lookup.values==='object')Object.assign(lookupValues,lookup.values);
  }
  reviewReasons.push(...evaluateValidationRules(connector,values,lookupResults));
  if(Number(extraction?.confidence??1)<Number(connector?.reviewPolicy?.requiredBelowConfidence??0))reviewReasons.push({code:'LOW_CLASSIFICATION_CONFIDENCE',confidence:extraction?.confidence});
  const validationOk=reviewReasons.length===0;
  stages.push(stage(executionId,'validation',validationOk,{reasonCount:reviewReasons.length}));
  const proposedPayload=buildPayload(connector,values,lookupValues);
  if(reviewReasons.length){
    stages.push(stage(executionId,'target',false,{skipped:true}));
    const evidence={configVersion:connector?.version,testExecutionId:executionId,sourceReadSuccess:true,extractionResult:{ok:true,documentType:extraction?.type||null},validationResult:{ok:false,reasons:reviewReasons},targetSafeTestResult:{ok:false,skipped:true}};
    return {status:'REVIEW_REQUIRED',executionId,stages,reviewReasons,proposedPayload,dedupeKey,startedAt,completedAt:now(),extraction,evidence};
  }
  const safeResult=await requireAdapter(adapters,'target').safeTest(proposedPayload,{connector,input,source,extraction});
  stages.push(stage(executionId,'target',safeResult?.ok===true,{reference:safeResult?.reference||safeResult?.targetRef||null}));
  const evidence={configVersion:connector?.version,testExecutionId:executionId,sourceReadSuccess:true,extractionResult:{ok:true,documentType:extraction?.type||null},validationResult:{ok:true},targetSafeTestResult:{ok:safeResult?.ok===true,reference:safeResult?.reference||safeResult?.targetRef||null}};
  return {status:safeResult?.ok===true?'TEST_PASSED':'TEST_FAILED',executionId,stages,reviewReasons:[],proposedPayload,dedupeKey,startedAt,completedAt:now(),extraction,evidence};
}
