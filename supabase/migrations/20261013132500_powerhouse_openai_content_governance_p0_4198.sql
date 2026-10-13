-- P0 #4198: migrate the canonical content use case where provisioned.
-- Supabase preview branches can legitimately omit production-only governance rows.
-- Production release still requires a readback of the canonical row.
UPDATE public.brain_ai_governance_registry
SET provider='OpenAI', model_id='gpt-5-mini'
WHERE tenant_id='canonical'
  AND use_case_id='supabase-bg-native-content-generate-v4'
  AND provider IN ('Anthropic','OpenAI');
