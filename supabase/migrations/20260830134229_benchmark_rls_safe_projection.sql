-- Preserve public aggregate benchmark semantics without SECURITY DEFINER views.
-- Raw submissions remain private. Public roles receive SELECT-only access to
-- aggregate projection rows that satisfy the existing minimum cohort size.

create schema if not exists benchmark_projection;
revoke all on schema benchmark_projection from public;
grant usage on schema benchmark_projection to anon, authenticated, service_role;

create table if not exists benchmark_projection.benchmark_branche_data (
  branche text primary key,
  aantal bigint not null,
  score_gemiddeld numeric,
  score_midden numeric,
  score_bovenste_kwart numeric
);

create table if not exists benchmark_projection.benchmark_niveaus_data (
  branche text not null,
  onderdeel text not null,
  aantal bigint not null,
  niveau_gemiddeld numeric,
  primary key (branche, onderdeel)
);

create table if not exists benchmark_projection.benchmark_offertes_data (
  maand date primary key,
  aantal bigint not null,
  gemiddeld_bedrag numeric,
  gemiddelde_doorlooptijd numeric,
  getekend_percentage numeric
);

alter table benchmark_projection.benchmark_branche_data enable row level security;
alter table benchmark_projection.benchmark_niveaus_data enable row level security;
alter table benchmark_projection.benchmark_offertes_data enable row level security;

drop policy if exists benchmark_branche_public_read on benchmark_projection.benchmark_branche_data;
create policy benchmark_branche_public_read on benchmark_projection.benchmark_branche_data
  for select to anon, authenticated using (true);

drop policy if exists benchmark_niveaus_public_read on benchmark_projection.benchmark_niveaus_data;
create policy benchmark_niveaus_public_read on benchmark_projection.benchmark_niveaus_data
  for select to anon, authenticated using (true);

drop policy if exists benchmark_offertes_public_read on benchmark_projection.benchmark_offertes_data;
create policy benchmark_offertes_public_read on benchmark_projection.benchmark_offertes_data
  for select to anon, authenticated using (true);

revoke all on table
  benchmark_projection.benchmark_branche_data,
  benchmark_projection.benchmark_niveaus_data,
  benchmark_projection.benchmark_offertes_data
from public, anon, authenticated, service_role;

grant select on table
  benchmark_projection.benchmark_branche_data,
  benchmark_projection.benchmark_niveaus_data,
  benchmark_projection.benchmark_offertes_data
to anon, authenticated, service_role;

-- Initial deterministic snapshot: identical formulas and k-anonymity threshold
-- to the legacy views.
delete from benchmark_projection.benchmark_branche_data;
insert into benchmark_projection.benchmark_branche_data
  (branche, aantal, score_gemiddeld, score_midden, score_bovenste_kwart)
select branche,
       count(*),
       round(avg(score), 1),
       round(percentile_cont(0.5) within group (order by score::double precision)::numeric, 1),
       round(percentile_cont(0.75) within group (order by score::double precision)::numeric, 1)
from public.scan_inzendingen
where soort = 'frisse_blik' and score is not null and branche is not null
group by branche
having count(*) >= 5;

delete from benchmark_projection.benchmark_niveaus_data;
insert into benchmark_projection.benchmark_niveaus_data
  (branche, onderdeel, aantal, niveau_gemiddeld)
select s.branche,
       n.sleutel,
       count(*),
       round(avg(n.ruw::numeric), 2)
from public.scan_inzendingen s
cross join lateral jsonb_each_text(coalesce(s.niveaus, '{}'::jsonb)) n(sleutel, ruw)
where s.soort = 'frisse_blik' and s.branche is not null
group by s.branche, n.sleutel
having count(*) >= 5;

delete from benchmark_projection.benchmark_offertes_data;
insert into benchmark_projection.benchmark_offertes_data
  (maand, aantal, gemiddeld_bedrag, gemiddelde_doorlooptijd, getekend_percentage)
select date_trunc('month', aangemaakt)::date,
       count(*),
       round(avg(totaal), 0),
       round(avg(weken), 1),
       round(100.0 * avg(case when getekend then 1 else 0 end), 1)
from public.offerte_inzendingen
group by date_trunc('month', aangemaakt)::date
having count(*) >= 5;

-- Statement-level refreshes keep database work bounded to once per write
-- statement rather than once per row. Trigger functions are not API-callable.
create or replace function benchmark_projection.refresh_scan_benchmarks()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from benchmark_projection.benchmark_branche_data;
  insert into benchmark_projection.benchmark_branche_data
    (branche, aantal, score_gemiddeld, score_midden, score_bovenste_kwart)
  select branche,
         count(*),
         round(avg(score), 1),
         round(percentile_cont(0.5) within group (order by score::double precision)::numeric, 1),
         round(percentile_cont(0.75) within group (order by score::double precision)::numeric, 1)
  from public.scan_inzendingen
  where soort = 'frisse_blik' and score is not null and branche is not null
  group by branche
  having count(*) >= 5;

  delete from benchmark_projection.benchmark_niveaus_data;
  insert into benchmark_projection.benchmark_niveaus_data
    (branche, onderdeel, aantal, niveau_gemiddeld)
  select s.branche,
         n.sleutel,
         count(*),
         round(avg(n.ruw::numeric), 2)
  from public.scan_inzendingen s
  cross join lateral jsonb_each_text(coalesce(s.niveaus, '{}'::jsonb)) n(sleutel, ruw)
  where s.soort = 'frisse_blik' and s.branche is not null
  group by s.branche, n.sleutel
  having count(*) >= 5;

  return null;
end;
$$;

create or replace function benchmark_projection.refresh_offerte_benchmarks()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from benchmark_projection.benchmark_offertes_data;
  insert into benchmark_projection.benchmark_offertes_data
    (maand, aantal, gemiddeld_bedrag, gemiddelde_doorlooptijd, getekend_percentage)
  select date_trunc('month', aangemaakt)::date,
         count(*),
         round(avg(totaal), 0),
         round(avg(weken), 1),
         round(100.0 * avg(case when getekend then 1 else 0 end), 1)
  from public.offerte_inzendingen
  group by date_trunc('month', aangemaakt)::date
  having count(*) >= 5;

  return null;
end;
$$;

revoke all on function benchmark_projection.refresh_scan_benchmarks() from public, anon, authenticated, service_role;
revoke all on function benchmark_projection.refresh_offerte_benchmarks() from public, anon, authenticated, service_role;

drop trigger if exists benchmark_scan_projection_refresh on public.scan_inzendingen;
create trigger benchmark_scan_projection_refresh
after insert or update or delete or truncate on public.scan_inzendingen
for each statement execute function benchmark_projection.refresh_scan_benchmarks();

drop trigger if exists benchmark_offerte_projection_refresh on public.offerte_inzendingen;
create trigger benchmark_offerte_projection_refresh
after insert or update or delete or truncate on public.offerte_inzendingen
for each statement execute function benchmark_projection.refresh_offerte_benchmarks();

create or replace view public.benchmark_branche
with (security_invoker = true)
as
select branche, aantal, score_gemiddeld, score_midden, score_bovenste_kwart
from benchmark_projection.benchmark_branche_data;

create or replace view public.benchmark_niveaus
with (security_invoker = true)
as
select branche, onderdeel, aantal, niveau_gemiddeld
from benchmark_projection.benchmark_niveaus_data;

create or replace view public.benchmark_offertes
with (security_invoker = true)
as
select maand, aantal, gemiddeld_bedrag, gemiddelde_doorlooptijd, getekend_percentage
from benchmark_projection.benchmark_offertes_data;

revoke all on table public.benchmark_branche, public.benchmark_niveaus, public.benchmark_offertes
from public, anon, authenticated, service_role;
grant select on table public.benchmark_branche, public.benchmark_niveaus, public.benchmark_offertes
to anon, authenticated, service_role;
