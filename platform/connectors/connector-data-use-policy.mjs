// One tenant-scoped intent for downstream use of connected data.
// This is a customer request, not an assertion that a provider is deployed or verified.
export const DATA_USE_MODES=Object.freeze(['CONNECTION_ONLY','PORTAL_INSIGHTS','PORTAL_AI']);
export const DEFAULT_CONNECTOR_DATA_USE=Object.freeze({
  mode:'CONNECTION_ONLY',modelRoute:'TENANT_POLICY',trainingUse:'PROHIBITED'
});
export function normalizeConnectorDataUse(value){
  if(value==null)return DEFAULT_CONNECTOR_DATA_USE;
  if(typeof value!=='object'||Array.isArray(value))throw Object.assign(new TypeError('INVALID_CONNECTOR_DATA_USE'),{code:'INVALID_CONNECTOR_DATA_USE'});
  const keys=Object.keys(value);
  if(keys.some(key=>!['mode','modelRoute','trainingUse'].includes(key))||
     !DATA_USE_MODES.includes(value.mode)||
     (value.modelRoute!==undefined&&value.modelRoute!=='TENANT_POLICY')||
     (value.trainingUse!==undefined&&value.trainingUse!=='PROHIBITED'))
    throw Object.assign(new TypeError('INVALID_CONNECTOR_DATA_USE'),{code:'INVALID_CONNECTOR_DATA_USE'});
  return Object.freeze({mode:value.mode,modelRoute:'TENANT_POLICY',trainingUse:'PROHIBITED'});
}
export function connectorDataUseActivationGuard(connector){
  let policy;
  try{policy=normalizeConnectorDataUse(connector?.dataUse);}
  catch{return Object.freeze({allowed:false,reason:'INVALID_CONNECTOR_DATA_USE'});}
  // A Datahub target means using data in the customer portal; never assume consent.
  if(connector?.target?.type==='datahub'&&policy.mode==='CONNECTION_ONLY')
    return Object.freeze({allowed:false,reason:'PORTAL_DATA_USE_NOT_AUTHORIZED'});
  return Object.freeze({allowed:true,reason:'ALLOWED',policy});
}
