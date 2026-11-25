-- Mira radar: entrepreneur (PH-P) signals can become the daily winner again.
-- Root cause: this materializer only accepted consumer complaints (fixed phrase list,
-- friction >= 0.9) and wrote forced_business_bridge_forbidden=true, which sends the
-- frozen-winner contract down the "approved source-led" route (needs a hard-coded
-- per-day approval). The orchestrator (#4267) needs an entrepreneur problem mapped to
-- a canonical PH-P. Now: signals with portal_problem_id + approved_mira_scene from the
-- radar are materialised as library-mapped winners. Freshness (60 days max), immutable
-- daily winner, 90-day source dedupe and the permission boundary are unchanged.
-- The bridge-forbidden flags are deliberately OMITTED (the selector reads a missing
-- flag as true and the resolver then takes the library-mapping route).
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
      and x.metadata->>'contract'='mira-entrepreneur-portal-story-v1'
      and coalesce(x.metadata->>'portal_problem_id','') ~ '^PH-P[0-9]{3}$'
      and coalesce(x.metadata->>'approved_mira_scene','')<>''
      and coalesce(x.title,'') !~* '(contact opnemen|klantenservice$|support$|mijnomgeving|veelgestelde vragen|faq)'
      and not exists (
        select 1 from public.powerhouse_mira_problem_lineage_v1 l
        join public.powerhouse_mira_problem_signals_v1 prior on prior.signal_id=l.signal_id
        where l.run_date < p_date and l.run_date >= p_date-90
          and (prior.source_url=x.source_url or prior.source_hash=x.source_hash)
      )
      and not exists (
        select 1 from public.powerhouse_mira_problem_lineage_v1 l
        join public.powerhouse_mira_problem_signals_v1 prior on prior.signal_id=l.signal_id
        where l.run_date < p_date and l.run_date >= p_date-3 and prior.topic_key=x.topic_key
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
    'Mira entrepreneur problem (canonical '||(s.metadata->>'portal_problem_id')||') selected from fresh public sector signal: '||left(s.title,220),
    jsonb_build_object(
      'character','Mira','character_mode','daily_life','contentPersona','mira','contentClass','mira_daily_life',
      'content_class','mira_daily_life','format','reel','reel_generator','OpenArt','production_route','openart_video',
      'source_loop','mira-public-complaint-source-loop-v1','source_backed',true,'mira_human_problem_signal',true,
      'source_signal_id',s.signal_id,'source_lineage',jsonb_build_array(s.source_url),
      'source_url',s.source_url,'source_domain',s.source_domain,'source_type',s.source_type,'source_title',s.title,
      'source_excerpt',left(s.excerpt,600),'source_observed_at',s.observed_at,'source_score',s.total_score,'topic_key',s.topic_key,
      'signal_contract','mira-entrepreneur-portal-story-v1','audience','ondernemers',
      'approved_canonical_problem_id',s.metadata->>'portal_problem_id',
      'approved_mira_scene',s.metadata->>'approved_mira_scene',
      'evidence_kind','public_signal_not_customer_fact','fictional_mira_scenario',true,
      'source_published_at',s.source_published_at,
      'objective','recognition_share_follow','tone','herkenbaar_menselijk_zakelijk',
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
    'source_hash',s.source_hash,'score',s.total_score,'observed_at',s.observed_at,'contract','mira-entrepreneur-portal-story-v1','portal_problem_id',s.metadata->>'portal_problem_id'
  ),'RECOMMENDATION_MATERIALIZED')
  on conflict(run_date) do update set signal_id=excluded.signal_id,recommendation_id=excluded.recommendation_id,
    source_evidence=excluded.source_evidence,state='RECOMMENDATION_MATERIALIZED',updated_at=now();

  return jsonb_build_object('ok',true,'state','RECOMMENDATION_MATERIALIZED','run_date',p_date,
    'signal_id',s.signal_id,'recommendation_id',rid,'score',s.total_score,'source_url',s.source_url);
end $function$;

REVOKE EXECUTE ON FUNCTION public.powerhouse_materialize_mira_problem_recommendation_v1(date) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.powerhouse_materialize_mira_problem_recommendation_v1(date) TO service_role;
