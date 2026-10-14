// Per-claim coverage report. A documented source assertion is NOT independently
// verified availability, pricing, customer DPA, retention or data residency.
// This script never changes the catalog, its verified_at dates or tenant accounts.
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';

const catalogFile=process.argv[2]||'data/ai-model-catalog-v1.json';
const evidenceFile=process.argv[3]||'data/evidence/ai-model-official-sources-2026-10-14.json';
const output=process.argv[4]||'.artifacts/ai-model-claim-coverage.json';
const raw=await fs.readFile(catalogFile);
const catalog=JSON.parse(raw.toString('utf8'));
const evidence=JSON.parse(await fs.readFile(evidenceFile,'utf8'));
const blobSha=createHash('sha1').update('blob '+raw.length+String.fromCharCode(0)).update(raw).digest('hex');
if(evidence.audited_catalog_blob_sha!==blobSha)throw Error('STALE_IDENTITY_EVIDENCE_CATALOG_SHA_MISMATCH');
if(evidence.models_checked!==catalog.models.length||evidence.receipts.length!==catalog.models.length)throw Error('IDENTITY_EVIDENCE_INCOMPLETE');
const receipts=new Map(evidence.receipts.map(x=>[x.model_id,x]));
if(receipts.size!==catalog.models.length)throw Error('IDENTITY_EVIDENCE_DUPLICATE_OR_MISSING');

const checkedAt=new Date();
const isRecent=date=>{
  if(!date||!/^\d{4}-\d{2}-\d{2}$/.test(date))return false;
  const age=(checkedAt.getTime()-new Date(date+'T23:59:59Z').getTime())/86400000;
  return age>=-1&&age<=14;
};
const sourceEntry=(entry,requiredFields=[])=>{
  if(!entry||typeof entry!=='object')return {state:'NO_CLAIM_LEVEL_RECEIPT'};
  if(!entry.source?.startsWith('https://'))return {state:'MISSING_OFFICIAL_SOURCE'};
  if(!isRecent(entry.checked_at))return {state:'STALE_CLAIM_LEVEL_RECEIPT',source:entry.source};
  const documented=new Set(['PROVIDER_DOC_CONFIRMED','OFFICIAL_BEDROCK_MODEL_ID_LISTED','OFFICIAL_MODEL_CARD_CONFIRMED','OFFICIAL_PUBLISHER_MODEL_HUB']);
  if(!documented.has(entry.status))return {state:'CLAIM_NOT_SOURCE_ATTESTED',source:entry.source};
  if(requiredFields.some(field=>entry[field]===undefined||entry[field]===null))return {state:'RECEIPT_VALUE_MISSING',source:entry.source};
  return {state:'SOURCE_ATTESTED_REQUIRES_INDEPENDENT_CHECK',source:entry.source,checked_at:entry.checked_at};
};
const knownRecordStatuses=new Set(['OFFICIAL_PAGE_MODEL_ID_MENTION','OFFICIAL_PAGE_API_ID_MENTION','PUBLISHER_FAMILY_REFERENCE_NOT_MODEL_ID']);
const rows=catalog.models.map(model=>{
  const receipt=receipts.get(model.id);
  if(!receipt||receipt.source_url!==model.source)throw Error('SOURCE_IDENTITY_MISMATCH:'+model.id);
  if(!knownRecordStatuses.has(receipt.status))throw Error('UNRESOLVED_MODEL_IDENTITY:'+model.id);
  if(receipt.full_model_verification_granted!==false)throw Error('UNSUPPORTED_FULL_VERIFICATION:'+model.id);
  const family=model.record_kind==='model_family';
  if(family&&(model.selection_eligible!==false||receipt.status!=='PUBLISHER_FAMILY_REFERENCE_NOT_MODEL_ID'))
    throw Error('FAMILY_ROUTE_NOT_BLOCKED:'+model.id);
  const claim=model.claim_evidence||{};
  const identity=family?{state:'NOT_A_DEPLOYABLE_MODEL'}:{
    state:'IDENTIFIER_MENTIONED_IN_OFFICIAL_SOURCE_NOT_FULLY_VERIFIED',
    evidence_type:receipt.status,
    provider_api_id:model.provider_model_id||null
  };
  const pricingEntry=claim.pricing_short_context||claim.pricing||null;
  const pricing=sourceEntry(pricingEntry);
  const context=sourceEntry(claim.context_window, ['value_tokens']);
  const lifecycle=sourceEntry(claim.lifecycle);
  const valuePriceMissing=!Number.isFinite(model.input_usd_m)||!Number.isFinite(model.output_usd_m);
  const priceZeroReview=!valuePriceMissing&&(model.input_usd_m===0||model.output_usd_m===0);
  const hasTier=Boolean(model.pricing_tier);
  const priceIssues=[];
  if(valuePriceMissing)priceIssues.push('TOKEN_PRICE_NOT_LISTED_OR_SPECIALIST_UNIT');
  if(priceZeroReview)priceIssues.push('ZERO_TOKEN_PRICE_REQUIRES_PROVIDER_TIER_REVIEW');
  if(pricing.state==='SOURCE_ATTESTED_REQUIRES_INDEPENDENT_CHECK'&&!hasTier&&!model.unit_price)
    priceIssues.push('PRICING_PROCESSING_TIER_NOT_SPECIFIED');
  if(family&&model.selection_eligible!==false)throw Error('FAMILY_ROUTE_ELIGIBLE:'+model.id);
  const isRetired=['retired','deprecated','duplicate_alias','family_reference'].includes(model.status);
  const selectionBlocked=model.selection_eligible===false;
  const routeRisk=isRetired&&!selectionBlocked;
  return {
    model_id:model.id,provider:model.provider,record_kind:family?'family':'model',
    selectable:!selectionBlocked,status:model.status,verified_at:model.verified_at,
    whole_model_verified_recently:false,
    identity,pricing:{...pricing,issues:priceIssues,pricing_tier:model.pricing_tier||null},
    context,lifecycle,
    governance:{state:family?'NOT_APPLICABLE_TO_FAMILY':'CUSTOMER_RUNTIME_READBACK_NOT_VERIFIED',
      eu_processing_claim:model.eu_processing??null,eu_storage_claim:model.eu_storage??null},
    provider_agreement:{state:family?'NOT_APPLICABLE_TO_FAMILY':'AUTHORIZED_SIGNED_AGREEMENT_NOT_VERIFIED'},
    route_risk:routeRisk
  };
});
const counts={
  records:rows.length,
  deployable_model_records:rows.filter(r=>r.record_kind==='model').length,
  publisher_family_placeholders:rows.filter(r=>r.record_kind==='family').length,
  source_identity_receipts:rows.filter(r=>r.identity.state==='IDENTIFIER_MENTIONED_IN_OFFICIAL_SOURCE_NOT_FULLY_VERIFIED').length,
  source_attested_price_receipts:rows.filter(r=>r.pricing.state==='SOURCE_ATTESTED_REQUIRES_INDEPENDENT_CHECK').length,
  source_attested_context_receipts:rows.filter(r=>r.context.state==='SOURCE_ATTESTED_REQUIRES_INDEPENDENT_CHECK').length,
  source_attested_lifecycle_receipts:rows.filter(r=>r.lifecycle.state==='SOURCE_ATTESTED_REQUIRES_INDEPENDENT_CHECK').length,
  pricing_without_numeric_token_values:rows.filter(r=>r.pricing.issues.includes('TOKEN_PRICE_NOT_LISTED_OR_SPECIALIST_UNIT')).length,
  signed_agreements_read_back:0,
  customer_runtime_residency_read_back:0,
  independently_completed_whole_models:0,
  unsafe_retired_models_selectable:rows.filter(r=>r.route_risk).length
};
if(counts.records!==catalog.models.length)throw Error('CATALOG_LEDGER_INCOMPLETE');
if(counts.unsafe_retired_models_selectable)throw Error('RETIRED_MODEL_SELECTABLE');
const result={
  contract:'powerhouse-model-claim-coverage-v1',generated_at:checkedAt.toISOString(),
  identity_evidence_catalog_blob_sha:blobSha,counts,
  warning:'Source-attested claims are NOT independently checked customer governance, pricing tier, signed DPA, API entitlements or residency; no whole-model verification date is advanced.',
  models:rows
};
await fs.mkdir(path.dirname(output),{recursive:true});
await fs.writeFile(output,JSON.stringify(result,null,2)+'\n');
process.stdout.write(JSON.stringify({output,counts})+'\n');
