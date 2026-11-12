-- Original Powerhouse SEO resolver => original unified ONE BRAIN evidence source.
-- Source registration only: NO scheduler, data collector, grant, RLS change or
-- provider-side mutation. Derived SEO opportunities are NOT DataForSEO truth.
-- Parent P0 #4198; original resolver #105, source archive #175, Brain #140.
INSERT INTO public.powerhouse_evidence_sources
  (source_key,source_class,required,max_age,writer_contract,owner_component,notes)
VALUES
  ('seo-opportunity-intelligence','derived_intelligence',false,interval '30 hours',
   'powerhouse_record_source_observation_v1','powerhouse-seo-opportunity-resolver',
   'Derived SEO opportunity decisions from original GSC, real DataForSEO cache timestamps and governed forecasts; not independent provider traffic, rankings, impressions, conversions or new keyword observations.')
ON CONFLICT (source_key) DO NOTHING;

DO $original_seo_source_guard$
BEGIN
  IF NOT EXISTS(
    SELECT 1 FROM public.powerhouse_evidence_sources
    WHERE source_key='seo-opportunity-intelligence'
      AND source_class='derived_intelligence'
      AND required=false
      AND max_age=interval '30 hours'
      AND writer_contract='powerhouse_record_source_observation_v1'
      AND owner_component='powerhouse-seo-opportunity-resolver'
  ) THEN
    RAISE EXCEPTION 'SEO_ORIGINAL_DERIVED_EVIDENCE_SOURCE_REGISTRY_CONFLICT' USING errcode='23514';
  END IF;
END
$original_seo_source_guard$;
