-- powerhouse-mira-public-complaint-source-loop-v1
-- Canonical E2E lineage: public complaint/blog/forum signal -> Mira recommendation -> immutable daily winner -> post -> metrics/learning.

create table if not exists public.powerhouse_mira_problem_signals_v1 (
  signal_id uuid primary key default gen_random_uuid(),
  source_url text not null unique,
  source_domain text not null,
  source_type text not null,
  title text not null,
  excerpt text not null default '',
  topic_key text not null,
  source_published_at timestamptz,
  observed_at timestamptz not null default now(),
  freshness_score numeric not null default 0,
  recognition_score numeric not null default 0,
  friction_score numeric not null default 0,
  shareability_score numeric not null default 0,
  originality_score numeric not null default 0,
  evidence_score numeric not null default 0,
  total_score numeric not null default 0,
  eligible boolean not null default false,
  source_hash text not null,
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.powerhouse_mira_problem_signals_v1 enable row level security;
revoke all on public.powerhouse_mira_problem_signals_v1 from public,anon,authenticated;
grant select,insert,update on public.powerhouse_mira_problem_signals_v1 to service_role;
create index if not exists powerhouse_mira_problem_signals_rank_idx
  on public.powerhouse_mira_problem_signals_v1(eligible,total_score desc,observed_at desc);

create table if not exists public.powerhouse_mira_problem_lineage_v1 (
  run_date date primary key,
  signal_id uuid not null references public.powerhouse_mira_problem_signals_v1(signal_id),
  recommendation_id uuid not null references public.powerhouse_content_recommendations(recommendation_id),
  winner_recommendation_id uuid,
  social_post_id text,
  state text not null default 'RECOMMENDATION_MATERIALIZED',
  source_evidence jsonb not null default '{}'::jsonb,
  outcome_evidence jsonb not null default '{}'::jsonb,
  learning_evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.powerhouse_mira_problem_lineage_v1 enable row level security;
revoke all on public.powerhouse_mira_problem_lineage_v1 from public,anon,authenticated;
grant select,insert,update on public.powerhouse_mira_problem_lineage_v1 to service_role;

create or replace function public.powerhouse_materialize_mira_problem_recommendation_v1(p_date date)
returns jsonb
language plpgsql security definer set search_path=public,pg_catalog
as $$
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
    and not exists (
      select 1 from public.powerhouse_mira_problem_lineage_v1 l
      join public.powerhouse_mira_problem_signals_v1 prior on prior.signal_id=l.signal_id
      where l.run_date >= p_date-45 and (prior.source_url=x.source_url or prior.topic_key=x.topic_key)
    )
  order by x.total_score desc,x.observed_at desc,x.signal_id
  limit 1;
  if not found then return jsonb_build_object('ok',false,'state','NO_FRESH_PUBLIC_PROBLEM_SIGNAL','run_date',p_date); end if;

  insert into public.powerhouse_content_recommendations(
    dedupe_key,run_date,topic_key,content_key,target_channel,recommendation_type,priority,reason,evidence,status
  ) values (
    'mira-public-problem:'||p_date::text,p_date,s.topic_key,'instagram-source-'||p_date::text,
    'instagram_company','source_backed_private_problem',95 + least(4.9,s.total_score),
    'Mira daily-life problem selected from public complaint/blog/forum evidence: '||left(s.title,220),
    jsonb_build_object(
      'character','Mira','character_mode','daily_life','content_class','mira_daily_life',
      'format','reel','reel_generator','OpenArt','production_route','openart_video',
      'source_loop','mira-public-complaint-source-loop-v1','source_signal_id',s.signal_id,
      'source_url',s.source_url,'source_domain',s.source_domain,'source_type',s.source_type,
      'source_title',s.title,'source_excerpt',left(s.excerpt,600),'source_observed_at',s.observed_at,
      'source_score',s.total_score,'topic_key',s.topic_key,
      'forced_business_bridge_forbidden',true,'office_problem_attribution_forbidden',true,
      'objective','recognition_share_follow','tone','personal_warm_observational_humor',
      'measurement',jsonb_build_array('watch_time','completion','shares','saves','comments','profile_visits','follows','dms')
    ),'suggested'
  )
  on conflict(dedupe_key) do update set
    topic_key=excluded.topic_key,content_key=excluded.content_key,priority=excluded.priority,
    reason=excluded.reason,evidence=excluded.evidence,status='suggested',updated_at=now()
  returning recommendation_id into rid;

  insert into public.powerhouse_mira_problem_lineage_v1(run_date,signal_id,recommendation_id,source_evidence)
  values(p_date,s.signal_id,rid,jsonb_build_object('source_url',s.source_url,'source_domain',s.source_domain,'source_type',s.source_type,'source_hash',s.source_hash,'score',s.total_score))
  on conflict(run_date) do update set signal_id=excluded.signal_id,recommendation_id=excluded.recommendation_id,
    source_evidence=excluded.source_evidence,state='RECOMMENDATION_MATERIALIZED',updated_at=now();

  return jsonb_build_object('ok',true,'state','RECOMMENDATION_MATERIALIZED','run_date',p_date,'signal_id',s.signal_id,'recommendation_id',rid,'score',s.total_score);
end $$;
revoke execute on function public.powerhouse_materialize_mira_problem_recommendation_v1(date) from public,anon,authenticated;
grant execute on function public.powerhouse_materialize_mira_problem_recommendation_v1(date) to service_role;

create or replace function public.powerhouse_sync_mira_problem_lineage_v1(p_date date)
returns jsonb
language plpgsql security definer set search_path=public,pg_catalog
as $$
declare w uuid; p text; m jsonb;
begin
  select recommendation_id into w from public.powerhouse_instagram_daily_winners_v1 where run_date=p_date;
  if w is not null then
    update public.powerhouse_mira_problem_lineage_v1 set winner_recommendation_id=w,
      state=case when recommendation_id=w then 'WINNER_FROZEN' else 'NOT_SELECTED' end,updated_at=now()
    where run_date=p_date;
  end if;
  select post_id into p from public.social_posts
   where lower(platform)='instagram' and winner_recommendation_id=w order by published_at desc nulls last limit 1;
  if p is not null then
    select coalesce(jsonb_agg(jsonb_build_object('observed_at',observed_at,'age_hours',age_hours,'metrics',metrics) order by observed_at),'[]'::jsonb)
      into m from public.social_metric_snapshots where post_id=p;
    update public.powerhouse_mira_problem_lineage_v1
      set social_post_id=p,state='OUTCOME_OBSERVED',outcome_evidence=jsonb_build_object('snapshots',coalesce(m,'[]'::jsonb)),
          learning_evidence=jsonb_build_object('contract','social-learning-v2','feedback_target','source_problem_score_and_topic_selection'),
          updated_at=now()
      where run_date=p_date and recommendation_id=w;
    update public.powerhouse_instagram_daily_winners_v1
      set outcome_evidence=coalesce(outcome_evidence,'{}'::jsonb)||jsonb_build_object('mira_problem_lineage_post_id',p,'social_metric_snapshots',coalesce(m,'[]'::jsonb)),
          updated_at=now()
      where run_date=p_date;
  end if;
  return jsonb_build_object('ok',true,'run_date',p_date,'winner_recommendation_id',w,'social_post_id',p);
end $$;
revoke execute on function public.powerhouse_sync_mira_problem_lineage_v1(date) from public,anon,authenticated;
grant execute on function public.powerhouse_sync_mira_problem_lineage_v1(date) to service_role;

-- Give source-backed Mira problems precedence over static calendar seeds while preserving the immutable winner contract.
create or replace function public.powerhouse_select_instagram_daily_winner_v1(p_date date)
returns jsonb
language plpgsql security definer set search_path=public,pg_catalog
as $$
declare v_existing public.powerhouse_instagram_daily_winners_v1%rowtype; v_rec public.powerhouse_content_recommendations%rowtype; v_format text; v_score_version text:='instagram-mira-source-aware-score-v2';
begin
  if p_date is null then raise exception 'PUBLICATION_DATE_REQUIRED'; end if;
  select * into v_existing from public.powerhouse_instagram_daily_winners_v1 where run_date=p_date for update;
  if found then return jsonb_build_object('selected',true,'immutable_reuse',true,'run_date',v_existing.run_date,'recommendation_id',v_existing.recommendation_id,'score_version',v_existing.score_version,'format',v_existing.selected_format,'selected_priority',v_existing.selected_priority); end if;

  select * into v_rec from public.powerhouse_content_recommendations r
  where r.run_date=p_date and r.target_channel in ('instagram','instagram_company') and r.status in ('suggested','accepted')
    and lower(coalesce(r.evidence->>'character',''))='mira'
    and lower(coalesce(r.evidence->>'character_mode','daily_life'))='daily_life'
    and coalesce((r.evidence->>'forced_business_bridge_forbidden')::boolean,true)=true
    and lower(coalesce(r.evidence->>'format','')) in ('reel','image','visual')
    and (lower(coalesce(r.evidence->>'format',''))<>'reel' or (lower(coalesce(r.evidence->>'reel_generator',''))='openart' and lower(coalesce(r.evidence->>'production_route','')) like '%openart%'))
  order by case when r.evidence->>'source_loop'='mira-public-complaint-source-loop-v1' then 1 else 0 end desc,
           r.priority desc,r.updated_at desc,r.recommendation_id
  limit 1 for update;
  if not found then return jsonb_build_object('selected',false,'reason','NO_ELIGIBLE_MIRA_DAILY_WINNER','run_date',p_date); end if;

  v_format:=case lower(coalesce(v_rec.evidence->>'format','')) when 'reel' then 'reel' else 'image' end;
  insert into public.powerhouse_instagram_daily_winners_v1(run_date,recommendation_id,score_version,selected_priority,selected_format,selector_evidence)
  values(p_date,v_rec.recommendation_id,v_score_version,v_rec.priority,v_format,
    jsonb_build_object('contract','instagram-mira-winner-selection-v1','selection_phase','EX_ANTE_BEFORE_MEDIA_AND_PUBLICATION','topic_key',v_rec.topic_key,'content_key',v_rec.content_key,'recommendation_type',v_rec.recommendation_type,'reason',v_rec.reason,'ranking','source_backed_first_then_priority','mira_persona',true,'daily_life',true,'selected_evidence',v_rec.evidence));
  update public.powerhouse_content_recommendations set status='accepted',evidence=coalesce(evidence,'{}'::jsonb)||jsonb_build_object('daily_winner',true,'daily_winner_selected_at',now(),'daily_winner_score_version',v_score_version),updated_at=now() where recommendation_id=v_rec.recommendation_id;
  update public.powerhouse_channel_decisions set delivery_evidence=coalesce(delivery_evidence,'{}'::jsonb)||jsonb_build_object('daily_winner_recommendation_id',v_rec.recommendation_id,'daily_winner_score_version',v_score_version,'daily_winner_format',v_format,'daily_winner_selected_at',now()),updated_at=now() where run_date=p_date and channel='instagram_company';
  perform public.powerhouse_sync_mira_problem_lineage_v1(p_date);
  return jsonb_build_object('selected',true,'immutable_reuse',false,'run_date',p_date,'recommendation_id',v_rec.recommendation_id,'score_version',v_score_version,'format',v_format,'selected_priority',v_rec.priority);
end $$;

do $$
declare jid bigint;
begin
  select jobid into jid from cron.job where jobname='powerhouse-mira-problem-radar-v1';
  if jid is not null then perform cron.unschedule(jid); end if;
  perform cron.schedule('powerhouse-mira-problem-radar-v1','17 20 * * *',
    $c$select net.http_post(
      url := 'https://adhjwmvyoixzjtmiroln.supabase.co/functions/v1/powerhouse-mira-problem-radar',
      headers := jsonb_build_object('content-type','application/json','x-powerhouse-token',(select decrypted_secret from vault.decrypted_secrets where name='powerhouse_daily_scheduler_token' order by created_at desc limit 1)),
      body := jsonb_build_object('runDate',(timezone('Europe/Amsterdam',now())::date + 1)::text),
      timeout_milliseconds := 120000
    );$c$);
  select jobid into jid from cron.job where jobname='powerhouse-mira-problem-outcome-sync-v1';
  if jid is not null then perform cron.unschedule(jid); end if;
  perform cron.schedule('powerhouse-mira-problem-outcome-sync-v1','42 * * * *',
    $c$select public.powerhouse_sync_mira_problem_lineage_v1(timezone('Europe/Amsterdam',now())::date);$c$);
end $$;
