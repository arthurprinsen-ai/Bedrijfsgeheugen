import {deriveOrganismEffects} from '../organism/organism-graph.mjs';

// A change is one correlated event, not independent compliance/finance/ESG tickets.
// This is an impact candidate planner; it does not assert legal applicability or measured emissions.
const CHANGE_START=Object.freeze({
  CONNECTOR:['portal.state','data.inventory','suppliers','security.risk','finance'],
  AI_MODEL:['portal.state','ai.inventory','data.inventory','suppliers','security.risk','finance'],
  AI_DEPLOYMENT:['portal.state','ai.inventory','data.inventory','data.location','suppliers','security.risk','finance'],
  DATA_LOCATION:['portal.state','data.inventory','data.location','suppliers','security.risk'],
  SUPPLIER:['portal.state','suppliers','security.risk','finance']
});
const ESG_REVIEW=Object.freeze({
  CONNECTOR:['ESRS_E1','ESRS_E5','ESRS_G1'],
  AI_MODEL:['ESRS_E1','ESRS_E5','ESRS_G1'],
  AI_DEPLOYMENT:['ESRS_E1','ESRS_E5','ESRS_G1'],
  DATA_LOCATION:['ESRS_E1','ESRS_G1'],
  SUPPLIER:['ESRS_E1','ESRS_E5','ESRS_S2','ESRS_G1']
});
const unique=x=>[...new Set(x)];
const own=(v,k)=>Object.prototype.hasOwnProperty.call(v,k);
export function planCrossDomainChange({tenantId,changeId,kind,before,after,actor,evidenceIds=[],occurredAt}={}){
  if(!String(tenantId||'').trim()||!String(changeId||'').trim()||!String(actor||'').trim())throw new TypeError('TENANT_CHANGE_ACTOR_REQUIRED');
  if(!own(CHANGE_START,kind))throw new TypeError('UNSUPPORTED_CHANGE_KIND');
  if(before===undefined||after===undefined)throw new TypeError('BEFORE_AFTER_REQUIRED');
  if(!Array.isArray(evidenceIds))throw new TypeError('EVIDENCE_IDS_INVALID');
  const evidence=unique(evidenceIds.map(v=>String(v).trim()).filter(Boolean));
  const unchanged=JSON.stringify(before)===JSON.stringify(after);
  const observedAt=occurredAt||new Date().toISOString();
  if(!Number.isFinite(Date.parse(observedAt)))throw new TypeError('INVALID_CHANGE_TIME');
  const organism=unchanged?null:deriveOrganismEffects({},{startNodes:CHANGE_START[kind]});
  const esg=unchanged?[]:ESG_REVIEW[kind].map(standard=>Object.freeze({standard,reviewRequired:true,applicability:'UNDETERMINED',materiality:'UNDETERMINED',measuredImpact:null,evidenceIds:evidence}));
  const domains=unchanged?[]:unique(['privacy','security','ai_governance','data_residency','supplier_risk','finance','sustainability','csrd_esrs_scope','audit','customer_disclosure']);
  return Object.freeze({
    contract:'powerhouse-cross-domain-change-v1',tenantId:String(tenantId),changeId:String(changeId),kind,actor:String(actor),observedAt,
    changed:!unchanged,before,after,evidenceIds:Object.freeze(evidence),
    propagation:organism,affectedDomains:Object.freeze(domains),esrsReview:Object.freeze(esg),
    status:unchanged?'NO_CHANGE':'REVIEW_REQUIRED',deploymentApproved:false,
    reason:unchanged?'NO_STATE_DIFFERENCE':'CROSS_DOMAIN_EVIDENCE_AND_APPLICABILITY_REVIEW_REQUIRED'
  });
}
export function assertCrossDomainChangeReady(assessment,{approvedDomains=[],evidenceIds=[]}={}){
  if(!assessment||assessment.contract!=='powerhouse-cross-domain-change-v1')throw new TypeError('INVALID_ASSESSMENT');
  if(!assessment.changed)return true;
  if(!Array.isArray(approvedDomains)||!Array.isArray(evidenceIds))throw new TypeError('INVALID_APPROVALS');
  const approved=new Set(approvedDomains);
  if(assessment.affectedDomains.some(domain=>!approved.has(domain)))throw Object.assign(new Error('CROSS_DOMAIN_REVIEW_INCOMPLETE'),{code:'CROSS_DOMAIN_REVIEW_INCOMPLETE'});
  if(evidenceIds.length===0||assessment.esrsReview.some(x=>x.applicability!=='UNDETERMINED')===false && !approved.has('csrd_esrs_scope'))throw Object.assign(new Error('CROSS_DOMAIN_EVIDENCE_MISSING'),{code:'CROSS_DOMAIN_EVIDENCE_MISSING'});
  return true;
}
