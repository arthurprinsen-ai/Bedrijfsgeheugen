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


export function enforceRefreshPolicy(policy,requestedRefreshMinutes){
  if(!policy){
    const error=new Error('SUBSCRIPTION_REQUIRED');
    error.code='SUBSCRIPTION_REQUIRED';
    throw error;
  }
  const minimum=Number(policy.refreshMinutes);
  if(!Number.isFinite(minimum)||minimum<0){
    const error=new Error('INVALID_PLAN_REFRESH_POLICY');
    error.code='INVALID_PLAN_REFRESH_POLICY';
    throw error;
  }
  const requested=requestedRefreshMinutes===undefined||requestedRefreshMinutes===null||requestedRefreshMinutes===''
    ? minimum
    : Number(requestedRefreshMinutes);
  if(!Number.isFinite(requested)||requested<0){
    const error=new Error('INVALID_REFRESH_INTERVAL');
    error.code='INVALID_REFRESH_INTERVAL';
    throw error;
  }
  if(minimum>0&&requested<minimum){
    const error=new Error('PLAN_REFRESH_LIMIT');
    error.code='PLAN_REFRESH_LIMIT';
    error.planCode=policy.planCode||null;
    error.minimumRefreshMinutes=minimum;
    error.requestedRefreshMinutes=requested;
    throw error;
  }
  return Object.freeze({
    planCode:policy.planCode||null,
    minimumRefreshMinutes:minimum,
    requestedRefreshMinutes:requested,
    effectiveRefreshMinutes:requested,
    mode:requested===0?'event_or_realtime':'interval'
  });
}

export function enforceConnectorRefreshPolicy(policy,connector){
  const requested=connector?.runtime?.refreshMinutes
    ??connector?.schedule?.refreshMinutes
    ??connector?.refreshMinutes;
  return enforceRefreshPolicy(policy,requested);
}


export function enforceAgentMode(policy,{status,approvalEvidence}={}){
  if(status!=='Executing')return Object.freeze({allowed:true,reason:'NOT_EXECUTION_TRANSITION',agentMode:policy?.agentMode||null});
  if(!policy){
    const error=new Error('SUBSCRIPTION_REQUIRED');
    error.code='SUBSCRIPTION_REQUIRED';
    throw error;
  }
  const mode=String(policy.agentMode||'none');
  if(mode==='recommend')return Object.freeze({allowed:false,reason:'PLAN_RECOMMEND_ONLY',agentMode:mode});
  if(mode==='approval_required'){
    const approved=Boolean(
      approvalEvidence&&
      approvalEvidence.approved===true&&
      String(approvalEvidence.approvedBy||'').trim()&&
      String(approvalEvidence.approvedAt||'').trim()
    );
    return Object.freeze({allowed:approved,reason:approved?'PLAN_APPROVAL_SATISFIED':'PLAN_APPROVAL_REQUIRED',agentMode:mode});
  }
  if(mode==='guardrailed_autonomous')return Object.freeze({allowed:true,reason:'PLAN_AUTONOMY_ALLOWED',agentMode:mode});
  return Object.freeze({allowed:false,reason:'PLAN_AGENT_MODE_DENY',agentMode:mode});
}
