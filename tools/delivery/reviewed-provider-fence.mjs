// Read-only native protection classifier. No status, ruleset, ref or grant writes.
const REPO='arthurprinsen-ai/Bedrijfsgeheugen';
const APP=5916428;
const BASE=Object.freeze(['CodeQL javascript-typescript','hygiene / admission','test']);
export const PROMOTION_CONTEXT='powerhouse / exclusive-promotion';
export function classifyReviewedProviderFence({repository,branch,protection,rulesets,complete}={}){
 const report=(state)=>Object.freeze({state,repository:REPO,branch:'main',appId:APP,requiredContext:PROMOTION_CONTEXT,exclusiveWriterVerified:false,mutationAuthority:false});
 if(repository!==REPO||branch!=='main'||complete!==true||!Array.isArray(rulesets)||rulesets.length!==0)return report('NATIVE_PROTECTION_INVENTORY_UNPROVEN');
 const p=protection,s=p?.required_status_checks;
 if(s?.strict!==true||p?.enforce_admins?.enabled!==true||p?.required_conversation_resolution?.enabled!==true||p?.allow_force_pushes?.enabled!==false||p?.allow_deletions?.enabled!==false||p?.lock_branch?.enabled!==false)return report('BASELINE_PROTECTION_UNPROVEN');
 // Unknown review bypass or push exceptions must be reviewed, never inferred safe.
 if(p.restrictions!=null||p.required_pull_request_reviews!=null)return report('ADDITIONAL_PROTECTION_REVIEW_REQUIRED');
 const checks=s.checks,contexts=s.contexts;
 if(!Array.isArray(checks)||!Array.isArray(contexts)||checks.some(c=>!c||typeof c.context!=='string'||!Number.isSafeInteger(c.app_id))||new Set(checks.map(c=>c.context)).size!==checks.length||new Set(contexts).size!==contexts.length||contexts.length!==checks.length||!checks.every(c=>contexts.includes(c.context)))return report('REQUIRED_CHECK_INVENTORY_UNPROVEN');
 if(!BASE.every(name=>checks.some(c=>c.context===name&&c.app_id===15368)))return report('BASELINE_REQUIRED_CHECK_UNPROVEN');
 const grant=checks.find(c=>c.context===PROMOTION_CONTEXT);
 if(!grant&&checks.length===BASE.length)return report('DEDICATED_CONTEXT_MISSING');
 if(!grant||grant.app_id!==APP||checks.length!==BASE.length+1)return report('DEDICATED_CONTEXT_BINDING_UNPROVEN');
 // Configuration evidence alone cannot prove that only a single writer can grant.
 return report('NATIVE_CONTEXT_BOUND_EXCLUSIVE_WRITER_UNPROVEN');
}
