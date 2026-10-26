// Tenant-safe public read model for customer sovereignty response.
// Full audit and actor identity remain in the EU authority, never in browser JSON.
const esrsCandidate=item=>{
 if(!item||typeof item!=='object')return null;
 const standard=String(item.standard||'').trim();
 if(!/^ESRS_[A-Z0-9]+$/.test(standard))return null;
 return Object.freeze({
  standard,
  reviewRequired:item.reviewRequired===true,
  applicability:'UNDETERMINED',
  materiality:'UNDETERMINED',
  measuredImpact:null
 });
};
export function customerSovereigntyReadback(result){
 if(!result||typeof result!=='object'||!result.snapshot||typeof result.snapshot!=='object')return result;
 const policy=result.snapshot.policy;
 if(!policy||typeof policy!=='object'||Array.isArray(policy))return result;

 const visiblePolicy={};
 for(const key of [
  'tenant_id','mode','preferred_ai_provider','preferred_ai_region',
  'ai_deployment_profile','allow_cross_border','block_unknown_region',
  'enforcement_mode','policy_version','updated_at'
 ])if(Object.prototype.hasOwnProperty.call(policy,key))visiblePolicy[key]=policy[key];
 const impact=policy.last_change_impact;
 if(impact&&impact.contract==='powerhouse-cross-domain-change-v1'){
  const review=(Array.isArray(impact.esrsReview)?impact.esrsReview:[]).map(esrsCandidate).filter(Boolean);
  visiblePolicy.last_change_impact=Object.freeze({
   contract:'powerhouse-cross-domain-change-v1',
   kind:['AI_MODEL','AI_DEPLOYMENT','DATA_LOCATION','CONNECTOR','SUPPLIER'].includes(impact.kind)?impact.kind:'UNKNOWN',
   status:impact.status==='REVIEW_REQUIRED'?'REVIEW_REQUIRED':'UNKNOWN',
   esrsReview:review
  });
 }else{
  visiblePolicy.last_change_impact=null;
 }
 return {...result,snapshot:{...result.snapshot,policy:visiblePolicy}};
}
