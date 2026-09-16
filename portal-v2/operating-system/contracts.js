export const ACTION_RISK_CLASS=Object.freeze({READ_ONLY:0,INTERNAL_REVERSIBLE:1,INTERNAL_MATERIAL:2,EXTERNAL:3});
export const ACTION_STATES=Object.freeze(['PROPOSED','ELIGIBLE','APPROVAL_REQUIRED','AUTO_APPROVED','QUEUED','EXECUTING','READBACK_PENDING','VERIFIED','OUTCOME_PENDING','OUTCOME_RECORDED','LEARNED','BLOCKED','FAILED']);
export const VALUE_KINDS=Object.freeze(['observed','derived','assumption','estimated','forecast','realized']);
const REQUIRED_EVIDENCE=Object.freeze(['id','tenant_id','entity_type','source_refs','provenance','freshness_at','confidence','model_or_formula_version','observed_at','updated_at']);

const clone=value=>value==null?value:structuredClone(value);
function deepFreeze(value){if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const child of Object.values(value))deepFreeze(child);}return value;}
function present(value){return value!==undefined&&value!==null&&value!=='';}

export function assertTenantScoped(entity,tenantId){
 if(!tenantId)throw new Error('TENANT_SCOPE_REQUIRED');
 if(!entity?.tenant_id)throw new Error('ENTITY_TENANT_REQUIRED');
 if(entity.tenant_id!==tenantId)throw new Error('TENANT_SCOPE_MISMATCH');
 return true;
}

export function normalizeEvidenceEnvelope(entity,tenantId){
 assertTenantScoped(entity,tenantId);
 const missing=REQUIRED_EVIDENCE.filter(key=>!present(entity?.[key]));
 if(!Array.isArray(entity?.source_refs))missing.push('source_refs[]');
 if(missing.length)throw new Error(`EVIDENCE_ENVELOPE_INCOMPLETE:${[...new Set(missing)].join(',')}`);
 const confidence=Number(entity.confidence);
 if(!Number.isFinite(confidence)||confidence<0||confidence>1)throw new Error('EVIDENCE_CONFIDENCE_INVALID');
 return deepFreeze({...clone(entity),confidence,source_refs:[...entity.source_refs]});
}

export function valueKind(value){
 const kind=String(value?.kind||'');
 if(!VALUE_KINDS.includes(kind))throw new Error('VALUE_KIND_REQUIRED');
 return kind;
}

export function canAutoExecute(action={}){
 const risk=Number(action.risk_class);
 if(!Number.isInteger(risk)||risk<0||risk>3)return false;
 if(risk>=2)return false;
 if(!action.tenant_id||!action.provenance||!action.identity_verified||!action.permission_verified)return false;
 return true;
}

export function evidenceHealth(entity,{now=Date.now(),staleAfterMs=86_400_000}={}){
 if(!entity)return Object.freeze({status:'unavailable',confidence:0,stale:true});
 const confidence=Number(entity.confidence);
 const freshAt=Date.parse(entity.freshness_at||'');
 const stale=!Number.isFinite(freshAt)||(Number(now)-freshAt)>staleAfterMs;
 const status=stale?'stale':confidence<.5?'low-confidence':'healthy';
 return Object.freeze({status,confidence:Number.isFinite(confidence)?confidence:0,stale});
}
