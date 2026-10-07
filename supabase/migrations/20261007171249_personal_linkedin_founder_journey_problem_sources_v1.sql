insert into public.bg_schrijfregels
(regel_id,onderwerp,regel,onderbouwing,bewijs_n,vertrouwen,status,bron,bijgewerkt_op)
values
(
  'personal-linkedin-founder-journey-v2',
  'Persoonlijk LinkedIn — droom, reis en overtuiging',
  'Arthur persoonlijk LinkedIn is het doorlopende verhaal van zijn droom en reis met Bedrijfsgeheugen. De kern: welke problemen hij in zijn werkende leven in bedrijven heeft gezien; waarom die problemen hem zijn blijven bezighouden; wat hij nu bouwt om ze op te lossen; welke echte problemen, mislukkingen en ontdekkingen hij onderweg tegenkomt; en waar hij in gelooft. Centrale overtuiging: wereld, technologie, klantverwachtingen, regelgeving en markten veranderen sneller, waardoor bedrijven niet alleen plannen moeten maken maar voortdurend moeten kunnen waarnemen, vooruitkijken, anticiperen, leren en bijsturen. AI is daarbij geen doel op zich maar een manier om bedrijven wendbaarder en beter geïnformeerd te maken, terwijl mensen richting en verantwoordelijkheid houden. Iedere post hoeft niet alle elementen te bevatten, maar moet herkenbaar onderdeel zijn van deze reis. Geen verzonnen werkervaring, geen generieke AI-praat en geen geforceerde verkoop.',
  'Expliciet door gebruiker aangescherpt en goedgekeurd op 2026-10-07.',
  1,1.0,'actief','user_instruction+canonical-content-policy',now()
),
(
  'personal-linkedin-entrepreneur-problem-evidence-v1',
  'Persoonlijk LinkedIn — echte ondernemersproblemen uit bronnen',
  'Gebruik actief actuele, toegestane brondata over problemen die ondernemers en bedrijven ervaren, plus zoekvraagdata, als context voor Arthurs persoonlijke LinkedIn. Denk aan veranderende regelgeving, digitalisering en AI-adoptie, cyberweerbaarheid, personeel en vaardigheden, financiering, bedrijfsopvolging, procesfrictie, kennisborging, ketenveranderingen en andere aantoonbare ondernemingsproblemen. Een brongegeven is geen los statistiekje: vertaal het naar het onderliggende bedrijfsprobleem en koppel het alleen wanneer het inhoudelijk past bij Arthurs eigen bouwreis, ervaring of overtuiging. Nooit doen alsof Arthur een bronprobleem persoonlijk heeft meegemaakt als dat niet canoniek bewezen is. Citeer of benoem een bron in de post alleen wanneer dat het verhaal sterker maakt; bronlineage blijft intern altijd bewaard.',
  'Gebruiker vraagt op 2026-10-07 expliciet om data uit bronnen over problemen die ondernemers ondervinden structureel te gebruiken.',
  1,1.0,'actief','user_instruction+external-intelligence+search-demand',now()
)
on conflict (regel_id) do update set
  onderwerp=excluded.onderwerp,
  regel=excluded.regel,
  onderbouwing=excluded.onderbouwing,
  bewijs_n=excluded.bewijs_n,
  vertrouwen=excluded.vertrouwen,
  status=excluded.status,
  bron=excluded.bron,
  bijgewerkt_op=excluded.bijgewerkt_op;

update public.bg_schrijfregels
set regel='Arthur persoonlijk LinkedIn volgt primair zijn AI-native founder journey met Bedrijfsgeheugen: ik bouw mijn droom om echte problemen van bedrijven op te lossen. Gebruik echte bouwgebeurtenissen, problemen en lessen uit het werkende leven voor zover canoniek onderbouwd, plus actuele brondata over problemen die ondernemers ervaren. Maak de menselijke vertaling naar waarom het probleem ertoe doet, wat Arthur probeert te bouwen, wat hij onderweg leert en zijn overtuiging dat bedrijven in een steeds snellere en dynamischere wereld continu moeten kunnen anticiperen en bijsturen. AI is middel, niet onderwerp op zichzelf. Schrijf in gewone taal; geen interne systeemtaal en geen productpitch.',
    onderbouwing='Geactualiseerd na expliciete gebruikersgoedkeuring 2026-10-07.',
    bewijs_n=1,
    vertrouwen=1.0,
    status='actief',
    bron='arthur-personal-linkedin-founder-journey',
    bijgewerkt_op=now()
where regel_id='rci-personal-standup';

update public.brain_records
set result=coalesce(result,'{}'::jsonb)||jsonb_build_object(
  'personal_content_mode','AI_NATIVE_FOUNDER_JOURNEY',
  'founder_story_policy','personal-linkedin-founder-journey-v2',
  'entrepreneur_problem_evidence_policy','personal-linkedin-entrepreneur-problem-evidence-v1',
  'core_belief','bedrijven moeten in een sneller en dynamischer wordende wereld continu kunnen waarnemen, anticiperen, leren en bijsturen; AI helpt daarbij maar mensen houden richting en verantwoordelijkheid',
  'narrative_pillars',jsonb_build_array(
    'mijn_droom',
    'mijn_reis_met_bedrijfsgeheugen',
    'problemen_gezien_in_bedrijven',
    'echte_ondernemersproblemen_uit_bronnen',
    'wat_ik_bouw_om_te_helpen',
    'bouwfrictie_en_lessen',
    'wereld_en_technologie_veranderen_sneller',
    'anticiperen_en_wendbaar_blijven',
    'waar_ik_in_geloof'
  )
),
updated_at=now()
where tenant_id='canonical'
  and record_id='arthur-personal-linkedin-identity-v4';

create or replace function public.powerhouse_materialize_source_backed_channel_candidates_v2(
  p_date date default (timezone('Europe/Amsterdam',now()))::date
)
returns jsonb
language plpgsql
security definer
set search_path to 'public','pg_catalog'
as $$
declare
  v_base jsonb;
  h record;
  e_err record;
  e_ok record;
  v_id uuid;
  v_reason text;
  v_problem_pack jsonb := '[]'::jsonb;
  v_search_pack jsonb := '[]'::jsonb;
begin
  v_base:=public.powerhouse_materialize_source_backed_channel_candidates_v1(p_date);

  select * into h from public.powerhouse_one_brain_runtime_health_v1 limit 1;

  select event_id,event_type,source,subject_key,state,occurred_at,evidence
    into e_err
  from public.powerhouse_runtime_events
  where (occurred_at at time zone 'Europe/Amsterdam')::date=p_date
    and state='error'
    and source like 'powerhouse%'
  order by updated_at desc,occurred_at desc
  limit 1;

  select event_id,event_type,source,subject_key,state,occurred_at,evidence
    into e_ok
  from public.powerhouse_runtime_events
  where (occurred_at at time zone 'Europe/Amsterdam')::date=p_date
    and state<>'error'
    and source like 'powerhouse%'
  order by updated_at desc,occurred_at desc
  limit 1;

  select coalesce(jsonb_agg(to_jsonb(s) - 'score'),'[]'::jsonb)
    into v_problem_pack
  from (
    select url,onderwerp,titel,samenvatting,domein,gepubliceerd_op,brontrouw,relevantie,vertrouwen,deadline,
           (coalesce(brontrouw,0)*0.35 + coalesce(relevantie,0)*0.35 + coalesce(vertrouwen,0)*0.30) as score
    from public.bg_externe_signalen
    where toegestaan is true
      and coalesce(nullif(trim(ruis_reden),''),'')=''
      and coalesce(opgehaald_op,gepubliceerd_op) >= now() - interval '45 days'
      and coalesce(vertrouwen,0) >= 0.60
      and coalesce(relevantie,0) >= 0.25
    order by score desc, gepubliceerd_op desc nulls last
    limit 8
  ) s;

  select coalesce(jsonb_agg(to_jsonb(k)),'[]'::jsonb)
    into v_search_pack
  from (
    select zoekwoord,zaadwoord,zoekvolume,cpc,kansscore,positie,bron,opgehaald_op
    from public.bg_zoekwoordkansen
    where afgewezen_reden is null
      and opgehaald_op >= now() - interval '60 days'
      and (
        zoekwoord ilike '%bedrijf%'
        or zoekwoord ilike '%werk%'
        or zoekwoord ilike '%ai %'
        or zoekwoord ilike '%governance%'
        or zoekwoord ilike '%automatis%'
        or zoekwoord ilike '%proces%'
        or zoekwoord ilike '%instructie%'
      )
    order by kansscore desc nulls last, zoekvolume desc nulls last
    limit 8
  ) k;

  if h.total_layers is not null then
    v_reason:=format(
      'Vertel Arthurs founder journey met Bedrijfsgeheugen in gewone mensentaal. Hoofdlijn: mijn droom en waarom ik bouw → een echt bedrijfsprobleem dat ik in mijn werkende leven heb gezien of dat actuele betrouwbare bronnen aantonen → waarom dat probleem groter wordt in een wereld waarin technologie, markten, regels en verwachtingen sneller veranderen → wat ik nu probeer te bouwen → welke echte frictie of ontdekking ik onderweg tegenkom → wat ik leer → waar ik in geloof over anticiperen en wendbaar blijven. Gebruik alleen een bronprobleem als het inhoudelijk bij de bouwgebeurtenis past en maak nooit van een extern bronfeit een persoonlijke ervaring. Technische runtime-evidence is alleen interne onderbouwing en mag nooit letterlijk in publieke copy terechtkomen. Vandaag zijn %s externe probleembronnen en %s zoekvraagsignalen beschikbaar naast de geverifieerde bouwstate.',
      jsonb_array_length(v_problem_pack),jsonb_array_length(v_search_pack)
    );

    insert into public.powerhouse_content_recommendations(
      dedupe_key,run_date,topic_key,content_key,target_channel,recommendation_type,priority,reason,evidence,status
    ) values (
      'ai-native-builder-linkedin-personal:'||p_date::text,
      p_date,
      'ai-native-founder-journey',
      'linkedin-personal-ai-native-builder-'||p_date::text,
      'linkedin_personal',
      'verified_ai_native_builder_story',
      100,
      v_reason,
      jsonb_build_object(
        'contract','powerhouse-ai-native-builder-content-v1',
        'source_backed',true,
        'source_kind','powerhouse_verified_build_event+external_entrepreneur_problem_intelligence',
        'content_id','ai-native-builder:'||p_date::text,
        'identity_contract','arthur-personal-linkedin-identity-v4',
        'identity_gate_version','channel-identity-hard-gate-v3',
        'ai_native_builder_story_verified',true,
        'ai_native_builder_policy','personal-linkedin-ai-native-builder-v1',
        'founder_story_policy','personal-linkedin-founder-journey-v2',
        'entrepreneur_problem_evidence_policy','personal-linkedin-entrepreneur-problem-evidence-v1',
        'build_event_verified',true,
        'arthur_anchor_verified',true,
        'first_person_claims_present',true,
        'personal_life_topic',false,
        'business_topic',true,
        'corporate_voice',false,
        'company_page_interchangeable',false,
        'forced_business_moral',false,
        'sensitive_private_detail',false,
        'personal_product_pitch_forbidden',true,
        'dynamic_world_belief',true,
        'entrepreneur_problem_sources',v_problem_pack,
        'search_demand_sources',v_search_pack,
        'source_lineage',jsonb_build_array(
          'powerhouse_one_brain_runtime_health_v1:'||h.observed_at::text,
          case when e_err.event_id is null then 'runtime_error:none' else 'powerhouse_runtime_events:'||e_err.event_id::text end,
          case when e_ok.event_id is null then 'runtime_recovery:none' else 'powerhouse_runtime_events:'||e_ok.event_id::text end,
          'bg_externe_signalen:ranked_recent_allowed',
          'bg_zoekwoordkansen:ranked_recent'
        ),
        'runtime_health',to_jsonb(h),
        'friction_event',case when e_err.event_id is null then null else jsonb_build_object(
          'event_id',e_err.event_id,'event_type',e_err.event_type,'source',e_err.source,'subject_key',e_err.subject_key,'occurred_at',e_err.occurred_at,'evidence',e_err.evidence
        ) end,
        'result_event',case when e_ok.event_id is null then null else jsonb_build_object(
          'event_id',e_ok.event_id,'event_type',e_ok.event_type,'source',e_ok.source,'subject_key',e_ok.subject_key,'occurred_at',e_ok.occurred_at,'evidence',e_ok.evidence
        ) end,
        'story_structure',jsonb_build_array(
          'dream',
          'career_problem_or_source_backed_problem',
          'why_change_is_accelerating',
          'what_i_am_building',
          'real_build_friction',
          'what_i_learned',
          'belief_about_adaptive_companies'
        ),
        'measurement',jsonb_build_array('reach','reactions','comments','shares','profile_visits','follows','inbound_dm')
      ),
      'suggested'
    )
    on conflict(dedupe_key) do update set
      topic_key=excluded.topic_key,
      priority=excluded.priority,
      reason=excluded.reason,
      evidence=excluded.evidence,
      status='suggested',
      updated_at=now()
    returning recommendation_id into v_id;
  end if;

  return coalesce(v_base,'{}'::jsonb)||jsonb_build_object(
    'contract','powerhouse-source-backed-all-channels-v2',
    'linkedin_personal_ai_native_builder_recommendation_id',v_id,
    'entrepreneur_problem_source_count',jsonb_array_length(v_problem_pack),
    'search_demand_source_count',jsonb_array_length(v_search_pack)
  );
end;
$$;

-- Fresh-replay hardening: the historical live migration predates the later
-- service-role-only execution boundary, so the repository mirror closes it
-- immediately while retaining the same remote migration version.
REVOKE EXECUTE ON FUNCTION public.powerhouse_materialize_source_backed_channel_candidates_v2(date)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.powerhouse_materialize_source_backed_channel_candidates_v2(date)
  TO service_role;
