// Canonical composer → autonomous-outreach handoff. No provider calls or status promotion.
const SOURCE_FIELDS=new Set(['human_readable_context','source_trigger_relevance','https_source_url','specific_source_context']);
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function composerHandoffForAction(results,actionId){
  if(!UUID.test(String(actionId||''))||!Array.isArray(results))return null;
  const matches=results.filter(x=>x&&x.action_id===actionId);
  if(matches.length>1)return {reason:'COMPOSER_RESULT_AMBIGUOUS',missingFields:[]};
  if(!matches.length)return null;
  const row=matches[0];
  if(row.status==='SOURCE_SPECIFIC_EVIDENCE_REQUIRED'){
    const missingFields=[...new Set((Array.isArray(row.missing_contract_fields)?row.missing_contract_fields:[])
      .filter(k=>typeof k==='string'&&SOURCE_FIELDS.has(k)))].sort();
    return {reason:'SOURCE_SPECIFIC_EVIDENCE_REQUIRED',missingFields};
  }
  if(row.status==='error')return {reason:'COMPOSER_GENERATION_ERROR',missingFields:[]};
  if(row.quality_passed===false)return {reason:'COMPOSER_QUALITY_NOT_PROVEN',missingFields:[]};
  return null;
}
export function outboundDeliveryGap({selected,sent,results}={}){
  if(Number(sent)>0)return null;
  if(Number(selected)===0)return 'NO_ELIGIBLE_PREPARED_EMAIL';
  const items=Array.isArray(results)?results:[];
  if(items.some(r=>r?.status==='unverified'))return 'PROVIDER_READBACK_UNVERIFIED';
  if(items.some(r=>r?.status==='held'&&r?.reason==='SOURCE_SPECIFIC_EVIDENCE_REQUIRED'))
    return 'SOURCE_SPECIFIC_EVIDENCE_REQUIRED';
  return 'NO_PROVIDER_CONFIRMED_EMAIL';
}
