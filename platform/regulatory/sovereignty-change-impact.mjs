import {planCrossDomainChange} from './cross-domain-change-impact.mjs';

// A tenant's desired AI placement is NOT proof of an active runtime or legal CSRD scope.
// This adapter translates sovereignty policy edits into the existing ONE BRAIN impact contract.
const stable=value=>JSON.stringify(value,(_key,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))):v);
const canonical=(policy={},db=false)=>Object.freeze({
 mode:String(policy?.mode||'TRANSPARENT_GLOBAL'),
 preferredAiProvider:policy?.[db?'preferred_ai_provider':'preferredAiProvider']||null,
 preferredAiRegion:policy?.[db?'preferred_ai_region':'preferredAiRegion']||null,
 aiDeploymentProfile:policy?.[db?'ai_deployment_profile':'aiDeploymentProfile']??null
});
const profileModel=p=>({provider:p?.provider||null,modelId:p?.modelId||null,modelFamily:p?.modelFamily||null});
export function buildSovereigntyChangeImpact({tenantId,actor,previousPolicy={},proposedPolicy}={}){
 if(!proposedPolicy||typeof proposedPolicy!=='object'||Array.isArray(proposedPolicy))throw new TypeError('PROPOSED_POLICY_REQUIRED');
 const before=canonical(previousPolicy,true);
 const after=canonical({...proposedPolicy,aiDeploymentProfile:Object.prototype.hasOwnProperty.call(proposedPolicy,'aiDeploymentProfile')?proposedPolicy.aiDeploymentProfile:before.aiDeploymentProfile});
 const expectedPolicyVersion=Number(previousPolicy?.policy_version??0);
 if(!Number.isSafeInteger(expectedPolicyVersion)||expectedPolicyVersion<0)throw new TypeError('INVALID_POLICY_VERSION');
 if(stable(before)===stable(after))return Object.freeze({impact:null,expectedPolicyVersion});
 const modelChanged=stable(profileModel(before.aiDeploymentProfile))!==stable(profileModel(after.aiDeploymentProfile))||before.preferredAiProvider!==after.preferredAiProvider;
 const locationChanged=before.mode!==after.mode||before.preferredAiRegion!==after.preferredAiRegion;
 const kind=modelChanged&&locationChanged?'AI_DEPLOYMENT':modelChanged?'AI_MODEL':locationChanged?'DATA_LOCATION':'AI_DEPLOYMENT';
 const impact=planCrossDomainChange({
  tenantId,actor,kind,changeId:`sovereignty:${tenantId}:${expectedPolicyVersion+1}`,
  before,after,evidenceIds:[]
 });
 return Object.freeze({impact,expectedPolicyVersion});
}
