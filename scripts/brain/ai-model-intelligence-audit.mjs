import fs from 'node:fs';
import path from 'node:path';

const catalog=JSON.parse(fs.readFileSync('data/ai-model-catalog-v1.json','utf8'));
const now=new Date();
const policy=JSON.parse(fs.readFileSync('config/powerhouse-ai-model-intelligence-v1.json','utf8'));
const staleAfter=policy.refresh.fail_closed_on_stale_pricing_days;
if(!Number.isInteger(staleAfter)||staleAfter<1||staleAfter>30)throw new Error('INVALID_CANONICAL_SUPPLIER_FRESHNESS_POLICY');
const providers=[...new Set(catalog.models.map(m=>m.provider))].sort();
const missingSource=catalog.models.filter(m=>!/^https:\/\//.test(String(m.source||''))).map(m=>m.id);
const missingJurisdiction=catalog.models.filter(m=>!m.jurisdiction).map(m=>m.id);
const missingVerifiedAt=catalog.models.filter(m=>!m.verified_at).map(m=>m.id);
// A repo commit or database updated_at is never proof of fresh supplier claims.
// Both catalog verification and independently recorded supplier claim receipts age out.
const evidenceAgeDays=value=>{
  if(typeof value!=='string'||!/^\\d{4}-\\d{2}-\\d{2}$/.test(value))return NaN;
  return (now-new Date(value+'T00:00:00Z'))/86400000;
};
const isStaleEvidence=value=>{
  const age=evidenceAgeDays(value);
  return !Number.isFinite(age)||age<0||age>staleAfter;
};
const staleModels=catalog.models.filter(m=>isStaleEvidence(m.verified_at)).map(m=>m.id);
const staleSupplierReceipts=catalog.models.filter(m=>isStaleEvidence(m.verification_evidence?.checked_on)).map(m=>m.id);
const staleAutoCandidates=catalog.models.filter(m=>
  (m.auto_recommendation_eligible===true||m.supplier_audit?.automatic_recommendation_eligible===true)&&
  (isStaleEvidence(m.verified_at)||isStaleEvidence(m.verification_evidence?.checked_on))
).map(m=>m.id);
const unknownEuProcessing=catalog.models.filter(m=>m.eu_processing==null).map(m=>m.id);
const unknownEuStorage=catalog.models.filter(m=>m.eu_storage==null).map(m=>m.id);
const missingLimitations=catalog.models.filter(m=>!Array.isArray(m.limitations)).map(m=>m.id);
const missingGovernance=catalog.models.filter(m=>!m.governance||!Object.prototype.hasOwnProperty.call(m.governance,'storage_residency')||!Object.prototype.hasOwnProperty.call(m.governance,'inference_residency')).map(m=>m.id);
const classCoverage={
  image_generation:catalog.models.some(m=>(m.strengths||[]).join(' ').toLowerCase().includes('image generation')),
  audio:catalog.models.some(m=>(m.modalities||[]).includes('audio')),
  ocr:catalog.models.some(m=>(m.strengths||[]).join(' ').toLowerCase().includes('ocr')),
  embeddings:catalog.models.some(m=>(m.strengths||[]).join(' ').toLowerCase().includes('embedding')),
  moderation:catalog.models.some(m=>(m.strengths||[]).join(' ').toLowerCase().includes('moderation')),
  video:catalog.models.some(m=>(m.modalities||[]).includes('video')),
  self_host:catalog.models.some(m=>m.self_host===true)
};
const report={
  capability:'ai-model-intelligence-advisor-v2',
  checked_at:now.toISOString(),
  verified_at:catalog.verified_at,
  stale_after_days:staleAfter,
  state:(missingSource.length||missingJurisdiction.length||missingVerifiedAt.length||staleModels.length||staleSupplierReceipts.length||staleAutoCandidates.length||missingLimitations.length||missingGovernance.length||Object.values(classCoverage).some(v=>!v)||catalog.models.length<100)?'REFRESH_REQUIRED':'FRESH',
  model_count:catalog.models.length,
  provider_count:providers.length,
  providers,
  class_coverage:classCoverage,
  official_source_coverage:{missing:missingSource,count:catalog.models.length-missingSource.length,total:catalog.models.length},
  freshness:{missing_verified_at:missingVerifiedAt,stale_models:staleModels,stale_supplier_claim_receipts:staleSupplierReceipts,stale_auto_recommendation_candidates:staleAutoCandidates},
  source_truth_boundary:'Historical VERIFIED and source URL are not current supplier proof; a fresh independently reviewable claim receipt is required before auto recommendation.',
  record_contract:{missing_limitations:missingLimitations,missing_governance:missingGovernance},
  governance_unknowns:{jurisdiction:missingJurisdiction,eu_processing:unknownEuProcessing,eu_storage:unknownEuStorage},
  invariant:'unknown governance values remain unknown and cannot be promoted to guaranteed'
};
fs.mkdirSync(path.join('artifacts','quality'),{recursive:true});
fs.writeFileSync(path.join('artifacts','quality','ai-model-intelligence-audit.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
if(report.state!=='FRESH') process.exitCode=1;
