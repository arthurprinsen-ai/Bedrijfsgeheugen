const privacyText=(value,max=500)=>value.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,'[REDACTED_EMAIL]').replace(/(?:\+\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?){2,}\d{3,}/g,'[REDACTED_PHONE]').slice(0,max);
// Public-market boundary: never send arbitrary rows, tenant forecasts or CRM learning.
export function publicMarketPayload({date,signals=[]}) {
  const fields=['signal_key','source_type','topic_key','direction','strength','novelty','lead_time_days'];
  const evidenceFields=['title','summary','domain','source_trust','confirmation','freshness','relevance','keyword','search_volume','competition','opportunity_score','position'];
  return {today:date,goal:{realized_revenue_eur:1000000,deadline:'2027-09-14'},signals:signals
    .filter(s=>s.entity_scope==='market'&&['external_news','search_demand'].includes(s.source_type)&&/^(external|search):[a-f0-9]{64}$/.test(s.signal_key)).slice(0,40)
    .map(s=>({...Object.fromEntries(fields.filter(k=>typeof s[k]==='string'||typeof s[k]==='number').map(k=>[k,k==='signal_key'?s[k]:typeof s[k]==='string'?privacyText(s[k]):s[k]])),
      evidence:Object.fromEntries(evidenceFields.filter(k=>typeof s.evidence?.[k]==='string'||typeof s.evidence?.[k]==='number')
        .map(k=>[k,typeof s.evidence[k]==='string'?privacyText(s.evidence[k],k==='summary'?650:500):s.evidence[k]]))}))};
}

function valid(value,schema) {
  if(schema.type==='object')return !!value&&typeof value==='object'&&!Array.isArray(value)
    &&(schema.required||[]).every(k=>Object.hasOwn(value,k))
    &&Object.keys(value).every(k=>Object.hasOwn(schema.properties,k)&&valid(value[k],schema.properties[k]));
  if(schema.type==='array')return Array.isArray(value)
    &&(schema.minItems===undefined||value.length>=schema.minItems)
    &&(schema.maxItems===undefined||value.length<=schema.maxItems)&&value.every(v=>valid(v,schema.items));
  if(schema.type==='number'||schema.type==='integer')return typeof value==='number'&&Number.isFinite(value)
    &&(schema.type!=='integer'||Number.isInteger(value))
    &&(schema.minimum===undefined||value>=schema.minimum)&&(schema.maximum===undefined||value<=schema.maximum);
  return typeof value===schema.type&&(!schema.enum||schema.enum.includes(value));
}

export async function requestForecastPlan({apiKey,model,schema,payload,instructions='',toolName='forecast_plan',timeoutMs=90000,maxOutputTokens=6000,fetchImpl=fetch}) {
  if(!['forecast_plan','calibration'].includes(toolName))throw new Error('AI_TOOL_CONFIGURATION_INVALID');
  if(!apiKey||!model)throw new Error('AI_CONFIGURATION_REQUIRED');
  const response=await fetchImpl('https://api.openai.com/v1/responses',{
    method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'content-type':'application/json'},
    signal:AbortSignal.timeout(Math.max(1,Math.min(90000,timeoutMs))),
    body:JSON.stringify({model,store:false,instructions,
      input:[{role:'user',content:[{type:'input_text',text:JSON.stringify(payload)}]}],
      reasoning:{effort:'minimal'},max_output_tokens:Math.min(6000,maxOutputTokens),
      tools:[{type:'function',name:toolName,description:'Evidence-bound predictive market forecasts',strict:true,parameters:schema}],
      tool_choice:{type:'function',name:toolName},parallel_tool_calls:false})
  });
  // Never persist raw provider error text or credentials in shared health receipts.
  if(!response.ok)throw new Error(`AI_PROVIDER_REQUEST_FAILED:${response.status}`);
  const body=await response.json().catch(()=>{throw new Error('AI_RESPONSE_INVALID');});
  if(body.status!=='completed')throw new Error('AI_RESPONSE_INCOMPLETE');
  const calls=(body.output||[]).filter(item=>item.type==='function_call');
  if(calls.length!==1||calls[0].name!==toolName)throw new Error('AI_TOOL_OUTPUT_MISSING');
  let plan;try{plan=JSON.parse(calls[0].arguments);}catch{throw new Error('AI_TOOL_OUTPUT_INVALID');}
  if(!valid(plan,schema))throw new Error('AI_TOOL_OUTPUT_INVALID');
  return plan;
}
