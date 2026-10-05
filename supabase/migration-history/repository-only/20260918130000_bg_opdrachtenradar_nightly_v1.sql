-- Opdrachtenradar: nachtelijke verzameling van freelance-/interimopdrachten in data, AI en BI in Nederland.
-- Producer: edge function bg-opdrachtenradar (Tavily-zoekronde + beoordeling door Claude).
-- Sleutels uit Vault via public.bg_geheim: TAVILY_API_KEY, ANTHROPIC_API_KEY, powerhouse_daily_scheduler_token.
-- Alleen service_role; geen browsertoegang. Vastgelegd 18 september 2026.

create table if not exists public.bg_opdrachten (
  url_hash text primary key,
  url text not null unique,
  bron text not null,
  site text,
  titel text not null,
  organisatie text,
  bemiddelaar text,
  locatie text,
  werkvorm text,
  uren text,
  tarief text,
  start text,
  duur text,
  sluitdatum date,
  samenvatting text,
  snippet text,
  volledig text,
  match smallint check (match between 0 and 100),
  waarom text,
  status text not null default 'open' check (status in ('open','bewaard','concept','gereageerd','afgewezen')),
  brief text,
  cv_op_maat text,
  ontbreekt text,
  gereageerd_op timestamptz,
  gevonden_op timestamptz not null default now(),
  laatst_gezien_op timestamptz not null default now(),
  beoordeeld_door text
);
create index if not exists bg_opdrachten_status_idx on public.bg_opdrachten(status, gevonden_op desc);
alter table public.bg_opdrachten enable row level security;
revoke all on table public.bg_opdrachten from public, anon, authenticated;
grant all on table public.bg_opdrachten to service_role;
comment on table public.bg_opdrachten is 'Opdrachtenradar: relevante freelance-/interimopdrachten data, AI en BI in Nederland. Gevuld door bg-opdrachtenradar; status bijgewerkt vanuit de Opdrachtenradar-app.';

create table if not exists public.bg_opdrachten_genegeerd (
  url_hash text primary key,
  url text not null,
  reden text not null default 'niet_relevant',
  gezien_op timestamptz not null default now()
);
alter table public.bg_opdrachten_genegeerd enable row level security;
revoke all on table public.bg_opdrachten_genegeerd from public, anon, authenticated;
grant all on table public.bg_opdrachten_genegeerd to service_role;
comment on table public.bg_opdrachten_genegeerd is 'Opdrachtenradar: beoordeelde treffers die geen opdracht zijn, zodat ze niet opnieuw beoordeeld worden.';

create table if not exists public.bg_opdrachten_profiel (
  id text primary key default 'arthur',
  cv text,
  naam text,
  tarief text,
  regio text,
  extra_domeinen text[] not null default '{}',
  bijgewerkt_op timestamptz not null default now()
);
alter table public.bg_opdrachten_profiel enable row level security;
revoke all on table public.bg_opdrachten_profiel from public, anon, authenticated;
grant all on table public.bg_opdrachten_profiel to service_role;
comment on table public.bg_opdrachten_profiel is 'Opdrachtenradar: basis-cv en voorkeuren voor de match-score. Eén rij.';

insert into public.powerhouse_evidence_sources(source_key, source_class, required, max_age, writer_contract, owner_component, notes)
values ('opdrachtenradar', 'external_intelligence', false, interval '30 hours', 'powerhouse_record_source_observation_v1', 'bg-opdrachtenradar',
        'Nachtelijke Opdrachtenradar (Tavily + Claude). Blijft NOT_OBSERVED tot de producer verified evidence schrijft.')
on conflict (source_key) do nothing;

do $$
begin
  if exists(select 1 from cron.job where jobname='bg-opdrachtenradar-nightly') then
    perform cron.unschedule('bg-opdrachtenradar-nightly');
  end if;
end
$$;

select cron.schedule('bg-opdrachtenradar-nightly','30 1 * * *',$cmd$
select net.http_post(
  url := 'https://adhjwmvyoixzjtmiroln.supabase.co/functions/v1/bg-opdrachtenradar',
  headers := jsonb_build_object(
    'content-type','application/json',
    'x-powerhouse-token',(select decrypted_secret from vault.decrypted_secrets where name='powerhouse_daily_scheduler_token' order by created_at desc limit 1)
  ),
  body := '{}'::jsonb,
  timeout_milliseconds := 150000
);
$cmd$);
