create table if not exists public.linkedin_engagement_events (
  event_id uuid primary key default gen_random_uuid(),
  event_key text not null unique,
  engagement_type text not null check (engagement_type in ('like','comment','repost','share','follow','save','click','dm')),
  actor_type text not null default 'person' check (actor_type in ('person','company')),
  actor_linkedin_url text not null,
  actor_name text,
  company_name text,
  role text,
  content_key text,
  post_url text,
  source text not null default 'linkedin',
  occurred_at timestamptz not null default now(),
  payload jsonb not null default '{}'::jsonb,
  is_test boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists linkedin_engagement_events_actor_idx
  on public.linkedin_engagement_events(actor_linkedin_url, occurred_at desc);
create index if not exists linkedin_engagement_events_content_idx
  on public.linkedin_engagement_events(content_key, occurred_at desc);

alter table public.linkedin_engagement_events enable row level security;
revoke all on public.linkedin_engagement_events from anon, authenticated;
grant all on public.linkedin_engagement_events to service_role;

create or replace function public.bg_linkedin_engagement_ingest(p_event jsonb)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_event_id uuid;
  v_event_key text := nullif(trim(p_event->>'event_key'), '');
  v_type text := lower(nullif(trim(p_event->>'engagement_type'), ''));
  v_actor_type text := lower(coalesce(nullif(trim(p_event->>'actor_type'), ''), 'person'));
  v_actor_url text := nullif(trim(p_event->>'actor_linkedin_url'), '');
  v_actor_name text := nullif(trim(p_event->>'actor_name'), '');
  v_company text := nullif(trim(p_event->>'company_name'), '');
  v_role text := nullif(trim(p_event->>'role'), '');
  v_content text := nullif(trim(p_event->>'content_key'), '');
  v_post_url text := nullif(trim(p_event->>'post_url'), '');
  v_source text := coalesce(nullif(trim(p_event->>'source'), ''), 'linkedin');
  v_occurred_at timestamptz := coalesce(nullif(p_event->>'occurred_at','')::timestamptz, now());
  v_is_test boolean := coalesce((p_event->>'is_test')::boolean, false);
  v_is_connection boolean := false;
  v_count integer := 0;
  v_base integer := 0;
  v_fit numeric := 0;
  v_score integer := 0;
  v_action text := 'observe';
  v_reason text;
  v_dedupe text;
begin
  if v_event_key is null then raise exception 'event_key required'; end if;
  if v_actor_url is null then raise exception 'actor_linkedin_url required'; end if;
  if v_type not in ('like','comment','repost','share','follow','save','click','dm') then raise exception 'unsupported engagement_type'; end if;
  if v_actor_type not in ('person','company') then raise exception 'unsupported actor_type'; end if;

  select exists(select 1 from public.bg_connecties c where c.linkedin_url=v_actor_url) into v_is_connection;

  insert into public.linkedin_engagement_events(
    event_key,engagement_type,actor_type,actor_linkedin_url,actor_name,company_name,role,
    content_key,post_url,source,occurred_at,payload,is_test
  ) values (
    v_event_key,v_type,v_actor_type,v_actor_url,v_actor_name,v_company,v_role,
    v_content,v_post_url,v_source,v_occurred_at,p_event,v_is_test
  ) on conflict (event_key) do nothing
  returning event_id into v_event_id;

  if v_event_id is null then
    return jsonb_build_object('duplicate',true,'event_key',v_event_key,'actor_linkedin_url',v_actor_url);
  end if;

  select count(*) into v_count
  from public.linkedin_engagement_events e
  where e.actor_linkedin_url=v_actor_url and e.occurred_at >= now()-interval '30 days';

  v_base := case v_type
    when 'like' then 4 when 'save' then 8 when 'click' then 10 when 'follow' then 12
    when 'comment' then 18 when 'share' then 24 when 'repost' then 28 when 'dm' then 40 else 0 end;
  if coalesce(p_event->>'commercial_fit','') ~ '^[0-9]+([.][0-9]+)?$' then
    v_fit := least(1, greatest(0, (p_event->>'commercial_fit')::numeric));
  end if;
  v_score := least(100, greatest(0, v_base + least(20,greatest(0,v_count-1)*4) + round(v_fit*10)::integer + case when v_is_connection then 4 else 0 end));

  v_action := case
    when v_type='dm' then 'reply_dm'
    when v_type='comment' and v_count>=2 and v_is_connection and v_fit>=0.7 then 'review_dm'
    when v_type='comment' then 'reply_public'
    when v_type in ('repost','share','follow') then 'review_profile'
    when v_type='like' and v_count>=3 then 'review_profile'
    when v_type in ('save','click') and v_count>=2 then 'review_profile'
    else 'observe' end;

  v_reason := concat('LinkedIn ',v_type,' door ',coalesce(v_actor_name,v_company,v_actor_url),' op ',coalesce(v_post_url,v_content,'content'));

  insert into public.bg_connecties(
    linkedin_url,naam,bedrijf,rol,segment,prioriteit,aanleiding,status,bron,extra,aangemaakt_op,bijgewerkt_op,sleutel
  ) values (
    v_actor_url,v_actor_name,v_company,v_role,null,least(100,50+v_score),v_reason,'nieuw','linkedin-engagement',
    jsonb_build_object('linkedin_engagement',jsonb_build_object('last_type',v_type,'last_at',v_occurred_at,'event_count_30d',v_count,'score',v_score,'recommended_action',v_action,'content_key',v_content,'post_url',v_post_url)),
    now(),now(),'li-'||md5(v_actor_url)
  ) on conflict (linkedin_url) do update set
    naam=coalesce(nullif(excluded.naam,''),bg_connecties.naam),
    bedrijf=coalesce(nullif(excluded.bedrijf,''),bg_connecties.bedrijf),
    rol=coalesce(nullif(excluded.rol,''),bg_connecties.rol),
    prioriteit=greatest(coalesce(bg_connecties.prioriteit,50),excluded.prioriteit),
    aanleiding=excluded.aanleiding,
    bron='linkedin-engagement',
    extra=coalesce(bg_connecties.extra,'{}'::jsonb)||excluded.extra,
    bijgewerkt_op=now();

  if v_action <> 'observe' then
    v_dedupe := 'linkedin-engagement:'||v_event_key;
    insert into public.powerhouse_sales_actions(
      dedupe_key,subject_key,person_key,company_key,action_type,channel,priority,reason,evidence,
      message_draft,source_url,status,content_key,person_name,company_name,role,created_at,updated_at
    ) values (
      v_dedupe,v_actor_url,case when v_actor_type='person' then v_actor_url end,case when v_actor_type='company' then v_actor_url else v_company end,
      v_action,'linkedin',v_score,v_reason,
      p_event||jsonb_build_object('event_id',v_event_id,'engagement_score',v_score,'recommended_action',v_action,'event_count_30d',v_count),
      '',coalesce(v_post_url,v_actor_url),'suggested',v_content,v_actor_name,v_company,v_role,now(),now()
    ) on conflict (dedupe_key) do nothing;
  end if;

  return jsonb_build_object('duplicate',false,'event_id',v_event_id,'event_key',v_event_key,'actor_linkedin_url',v_actor_url,'engagement_score',v_score,'event_count_30d',v_count,'recommended_action',v_action,'is_connection',v_is_connection);
end;
$$;

revoke all on function public.bg_linkedin_engagement_ingest(jsonb) from public, anon, authenticated;
grant execute on function public.bg_linkedin_engagement_ingest(jsonb) to service_role;
