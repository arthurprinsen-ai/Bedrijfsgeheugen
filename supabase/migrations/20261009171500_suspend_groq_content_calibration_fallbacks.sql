-- P0 #4198: Retire only the two independently observed Groq fallbacks.
-- Anthropic primary content and predictive/calibration routes stay active.
-- Preserve historical approvals, model IDs and governance lineage for audit.
UPDATE public.brain_ai_governance_registry
SET lifecycle_status='SUSPENDED', updated_at=now()
WHERE tenant_id='canonical'
  AND provider='Composio/Groq'
  AND lifecycle_status='ACTIVE'
  AND use_case_id IN (
    'supabase-bg-composio-content-fallback-v1',
    'supabase-powerhouse-forecast-calibration-fallback-v1'
  );
