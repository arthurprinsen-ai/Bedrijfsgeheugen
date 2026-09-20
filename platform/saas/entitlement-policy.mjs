const ACTIVE_STATUSES=new Set(['trialing','active','past_due']);

export function normalizeEntitlementRecord(record){
  if(!record||!ACTIVE_STATUSES.has(String(record.status||'').toLowerCase()))return null;
  return {
    organisationId:record.organisation_id||null,
    planCode:String(record.plan_code||'').toLowerCase(),
    planName:record.plan_name||null,
    status:String(record.status||'').toLowerCase(),
    entitlements:record.entitlements&&typeof record.entitlements==='object'?record.entitlements:{}
  };
}

export function readEntitlement(record,key){
  return normalizeEntitlementRecord(record)?.entitlements?.[key];
}

export function entitlementAllows(record,key,{requested=1,allowedValues=null}={}){
  const value=readEntitlement(record,key);
  if(typeof value==='boolean')return value;
  if(typeof value==='number')return Number(requested)<=value;
  if(typeof value==='string'){
    if(Array.isArray(allowedValues))return allowedValues.includes(value);
    return Boolean(value);
  }
  return false;
}

export function requireEntitlement(record,key,options={}){
  const normalized=normalizeEntitlementRecord(record);
  if(!normalized){
    const error=new Error('SUBSCRIPTION_REQUIRED');
    error.code='SUBSCRIPTION_REQUIRED';
    throw error;
  }
  if(!entitlementAllows(normalized,key,options)){
    const error=new Error('PLAN_ENTITLEMENT_REQUIRED');
    error.code='PLAN_ENTITLEMENT_REQUIRED';
    error.entitlement=key;
    error.planCode=normalized.planCode;
    throw error;
  }
  return normalized;
}

export function planRuntimePolicy(record){
  const normalized=normalizeEntitlementRecord(record);
  if(!normalized)return null;
  const e=normalized.entitlements;
  return Object.freeze({
    planCode:normalized.planCode,
    status:normalized.status,
    intelligenceCore:Boolean(e.intelligence_core),
    maxDataSources:Number(e.data_sources||0),
    refreshMinutes:Number(e.refresh_minutes||0),
    externalSignalScan:e.external_signal_scan||null,
    forecasting:Boolean(e.forecasting),
    scenarioAnalysis:Boolean(e.scenario_analysis),
    agentMode:e.agent_mode||'none',
    organisations:Number(e.organisations||0),
    sso:Boolean(e.sso),
    auditTrail:Boolean(e.audit_trail),
    seniorAdvisoryMinutesMonth:Number(e.senior_advisory_minutes_month||0)
  });
}
