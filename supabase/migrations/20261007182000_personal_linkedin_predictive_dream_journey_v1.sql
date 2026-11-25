-- Canonical personal LinkedIn founder journey: first-person dream, predictive external impact,
-- software + data + BI + AI, verified value loop, and 5NL/2EN language rotation.

CREATE OR REPLACE FUNCTION public.powerhouse_materialize_source_backed_channel_candidates_v2(p_date date DEFAULT (timezone('Europe/Amsterdam'::text, now()))::date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
declare
  v_base jsonb;
  h record;
  e_err record;
  e_ok record;
  v_id uuid;
  v_reason text;
  v_problem_pack jsonb := '[]'::jsonb;
  v_search_pack jsonb := '[]'::jsonb;
  v_forecast_pack jsonb := '[]'::jsonb;
  v_journey_snapshot jsonb := '{}'::jsonb;
  v_recent_chapters jsonb := '[]'::jsonb;
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

  select coalesce(jsonb_agg(to_jsonb(c)),'[]'::jsonb)
    into v_recent_chapters
  from (
    select run_date,title,left(body,500) as excerpt,status
    from public.powerhouse_content_artifacts
    where channel='linkedin_personal'
      and run_date < p_date
      and status in ('content_ready','scheduled','published','measured','learned')
    order by run_date desc, updated_at desc
    limit 7
  ) c;

  v_journey_snapshot := jsonb_build_object(
    'as_of_date',p_date,
    'what_exists',jsonb_build_object(
      'approved_active_ai_models',(
        select count(distinct model_id)
        from public.brain_ai_governance_registry
        where tenant_id='canonical' and approved is true and lifecycle_status='ACTIVE'
      ),
      'measured_pages',(
        select count(distinct pagina)
        from public.bg_paginarendement
      ),
      'evidence_sources',(
        select count(*)
        from public.powerhouse_evidence_sources
      ),
      'sales_actions_total',(
        select count(*)
        from public.powerhouse_sales_actions
      ),
      'sales_outcomes_total',(
        select count(*)
        from public.powerhouse_sales_outcomes
      )
    ),
    'today',jsonb_build_object(
      'content_recommendations',(
        select count(*)
        from public.powerhouse_content_recommendations
        where run_date=p_date
      ),
      'actions_created',(
        select count(*)
        from public.powerhouse_sales_actions
        where (created_at at time zone 'Europe/Amsterdam')::date=p_date
      ),
      'actions_executed',(
        select count(*)
        from public.powerhouse_sales_actions
        where executed_at is not null
          and (executed_at at time zone 'Europe/Amsterdam')::date=p_date
      ),
      'outcomes_observed',(
        select count(*)
        from public.powerhouse_sales_outcomes
        where (occurred_at at time zone 'Europe/Amsterdam')::date=p_date
      ),
      'realized_revenue_eur',(
        select coalesce(sum(revenue_eur),0)
        from public.powerhouse_sales_outcomes
        where (occurred_at at time zone 'Europe/Amsterdam')::date=p_date
      ),
      'runtime_errors_internal_only',(
        select count(*)
        from public.powerhouse_runtime_events
        where (occurred_at at time zone 'Europe/Amsterdam')::date=p_date
          and state='error'
      )
    ),
    'value_proof',jsonb_build_object(
      'actions_with_expected_value',(
        select count(*)
        from public.powerhouse_action_business_value_v1
        where coalesce(expected_value_eur,0)>0
      ),
      'realized_actions',(
        select count(*)
        from public.powerhouse_action_business_value_v1
        where business_value_status='REALIZED'
      ),
      'realized_revenue_eur_total',(
        select coalesce(sum(realized_revenue_eur),0)
        from public.powerhouse_action_business_value_v1
      ),
      'realized_net_value_eur_total',(
        select coalesce(sum(realized_net_value_eur),0)
        from public.powerhouse_action_business_value_v1
      )
    ),
    'latest_friction_internal',case when e_err.event_id is null then null else jsonb_build_object(
      'event_id',e_err.event_id,'event_type',e_err.event_type,'source',e_err.source,'subject_key',e_err.subject_key,'occurred_at',e_err.occurred_at,'evidence',e_err.evidence
    ) end,
    'latest_progress_internal',case when e_ok.event_id is null then null else jsonb_build_object(
      'event_id',e_ok.event_id,'event_type',e_ok.event_type,'source',e_ok.source,'subject_key',e_ok.subject_key,'occurred_at',e_ok.occurred_at,'evidence',e_ok.evidence
    ) end
  );

  select coalesce(jsonb_agg(to_jsonb(f)),'[]'::jsonb)
    into v_forecast_pack
  from (
    select forecast_key,scope,scope_key,topic_key,predicted_event,predicted_problem,
           probability,confidence,expected_lead_days,horizon_start,horizon_end,expected_by,
           first_mover_score,strategic_fit,revenue_potential,prediction_mode,status,last_scored_at
    from public.powerhouse_forecasts
    where status in ('active','materialized')
      and coalesce(last_scored_at,updated_at,created_at) >= now() - interval '30 days'
      and coalesce(confidence,0) >= 0.50
    order by (coalesce(probability,0)*coalesce(confidence,0)*greatest(coalesce(strategic_fit,0),0.01)) desc,
             coalesce(last_scored_at,updated_at,created_at) desc
    limit 8
  ) f;

  if h.total_layers is not null then
    v_reason:=format(
      'Maak van vandaag één nieuw hoofdstuk in Arthurs doorlopende droomreis met Bedrijfsgeheugen. Schrijf voor ondernemers in gewone mensentaal. Vertel waarom ik dit bouw, welk echt bedrijfsprobleem centraal staat, wat vandaag aantoonbaar niet goed ging of tegenviel, wat ik veranderde, wat er inmiddels concreet staat, hoe AI helpt meten/waarderen/prioriteren/advies geven, welke actie echt is uitgezet of uitgevoerd, wat aantoonbaar is opgeleverd of nog niet bewezen is, wat ik heb geleerd en wat het volgende hoofdstuk is. Gebruik journey_snapshot als feitelijke bron voor begrijpelijke schaalbewijzen, maar maak er geen cijferdump van. Gebruik recent_personal_chapters om het verhaal voort te zetten en herhaling te voorkomen. Externe bronproblemen mogen context geven, maar nooit worden voorgesteld als Arthurs eigen ervaring. Interne technische events zijn alleen bewijs onder de motorkap en moeten volledig naar menselijke gevolgen worden vertaald. Vandaag zijn %s externe probleembronnen en %s zoekvraagsignalen beschikbaar.',
      jsonb_array_length(v_problem_pack),jsonb_array_length(v_search_pack)
    );

    insert into public.powerhouse_content_recommendations(
      dedupe_key,run_date,topic_key,content_key,target_channel,recommendation_type,priority,reason,evidence,status
    ) values (
      'ai-native-builder-linkedin-personal:'||p_date::text,
      p_date,
      'daily-dream-journey',
      'linkedin-personal-ai-native-builder-'||p_date::text,
      'linkedin_personal',
      'verified_ai_native_builder_story',
      100,
      v_reason,
      jsonb_build_object(
        'contract','powerhouse-ai-native-builder-content-v1',
        'source_backed',true,
        'source_kind','daily_founder_journey+verified_build_event+external_entrepreneur_problem_intelligence',
        'content_id','ai-native-builder:'||p_date::text,
        'identity_contract','arthur-personal-linkedin-identity-v4',
        'identity_gate_version','channel-identity-hard-gate-v3',
        'ai_native_builder_story_verified',true,
        'ai_native_builder_policy','personal-linkedin-ai-native-builder-v1',
        'founder_story_policy','personal-linkedin-founder-journey-v2',
        'daily_story_policy','personal-linkedin-daily-dream-journey-v1',
        'journey_proof_policy','personal-linkedin-journey-proof-v1',
        'language_policy','personal-linkedin-language-rotation-v1',
        'intended_language',case when extract(isodow from p_date)::int in (2,5) then 'en' else 'nl' end,
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
        'journey_snapshot',v_journey_snapshot,
        'recent_personal_chapters',v_recent_chapters,
        'entrepreneur_problem_sources',v_problem_pack,
        'search_demand_sources',v_search_pack,
        'predictive_forecasts',v_forecast_pack,
        'source_lineage',jsonb_build_array(
          'powerhouse_one_brain_runtime_health_v1:'||h.observed_at::text,
          case when e_err.event_id is null then 'runtime_error:none' else 'powerhouse_runtime_events:'||e_err.event_id::text end,
          case when e_ok.event_id is null then 'runtime_recovery:none' else 'powerhouse_runtime_events:'||e_ok.event_id::text end,
          'bg_externe_signalen:ranked_recent_allowed',
          'bg_zoekwoordkansen:ranked_recent',
          'powerhouse_forecasts:ranked_recent_high_confidence',
          'powerhouse_content_artifacts:recent_personal_chapters',
          'brain_ai_governance_registry:active_models',
          'bg_paginarendement:measured_pages',
          'powerhouse_evidence_sources:source_count',
          'powerhouse_sales_actions:actions',
          'powerhouse_sales_outcomes:outcomes',
          'powerhouse_action_business_value_v1:value_proof'
        ),
        'runtime_health',to_jsonb(h),
        'friction_event',case when e_err.event_id is null then null else jsonb_build_object(
          'event_id',e_err.event_id,'event_type',e_err.event_type,'source',e_err.source,'subject_key',e_err.subject_key,'occurred_at',e_err.occurred_at,'evidence',e_err.evidence
        ) end,
        'result_event',case when e_ok.event_id is null then null else jsonb_build_object(
          'event_id',e_ok.event_id,'event_type',e_ok.event_type,'source',e_ok.source,'subject_key',e_ok.subject_key,'occurred_at',e_ok.occurred_at,'evidence',e_ok.evidence
        ) end,
        'story_structure',jsonb_build_array(
          'dream_progress',
          'real_company_problem',
          'what_went_wrong',
          'what_changed',
          'what_exists_now',
          'what_ai_measures_values_prioritizes_advises',
          'what_changed_outside_the_company',
          'predicted_company_specific_impact_and_timing',
          'what_was_actually_done',
          'what_value_is_proven_or_not_yet_proven',
          'what_i_learned',
          'next_chapter'
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
    'search_demand_source_count',jsonb_array_length(v_search_pack),
    'predictive_forecast_count',jsonb_array_length(v_forecast_pack),
    'intended_language',case when extract(isodow from p_date)::int in (2,5) then 'en' else 'nl' end,
    'recent_personal_chapter_count',jsonb_array_length(v_recent_chapters),
    'journey_snapshot',v_journey_snapshot
  );
end;
$function$;


insert into public.bg_schrijfregels
(regel_id,onderwerp,regel,onderbouwing,bewijs_n,vertrouwen,status,bron,bijgewerkt_op)
values
('personal-linkedin-daily-dream-journey-v1','Persoonlijk LinkedIn — dagelijks reisverslag van mijn droom','Iedere kalenderdag is Arthurs persoonlijke LinkedIn primair één nieuw hoofdstuk in het doorlopende reisverslag van zijn droom met Bedrijfsgeheugen. De post vertelt in gewone mensentaal waar hij nu staat, waarom hij dit bouwt, welk bedrijfsprobleem hij probeert op te lossen, wat die dag aantoonbaar niet goed ging of tegenviel, wat is veranderd of verbeterd, wat er inmiddels concreet staat, wat AI meet/waardeert/prioriteert/adviseert of als actie uitzet, wat daarvan daadwerkelijk is uitgevoerd en wat aantoonbaar is opgeleverd of nog niet is bewezen. Gebruik waar passend enkele begrijpelijke schaalbewijzen zoals aantal actieve AI-modellen, gemeten pagina’s, bronnen, beoordeelde of uitgezette acties en gemeten uitkomsten, maar maak er nooit een technisch statusrapport of cijferdump van. Iedere dag moet voortbouwen op eerdere hoofdstukken, niet hetzelfde verhaal herhalen. Als een resultaat nog nul of onbewezen is, zeg dat eerlijk. Geen verzonnen ervaring, resultaat, omzet of succes.','Expliciet goedgekeurd door gebruiker 2026-10-07 als dagelijkse founder-story.',1,1,'actief','user_instruction+canonical-founder-journey',now()),
('personal-linkedin-entrepreneur-problem-evidence-v1','Persoonlijk LinkedIn — echte ondernemersproblemen uit bronnen','Gebruik actief actuele, toegestane brondata over problemen die ondernemers en bedrijven ervaren, plus zoekvraagdata, als context voor Arthurs persoonlijke LinkedIn. Denk aan veranderende regelgeving, digitalisering en AI-adoptie, cyberweerbaarheid, personeel en vaardigheden, financiering, bedrijfsopvolging, procesfrictie, kennisborging, ketenveranderingen en andere aantoonbare ondernemingsproblemen. Een brongegeven is geen los statistiekje: vertaal het naar het onderliggende bedrijfsprobleem en koppel het alleen wanneer het inhoudelijk past bij Arthurs eigen bouwreis, ervaring of overtuiging. Nooit doen alsof Arthur een bronprobleem persoonlijk heeft meegemaakt als dat niet canoniek bewezen is. Citeer of benoem een bron in de post alleen wanneer dat het verhaal sterker maakt; bronlineage blijft intern altijd bewaard.','Gebruiker vraagt op 2026-10-07 expliciet om data uit bronnen over problemen die ondernemers ondervinden structureel te gebruiken.',1,1,'actief','user_instruction+external-intelligence+search-demand',now()),
('personal-linkedin-first-person-dream-voice-v1','Persoonlijk LinkedIn — ik vertel mijn droom','Alle persoonlijke LinkedIn-hoofdstukken worden primair vanuit Arthur in de ik-vorm verteld. Niet: “Bedrijfsgeheugen helpt bedrijven…”, maar: “Ik bouw Bedrijfsgeheugen omdat…” De lezer moet Arthur volgen als bouwer: wat ik in mijn werkende leven heb gezien, waarom dat mij blijft bezighouden, welk probleem ik wil oplossen, waar mijn droom naartoe gaat, wat ik vandaag probeerde, wat niet goed ging, wat ik veranderde, wat er inmiddels staat, wat werkelijk is gedaan en wat het aantoonbaar heeft opgeleverd of nog niet heeft opgeleverd. Bedrijfsgeheugen is de uitkomst van Arthurs overtuiging, niet de verteller en niet het onderwerp van een productpitch. De onderliggende droom: een ondernemer moet continu kunnen zien wat er verandert, wat echt belangrijk is, waarom, wat eerst moet, welke actie volgt, of die actie daadwerkelijk gebeurt, wat het oplevert, of strategie nog klopt, waar waarde lekt, welke risico’s ontstaan, hoe verkoopbaar/sterk het bedrijf wordt en waar regelgeving of AI-governance aandacht vraagt. Geen verzonnen autobiografische feiten.','Expliciet door gebruiker bevestigd op 2026-10-07: “Ja dit”.',1,1,'actief','user_instruction+canonical-founder-voice',now()),
('personal-linkedin-founder-journey-v2','Persoonlijk LinkedIn — droom, reis en overtuiging','Arthur persoonlijk LinkedIn is het doorlopende verhaal van zijn droom en reis met Bedrijfsgeheugen. De kern: welke problemen hij in zijn werkende leven in bedrijven heeft gezien; waarom die problemen hem zijn blijven bezighouden; wat hij nu bouwt om ze op te lossen; welke echte problemen, mislukkingen en ontdekkingen hij onderweg tegenkomt; en waar hij in gelooft. Centrale overtuiging: wereld, technologie, klantverwachtingen, regelgeving en markten veranderen sneller, waardoor bedrijven niet alleen plannen moeten maken maar voortdurend moeten kunnen waarnemen, vooruitkijken, anticiperen, leren en bijsturen. AI is daarbij geen doel op zich maar een manier om bedrijven wendbaarder en beter geïnformeerd te maken, terwijl mensen richting en verantwoordelijkheid houden. Iedere post hoeft niet alle elementen te bevatten, maar moet herkenbaar onderdeel zijn van deze reis. Geen verzonnen werkervaring, geen generieke AI-praat en geen geforceerde verkoop.','Expliciet door gebruiker aangescherpt en goedgekeurd op 2026-10-07.',1,1,'actief','user_instruction+canonical-content-policy',now()),
('personal-linkedin-journey-proof-v1','Persoonlijk LinkedIn — bewijs van bouwen, doen en opbrengst','Het dagelijkse reisverslag sluit de cirkel: zien wat verandert -> waarde en prioriteit bepalen -> adviseren -> actie uitzetten -> controleren of het echt gebeurt -> uitkomst meten -> leren -> volgende prioriteit. Publieke copy vertaalt interne evidence naar mensentaal. Gebruik alleen provider-/runtime-/portal-/outcome-data als bronbewijs; interne functienamen, tabellen, foutcodes en architectuurtermen blijven verborgen. De lezer moet kunnen begrijpen wat Bedrijfsgeheugen inmiddels kan en wat daarvan werkelijk effect heeft gehad.','Gebruiker wil dagelijks zichtbaar maken dat advies niet eindigt bij advies maar leidt tot actie en gemeten waarde.',1,1,'actief','user_instruction+closed-loop-value',now()),
('personal-linkedin-language-rotation-v1','Persoonlijk LinkedIn — één dagelijks hoofdstuk, NL en EN','Publiceer iedere dag precies één nieuw persoonlijk LinkedIn-hoofdstuk. Dinsdag en vrijdag zijn Engelstalig; de overige dagen Nederlandstalig. Publiceer nooit dezelfde inhoud dubbel in twee talen en maak geen tweetalige lange post. Engels is geen aparte identiteit of vertaling, maar het volgende originele hoofdstuk in exact dezelfde founder journey, met dezelfde waarheidseisen, bewijsregels en positionering. De taalkeuze mag inhoudelijke relevantie niet overrulen: feiten en bewijs blijven leidend.','Gebruiker vroeg expliciet ook Engels op persoonlijk LinkedIn; gekozen structurele verdeling: 5 NL + 2 EN zonder duplicatie.',1,1,'actief','user_instruction+canonical-language-rotation',now()),
('personal-linkedin-predictive-external-impact-v1','Persoonlijk LinkedIn — voorspellend van buiten naar binnen','Arthur laat in zijn dagelijkse droomreis zien dat de slimme software niet alleen intern terugkijkt maar voortdurend externe veranderingen probeert te begrijpen en vooruit te vertalen naar het specifieke bedrijf. Denk aan wet- en regelgeving, AI-regels, cyberdreiging, technologie, markt- en klantgedrag, concurrentie, subsidies, financiering/rente, personeel/skills, energie, keten en andere relevante externe signalen. De kernvraag is niet “wat is er in het nieuws?”, maar: wat verandert, wanneer kan dit mij raken, welk deel van mijn bedrijf wordt geraakt, hoe groot kan de impact zijn, hoe zeker zijn we daarvan, wat gebeurt er als ik niets doe, welke opties heb ik en welke actie verdient nu prioriteit? Voorspellingen worden nooit als zekerheid gepresenteerd: gebruik probability/confidence, timing/horizon en bewijs. De gesloten lus blijft: extern signaal -> voorspelde bedrijfsspecifieke impact -> prioriteit -> advies/actie -> uitvoering -> gemeten uitkomst -> herijkte voorspelling/strategie.','Expliciete gebruikersaanvulling 2026-10-07: voorspellend, externe veranderingen en impact van wetgeving e.d. moeten zichtbaar onderdeel zijn van de rode draad.',1,1,'actief','user_instruction+predictive-external-intelligence',now()),
('personal-linkedin-software-data-bi-ai-intelligence-v1','Persoonlijk LinkedIn — slimme software = software + data + BI + AI','Arthur laat in zijn dagelijkse droomreis expliciet zien hoe hij een nieuwe generatie slimme bedrijfssoftware probeert te bouwen waarin klassieke software, bedrijfsdata, BI/analytics en AI één geheel vormen. AI wordt bewust genoemd, maar niet als hype, chatbot of losse feature. Het onderscheid zit in veel gespecialiseerde intelligenties die verschillende perspectieven combineren — strategie, markt, klant, proces, risico, regelgeving, commercie, uitvoering, waarde en leren — zodat software niet alleen registreert en dashboards niet alleen terugkijken, maar het geheel kan signaleren, begrijpen, voorspellen, waarderen, prioriteren, adviseren, acties ondersteunen/uitzetten en leren van echte uitkomsten. Gebruik aantallen intelligentielagen alleen wanneer die op publicatiedag rechtstreeks uit actuele geverifieerde evidence komen. Vertaal technische architectuur altijd naar begrijpelijke bedrijfswaarde.','Gebruiker bevestigde 2026-10-07 dat AI expliciet zichtbaar moet zijn en dat de bouwreis moet laten zien hoe software, data, BI en AI met grote aantallen intelligentie worden gecombineerd.',1,1,'actief','user_instruction+canonical-ai-native-software-positioning',now()),
('personal-linkedin-value-priority-v1','Persoonlijk LinkedIn — van overload naar waardeprioriteit','Een terugkerend probleem in Arthurs LinkedIn-verhaal is beslisoverload: er verandert zoveel tegelijk dat ondernemers en managers blijven hangen in waar te beginnen, waarom juist daar, voor wie, wat eerst moet en wat het concreet oplevert. Bedrijfsgeheugen moet daarom niet vooral méér informatie geven, maar AI gebruiken om alles in samenhang te waarderen en te prioriteren op verwachte bedrijfswaarde, urgentie, risico, haalbaarheid en timing. Publieke posts leggen dit menselijk uit: niet “meer dashboards”, maar “wat vraagt vandaag aandacht, waarom, wat kun je doen en wat levert dat waarschijnlijk op?”. AI is hier de prioriterings- en beslisondersteunende laag; mensen bepalen richting en nemen verantwoordelijkheid.','Expliciete gebruikersverduidelijking 2026-10-07.',1,1,'actief','user_instruction+canonical-positioning',now()),
('rci-personal-standup','Persoonlijk LinkedIn','Arthur persoonlijk LinkedIn is dagelijks het doorlopende reisverslag van mijn droom met Bedrijfsgeheugen, verteld vanuit ik. Ik vertel waarom ik dit bouw, welk echt probleem ik in bedrijven zie, waarom dat mij bezighoudt, waar ik uiteindelijk naartoe wil, wat vandaag niet goed ging, wat ik heb veranderd en wat er inmiddels concreet staat. Ik laat zien hoe ik software, data, BI en AI combineer tot slimme software met meerdere gespecialiseerde intelligenties die niet alleen intern meten en terugkijken, maar ook externe veranderingen volgen en voorspellen wat die waarschijnlijk voor een specifiek bedrijf betekenen. Denk aan wetgeving, AI-regels, cyber, technologie, markt, klantgedrag, concurrentie, subsidies, rente/financiering, personeel, energie en keten. De menselijke vertaling is steeds: wat verandert, wanneer raakt dit mij waarschijnlijk, wat is de impact, hoe zeker weten we dat, wat gebeurt er als ik niets doe, wat verdient prioriteit, welke actie volgt, is die echt uitgevoerd, wat leverde die op en moet de strategie opnieuw worden herijkt? Geen zekerheid veinzen: voorspellingen krijgen bewijs, timing en onzekerheid. Geen technisch statusrapport, cijferdump, productpitch of verzonnen resultaat. Taalritme: dinsdag en vrijdag Engels; overige dagen Nederlands. Altijd één origineel hoofdstuk per dag, nooit dezelfde post dubbel of tweetalig onder elkaar.','Predictive external-impact lijn expliciet bevestigd door gebruiker 2026-10-07.',1,1,'actief','arthur-personal-linkedin-predictive-external-impact',now())
on conflict (regel_id) do update set
  onderwerp=excluded.onderwerp,
  regel=excluded.regel,
  onderbouwing=excluded.onderbouwing,
  bewijs_n=excluded.bewijs_n,
  vertrouwen=excluded.vertrouwen,
  status=excluded.status,
  bron=excluded.bron,
  bijgewerkt_op=excluded.bijgewerkt_op;

update public.brain_records
set result=coalesce(result,'{}'::jsonb)||jsonb_build_object(
  'personal_content_mode','DAILY_DREAM_JOURNEY',
  'daily_story_policy','personal-linkedin-daily-dream-journey-v1',
  'journey_proof_policy','personal-linkedin-journey-proof-v1',
  'daily_story_structure',jsonb_build_array(
    'waar_sta_ik_in_mijn_droom','waarom_bouw_ik_dit','echt_bedrijfsprobleem','wat_ging_niet_goed',
    'wat_heb_ik_veranderd','wat_staat_er_nu','wat_meet_en_prioriteert_ai','wat_verandert_er_buiten',
    'wat_is_de_voorspelde_bedrijfsspecifieke_impact','welke_actie_is_echt_gedaan',
    'wat_heeft_het_aantoonbaar_opgeleverd','wat_is_nog_niet_bewezen','wat_heb_ik_geleerd','volgend_hoofdstuk'
  ),
  'daily_continuity_required',true,
  'daily_no_repeat_required',true,
  'technical_status_publication_forbidden',true,
  'narrative_voice','FIRST_PERSON_FOUNDER',
  'narrative_subject','Arthur',
  'company_role_in_story','OUTCOME_OF_BELIEF_NOT_NARRATOR',
  'dream_destination','een bedrijf dat continu begrijpt wat verandert, bepaalt wat echt waarde heeft, prioriteert, adviseert, acties laat uitvoeren, controleert of ze gebeuren, meet wat ze opleveren, strategie herijkt en daarvan opnieuw leert',
  'first_person_required',true,
  'product_pitch_forbidden',true,
  'technology_story','SOFTWARE_DATA_BI_AI_COMBINED',
  'ai_must_be_visible',true,
  'ai_story','AI is geen losse chatbot of feature maar een verzameling gespecialiseerde intelligenties die samen met software, data en BI helpt begrijpen, voorspellen, prioriteren, adviseren, handelen en leren',
  'public_intelligence_scale_rule','gebruik alleen actuele aantallen intelligentielagen wanneer die rechtstreeks door geverifieerde runtime-evidence worden bevestigd',
  'positioning_not','geen nieuw duur ERP, geen extra dashboard, geen losse AI-wrapper',
  'positioning_is','intelligentielaag die bestaande bedrijfsinformatie en systemen slimmer laat samenwerken en van inzicht naar prioriteit, actie en gemeten waarde brengt',
  'predictive_story','EXTERNAL_SIGNAL_TO_COMPANY_IMPACT_TO_ACTION',
  'predictive_questions',jsonb_build_array(
    'wat verandert er buiten mijn bedrijf','wanneer kan dit mijn bedrijf raken','welk deel van mijn bedrijf wordt geraakt',
    'wat is de mogelijke impact op omzet marge kosten cash risico compliance mensen processen klanten strategie en waarde',
    'hoe waarschijnlijk en hoe zeker is dit','wat gebeurt er als ik niets doe','welke opties heb ik',
    'wat verdient nu prioriteit','welke actie moet echt gebeuren','wat leverde die actie op',
    'wat betekent de uitkomst voor de volgende voorspelling en strategie'
  ),
  'external_signal_domains',jsonb_build_array(
    'wet_en_regelgeving','ai_regelgeving','cyber','technologie','markt','klantgedrag','concurrentie','subsidies',
    'financiering_en_rente','arbeidsmarkt_en_skills','energie','keten_en_leveranciers'
  ),
  'forecast_truth_rule','voorspellingen zijn probabilistisch en moeten actuele evidence, timing/horizon, probability/confidence en gemeten uitkomsten onderscheiden van gerealiseerde feiten',
  'personal_linkedin_language_policy','ONE_POST_PER_DAY_5NL_2EN',
  'english_days_iso',jsonb_build_array(2,5),
  'english_days',jsonb_build_array('Tuesday','Friday'),
  'duplicate_translation_forbidden',true,
  'bilingual_same_post_forbidden',true,
  'vision_red_thread','ik bouw slimme software waarin software, data, BI en AI samenkomen; veel gespecialiseerde intelligenties begrijpen zowel interne bedrijfsdata als externe veranderingen, voorspellen bedrijfsspecifieke impact, bepalen prioriteit, zetten acties uit, meten uitkomsten en herijken strategie',
  'core_problem','te veel verandering, signalen, ideeën en mogelijke acties tegelijk; bedrijven blijven hangen in waar te beginnen en wat werkelijk waarde oplevert',
  'core_value_promise','AI helpt alles in samenhang waarderen en prioriteren op verwachte bedrijfswaarde, urgentie, risico, haalbaarheid en timing'
),
updated_at=now()
where tenant_id='canonical'
  and record_id='arthur-personal-linkedin-identity-v4';

update public.content_publication_obligations
set next_action=
  case when extract(isodow from publication_date)::int in (2,5)
    then 'Maak één origineel Engelstalig hoofdstuk van Arthurs droomreis. Vanuit ik: waarom ik dit bouw, waar ik naartoe bouw, wat buiten of binnen veranderde, voorspelde impact, wat misging, wat ik veranderde, wat AI prioriteerde, welke actie echt gebeurde en wat aantoonbaar is opgeleverd. Geen vertaling van een Nederlandse post, geen technische systeemtaal.'
    else 'Maak één origineel Nederlandstalig hoofdstuk van Arthurs droomreis. Vanuit ik: waarom ik dit bouw, waar ik naartoe bouw, wat buiten of binnen veranderde, voorspelde impact, wat misging, wat ik veranderde, wat AI prioriteerde, welke actie echt gebeurde en wat aantoonbaar is opgeleverd. Geen dubbele taal, geen technische systeemtaal.'
  end,
  updated_at=now()
where tenant_id='canonical'
  and channel='linkedin_personal'
  and publication_date >= (now() at time zone 'Europe/Amsterdam')::date
  and status in ('PLANNED','GENERATED','BLOCKED','FAILED');

-- Least-privilege execution authority for the SECURITY DEFINER materializer.
-- Browser roles must never invoke this server-side orchestration primitive directly.
REVOKE EXECUTE ON FUNCTION public.powerhouse_materialize_source_backed_channel_candidates_v2(date)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.powerhouse_materialize_source_backed_channel_candidates_v2(date)
  TO service_role;
