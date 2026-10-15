// Tenant model preferences define desired state, never authorization.
// A single default covers only compatible AI workloads. Function overrides
// are explicit and all selected models still require a verified runtime route.
export const MODEL_WORKLOADS=Object.freeze(['brain','routine','analysis','documents','knowledge','sensitive']);
const hasOwn=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
export function resolveDesiredTenantModel(preferences,workload='brain'){
 if(!MODEL_WORKLOADS.includes(workload))
  return Object.freeze({ok:false,code:'UNKNOWN_MODEL_WORKLOAD'});
 if(!preferences||preferences.requestState!=='review_only_not_activated'||
    !Array.isArray(preferences.models)||!preferences.assignments||
    typeof preferences.assignments!=='object'||Array.isArray(preferences.assignments))
  return Object.freeze({ok:false,code:'MODEL_CHOICE_REQUIRED'});
 const hasOverride=hasOwn(preferences.assignments,workload);
 const id=hasOverride?preferences.assignments[workload]:preferences.defaultModelId;
 if(typeof id!=='string'||!id||id.length>120)
  return Object.freeze({ok:false,code:'MODEL_WORKLOAD_NOT_ASSIGNED'});
 const matches=preferences.models.filter(row=>row&&row.modelId===id);
 if(matches.length!==1)
  return Object.freeze({ok:false,code:'MODEL_NOT_IN_TENANT_WISHLIST'});
 if(typeof matches[0].routeId!=='string'||!matches[0].routeId)
  return Object.freeze({ok:false,code:'MODEL_DEPLOYMENT_ROUTE_REQUIRED'});
 return Object.freeze({ok:true,modelId:id,routeId:matches[0].routeId,source:hasOverride?'override':'default',workload});
}
