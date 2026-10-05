-- Canonical story fingerprint authority.
-- Fingerprint: powerhouse-story-fingerprint-authority-v3

CREATE OR REPLACE FUNCTION public.powerhouse_story_fingerprint_v1(p_source text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public, extensions
AS $$
  SELECT CASE
    WHEN nullif(trim(coalesce(p_source,'')),'') IS NULL THEN NULL
    ELSE encode(
      extensions.digest(
        'personal-story-v1:' || public.powerhouse_normalize_publication_text_v1(p_source),
        'sha256'
      ),
      'hex'
    )
  END;
$$;

REVOKE EXECUTE ON FUNCTION public.powerhouse_story_fingerprint_v1(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.powerhouse_story_fingerprint_v1(text) TO service_role;

UPDATE public.powerhouse_publication_uniqueness_v1 u
SET story_fingerprint = public.powerhouse_story_fingerprint_v1(
      coalesce(
        nullif(a.generation_evidence #>> '{identity_gate_evidence,source_text}',''),
        nullif(a.generation_evidence #>> '{identity_gate_evidence,content_id}','')
      )
    ),
    updated_at = now()
FROM public.powerhouse_content_artifacts a
WHERE u.tenant_id='canonical'
  AND u.reservation_key='history-artifact:'||a.run_date::text||':'||a.channel
  AND a.channel='linkedin_personal'
  AND coalesce(
        nullif(a.generation_evidence #>> '{identity_gate_evidence,source_text}',''),
        nullif(a.generation_evidence #>> '{identity_gate_evidence,content_id}','')
      ) IS NOT NULL;
