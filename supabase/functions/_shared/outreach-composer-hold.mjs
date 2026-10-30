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

/** Route a real source-gap into the ORIGINAL internal relationship-research queue.
 * Never treat this task as marketing permission, verified trigger or sent email. */
export function sourceResearchTaskForAction(action,handoff,at){
  if(handoff?.reason!=='SOURCE_SPECIFIC_EVIDENCE_REQUIRED'||!UUID.test(String(action?.action_id||'')))return null;
  const person=String(action?.person_key||'').trim();
  const company=String(action?.company_key||'').trim();
  if(!person||!company||!Number.isFinite(Date.parse(at)))return null;
  const missing=(Array.isArray(handoff.missingFields)?handoff.missingFields:[])
    .filter(x=>SOURCE_FIELDS.has(x)).slice(0,4);
  const dedupe_key='relationship-research:outreach-source:'+action.action_id;
  return {
    dedupe_key,subject_key:'outreach-source:'+action.action_id,
    person_key:person,company_key:company,
    person_name:String(action.person_name||'').trim()||null,
    company_name:String(action.company_name||'').trim()||null,
    action_type:'research_enrichment',channel:'internal',priority:Math.min(100,Math.max(0,Number(action.priority)||0)),
    reason:'Verify concrete current company-specific public source before already prepared email can be evaluated.',
    evidence:{
      contract:'powerhouse-relationship-research-auto-enrichment-v1',
      research_need:'source_specific_evidence',
      original_outreach_action_id:action.action_id,
      original_quality_gate:'SOURCE_SPECIFIC_EVIDENCE_REQUIRED',
      missing_contract_fields:missing,
      external_side_effect_allowed:false,
      recipient_authority_not_inferred:true,
      delivery_not_attempted:true,
      feedback_contract:'OUTREACH_TO_ORIGINAL_RESEARCH_V1'
    },
    message_draft:'',source_url:'',status:'suggested',due_at:at,expected_value_eur:0
  };
}
