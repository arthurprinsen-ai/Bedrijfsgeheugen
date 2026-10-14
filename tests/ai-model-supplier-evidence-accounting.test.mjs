import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {classifySupplierClaim,supplierEvidenceWorklist,reconcileSupplierAudit} from './ai-model-supplier-evidence-worklist.mjs';

const date='2026-10-14';
const modelReceipt={
 claim:'governance',url:'https://provider.example/model',
 locator:'Model specific > retention',observed_value:'Documented model-specific retention term',
 checked_on:date
};
const policyReceipt={
 ...modelReceipt,
 url:'https://provider.example/terms',
 scope:'official provider/API baseline only; NOT model-specific deployed tenant or executed customer contract evidence',
 verification_status:'PROVIDER_POLICY_OBSERVED_TENANT_UNVERIFIED'
};

test('generic supplier policy never counts as model-specific evidence',()=>{
 assert.equal(classifySupplierClaim({checked_on:date,claim_evidence:[policyReceipt]},'governance'),
  'PROVIDER_BASELINE_ONLY_NOT_MODEL_PROOF');
 assert.equal(classifySupplierClaim({checked_on:date,claim_evidence:[{...modelReceipt,observed_value:''}]},'governance'),
  'NO_USABLE_MODEL_SOURCE_RECEIPT');
 assert.equal(classifySupplierClaim({checked_on:date,claim_evidence:[modelReceipt]},'governance'),
  'MODEL_SOURCE_RECEIPT_PRESENT_REVIEW_REQUIRED');
});

test('110-model worklist categories exactly partition six claims per model',()=>{
 const c=JSON.parse(fs.readFileSync('data/ai-model-catalog-v1.json','utf8'));
 const r=supplierEvidenceWorklist(c);
 assert.equal(r.models,110);
 assert.equal(r.total_claims,660);
 const classified=Object.values(r.evidence_classification).reduce((a,b)=>a+b,0);
 assert.equal(classified,r.total_claims);
 assert.equal(r.missing_claim_specific_receipts,
  r.evidence_classification.provider_baseline_only+r.evidence_classification.missing_or_incomplete_receipts);
 assert.equal(r.existing_complete_receipts+r.missing_claim_specific_receipts,r.total_claims);
 assert.equal(r.pending_claim_reviews,r.worklist.length);
 assert.equal(r.structurally_complete_models>=r.independently_accepted_models,true);
 assert.equal(r.fully_verified_models,r.independently_accepted_models);
 assert.equal(r.pending_independent_model_reviews,r.models-r.independently_accepted_models);
 const independentlyApproved=c.models.filter(m=>m.supplier_audit?.independent_verification_required===false&&
   m.supplier_audit?.automatic_recommendation_eligible===true&&m.verification_evidence?.claim_scope==='full');
 assert.equal(r.independently_accepted_models,independentlyApproved.length);
 assert.equal(r.ready_for_full_supplier_acceptance,
   r.pending_claim_reviews===0&&r.pending_independent_model_reviews===0);
 // A complete supplier receipt does not automatically confer independent acceptance.
 assert.ok(c.models.some(m=>m.verification_evidence?.claim_scope==='full'&&
   m.supplier_audit?.independent_verification_required===true));
 for(const row of r.worklist)
  assert.ok(['MODEL_SOURCE_RECEIPT_PRESENT_REVIEW_REQUIRED','PROVIDER_BASELINE_ONLY_NOT_MODEL_PROOF',
   'NO_USABLE_MODEL_SOURCE_RECEIPT'].includes(row.evidence_classification));
});

test('public model advisor must never promote provider-only policy to full model governance',()=>{
 const html=fs.readFileSync('ai-modelwijzer.html','utf8');
 const source=html.slice(html.indexOf('function fullSupplierEvidence(m)'),html.indexOf('function eligible(m)'));
 assert.match(source,/PROVIDER_POLICY_OBSERVED_TENANT_UNVERIFIED/);
 assert.match(source,/NOT model-specific/);
});

test('supplier ledger reconciliation is deterministic, scoped and fail-closed',()=>{
 const original=JSON.parse(fs.readFileSync('data/ai-model-catalog-v1.json','utf8'));
 const catalog=structuredClone(original);
 const model=catalog.models.find(m=>m.supplier_audit?.claim_evidence_classification);
 assert.ok(model,'Expected a catalog model with an independent supplier audit');
 const originalEvidence=JSON.stringify(model.verification_evidence);
 const oldClassification=model.supplier_audit.claim_evidence_classification.governance;
 model.supplier_audit.claim_evidence_classification.governance=
  oldClassification==='NO_USABLE_MODEL_SOURCE_RECEIPT'
   ? 'MODEL_SOURCE_RECEIPT_PRESENT_REVIEW_REQUIRED' : 'NO_USABLE_MODEL_SOURCE_RECEIPT';
 model.supplier_audit.missing_claim_receipts=['bogus-drift'];
 model.supplier_audit.missing_receipt_count=99;
 model.supplier_audit.automatic_recommendation_eligible=true;
 model.supplier_audit.independent_verification_required=false;
 const check=reconcileSupplierAudit(catalog);
 assert.ok(check.changed_models>=1);
 assert.equal(check.applied,false);
 const repaired=reconcileSupplierAudit(catalog,{apply:true});
 assert.ok(repaired.changed_model_ids.includes(model.id));
 const second=reconcileSupplierAudit(catalog);
 assert.equal(second.changed_models,0,'Reconciliation must be idempotent');
 assert.equal(model.supplier_audit.automatic_recommendation_eligible,false,
  'A reconciler cannot grant independent supplier approval');
 assert.equal(model.supplier_audit.independent_verification_required,true);
 assert.equal(JSON.stringify(model.verification_evidence),originalEvidence,
  'Supplier claims, observations and evidence dates must be left untouched');
});

test('review-only ledger drift is repaired without new supplier approvals',()=>{
 const catalog=structuredClone(JSON.parse(fs.readFileSync('data/ai-model-catalog-v1.json','utf8')));
 const model=catalog.models.find(m=>m.verification_evidence?.claim_scope==='full');
 assert.ok(model);
 const before=JSON.stringify(model.verification_evidence);
 const audit=model.supplier_audit;
 audit.review_required_claims=['stale'];
 audit.pending_independent_claim_reviews=999;
 audit.automatic_recommendation_eligible=true;
 audit.independent_verification_required=false;
 assert.ok(reconcileSupplierAudit(catalog).changed_model_ids.includes(model.id));
 assert.ok(reconcileSupplierAudit(catalog,{apply:true}).changed_model_ids.includes(model.id));
 const e=model.verification_evidence;
 const expected=['model_id','status','pricing','capabilities','deployment','governance'].filter(claim=>
  !(audit.claim_evidence_classification[claim]==='MODEL_SOURCE_RECEIPT_PRESENT_REVIEW_REQUIRED'&&
    e.claim_scope==='full'&&e.source_url===model.source&&e.checked_on===model.verified_at&&
    e.verified_claims?.includes(claim)&&!e.not_verified?.includes(claim)));
 assert.deepEqual(audit.review_required_claims,expected);
 assert.equal(audit.pending_independent_claim_reviews,expected.length);
 assert.equal(audit.independent_verification_required,true);
 assert.equal(audit.automatic_recommendation_eligible,false);
 assert.equal(JSON.stringify(model.verification_evidence),before);
});


test('official AWS model identifiers and Falcon source pricing never imply customer entitlement',()=>{
 const catalog=JSON.parse(fs.readFileSync('data/ai-model-catalog-v1.json','utf8'));
 const ids=new Map([
  ['amazon-nova-2-lite','amazon.nova-2-lite-v1:0'],
  ['amazon-nova-lite','amazon.nova-lite-v1:0'],
  ['amazon-nova-pro','amazon.nova-pro-v1:0'],
  ['amazon-nova-canvas','amazon.nova-canvas-v1:0'],
  ['amazon-nova-reel','amazon.nova-reel-v1:0'],
  ['amazon-nova-sonic','amazon.nova-sonic-v1:0'],
  ['amazon-titan-text-embeddings-v2','amazon.titan-embed-text-v2:0'],
  ['amazon-titan-multimodal-embeddings-g1','amazon.titan-embed-image-v1'],
  ['amazon-titan-image-generator-g1-v2','amazon.titan-image-generator-v2:0']
 ]);
 for(const [id,officialApiId] of ids){
  const m=catalog.models.find(row=>row.id===id);
  assert.ok(m,'Expected documented Bedrock model '+id);
  assert.equal(m.provider_api_id,officialApiId);
  const provenance=m.bedrock_identity_evidence_20261014;
  assert.equal(provenance.official_model_id,officialApiId);
  assert.ok(provenance.official_model_page.startsWith('https://docs.aws.amazon.com/'));
  assert.equal(provenance.automatic_recommendation_eligible,false,
   'A public model ID cannot authorize customer account usage');
  assert.equal(m.supplier_audit.automatic_recommendation_eligible,false);
 }
 for(const m of catalog.models.filter(row=>row.provider==='TII/Falcon')){
  const evidence=m.supplier_pricing_research;
  assert.equal(evidence.url,m.source,'Pricing investigation must cite the same model');
  assert.equal(evidence.verification_status,'UNVERIFIED_NUMERIC_HOSTED_API_PRICE');
  assert.equal(evidence.not_a_claim_receipt,true);
  assert.equal(m.supplier_audit.automatic_recommendation_eligible,false);
  if(m.id==='falcon-ocr'){
   assert.match(evidence.finding,/Apache-2\.0/);
   assert.match(evidence.finding,/not Falcon-LLM License/);
  }
 }
});

test('Falcon license source crosschecks remain public-only and non-promoting',()=>{
 const catalog=JSON.parse(fs.readFileSync('data/ai-model-catalog-v1.json','utf8'));
 const falcon=catalog.models.filter(model=>model.provider==='TII/Falcon');
 assert.equal(falcon.length,7);
 for(const model of falcon){
  const audit=model.supplier_audit;
  const receipt=audit.public_license_source_review_20261014;
  assert.ok(receipt,model.id+': supplier license source review missing');
  assert.equal(receipt.source_url,model.source);
  assert.equal(receipt.checked_on,'2026-10-14');
  assert.equal(receipt.canonical_repository,model.source.replace('https://huggingface.co/',''));
  assert.equal(receipt.observed_license_label,
   model.id==='falcon-ocr'?'apache-2.0':'falcon-llm-license');
  assert.equal(receipt.customer_runtime_attested,false);
  assert.equal(receipt.commercial_tariff_attested,false);
  assert.equal(receipt.independent_supplier_full_verification,false);
  assert.equal(receipt.automatic_recommendation_eligible,false);
  assert.equal(audit.automatic_recommendation_eligible,false);
  assert.ok(receipt.not_verified.some(x=>x.includes('deployment costs')));
 }
});

test('DeepSeek API platform terms are not model-specific governance proof',()=>{
 const catalog=JSON.parse(fs.readFileSync('data/ai-model-catalog-v1.json','utf8'));
 for(const id of ['deepseek-flash','deepseek-v4-pro']){
  const model=catalog.models.find(m=>m.id===id);
  assert.ok(model);
  const receipts=model.verification_evidence.claim_evidence.filter(r=>r.claim==='governance');
  assert.ok(receipts.some(r=>r.scope==='API_PLATFORM_TERMS_BASELINE_ONLY'));
  assert.equal(classifySupplierClaim(model.verification_evidence,'governance'),
   'PROVIDER_BASELINE_ONLY_NOT_MODEL_PROOF');
  assert.equal(model.supplier_audit.automatic_recommendation_eligible,false);
  assert.equal(model.supplier_audit.independent_verification_required,true);
 }
});

test('Nova Premier public-list omission cannot attest AWS account/region lifecycle',()=>{
 const c=JSON.parse(fs.readFileSync('data/ai-model-catalog-v1.json','utf8'));
 const m=c.models.find(model=>model.id==='amazon-nova-premier');
 assert.ok(m);
 const check=m.supplier_audit?.current_public_table_recheck_20261014;
 assert.ok(check,'The independent AWS public lifecycle table recheck must be retained');
 assert.equal(check.source_url,'https://docs.aws.amazon.com/bedrock/latest/userguide/model-lifecycle-legacy.html');
 assert.equal(check.account_region_modelLifecycle_readback,false);
 assert.equal(check.model_card_discrepancy_retained,true);
 assert.equal(check.release_eligible,false);
 assert.equal(check.independent_supplier_full_verification,false);
 assert.ok(Array.isArray(m.supplier_source_conflicts)&&m.supplier_source_conflicts.length>0);
 assert.equal(m.supplier_audit.automatic_recommendation_eligible,false);
 assert.notEqual(m.verification_evidence?.claim_scope,'full');
});

test('active Amazon Nova catalog records cite their exact model cards without supplier or customer approval',()=>{
 const catalog=JSON.parse(fs.readFileSync('data/ai-model-catalog-v1.json','utf8'));
 const cards={
  'amazon-nova-2-lite':'https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-amazon-nova-2-lite.html',
  'amazon-nova-2-sonic':'https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-amazon-nova-2-sonic.html',
  'amazon-nova-pro':'https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-amazon-nova-pro.html'
 };
 for(const [id,url] of Object.entries(cards)){
  const model=catalog.models.find(x=>x.id===id);
  assert.ok(model,id+' must be present');
  assert.equal(model.source,url,id+' canonical model-specific source');
  assert.equal(model.verification_evidence.source_url,url,id+' evidence source');
  assert.equal(model.supplier_audit.source_reference,url,id+' audit source');
  const review=model.supplier_audit.exact_model_card_source_20261014;
  assert.equal(review.exact_model_card_url,url);
  assert.equal(review.official_bedrock_model_id,model.provider_api_id);
  assert.equal(review.independent_six_claim_supplier_approval,false);
  assert.equal(review.customer_runtime_attested,false);
  assert.equal(model.supplier_audit.automatic_recommendation_eligible,false);
  assert.equal(model.verification_evidence.claim_scope,'partial',
   'Public model card reference is not full six-claim supplier verification');
 }
});

test('Google legacy preview Standard Paid prices are modality-scoped not blanket account approval',()=>{
 const catalog=JSON.parse(fs.readFileSync('data/ai-model-catalog-v1.json','utf8'));
 const tariffs=[
  {id:'gemini-3-flash-preview',input:0.50,output:3.00,expected:/audio input tokens|audio input/i},
  {id:'gemini-3.1-flash-tts-preview',input:1.00,output:20.00,expected:/audio output tokens/i}
 ];
 for(const t of tariffs){
  const model=catalog.models.find(m=>m.id===t.id);
  assert.ok(model,'Missing Google model '+t.id);
  assert.equal(model.provider,'Google');
  assert.equal(model.input_usd_m,t.input);
  assert.equal(model.output_usd_m,t.output);
  const evidence=model.verification_evidence;
  assert.ok(evidence.verified_claims.includes('pricing'));
  assert.ok(!evidence.not_verified.includes('pricing'));
  const receipt=evidence.claim_evidence.find(r=>r.claim==='pricing' &&
   r.url==='https://ai.google.dev/gemini-api/docs/pricing' &&
   r.checked_on===evidence.checked_on && t.expected.test(r.observed_value||''));
  assert.ok(receipt,'Model-specific modal pricing source receipt required for '+t.id);
  // A public price alone cannot certify a complete supplier claim set. When
  // the six public claims have separately been sourced, "full" is still NOT
  // independent approval, paid-tier entitlement, signed DPA, or tenant ZDR.
  const modelSpecificPolicy=evidence.claim_evidence.find(r=>r.claim==='governance' &&
   r.url==='https://ai.google.dev/gemini-api/docs/zdr' &&
   r.checked_on===evidence.checked_on &&
   String(r.scope??'').includes('supplier-public claim only') &&
   String(r.observed_value??'').includes(t.id) &&
   String(r.observed_value??'').includes('Actual tenant'));
  if(evidence.claim_scope==='full'){
   assert.ok(modelSpecificPolicy,'Full public supplier scope needs a model-specific governance source');
   assert.deepEqual([...evidence.verified_claims].sort(),
    ['model_id','status','pricing','capabilities','deployment','governance'].sort(),
    'Full public supplier scope requires all six distinct sourced claims');
   assert.deepEqual(evidence.not_verified,[],
    'Full public supplier scope cannot conceal unverified supplier claims');
  }else{
   assert.equal(evidence.claim_scope,'partial');
   assert.ok(evidence.not_verified.includes('governance'));
  }
  assert.equal(model.supplier_audit.automatic_recommendation_eligible,false,
   'Public evidence never grants automatic recommendation or tenant approval');
  assert.equal(model.supplier_audit.independent_verification_required,true);
 }
});

test('self-host-only Shieldstral cannot inherit Mistral managed API governance',()=>{
 const catalog=JSON.parse(fs.readFileSync('data/ai-model-catalog-v1.json','utf8'));
 const model=catalog.models.find(m=>m.id==='shieldstral-1');
 assert.ok(model);
 assert.deepEqual(model.deployment,['self-host']);
 assert.equal(model.status,'preview');
 const evidence=model.supplier_audit?.self_host_governance_boundary_review_20261014;
 assert.ok(evidence);
 assert.equal(evidence.provider_api_available,false);
 assert.equal(evidence.customer_deployment_attested,false);
 assert.equal(evidence.managed_saas_region_or_zdr_applicable,false);
 assert.equal(evidence.independent_customer_governance_accepted,false);
 assert.equal(evidence.automatic_recommendation_eligible,false);
 assert.ok(evidence.official_self_host_cookbook.startsWith('https://docs.mistral.ai/'));
 assert.match(model.governance.zero_data_retention,/NOT an entitlement/);
 assert.doesNotMatch(JSON.stringify(model.governance),/api\.eu\.mistral\.ai|approved paid-plan organization ZDR/i);
 assert.equal(model.supplier_audit.automatic_recommendation_eligible,false);
});

test('three Amazon Nova per-model card identities do not grant runtime entitlement',()=>{
 const catalog=JSON.parse(fs.readFileSync('data/ai-model-catalog-v1.json','utf8'));
 const expected={
  'amazon-nova-lite':'amazon.nova-lite-v1:0',
  'amazon-nova-micro':'amazon.nova-micro-v1:0',
  'amazon-nova-multimodal-embeddings':'amazon.nova-2-multimodal-embeddings-v1:0'
 };
 for(const [id,modelId] of Object.entries(expected)){
  const model=catalog.models.find(m=>m.id===id);
  assert.ok(model);
  const r=model.supplier_audit?.official_per_model_card_readback_20261014;
  assert.ok(r);
  assert.equal(r.checked_on,'2026-10-14');
  assert.equal(r.source_url,model.source);
  assert.equal(r.observed_value,modelId);
  assert.equal(model.provider_api_id,modelId);
  assert.equal(model.verification_evidence.source_url,model.source);
  assert.equal(r.customer_account_readback,false);
  assert.equal(r.independent_six_claim_supplier_approval,false);
  assert.equal(r.automatic_recommendation_eligible,false);
  assert.equal(model.supplier_audit.automatic_recommendation_eligible,false);
  assert.equal(model.verification_evidence.claim_scope,'partial');
 }
});

test('canonical source URLs for Grok audio and moderation remain exact model pages',()=>{
 const catalog=JSON.parse(fs.readFileSync('data/ai-model-catalog-v1.json','utf8'));
 const sources={
  'grok-4.7':'https://docs.x.ai/developers/models/grok-4.7',
  'gpt-audio-1.5':'https://developers.openai.com/api/docs/models/gpt-audio-1.5',
  'omni-moderation-latest':'https://developers.openai.com/api/docs/models/omni-moderation-latest'
 };
 for(const [id,url] of Object.entries(sources)){
  const model=catalog.models.find(x=>x.id===id);
  assert.ok(model);
  assert.equal(model.source,url);
  assert.equal(model.verification_evidence.source_url,url);
  assert.equal(model.supplier_audit.source_reference,url);
  const check=model.supplier_audit.official_exact_model_card_reconciliation_20261014;
  assert.equal(check.official_exact_model_card_url,url);
  assert.equal(check.customer_account_access_attested,false);
  assert.equal(check.independent_customer_governance_accepted,false);
  assert.equal(check.pricing_or_contract_revalidated,false);
  assert.equal(check.automatic_recommendation_eligible,false);
  assert.equal(model.supplier_audit.automatic_recommendation_eligible,false);
 }
});

test('Nova Premier English-card redirect cannot resolve contradictory AWS lifecycle',()=>{
 const catalog=JSON.parse(fs.readFileSync('data/ai-model-catalog-v1.json','utf8'));
 const m=catalog.models.find(row=>row.id==='amazon-nova-premier');
 assert.ok(m);
 const r=m.supplier_audit?.public_english_card_http_readback_20261014;
 assert.ok(r);
 assert.equal(r.source_access_status,'PUBLIC_ENGLISH_CANONICAL_PAGE_UNAVAILABLE_AT_READBACK');
 assert.equal(r.alternate_official_observed_status,'Legacy');
 assert.equal(r.alternate_official_date_conflict.eol_no_sooner_than,'2026-10-31');
 assert.equal(r.alternate_official_date_conflict.model_eol_date,'2026-09-14');
 assert.equal(r.account_region_readback,false);
 assert.equal(r.current_operational_lifecycle_resolved,false);
 assert.equal(r.automatic_recommendation_eligible,false);
 assert.notEqual(m.verification_evidence?.claim_scope,'full');
 assert.equal(m.supplier_audit.automatic_recommendation_eligible,false);
});

test('Falcon exact model-card inference receipts cannot authorize hosted API or customer runtime',()=>{
 const c=JSON.parse(fs.readFileSync('data/ai-model-catalog-v1.json','utf8'));
 const ids=['falcon-h1-0.5b-instruct','falcon-h1-1.5b-instruct','falcon-h1-3b-instruct',
  'falcon-h1-7b-instruct','falcon-h1-34b-instruct','falcon-h1r-7b'];
 for(const id of ids){
  const m=c.models.find(row=>row.id===id);
  assert.ok(m,id+' must be present');
  const r=m.supplier_audit?.public_model_card_self_host_scope_review_20261014;
  assert.ok(r,id+': public exact model card missing');
  assert.equal(r.checked_on,'2026-10-14');
  assert.equal(r.official_supplier_model_card,m.source);
  assert.equal(r.canonical_repository,m.source.replace('https://huggingface.co/',''));
  assert.equal(r.observed_license,'falcon-llm-license');
  assert.ok(r.observed_local_inference_frameworks.includes('Transformers'));
  assert.ok(r.observed_local_inference_frameworks.includes('vLLM'));
  assert.equal(r.independent_six_claim_supplier_approval,false);
  assert.equal(r.commercial_tariff_attested,false);
  assert.equal(r.customer_runtime_attested,false);
  assert.equal(r.automatic_recommendation_eligible,false);
  assert.equal(m.verification_evidence?.claim_scope,'partial');
  assert.equal(m.supplier_audit.automatic_recommendation_eligible,false);
 }
});
