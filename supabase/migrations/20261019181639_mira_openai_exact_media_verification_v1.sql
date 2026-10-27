-- Existing user-authorized OpenAI provider migration, scoped to fictional Mira proof.
-- Preserve approval, data categories, tenant isolation, thresholds and review gates.
update public.brain_ai_governance_registry
set provider='OpenAI',model_id='gpt-5-mini',model_revision='gpt-5-mini',
    inference_platform='OpenAI Responses API',
    provider_evidence_urls=ARRAY['https://developers.openai.com/api/docs/models/gpt-5-mini','https://developers.openai.com/api/docs/guides/images-vision'],
    evidence_ids=array(select distinct value from unnest(coalesce(evidence_ids,ARRAY[]::text[])||ARRAY['mira-openai-exact-media-verification-20261019']) value),
    updated_at=now()
where tenant_id='canonical' and use_case_id='supabase-powerhouse-instagram-media-verifier-v1'
  and approved=true and lifecycle_status='ACTIVE'
  and provider in ('Anthropic','OpenAI');
