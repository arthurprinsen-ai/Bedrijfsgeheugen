-- Mira human-problem source loop v1
create or replace function public.powerhouse_materialize_instagram_mira_source_candidates_v1(p_date date)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $function$
declare
  v_count integer := 0;
  r record;
  v_priority numeric;
  v_recency numeric;
  v_dedupe text;
  v_existing uuid;
begin
  if p_date is null then raise exception 'RUN_DATE_REQUIRED'; end if;

  for r in
    select *
    from public.instagram_growth_research_sources s
    where s.status in ('active','candidate')
      and coalesce((s.metadata->>'mira_human_problem')::boolean,false) is true
      and s.fetched_at >= now() - interval '7 days'
      and coalesce(s.evidence_summary,'') <> ''
    order by
      coalesce((s.metadata->>'complaint_intensity')::numeric,0.5) desc,
      s.relevance desc,
      s.confidence desc,
      s.fetched_at desc
    limit 24
  loop
    v_recency := greatest(0, least(1, 1 - (extract(epoch from (now()-r.fetched_at))/86400.0)/7.0));
    v_priority := round(least(100,
      45
      + 20*coalesce(r.relevance,0.5)
      + 15*coalesce(r.confidence,0.5)
      + 10*v_recency
      + 10*coalesce((r.metadata->>'complaint_intensity')::numeric,0.5)
    ));
    v_dedupe := 'mira-human-problem:'||p_date::text||':'||md5(r.source_url);

    insert into public.powerhouse_content_recommendations(
      dedupe_key,run_date,topic_key,content_key,target_channel,recommendation_type,
      priority,reason,evidence,status,created_at,updated_at
    ) values (
      v_dedupe,
      p_date,
      coalesce(nullif(r.topic,''),'human-friction'),
      'instagram-mira-'||p_date::text||'-'||substr(md5(r.source_url),1,10),
      'instagram_company',
      'mira_human_problem_signal',
      v_priority,
      left(coalesce(r.source_title,'')||' — '||coalesce(r.evidence_summary,''),1200),
      jsonb_build_object(
        'character','Mira',
        'character_mode','daily_life',
        'contentPersona','mira',
        'contentClass','mira_daily_life',
        'format','reel',
        'reel_generator','OpenArt',
        'production_route','openart_video',
        'instagram_native',true,
        'forced_business_bridge_forbidden',true,
        'office_problem_attribution_forbidden',true,
        'mira_human_problem_signal',true,
        'source_backed',true,
        'source_lineage',jsonb_build_array(r.source_url),
        'source_url',r.source_url,
        'source_domain',r.domain,
        'source_title',r.source_title,
        'source_type',r.source_type,
        'source_fetched_at',r.fetched_at,
        'source_published_at',r.published_at,
        'source_relevance',r.relevance,
        'source_confidence',r.confidence,
        'complaint_intensity',coalesce((r.metadata->>'complaint_intensity')::numeric,0.5),
        'human_problem_excerpt',left(coalesce(r.evidence_summary,''),700),
        'topic_source',r.topic,
        'research_rule','mira-human-problem-source-loop-v1',
        'selection_dimensions',jsonb_build_array('freshness','recognition','emotional_friction','shareability','originality','mira_fit','evidence_strength'),
        'measurement',jsonb_build_array('watch_time','completion','shares','saves','comments','profile_visits','follows','dms')
      ),
      'suggested',now(),now()
    )
    on conflict (dedupe_key) do update set
      priority=excluded.priority,
      reason=excluded.reason,
      evidence=excluded.evidence,
      updated_at=now()
    returning recommendation_id into v_existing;

    update public.instagram_growth_research_sources
       set used_in_rule_ids = (
         select array(select distinct x from unnest(coalesce(used_in_rule_ids,'{}'::text[]) || array['mira-human-problem-source-loop-v1']) x)
       )
     where source_url=r.source_url;
    v_count := v_count + 1;
  end loop;

  return jsonb_build_object(
    'ok',true,
    'run_date',p_date,
    'materialized',v_count,
    'contract','mira-human-problem-source-loop-v1'
  );
end
$function$;

revoke execute on function public.powerhouse_materialize_instagram_mira_source_candidates_v1(date) from public, anon, authenticated;
grant execute on function public.powerhouse_materialize_instagram_mira_source_candidates_v1(date) to service_role;

create or replace function public.powerhouse_select_instagram_daily_winner_v1(p_date date)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $function$
declare
  v_existing public.powerhouse_instagram_daily_winners_v1%rowtype;
  v_rec public.powerhouse_content_recommendations%rowtype;
  v_format text;
  v_score_version text := 'instagram-mira-source-backed-score-v2';
begin
  if p_date is null then raise exception 'PUBLICATION_DATE_REQUIRED'; end if;

  select * into v_existing
  from public.powerhouse_instagram_daily_winners_v1
  where run_date=p_date
  for update;

  if found then
    return jsonb_build_object(
      'selected',true,'immutable_reuse',true,'run_date',v_existing.run_date,
      'recommendation_id',v_existing.recommendation_id,'score_version',v_existing.score_version,
      'format',v_existing.selected_format,'selected_priority',v_existing.selected_priority
    );
  end if;

  perform public.powerhouse_materialize_instagram_mira_source_candidates_v1(p_date);

  select * into v_rec
  from public.powerhouse_content_recommendations r
  where r.run_date=p_date
    and r.target_channel in ('instagram','instagram_company')
    and r.status in ('suggested','accepted')
    and r.recommendation_type='mira_human_problem_signal'
    and lower(coalesce(r.evidence->>'character',''))='mira'
    and lower(coalesce(r.evidence->>'character_mode','daily_life'))='daily_life'
    and coalesce((r.evidence->>'mira_human_problem_signal')::boolean,false)=true
    and coalesce((r.evidence->>'source_backed')::boolean,false)=true
    and jsonb_typeof(r.evidence->'source_lineage')='array'
    and jsonb_array_length(r.evidence->'source_lineage')>0
    and coalesce((r.evidence->>'forced_business_bridge_forbidden')::boolean,true)=true
    and lower(coalesce(r.evidence->>'format','')) in ('reel','image','visual')
    and (
      lower(coalesce(r.evidence->>'format','')) not in ('reel','video')
      or (
        lower(coalesce(r.evidence->>'reel_generator',''))='openart'
        and lower(coalesce(r.evidence->>'production_route','')) like '%openart%'
      )
    )
  order by
    r.priority desc,
    coalesce((r.evidence->>'complaint_intensity')::numeric,0) desc,
    r.updated_at desc,
    r.recommendation_id
  limit 1
  for update;

  if not found then
    return jsonb_build_object(
      'selected',false,
      'reason','NO_FRESH_SOURCE_BACKED_MIRA_HUMAN_PROBLEM',
      'run_date',p_date,
      'contract','mira-human-problem-source-loop-v1'
    );
  end if;

  v_format:=case lower(coalesce(v_rec.evidence->>'format',''))
    when 'reel' then 'reel'
    else 'image'
  end;

  insert into public.powerhouse_instagram_daily_winners_v1(
    run_date,recommendation_id,score_version,selected_priority,selected_format,selector_evidence
  ) values (
    p_date,v_rec.recommendation_id,v_score_version,v_rec.priority,v_format,
    jsonb_build_object(
      'contract','mira-human-problem-source-loop-v1',
      'selection_phase','EX_ANTE_BEFORE_MEDIA_AND_PUBLICATION',
      'topic_key',v_rec.topic_key,
      'content_key',v_rec.content_key,
      'recommendation_type',v_rec.recommendation_type,
      'reason',v_rec.reason,
      'ranking','priority_then_complaint_intensity_then_freshness',
      'mira_persona',true,
      'daily_life',true,
      'source_backed',true,
      'source_lineage',v_rec.evidence->'source_lineage',
      'selected_evidence',v_rec.evidence
    )
  );

  update public.powerhouse_content_recommendations
     set status='accepted',
         evidence=coalesce(evidence,'{}'::jsonb) || jsonb_build_object(
           'daily_winner',true,
           'daily_winner_selected_at',now(),
           'daily_winner_score_version',v_score_version
         ),
         updated_at=now()
   where recommendation_id=v_rec.recommendation_id;

  update public.powerhouse_channel_decisions
     set delivery_evidence=coalesce(delivery_evidence,'{}'::jsonb) || jsonb_build_object(
           'daily_winner_recommendation_id',v_rec.recommendation_id,
           'daily_winner_score_version',v_score_version,
           'daily_winner_format',v_format,
           'daily_winner_selected_at',now(),
           'mira_source_backed',true,
           'mira_source_lineage',v_rec.evidence->'source_lineage'
         ),
         updated_at=now()
   where run_date=p_date and channel='instagram_company';

  return jsonb_build_object(
    'selected',true,'immutable_reuse',false,'run_date',p_date,
    'recommendation_id',v_rec.recommendation_id,'score_version',v_score_version,
    'format',v_format,'selected_priority',v_rec.priority,
    'source_lineage',v_rec.evidence->'source_lineage'
  );
end
$function$;

revoke execute on function public.powerhouse_select_instagram_daily_winner_v1(date) from public, anon, authenticated;
grant execute on function public.powerhouse_select_instagram_daily_winner_v1(date) to service_role;
