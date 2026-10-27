-- Anoniem meedoen aan de benchmark (AI-scan). Geen account, geen identiteit:
-- alleen branche, omvangklasse en uren per jaar. Schrijven loopt via de edge function
-- bg-benchmark-intake met de service role; anon en authenticated krijgen niets.
create table if not exists public.benchmark_anoniem_inzendingen (
  id uuid primary key default gen_random_uuid(),
  aangemaakt timestamptz not null default now(),
  branche text not null check (branche in ('Productie','Groothandel','Zakelijke dienstverlening','Bouw en installatie','Retail en e-commerce','Zorg','Transport en logistiek','Overig')),
  omvang text not null check (omvang in ('3 tot 10','10 tot 25','25 tot 50','50 tot 100','100 tot 250')),
  uren_per_jaar integer not null check (uren_per_jaar between 1 and 1000000),
  bron text not null default 'ai-scan' check (bron = 'ai-scan')
);

alter table public.benchmark_anoniem_inzendingen enable row level security;
revoke all on public.benchmark_anoniem_inzendingen from public, anon, authenticated;
grant select, insert on public.benchmark_anoniem_inzendingen to service_role;

-- Overzicht per branche, alleen met minimaal vijf deelnemers.
create or replace view public.benchmark_anoniem_branche with (security_invoker = true) as
select branche,
       count(*)::int as aantal,
       round(percentile_cont(0.5) within group (order by uren_per_jaar::double precision))::int as uren_mediaan
from public.benchmark_anoniem_inzendingen
group by branche
having count(*) >= 5;

revoke all on public.benchmark_anoniem_branche from public, anon, authenticated;
grant select on public.benchmark_anoniem_branche to service_role;
