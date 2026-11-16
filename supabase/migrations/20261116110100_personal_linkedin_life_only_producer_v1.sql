-- P0 #5913. Original personal LinkedIn lane must be about verified, authored
-- personal life, NOT the legacy 7-Oct AI-native business founder journey.
-- No new jobs, schedulers, sender or provider permissions. Existing personal
-- truth, dedupe, final SHA review and author/provider readback remain required.

-- Retire only the twelve explicitly observed obsolete personal LinkedIn rules.
-- The newer 15/16-Nov binding personal-life contract supersedes these; other
-- business-company/editorial rules remain untouched.
UPDATE public.bg_schrijfregels
SET status='vervallen',
    onderbouwing=concat_ws(' | ',nullif(onderbouwing,''),
      'Superseded 2026-11-16 by personal-linkedin-personal-life-only-v1: a verified first-person personal-life event, not a founder/business post. P0 #5913.'),
    bijgewerkt_op=now()
WHERE status='actief'
  AND regel_id IN (
    'rci-personal-standup',
    'personal-linkedin-language-rotation-v1',
    'personal-linkedin-software-data-bi-ai-intelligence-v1',
    'personal-linkedin-value-priority-v1',
    'personal-linkedin-first-person-dream-voice-v1',
    'personal-linkedin-journey-proof-v1',
    'personal-linkedin-predictive-external-impact-v1',
    'personal-linkedin-daily-dream-journey-v1',
    'personal-linkedin-entrepreneur-problem-evidence-v1',
    'personal-linkedin-founder-journey-v2',
    'personal-linkedin-dream-builder-v1',
    'personal-linkedin-dream-builder-human-language-v1'
  );

INSERT INTO public.bg_schrijfregels
 (regel_id,onderwerp,regel,onderbouwing,bewijs_n,vertrouwen,status,bron,bijgewerkt_op)
VALUES
 ('personal-linkedin-life-only-first-person-20261116-v1',
  'Persoonlijk LinkedIn — alleen echte persoonlijke belevenissen',
  'Alleen een door Arthur zelf aangeleverde of expliciet feitelijk bevestigde, nog ongebruikte gebeurtenis uit het dagelijks leven. Schrijf in de ik-vorm, met concrete eigen ervaring, menselijk detail, kleine wending en een natuurlijke pointe; bijvoorbeeld sport, reizen, gezin zonder privégegevens, hobby of dagelijkse frustraties. Nooit bedrijfsnieuws, Bedrijfsgeheugen, werk-/klantverhalen, AI, automatisering, ondernemerschap, managementles, verkapte marketing, hashtags, links of verzonnen eigen feiten. Extern nieuws is geen persoonlijke ervaring. Eerstehands bron met current-chat:user-fact / chat-history:user-fact / user-submitted-personal / user-verified-personal, personal_truth_verified, first_person_claims_verified, exact final-SHA onafhankelijke reviewer PASS, identiteit, dedupe en echte providerreadback zijn verplicht. Maandag t/m zaterdag; zondag geen post. Geen authentieke, nog ongebruikte persoonlijke bron of privétoestemming: behoud originele OPEN bronactie; geen zakelijke fallback en geen publicatie.',
  'Expliciete bindende persoons-/bedrijfscheiding herbevestigd 15 en 16 november 2026; vervangt 12 conflicterende founder/ondernemersregels van 7 oktober. Originele user-fact-bevestiging is afzonderlijk van de wens dagelijks te publiceren.',
  2,1,'actief','user_instruction+personal-linkedin-life-only+personal-first-person-source-v1',now())
ON CONFLICT (regel_id) DO UPDATE SET
 onderwerp=excluded.onderwerp, regel=excluded.regel,
 onderbouwing=excluded.onderbouwing, bewijs_n=excluded.bewijs_n,
 vertrouwen=excluded.vertrouwen,status='actief',bron=excluded.bron,
 bijgewerkt_op=now();

-- Preserve the existing v2 materialization RPC and its v1 all-channel output
-- while discontinuing ONLY its obsolete business-to-personal recommendation.
-- v1 remains the original single source-to-ONE-BRAIN consumer authority.
CREATE OR REPLACE FUNCTION public.powerhouse_materialize_source_backed_channel_candidates_v2(
 p_date date DEFAULT (timezone('Europe/Amsterdam'::text, now()))::date
) RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public','pg_catalog'
AS $function$
DECLARE
 v_base jsonb;
 v_quarantined integer:=0;
BEGIN
 v_base := public.powerhouse_materialize_source_backed_channel_candidates_v1(p_date);
 -- Safe for historical/current due-day materialization, no external writer.
 -- Quarantine old business founder proposals before the next content editor
 -- can read them, including an old v1 producer that might still insert one.
 UPDATE public.powerhouse_content_recommendations
 SET status='skipped',
     evidence=coalesce(evidence,'{}'::jsonb)
       ||jsonb_build_object(
          'personal_editorial_rejection','PERSONAL_BUSINESS_SOURCE_FORBIDDEN',
          'personal_life_only_policy','personal-linkedin-personal-life-only-v1',
          'personal_truth_verified',false,
          'original_candidate_not_published',true,
          'source_repair_owner','powerhouse-content-orchestrator'),
     updated_at=now()
 WHERE run_date=p_date AND target_channel='linkedin_personal'
   AND status IN ('suggested','accepted')
   AND (
     topic_key IN ('daily-dream-journey')
     OR coalesce(evidence->>'business_topic','false')='true'
     OR coalesce(evidence->>'ai_native_builder_story_verified','false')='true'
     OR coalesce(evidence->>'founder_story_policy','')<>''
   );
 GET DIAGNOSTICS v_quarantined=ROW_COUNT;

 RETURN coalesce(v_base,'{}'::jsonb) || jsonb_build_object(
   'contract','powerhouse-source-backed-all-channels-v2',
   'linkedin_personal_ai_native_builder_recommendation_id',null,
   'personal_life_only_policy','personal-linkedin-personal-life-only-v1',
   'personal_first_person_source_required',true,
   'legacy_personal_business_candidates_quarantined',v_quarantined,
   'personal_writer_authority','original-powerhouse-social-publisher',
   'personal_source_status','ORIGINAL_USER_FACT_REQUIRED_IF_NONE_VERIFIED'
 );
END;
$function$;

-- Preserve and restrict the original native service-role-only execution lane.
REVOKE ALL ON FUNCTION public.powerhouse_materialize_source_backed_channel_candidates_v2(date)
 FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.powerhouse_materialize_source_backed_channel_candidates_v2(date)
 TO service_role;
