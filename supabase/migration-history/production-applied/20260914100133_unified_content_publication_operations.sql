-- Unified content publication operations.
-- social_experiments stays the canonical adaptive calendar; this table is the execution ledger.

alter table public.social_experiments
  add column if not exists target_channels jsonb not null default '[]'::jsonb;

update public.social_experiments
set target_channels = (
      select jsonb_agg(channel order by ord)
      from (
        select channel, min(ord) as ord
        from (
          select x.channel,
            case x.channel
              when 'linkedin_personal' then 1
              when 'linkedin_company' then 2
              when 'instagram' then 3
              when 'blog' then 4
              else 50
            end as ord
          from jsonb_array_elements_text(coalesce(target_channels, '[]'::jsonb)) as x(channel)
          union all select 'linkedin_personal', 1
          union all select 'linkedin_company', 2
          union all select 'instagram', 3
          union all select 'blog', 4
        ) raw_channels
        group by channel
      ) normalized
    ),
    updated_at = now()
where calendar_date between date '2026-09-14' and date '2026-12-31'
  and tenant_id in ('canonical','bedrijfsgeheugen');

create table if not exists public.content_publication_obligations (
  tenant_id text not null,
  publication_date date not null,
  channel text not null,
  experiment_id text not null,
  content_kind text not null check (content_kind in ('social','blog')),
  status text not null default 'PLANNED'
    check (status in ('PLANNED','GENERATED','APPROVED','DISPATCHED','PUBLISHED','LIVE_PROVEN','MEASURED','LEARNED','BLOCKED','FAILED')),
  content_id text,
  slug text,
  external_id text,
  canonical_url text,
  generated_at timestamptz,
  approved_at timestamptz,
  dispatched_at timestamptz,
  published_at timestamptz,
  live_proven_at timestamptz,
  measured_at timestamptz,
  learned_at timestamptz,
  last_error text,
  recovery_attempts integer not null default 0 check (recovery_attempts >= 0),
  evidence jsonb not null default '{}'::jsonb,
  metrics jsonb not null default '{}'::jsonb,
  next_action text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, publication_date, channel)
);

create index if not exists content_publication_obligations_date_status_idx
  on public.content_publication_obligations(publication_date, status);
create index if not exists content_publication_obligations_experiment_idx
  on public.content_publication_obligations(tenant_id, experiment_id);

create or replace function public.content_publication_state_rank(p_status text)
returns integer language sql immutable as $$
  select case p_status when 'PLANNED' then 10 when 'GENERATED' then 20 when 'APPROVED' then 30 when 'DISPATCHED' then 40 when 'PUBLISHED' then 50 when 'LIVE_PROVEN' then 60 when 'MEASURED' then 70 when 'LEARNED' then 80 when 'BLOCKED' then 5 when 'FAILED' then 5 else -1 end;
$$;

create or replace function public.sync_content_publication_obligations(
  p_from date default (timezone('Europe/Amsterdam', now()))::date,
  p_to date default (timezone('Europe/Amsterdam', now()))::date
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare v_count integer := 0;
begin
  if p_from is null or p_to is null or p_to < p_from then raise exception 'INVALID_PUBLICATION_RANGE'; end if;
  insert into public.content_publication_obligations(tenant_id, publication_date, channel, experiment_id, content_kind, status, next_action, updated_at)
  select e.tenant_id, e.calendar_date, ch.channel, e.experiment_id,
    case when ch.channel = 'blog' then 'blog' else 'social' end,
    'PLANNED',
    case when ch.channel = 'blog' then 'Selecteer exact één goedgekeurde due slug en lever via candidate PR → BG169 → live proof.' else 'Genereer/publiceer via de bestaande kanaallane en koppel live bewijs plus metrics terug.' end,
    now()
  from public.social_experiments e
  cross join lateral (select distinct value as channel from jsonb_array_elements_text(coalesce(e.target_channels,'[]'::jsonb)) as c(value)) ch
  where e.calendar_date between p_from and p_to
    and e.tenant_id in ('canonical','bedrijfsgeheugen')
    and ch.channel in ('linkedin_personal','linkedin_company','instagram','blog')
  on conflict (tenant_id, publication_date, channel) do update
    set experiment_id = excluded.experiment_id,
        content_kind = excluded.content_kind,
        next_action = case when public.content_publication_state_rank(content_publication_obligations.status) <= 10 then excluded.next_action else content_publication_obligations.next_action end,
        updated_at = now();
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;
revoke all on function public.sync_content_publication_obligations(date,date) from public;

create or replace function public.record_content_publication_state(
  p_tenant_id text, p_publication_date date, p_channel text, p_status text,
  p_content_id text default null, p_slug text default null, p_external_id text default null,
  p_canonical_url text default null, p_evidence jsonb default '{}'::jsonb,
  p_metrics jsonb default '{}'::jsonb, p_next_action text default null, p_error text default null
)
returns public.content_publication_obligations
language plpgsql security definer set search_path = public
as $$
declare
  v_row public.content_publication_obligations%rowtype;
  v_old_rank integer; v_new_rank integer;
begin
  select * into v_row from public.content_publication_obligations
  where tenant_id=p_tenant_id and publication_date=p_publication_date and channel=p_channel for update;
  if not found then raise exception 'PUBLICATION_OBLIGATION_NOT_FOUND'; end if;
  v_old_rank := public.content_publication_state_rank(v_row.status);
  v_new_rank := public.content_publication_state_rank(p_status);
  if v_new_rank < 0 then raise exception 'INVALID_PUBLICATION_STATE'; end if;
  if v_row.status not in ('BLOCKED','FAILED') and p_status not in ('BLOCKED','FAILED') and v_new_rank < v_old_rank then raise exception 'STATE_REGRESSION_NOT_ALLOWED'; end if;
  if p_status in ('LIVE_PROVEN','MEASURED','LEARNED') and coalesce(nullif(p_canonical_url,''),nullif(p_external_id,''),nullif(v_row.canonical_url,''),nullif(v_row.external_id,'')) is null then raise exception 'LIVE_PROOF_REQUIRED'; end if;
  if p_status in ('LIVE_PROVEN','MEASURED','LEARNED') and coalesce(p_evidence,'{}'::jsonb)='{}'::jsonb and coalesce(v_row.evidence,'{}'::jsonb)='{}'::jsonb then raise exception 'LIVE_PROOF_REQUIRED'; end if;
  update public.content_publication_obligations
  set status=p_status,
      content_id=coalesce(nullif(p_content_id,''),content_id),
      slug=coalesce(nullif(p_slug,''),slug), external_id=coalesce(nullif(p_external_id,''),external_id),
      canonical_url=coalesce(nullif(p_canonical_url,''),canonical_url),
      evidence=case when coalesce(p_evidence,'{}'::jsonb)='{}'::jsonb then evidence else evidence||p_evidence end,
      metrics=case when coalesce(p_metrics,'{}'::jsonb)='{}'::jsonb then metrics else metrics||p_metrics end,
      next_action=coalesce(p_next_action,next_action),
      last_error=case when p_status in ('BLOCKED','FAILED') then coalesce(p_error,last_error) else null end,
      recovery_attempts=recovery_attempts+case when p_status in ('BLOCKED','FAILED') then 1 else 0 end,
      generated_at=case when p_status in ('GENERATED','APPROVED','DISPATCHED','PUBLISHED','LIVE_PROVEN','MEASURED','LEARNED') then coalesce(generated_at,now()) else generated_at end,
      approved_at=case when p_status in ('APPROVED','DISPATCHED','PUBLISHED','LIVE_PROVEN','MEASURED','LEARNED') then coalesce(approved_at,now()) else approved_at end,
      dispatched_at=case when p_status in ('DISPATCHED','PUBLISHED','LIVE_PROVEN','MEASURED','LEARNED') then coalesce(dispatched_at,now()) else dispatched_at end,
      published_at=case when p_status in ('PUBLISHED','LIVE_PROVEN','MEASURED','LEARNED') then coalesce(published_at,now()) else published_at end,
      live_proven_at=case when p_status in ('LIVE_PROVEN','MEASURED','LEARNED') then coalesce(live_proven_at,now()) else live_proven_at end,
      measured_at=case when p_status in ('MEASURED','LEARNED') then coalesce(measured_at,now()) else measured_at end,
      learned_at=case when p_status='LEARNED' then coalesce(learned_at,now()) else learned_at end,
      updated_at=now()
  where tenant_id=p_tenant_id and publication_date=p_publication_date and channel=p_channel returning * into v_row;
  return v_row;
end;
$$;
revoke all on function public.record_content_publication_state(text,date,text,text,text,text,text,text,jsonb,jsonb,text,text) from public;

create or replace view public.content_operations_cockpit as
select o.tenant_id,o.publication_date,o.channel,o.content_kind,o.status,o.experiment_id,
  e.comparison_scope->>'family' as experiment_family,e.comparison_scope->>'mode' as decision_mode,e.recipe,e.source_signals,e.commercial_hypothesis,
  o.content_id,o.slug,o.external_id,o.canonical_url,o.last_error,o.recovery_attempts,o.evidence,o.metrics,o.next_action,
  o.generated_at,o.approved_at,o.dispatched_at,o.published_at,o.live_proven_at,o.measured_at,o.learned_at,
  (o.publication_date=(timezone('Europe/Amsterdam',now()))::date) as is_due_today,
  (o.publication_date<(timezone('Europe/Amsterdam',now()))::date and o.status not in ('LIVE_PROVEN','MEASURED','LEARNED')) as is_overdue,
  o.updated_at
from public.content_publication_obligations o
left join public.social_experiments e on e.tenant_id=o.tenant_id and e.experiment_id=o.experiment_id and e.calendar_date=o.publication_date;

select public.sync_content_publication_obligations(date '2026-09-14', date '2026-12-31');

do $$
declare v_blog_count integer;
begin
  select count(*) into v_blog_count from public.content_publication_obligations
  where tenant_id='canonical' and channel='blog' and publication_date between date '2026-09-14' and date '2026-12-31';
  if v_blog_count <> 109 then raise exception 'BLOG_CALENDAR_INCOMPLETE expected=109 actual=%',v_blog_count; end if;
end;
$$;
