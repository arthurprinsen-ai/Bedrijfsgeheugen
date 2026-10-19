-- User-directed provider replacement for the existing public-market use case only.
-- Keep approval, lifecycle, tenant scope, data categories and review controls unchanged.
update public.brain_ai_governance_registry
set provider='OpenAI',model_id='gpt-5-mini',model_revision='gpt-5-mini',
    inference_platform='OpenAI Responses API',
    provider_evidence_urls=ARRAY['https://developers.openai.com/api/docs/models/gpt-5-mini','https://developers.openai.com/api/docs/guides/function-calling'],
    evidence_ids=array(select distinct value from unnest(coalesce(evidence_ids,ARRAY[]::text[])||ARRAY['predictive-openai-recovery-20261019']) value),
    updated_at=now()
where tenant_id='canonical' and use_case_id='supabase-powerhouse-predictive-first-mover-v1'
  and approved=true and lifecycle_status='ACTIVE'
  and provider in ('Anthropic','OpenAI');
