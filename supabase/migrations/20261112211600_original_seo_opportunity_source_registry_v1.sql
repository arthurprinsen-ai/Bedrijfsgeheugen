-- Original SEO resolver #105 -> ONE BRAIN source evidence registry repair.
-- Fixed original existing writer: powerhouse-seo-opportunity-resolver-v1.
-- No new external producer, cron, event sink, provider auth or public access.
-- Provider keyword facts stay under source_key=dataforseo-intelligence.
-- This source key marks DERIVED resolver opportunities, not fresh provider ranks.
INSERT INTO public.powerhouse_evidence_sources
  (source_key,source_class,required,max_age,writer_contract,owner_component,notes,updated_at)
VALUES
  ('seo-opportunity-intelligence','projection',false,interval '7 days',
   'powerhouse-seo-opportunity-resolver-v1',
   'powerhouse-seo-opportunity-resolver',
   'Derived canonical SEO intent-owner/market opportunity resolver output. No new provider keyword observation, human visitor, executed SEO change or conversion is implied by this source record.',
   now())
ON CONFLICT (source_key) DO NOTHING;

-- Fail closed if a competing owner registered the same key with a different
-- authority. Never rewrite other source owners or weaken FK/RLS constraints.
DO $verify_original_seo_resolver_source$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.powerhouse_evidence_sources
    WHERE source_key='seo-opportunity-intelligence'
      AND source_class='projection'
      AND required=false
      AND writer_contract='powerhouse-seo-opportunity-resolver-v1'
      AND owner_component='powerhouse-seo-opportunity-resolver'
      AND max_age=interval '7 days'
  ) THEN
    RAISE EXCEPTION 'ORIGINAL_SEO_RESOLVER_SOURCE_OWNER_CONFLICT'
      USING errcode='23514';
  END IF;
END
$verify_original_seo_resolver_source$;
