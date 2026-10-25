-- Production source refresh with immutable daily winner preserved.
-- Previously the materializer trusted x.observed_at < 10d even if the
-- *original* source was published years earlier. Preexisting records with
-- NULL published date cannot be newly selected until the existing provider
-- supplies dated evidence; do not mutate frozen winners or historical orders.
-- Keep the existing permission boundary: no public/authenticated RPC access.
CREATE OR REPLACE FUNCTION public.powerhouse_materialize_mira_problem_recommendation_v1(p_date date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
declare
  s public.powerhouse_mira_problem_signals_v1%rowtype;
  rid uuid;
  existing_signal uuid;
begin
  if p_date is null then raise exception 'RUN_DATE_REQUIRED'; end if;
  if exists(select 1 from public.powerhouse_instagram_daily_winners_v1 where run_date=p_date) then
    return jsonb_build_object('ok',true,'state','WINNER_ALREADY_FROZEN','run_date',p_date);
  end if;

  select signal_id into existing_signal
  from public.powerhouse_mira_problem_lineage_v1
  where run_date=p_date;

  if existing_signal is not null then
    select * into s from public.powerhouse_mira_problem_signals_v1 where signal_id=existing_signal;
  else
    select x.* into s
    from public.powerhouse_mira_problem_signals_v1 x
    where x.eligible=true
      and x.observed_at >= now()-interval '10 days'
      and x.source_published_at >= (p_date - interval '60 days')
      and x.source_published_at <= (p_date + interval '1 day')
      and x.friction_score >= 0.9
      and coalesce(x.title,'') !~* '(contact opnemen|klantenservice$|support$|mijnomgeving|veelgestelde vragen|faq)'
      and (coalesce(x.title,'')||' '||coalesce(x.excerpt,'')) ~* '(klacht|erger|irrit|frustr|gedoe|waardeloos|werkt niet|kan niet|onterecht|misleid|teleurgesteld|steeds|elke keer|weer|niet bezorgd|niet thuis|kan niet inloggen)'
      and not exists (
        select 1 from public.powerhouse_mira_problem_lineage_v1 l
        join public.powerhouse_mira_problem_signals_v1 prior on prior.signal_id=l.signal_id
        where l.run_date < p_date and l.run_date >= p_date-90
          and (prior.source_url=x.source_url or prior.source_hash=x.source_hash)
      )
      and not exists (
        select 1 from public.powerhouse_mira_problem_lineage_v1 l
        join public.powerhouse_mira_problem_signals_v1 prior on prior.signal_id=l.signal_id
        where l.run_date < p_date and l.run_date >= p_date-2 and prior.topic_key=x.topic_key
      )
    order by x.total_score desc,x.observed_at desc,x.signal_id
    limit 1;
  end if;

  if not found and existing_signal is null then
    return jsonb_build_object('ok',false,'state','NO_FRESH_PUBLIC_PROBLEM_SIGNAL','run_date',p_date);
  end if;
  if s.signal_id is null then
    return jsonb_build_object('ok',false,'state','SOURCE_LINEAGE_SIGNAL_MISSING','run_date',p_date);
  end if;
  -- Never reuse an unfrozen historical source merely because it was crawled recently.
  -- A frozen same-day winner is handled by the immutable early return above.
  if s.source_published_at IS NULL
     or s.source_published_at < (p_date - interval '60 days')
     or s.source_published_at > (p_date + interval '1 day') then
    return jsonb_build_object('ok',false,'state','SOURCE_PUBLICATION_DATE_UNVERIFIED_OR_STALE',
      'run_date',p_date,'signal_id',s.signal_id,'source_publication_date_status','UNVERIFIED_OR_STALE');
  end if;

  insert into public.powerhouse_content_recommendations(
    dedupe_key,run_date,topic_key,content_key,target_channel,recommendation_type,priority,reason,evidence,status
  ) values (
    'mira-public-problem:'||p_date::text,p_date,s.topic_key,'instagram-source-'||p_date::text,
    'instagram_company','source_backed_private_problem',95+least(4.9,s.total_score),
    'Mira daily-life problem selected from public complaint/blog/forum evidence: '||left(s.title,220),
    jsonb_build_object(
      'character','Mira','character_mode','daily_life','contentPersona','mira','contentClass','mira_daily_life',
      'content_class','mira_daily_life','format','reel','reel_generator','OpenArt','production_route','openart_video',
      'source_loop','mira-public-complaint-source-loop-v1','source_backed',true,'mira_human_problem_signal',true,
      'source_signal_id',s.signal_id,'source_lineage',jsonb_build_array(s.source_url),
      'source_url',s.source_url,'source_domain',s.source_domain,'source_type',s.source_type,'source_title',s.title,
      'source_excerpt',left(s.excerpt,600),'source_observed_at',s.observed_at,'source_score',s.total_score,'topic_key',s.topic_key,
      'forced_business_bridge_forbidden',true,'office_problem_attribution_forbidden',true,
      'objective','recognition_share_follow','tone','personal_warm_observational_humor',
      'selection_dimensions',jsonb_build_array('freshness','recognition','emotional_friction','shareability','originality','mira_fit','evidence_strength'),
      'measurement',jsonb_build_array('watch_time','completion','shares','saves','comments','profile_visits','follows','dms')
    ),'suggested'
  )
  on conflict(dedupe_key) do update set
    topic_key=excluded.topic_key,content_key=excluded.content_key,priority=excluded.priority,
    reason=excluded.reason,evidence=excluded.evidence,status='suggested',updated_at=now()
  returning recommendation_id into rid;

  insert into public.powerhouse_mira_problem_lineage_v1(run_date,signal_id,recommendation_id,source_evidence,state)
  values(p_date,s.signal_id,rid,jsonb_build_object(
    'source_url',s.source_url,'source_domain',s.source_domain,'source_type',s.source_type,
    'source_hash',s.source_hash,'score',s.total_score,'observed_at',s.observed_at,'contract','mira-public-complaint-source-loop-v1'
  ),'RECOMMENDATION_MATERIALIZED')
  on conflict(run_date) do update set signal_id=excluded.signal_id,recommendation_id=excluded.recommendation_id,
    source_evidence=excluded.source_evidence,state='RECOMMENDATION_MATERIALIZED',updated_at=now();

  return jsonb_build_object('ok',true,'state','RECOMMENDATION_MATERIALIZED','run_date',p_date,
    'signal_id',s.signal_id,'recommendation_id',rid,'score',s.total_score,'source_url',s.source_url);
end $function$

REVOKE EXECUTE ON FUNCTION public.powerhouse_materialize_mira_problem_recommendation_v1(date) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.powerhouse_materialize_mira_problem_recommendation_v1(date) TO service_role;
