
drop function if exists public.powerhouse_materialize_instagram_mira_source_candidates_v1(date);

create or replace function public.powerhouse_materialize_mira_problem_recommendation_v1(p_date date)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $function$
declare
  s public.powerhouse_mira_problem_signals_v1%rowtype;
  rid uuid;
begin
  if p_date is null then raise exception 'RUN_DATE_REQUIRED'; end if;
  if exists(select 1 from public.powerhouse_instagram_daily_winners_v1 where run_date=p_date) then
    return jsonb_build_object('ok',true,'state','WINNER_ALREADY_FROZEN','run_date',p_date);
  end if;

  select x.* into s
  from public.powerhouse_mira_problem_signals_v1 x
  where x.eligible=true
    and x.observed_at >= now()-interval '10 days'
    and x.friction_score >= 0.9
    and coalesce(x.title,'') !~* '(contact opnemen|klantenservice$|support$|mijnomgeving|veelgestelde vragen|faq)'
    and coalesce(x.excerpt,'') ~* '(klacht|erger|irrit|frustr|gedoe|waardeloos|werkt niet|kan niet|onterecht|misleid|teleurgesteld|steeds|elke keer|weer)'
    and not exists (
      select 1
      from public.powerhouse_mira_problem_lineage_v1 l
      join public.powerhouse_mira_problem_signals_v1 prior on prior.signal_id=l.signal_id
      where l.run_date >= p_date-90
        and (prior.source_url=x.source_url or prior.source_hash=x.source_hash)
    )
    and not exists (
      select 1
      from public.powerhouse_mira_problem_lineage_v1 l
      join public.powerhouse_mira_problem_signals_v1 prior on prior.signal_id=l.signal_id
      where l.run_date >= p_date-2 and prior.topic_key=x.topic_key
    )
  order by x.total_score desc,x.observed_at desc,x.signal_id
  limit 1;

  if not found then
    return jsonb_build_object('ok',false,'state','NO_FRESH_PUBLIC_PROBLEM_SIGNAL','run_date',p_date);
  end if;

  insert into public.powerhouse_content_recommendations(
    dedupe_key,run_date,topic_key,content_key,target_channel,recommendation_type,priority,reason,evidence,status
  ) values (
    'mira-public-problem:'||p_date::text,
    p_date,
    s.topic_key,
    'instagram-source-'||p_date::text,
    'instagram_company',
    'source_backed_private_problem',
    95 + least(4.9,s.total_score),
    'Mira daily-life problem selected from public complaint/blog/forum evidence: '||left(s.title,220),
    jsonb_build_object(
      'character','Mira',
      'character_mode','daily_life',
      'contentPersona','mira',
      'contentClass','mira_daily_life',
      'format','reel',
      'reel_generator','OpenArt',
      'production_route','openart_video',
      'source_loop','mira-public-complaint-source-loop-v1',
      'source_backed',true,
      'mira_human_problem_signal',true,
      'source_signal_id',s.signal_id,
      'source_lineage',jsonb_build_array(s.source_url),
      'source_url',s.source_url,
      'source_domain',s.source_domain,
      'source_type',s.source_type,
      'source_title',s.title,
      'source_excerpt',left(s.excerpt,600),
      'source_observed_at',s.observed_at,
      'source_score',s.total_score,
      'topic_key',s.topic_key,
      'forced_business_bridge_forbidden',true,
      'office_problem_attribution_forbidden',true,
      'objective','recognition_share_follow',
      'tone','personal_warm_observational_humor',
      'selection_dimensions',jsonb_build_array('freshness','recognition','emotional_friction','shareability','originality','mira_fit','evidence_strength'),
      'measurement',jsonb_build_array('watch_time','completion','shares','saves','comments','profile_visits','follows','dms')
    ),
    'suggested'
  )
  on conflict(dedupe_key) do update set
    topic_key=excluded.topic_key,
    content_key=excluded.content_key,
    priority=excluded.priority,
    reason=excluded.reason,
    evidence=excluded.evidence,
    status='suggested',
    updated_at=now()
  returning recommendation_id into rid;

  insert into public.powerhouse_mira_problem_lineage_v1(run_date,signal_id,recommendation_id,source_evidence,state)
  values(
    p_date,s.signal_id,rid,
    jsonb_build_object(
      'source_url',s.source_url,
      'source_domain',s.source_domain,
      'source_type',s.source_type,
      'source_hash',s.source_hash,
      'score',s.total_score,
      'observed_at',s.observed_at,
      'contract','mira-public-complaint-source-loop-v1'
    ),
    'RECOMMENDATION_MATERIALIZED'
  )
  on conflict(run_date) do update set
    signal_id=excluded.signal_id,
    recommendation_id=excluded.recommendation_id,
    source_evidence=excluded.source_evidence,
    state='RECOMMENDATION_MATERIALIZED',
    updated_at=now();

  return jsonb_build_object(
    'ok',true,'state','RECOMMENDATION_MATERIALIZED','run_date',p_date,
    'signal_id',s.signal_id,'recommendation_id',rid,'score',s.total_score,
    'source_url',s.source_url
  );
end
$function$;

revoke execute on function public.powerhouse_materialize_mira_problem_recommendation_v1(date) from public,anon,authenticated;
grant execute on function public.powerhouse_materialize_mira_problem_recommendation_v1(date) to service_role;

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
  v_score_version text := 'instagram-mira-public-problem-score-v3';
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

  perform public.powerhouse_materialize_mira_problem_recommendation_v1(p_date);

  select * into v_rec
  from public.powerhouse_content_recommendations r
  where r.run_date=p_date
    and r.target_channel in ('instagram','instagram_company')
    and r.status in ('suggested','accepted')
    and r.recommendation_type='source_backed_private_problem'
    and lower(coalesce(r.evidence->>'character',''))='mira'
    and lower(coalesce(r.evidence->>'character_mode','daily_life'))='daily_life'
    and coalesce((r.evidence->>'source_backed')::boolean,false)=true
    and coalesce(r.evidence->>'source_loop','')='mira-public-complaint-source-loop-v1'
    and coalesce(r.evidence->>'source_signal_id','')<>''
    and jsonb_typeof(r.evidence->'source_lineage')='array'
    and jsonb_array_length(r.evidence->'source_lineage')>0
    and coalesce((r.evidence->>'forced_business_bridge_forbidden')::boolean,true)=true
    and lower(coalesce(r.evidence->>'format','')) in ('reel','image','visual')
  order by r.priority desc,r.updated_at desc,r.recommendation_id
  limit 1
  for update;

  if not found then
    return jsonb_build_object(
      'selected',false,'reason','NO_FRESH_SOURCE_BACKED_MIRA_HUMAN_PROBLEM',
      'run_date',p_date,'contract','mira-public-complaint-source-loop-v1'
    );
  end if;

  v_format:=case lower(coalesce(v_rec.evidence->>'format',''))
    when 'reel' then 'reel' else 'image' end;

  insert into public.powerhouse_instagram_daily_winners_v1(
    run_date,recommendation_id,score_version,selected_priority,selected_format,selector_evidence
  ) values (
    p_date,v_rec.recommendation_id,v_score_version,v_rec.priority,v_format,
    jsonb_build_object(
      'contract','mira-public-complaint-source-loop-v1',
      'selection_phase','EX_ANTE_BEFORE_MEDIA_AND_PUBLICATION',
      'topic_key',v_rec.topic_key,
      'content_key',v_rec.content_key,
      'recommendation_type',v_rec.recommendation_type,
      'reason',v_rec.reason,
      'ranking','source_quality_then_priority',
      'mira_persona',true,
      'daily_life',true,
      'source_backed',true,
      'source_signal_id',v_rec.evidence->>'source_signal_id',
      'source_lineage',v_rec.evidence->'source_lineage',
      'selected_evidence',v_rec.evidence
    )
  );

  update public.powerhouse_content_recommendations
  set status='accepted',
      evidence=coalesce(evidence,'{}'::jsonb)||jsonb_build_object(
        'daily_winner',true,
        'daily_winner_selected_at',now(),
        'daily_winner_score_version',v_score_version
      ),
      updated_at=now()
  where recommendation_id=v_rec.recommendation_id;

  update public.powerhouse_mira_problem_lineage_v1
  set winner_recommendation_id=v_rec.recommendation_id,
      state='WINNER_FROZEN',
      updated_at=now()
  where run_date=p_date and recommendation_id=v_rec.recommendation_id;

  update public.powerhouse_channel_decisions
  set delivery_evidence=coalesce(delivery_evidence,'{}'::jsonb)||jsonb_build_object(
        'daily_winner_recommendation_id',v_rec.recommendation_id,
        'daily_winner_score_version',v_score_version,
        'daily_winner_format',v_format,
        'daily_winner_selected_at',now(),
        'mira_source_backed',true,
        'mira_source_signal_id',v_rec.evidence->>'source_signal_id',
        'mira_source_lineage',v_rec.evidence->'source_lineage'
      ),
      updated_at=now()
  where run_date=p_date and channel='instagram_company';

  return jsonb_build_object(
    'selected',true,'immutable_reuse',false,'run_date',p_date,
    'recommendation_id',v_rec.recommendation_id,'score_version',v_score_version,
    'format',v_format,'selected_priority',v_rec.priority,
    'source_signal_id',v_rec.evidence->>'source_signal_id',
    'source_lineage',v_rec.evidence->'source_lineage'
  );
end
$function$;

revoke execute on function public.powerhouse_select_instagram_daily_winner_v1(date) from public,anon,authenticated;
grant execute on function public.powerhouse_select_instagram_daily_winner_v1(date) to service_role;

create or replace function public.powerhouse_mira_lineage_on_social_post_v1()
returns trigger
language plpgsql
security definer
set search_path=public,pg_catalog
as $function$
begin
  if lower(coalesce(new.platform,''))='instagram' and new.winner_recommendation_id is not null then
    update public.powerhouse_mira_problem_lineage_v1
       set social_post_id=new.post_id,
           state='PUBLISHED',
           outcome_evidence=coalesce(outcome_evidence,'{}'::jsonb)||jsonb_build_object(
             'external_post_id',new.external_post_id,
             'published_at',new.published_at,
             'format',new.format,
             'content_hash',new.content_hash,
             'winner_score_version',new.winner_score_version
           ),
           updated_at=now()
     where winner_recommendation_id=new.winner_recommendation_id;
  end if;
  return new;
end
$function$;

drop trigger if exists trg_powerhouse_mira_lineage_social_post_v1 on public.social_posts;
create trigger trg_powerhouse_mira_lineage_social_post_v1
after insert or update of external_post_id,published_at,winner_recommendation_id,winner_score_version
on public.social_posts
for each row execute function public.powerhouse_mira_lineage_on_social_post_v1();

create or replace function public.powerhouse_mira_lineage_on_metric_v1()
returns trigger
language plpgsql
security definer
set search_path=public,pg_catalog
as $function$
begin
  update public.powerhouse_mira_problem_lineage_v1
     set state='MEASURED',
         outcome_evidence=coalesce(outcome_evidence,'{}'::jsonb)||jsonb_build_object(
           'latest_snapshot_id',new.snapshot_id,
           'latest_metrics',new.metrics,
           'metrics_observed_at',new.observed_at,
           'metrics_age_hours',new.age_hours,
           'metrics_source',new.source
         ),
         updated_at=now()
   where social_post_id=new.post_id;
  return new;
end
$function$;

drop trigger if exists trg_powerhouse_mira_lineage_metric_v1 on public.social_metric_snapshots;
create trigger trg_powerhouse_mira_lineage_metric_v1
after insert or update of metrics,observed_at,age_hours
on public.social_metric_snapshots
for each row execute function public.powerhouse_mira_lineage_on_metric_v1();

create or replace function public.powerhouse_mira_lineage_on_learning_v1()
returns trigger
language plpgsql
security definer
set search_path=public,pg_catalog
as $function$
begin
  update public.powerhouse_mira_problem_lineage_v1
     set state='LEARNED',
         learning_evidence=coalesce(learning_evidence,'{}'::jsonb)||jsonb_build_object(
           'evaluation_id',new.evaluation_id,
           'window_hours',new.window_hours,
           'metric_vector',new.metric_vector,
           'cohort_size',new.cohort_size,
           'observed_at',new.observed_at,
           'evaluation_evidence',new.evidence
         ),
         updated_at=now()
   where social_post_id=new.post_id;
  return new;
end
$function$;

drop trigger if exists trg_powerhouse_mira_lineage_learning_v1 on public.social_learning_evaluations;
create trigger trg_powerhouse_mira_lineage_learning_v1
after insert or update of metric_vector,evidence
on public.social_learning_evaluations
for each row execute function public.powerhouse_mira_lineage_on_learning_v1();
