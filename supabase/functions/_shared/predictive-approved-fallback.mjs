// Shared, audit-friendly fallback boundary: no secrets, contacts or private source bodies
// may cross to the already approved Composio/Groq predictive use case.
const clean=(v)=>String(v??'').trim();
const privacyText=(value,max=360)=>clean(value)
  .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,'[REDACTED_EMAIL]')
  .replace(/(?:\+\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?){2,}\d{3,}/g,'[REDACTED_PHONE]')
  .slice(0,max);

const scopes=new Set(['segment','market','technology','regulation','behavior']);
const modes=new Set(['anticipatory','category_creation','reactive']);
const numberFields=['probability','confidence','signal_acceleration','market_saturation','whitespace_score','strategic_fit','revenue_potential'];
const stringFields=['topic_key','scope','scope_key','predicted_event','predicted_problem','predicted_question','predicted_search_intent','predicted_buying_trigger','prediction_mode','rationale'];
const requiredKeys=[...stringFields,...numberFields,'expected_lead_days','evidence_keys'];

export function fallbackEligible(error){
  const value=clean(error?.message);
  return value==='AI_KEY_UNAVAILABLE'
    || /^AI_400:.*(?:credit balance is too low|insufficient credits|billing)/i.test(value)
    || /^AI_402:/i.test(value)
    || /^AI_429:/i.test(value)
    || /^AI_5\d\d:/i.test(value);
}
export function publicForecastContext(input){
  return {
    today:privacyText(input?.today,15),
    goal:{deadline:privacyText(input?.goal?.deadline,15)},
    signals:(Array.isArray(input?.signals)?input.signals:[]).filter(s=>
      ['external_news','search_demand'].includes(s?.source_type)
      && /^(external|search):/.test(clean(s?.signal_key))
    ).slice(0,60).map(s=>({
      signal_key:clean(s.signal_key).slice(0,100),
      source_type:s.source_type,
      topic_key:privacyText(s.topic_key,180),
      direction:privacyText(s.direction,35),
      strength:Number(s.strength)||0,
      novelty:Number(s.novelty)||0,
      lead_time_days:Number(s.lead_time_days)||0,
      evidence:{
        title:privacyText(s.evidence?.title,200),
        summary:privacyText(s.evidence?.summary,680),
        domain:privacyText(s.evidence?.domain,100),
        keyword:privacyText(s.evidence?.keyword,180),
        source_trust:privacyText(s.evidence?.source_trust,40),
        opportunity_score:Number(s.evidence?.opportunity_score)||0
      }
    }))
  };
}
export function parseForecastPlan(raw,allowedKeys){
  let payload;
  try {
    const unwrapped=clean(raw).replace(/^\`\`\`(?:json)?\s*/i,'').replace(/\s*\`\`\`$/,'').trim();
    payload=JSON.parse(unwrapped);
  } catch {throw new Error('FALLBACK_FORECAST_SCHEMA_INVALID');}
  if(!payload||typeof payload!=='object'||Array.isArray(payload)
     ||Object.keys(payload).join('|')!=='forecasts'
     ||!Array.isArray(payload.forecasts)||payload.forecasts.length>6)
    throw new Error('FALLBACK_FORECAST_SCHEMA_INVALID');
  const allowed=new Set(allowedKeys);
  for(const f of payload.forecasts){
    if(!f||typeof f!=='object'||Array.isArray(f))throw new Error('FALLBACK_FORECAST_SCHEMA_INVALID');
    if(Object.keys(f).length!==requiredKeys.length
       ||!requiredKeys.every(k=>Object.hasOwn(f,k)))
       throw new Error('FALLBACK_FORECAST_SCHEMA_INVALID');
    if(stringFields.some(k=>typeof f[k]!=='string'||!f[k].trim()||f[k].length>2000)
       ||!scopes.has(f.scope)||!modes.has(f.prediction_mode))
       throw new Error('FALLBACK_FORECAST_SCHEMA_INVALID');
    if(numberFields.some(k=>typeof f[k]!=='number'||!Number.isFinite(f[k])||f[k]<0||f[k]>1)
       ||!Number.isInteger(f.expected_lead_days)||f.expected_lead_days<1||f.expected_lead_days>180)
       throw new Error('FALLBACK_FORECAST_SCHEMA_INVALID');
    if(!Array.isArray(f.evidence_keys)||f.evidence_keys.length<2||f.evidence_keys.length>8
       ||new Set(f.evidence_keys).size!==f.evidence_keys.length
       ||f.evidence_keys.some(k=>typeof k!=='string'||!allowed.has(k)))
       throw new Error('FALLBACK_FORECAST_SCHEMA_INVALID');
  }
  return payload;
}
export async function callApprovedForecastFallback({apiKey,model,context,fetchImpl=fetch,schemaRetry=false}){
  if(!clean(apiKey)||!clean(model))throw new Error('FALLBACK_PROVIDER_CONFIGURATION_MISSING');
  const strictRetryInstruction=schemaRetry
    ?' STRICT_SCHEMA_RETRY: The previous answer did not match the strict forecast schema. Return one JSON object with forecasts array only. Each nonempty item MUST use precisely these fields with no extras: '+requiredKeys.join(', ')+'. Every string field must be a nonempty string; all score fields are numeric 0 through 1; expected_lead_days is an integer 1 through 180; evidence_keys contains 2-8 unique keys copied exactly from the given public signals. If you cannot meet EVERY condition, return exactly {"forecasts":[]}. Never invent source keys or personal facts.'
    :'';
  const response=await fetchImpl('https://backend.composio.dev/api/v3.1/tools/execute/COMPOSIO_SEARCH_GROQ_CHAT',{
    method:'POST',
    headers:{'content-type':'application/json','x-api-key':apiKey},
    body:JSON.stringify({version:'latest',arguments:{
      model,temperature:0.2,max_tokens:4200,stream:false,
      messages:[
        {role:'system',content:'Je bent een evidence-bound voorspeller voor MKB. Geef uitsluitend JSON met één sleutel forecasts (max 6) en exact deze velden per forecast: '+requiredKeys.join(', ')+'. scope = segment, market, technology, regulation of behavior. prediction_mode = anticipatory, category_creation of reactive. Kansscores liggen tussen 0 en 1, expected_lead_days tussen 1 en 180. evidence_keys moeten afkomstig zijn uit de meegegeven signalen. Gebruik twee onafhankelijke publieke signalen per voorspelling en drie bij category_creation. Geen verzonnen feiten, geen persoonsgegevens. Als bewijs onvoldoende is, antwoord exact {"forecasts":[]}.'+strictRetryInstruction},
        {role:'user',content:JSON.stringify(context)}
      ]
    }}),
    signal:AbortSignal.timeout(45000)
  });
  const body=await response.json().catch(()=>({}));
  if(!response.ok||body?.successful!==true)
    throw new Error('FALLBACK_PROVIDER_UNAVAILABLE:'+response.status);
  const content=clean(body?.data?.choices?.[0]?.message?.content);
  if(!content)throw new Error('FALLBACK_PROVIDER_EMPTY');
  return content;
}


// Retry only when the first public provider output failed our unchanged strict
// parser. Transport, authentication and governance failures never get extra calls.
export async function generateValidatedForecastFallback({apiKey,model,context,fetchImpl=fetch}){
  const allowedKeys=(context?.signals||[]).map(signal=>signal.signal_key);
  for(let attempt=1;attempt<=2;attempt++){
    const raw=await callApprovedForecastFallback({
      apiKey,model,context,fetchImpl,schemaRetry:attempt===2
    });
    try{
      return {plan:parseForecastPlan(raw,allowedKeys),attempts:attempt};
    }catch(error){
      if(error?.message!=='FALLBACK_FORECAST_SCHEMA_INVALID'||attempt===2)throw error;
    }
  }
  throw new Error('FALLBACK_FORECAST_SCHEMA_INVALID');
}
