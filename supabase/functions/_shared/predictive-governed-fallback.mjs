// Pure ONE BRAIN provider decision contract; never opens an independent scheduler.
export const PREDICTIVE_FALLBACK_USE_CASE='supabase-powerhouse-predictive-first-mover-fallback-v1';
export const PREDICTIVE_FALLBACK_PROVIDER='Composio/Groq';
export const PREDICTIVE_FALLBACK_MODEL='openai/gpt-oss-120b';

const clean=v=>String(v??'').trim();
export function isRecoverablePredictiveProviderError(error){
  const message=clean(error?.message??error);
  if(message==='AI_KEY_UNAVAILABLE')return true;
  if(/^AI_(?:402|408|429|500|502|503|504):/.test(message))return true;
  return /^AI_400:/i.test(message)&&/(credit|billing|balance|quota|insufficient|tegoed)/i.test(message);
}
export function parseForecastPlanJson(raw){
  const text=clean(raw).replace(/^\x60\x60\x60(?:json)?\s*/i,'').replace(/\s*\x60\x60\x60$/,'');
  let body;
  try{body=JSON.parse(text);}catch{throw new Error('PREDICTIVE_PLAN_JSON_INVALID');}
  if(!body||typeof body!=='object'||!Array.isArray(body.forecasts)||body.forecasts.length>6){
    throw new Error('PREDICTIVE_PLAN_SCHEMA_INVALID');
  }
  return body;
}
export async function executeGovernedForecast({primary,fallbackConfig,fallback,primaryModel}){
  try{
    const plan=await primary();
    if(!plan||!Array.isArray(plan.forecasts)||plan.forecasts.length>6)throw new Error('PREDICTIVE_PLAN_SCHEMA_INVALID');
    return {plan,provider:'Anthropic',model:primaryModel??'',fallback:false,primary_error:null};
  }catch(error){
    if(!isRecoverablePredictiveProviderError(error))throw error;
    const primaryError=clean(error?.message??error).slice(0,220);
    const governance=await fallbackConfig();
    if(governance?.approved!==true||governance?.lifecycle_status!=='ACTIVE'
        ||governance?.provider!==PREDICTIVE_FALLBACK_PROVIDER
        ||governance?.model_id!==PREDICTIVE_FALLBACK_MODEL){
      throw new Error('PREDICTIVE_FALLBACK_NOT_APPROVED:'+primaryError);
    }
    const plan=await fallback(governance);
    if(!plan||!Array.isArray(plan.forecasts)||plan.forecasts.length>6){
      throw new Error('PREDICTIVE_FALLBACK_PLAN_INVALID:'+primaryError);
    }
    return {plan,provider:governance.provider,model:governance.model_id,fallback:true,primary_error:primaryError};
  }
}
