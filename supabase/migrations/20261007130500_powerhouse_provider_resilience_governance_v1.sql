-- POWERHOUSE_ONE provider resilience governance.
-- Primary Anthropic routes remain authoritative. These explicit fallback records
-- permit evidence-bound Composio/Groq execution only when the primary provider
-- is unavailable; provider/model/fallback reason remain part of runtime evidence.

insert into public.brain_ai_governance_registry(
  tenant_id,use_case_id,name,provider,model_id,model_revision,purpose,owner_id,
  lifecycle_status,risk_class,human_oversight,data_categories,prohibited_data_categories,
  retention_policy,transparency_required,impact_assessment_required,approved,
  approval_evidence_ids,evidence_ids,last_reviewed_at,next_review_at,
  inference_platform,training_use,processing_scope,cross_border_transfer,subprocessors,
  transfer_safeguard,provider_evidence_urls,created_at,updated_at
)
select
  p.tenant_id,
  v.use_case_id,
  v.name,
  f.provider,
  f.model_id,
  f.model_revision,
  v.purpose,
  p.owner_id,
  'ACTIVE',
  p.risk_class,
  p.human_oversight,
  p.data_categories,
  p.prohibited_data_categories,
  f.retention_policy,
  true,
  p.impact_assessment_required,
  true,
  array['user-authorized-powerhouse-end-to-end-wiring-20261007','approved-provider-reuse:composio-groq'],
  array[v.evidence_id],
  now(),
  now()+interval '30 days',
  f.inference_platform,
  f.training_use,
  f.processing_scope,
  f.cross_border_transfer,
  f.subprocessors,
  f.transfer_safeguard,
  f.provider_evidence_urls,
  now(),
  now()
from public.brain_ai_governance_registry p
join public.brain_ai_governance_registry f
  on f.tenant_id=p.tenant_id
 and f.use_case_id='supabase-bg-composio-content-fallback-v1'
cross join (
  values
  (
    'supabase-powerhouse-predictive-first-mover-fallback-v1',
    'Powerhouse predictive first-mover provider fallback',
    'Evidence-bound predictive first-mover fallback when the approved primary provider is temporarily unavailable.',
    'predictive-fallback-contract-v1'
  ),
  (
    'supabase-powerhouse-forecast-calibration-fallback-v1',
    'Powerhouse forecast calibration provider fallback',
    'Evidence-bound forecast calibration fallback when the approved primary provider is temporarily unavailable.',
    'forecast-calibration-fallback-contract-v1'
  )
) as v(use_case_id,name,purpose,evidence_id)
where p.tenant_id='canonical'
  and p.use_case_id='supabase-powerhouse-predictive-first-mover-v1'
on conflict (tenant_id,use_case_id) do update set
  name=excluded.name,
  provider=excluded.provider,
  model_id=excluded.model_id,
  model_revision=excluded.model_revision,
  purpose=excluded.purpose,
  lifecycle_status='ACTIVE',
  approved=true,
  approval_evidence_ids=excluded.approval_evidence_ids,
  evidence_ids=excluded.evidence_ids,
  last_reviewed_at=now(),
  next_review_at=excluded.next_review_at,
  inference_platform=excluded.inference_platform,
  training_use=excluded.training_use,
  processing_scope=excluded.processing_scope,
  cross_border_transfer=excluded.cross_border_transfer,
  subprocessors=excluded.subprocessors,
  transfer_safeguard=excluded.transfer_safeguard,
  provider_evidence_urls=excluded.provider_evidence_urls,
  updated_at=now();
