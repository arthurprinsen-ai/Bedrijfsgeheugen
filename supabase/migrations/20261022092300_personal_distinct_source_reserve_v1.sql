-- Existing ONE BRAIN source-backed recommendation store: no new scheduler or sender.
-- A verified daily founder/source event may yield up to 3 distinct, factual angles.
-- Candidate preparation never overrides external provider/uniqueness/identity proof.
create or replace function public.powerhouse_seed_verified_personal_reserve_v1(p_date date)
returns jsonb
language plpgsql
security invoker
set search_path to 'pg_catalog'
as $fn$
declare
  base_source public.powerhouse_content_recommendations%rowtype;
  event_row record;
  inserted_count integer := 0;
  affected_rows integer := 0;
  scoped_count integer := 0;
begin
  -- Never invent a founder story when no independently eligible base source exists.
  select * into base_source
  from public.powerhouse_content_recommendations
  where run_date=p_date
    and target_channel='linkedin_personal'
    and status in ('suggested','accepted')
    and evidence->>'ai_native_builder_story_verified'='true'
    and evidence->>'ai_native_builder_policy'='personal-linkedin-ai-native-builder-v1'
    and evidence->>'arthur_anchor_verified'='true'
    and evidence->>'build_event_verified'='true'
    and evidence->>'source_backed'='true'
    and evidence->>'identity_contract'='arthur-personal-linkedin-identity-v4'
    and evidence->>'identity_gate_version'='channel-identity-hard-gate-v3'
  order by priority desc,created_at asc
  limit 1;
  if not found then
    return jsonb_build_object('ok',true,'run_date',p_date,
      'status','NO_VERIFIED_BASE_SOURCE','created',0);
  end if;

  -- One latest genuine event per distinct business-relevant source family.
  -- An event is a factual observation, NOT proof of a customer win, a sent
  -- message or a personal anecdote. Final copy passes independent review.
  for event_row in
    select distinct on (event_type)
      event_id,event_type,source,state,occurred_at,
      case event_type
        when 'external_intelligence_universe_refresh'
          then 'wat nieuwe externe signalen een ondernemer kunnen laten heroverwegen'
        when 'commercial_learning_cycle'
          then 'wat werkelijk is geleerd over het beoordelen van commerciële acties'
        when 'source_health_evaluated'
          then 'waarom controleerbare en actuele bedrijfsinformatie belangrijk is'
      end as topic_angle
    from public.powerhouse_runtime_events
    where (occurred_at at time zone 'Europe/Amsterdam')::date=p_date
      and source like 'powerhouse%'
      and event_type in (
        'external_intelligence_universe_refresh',
        'commercial_learning_cycle',
        'source_health_evaluated')
      and event_id is not null
      and state in ('observed','actioned')
      and evidence is not null
      and jsonb_typeof(evidence)='object'
      and evidence <> '{}'::jsonb
    order by event_type,occurred_at desc,event_id
  loop
    if scoped_count >= 3 then exit; end if;
    scoped_count := scoped_count + 1;
    insert into public.powerhouse_content_recommendations
      (dedupe_key,run_date,topic_key,content_key,target_channel,
       recommendation_type,priority,reason,evidence,status)
    values (
      'founder-proof-reserve:'||p_date::text||':'||event_row.event_type,
      p_date,
      'founder-verified:'||event_row.event_type,
      'linkedin-personal-source-reserve:'||p_date::text||':'||event_row.event_type,
      'linkedin_personal',
      'verified_ai_native_builder_story',
      100-scoped_count,
      'Maak een inhoudelijk ander, brongebonden hoofdstuk over '||event_row.topic_angle||
        '. Bewijsanker: waargenomen '||event_row.event_type||' van '||
        event_row.occurred_at::text||
        '. Noem uitsluitend wat de bron aantoont; niet dat een klant resultaat had, '||
        'een e-mail is verstuurd of Arthur persoonlijk iets deed zonder bewijs. '||
        'Herhaal niet de tekst of verhaalstructuur van het afgekeurde hoofdstuk '||
        'en verzin geen ervaringen.',
      base_source.evidence || jsonb_build_object(
        'content_id','ai-native-builder:'||p_date::text||':'||event_row.event_type||
          ':'||event_row.event_id::text,
        'source_kind','verified_daily_founder_build_event+distinct_runtime_evidence',
        'source_lineage',coalesce(base_source.evidence->'source_lineage','[]'::jsonb)||
          jsonb_build_array('powerhouse_runtime_events:'||event_row.event_id::text),
        'personal_story_focus',event_row.topic_angle,
        'source_family_event',jsonb_build_object(
          'event_id',event_row.event_id,
          'event_type',event_row.event_type,
          'source',event_row.source,
          'state',event_row.state,
          'occurred_at',event_row.occurred_at),
        'source_family_verification','RECORDED_RUNTIME_EVENT_NOT_PERSONAL_EXPERIENCE',
        'provider_outcome_unproven',true),
      'suggested'
    )
    on conflict (dedupe_key) do nothing;
    get diagnostics affected_rows = row_count;
    inserted_count := inserted_count + affected_rows;
  end loop;
  return jsonb_build_object(
    'ok',true,'run_date',p_date,'status','EVIDENCE_BASED_RESERVE',
    'eligible_event_families',scoped_count,'created',inserted_count);
end;
$fn$;

revoke execute on function public.powerhouse_seed_verified_personal_reserve_v1(date)
  from public,anon,authenticated;
grant execute on function public.powerhouse_seed_verified_personal_reserve_v1(date)
  to service_role;
