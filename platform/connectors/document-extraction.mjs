export function validateExtractedFields(schema,extraction){
  const reasons=[];
  const fields=extraction?.fields||{};
  for(const field of schema?.fields||[]){
    const observed=fields[field.key];
    if(field.required&&(observed?.value===undefined||observed?.value===null||observed?.value===''))reasons.push({code:'REQUIRED_FIELD_MISSING',field:field.key});
    if(observed&&Number(observed.confidence??1)<Number(field.confidenceThreshold??0))reasons.push({code:'LOW_FIELD_CONFIDENCE',field:field.key,confidence:observed.confidence,threshold:field.confidenceThreshold});
  }
  return {ok:reasons.length===0,reasons};
}

export function extractedValues(extraction){
  return Object.fromEntries(Object.entries(extraction?.fields||{}).map(([key,item])=>[key,item?.value]));
}
