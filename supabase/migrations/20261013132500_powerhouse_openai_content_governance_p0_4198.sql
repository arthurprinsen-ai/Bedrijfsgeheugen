-- P0 #4198: route the existing canonical content generation use case to the
-- previously approved OpenAI provider family, without starting another publisher.
-- Fail closed if canonical governance has changed unexpectedly.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.brain_ai_governance_registry
    WHERE tenant_id='canonical'
      AND use_case_id='supabase-bg-native-content-generate-v4'
      AND provider IN ('Anthropic','OpenAI')
  ) THEN
    RAISE EXCEPTION 'CONTENT_GOVERNANCE_ROW_MISSING_OR_UNEXPECTED';
  END IF;

  UPDATE public.brain_ai_governance_registry
  SET provider='OpenAI',
      model_id='gpt-5-mini'
  WHERE tenant_id='canonical'
    AND use_case_id='supabase-bg-native-content-generate-v4'
    AND provider IN ('Anthropic','OpenAI');
END $$;
