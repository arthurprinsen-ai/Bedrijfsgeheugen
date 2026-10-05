-- Powerhouse bilingual SEO revenue intelligence v1
create table if not exists public.powerhouse_seo_keyword_intelligence_v1 (
  tenant_id text not null default 'canonical',
  locale text not null check (locale in ('nl','en')),
  market text not null,
  language_code text not null,
  keyword text not null,
  search_volume integer,
  cpc_eur numeric,
  competition text,
  competition_index numeric,
  intent_class text not null default 'commercial' check (intent_class in ('transactional','commercial','informational','navigational')),
  canonical_owner text not null,
  conversion_destination text,
  source text not null default 'dataforseo',
  observed_at timestamptz not null default now(),
  evidence jsonb not null default '{}'::jsonb,
  primary key (tenant_id, locale, market, keyword)
);
comment on table public.powerhouse_seo_keyword_intelligence_v1 is
'Canonical bilingual SEO market evidence. Composite identity keeps NL/EN and markets separate; links keyword demand to one canonical intent owner and commercial destination.';
alter table public.powerhouse_seo_keyword_intelligence_v1 enable row level security;
revoke all on public.powerhouse_seo_keyword_intelligence_v1 from public, anon, authenticated;
grant select,insert,update,delete on public.powerhouse_seo_keyword_intelligence_v1 to service_role;

create or replace view public.powerhouse_seo_keyword_revenue_priority_v1
with (security_invoker=true) as
select
  tenant_id,locale,market,language_code,keyword,search_volume,cpc_eur,competition,competition_index,intent_class,canonical_owner,conversion_destination,source,observed_at,
  round((ln(greatest(0,coalesce(search_volume,0)) + 1) * 10
    + ln(greatest(0,coalesce(cpc_eur,0)) + 1) * 12
    + case intent_class when 'transactional' then 25 when 'commercial' then 18 when 'informational' then 8 else 4 end)::numeric,2) as revenue_opportunity_score,
  evidence
from public.powerhouse_seo_keyword_intelligence_v1;
revoke all on public.powerhouse_seo_keyword_revenue_priority_v1 from public, anon, authenticated;
grant select on public.powerhouse_seo_keyword_revenue_priority_v1 to service_role;

insert into public.powerhouse_seo_keyword_intelligence_v1
(tenant_id,locale,market,language_code,keyword,search_volume,cpc_eur,competition,competition_index,intent_class,canonical_owner,conversion_destination,source,observed_at,evidence)
values
('canonical','nl','Netherlands','nl','ai modellen vergelijken',10,12.14,'LOW',18,'commercial','https://www.bedrijfsgeheugen.nl/ai-modelwijzer','https://www.bedrijfsgeheugen.nl/frisse-blik','dataforseo','2026-09-30T10:00:00Z','{"measurement":"google_ads_search_volume","purpose":"revenue-seo"}'),
('canonical','nl','Netherlands','nl','ai voor mkb',70,8.31,'MEDIUM',62,'commercial','https://www.bedrijfsgeheugen.nl/ai-adoptie','https://www.bedrijfsgeheugen.nl/frisse-blik','dataforseo','2026-09-30T10:00:00Z','{"measurement":"google_ads_search_volume","purpose":"revenue-seo"}'),
('canonical','nl','Netherlands','nl','ai governance',390,15.86,'HIGH',67,'commercial','https://www.bedrijfsgeheugen.nl/ai-governance','https://www.bedrijfsgeheugen.nl/frisse-blik','dataforseo','2026-09-30T10:00:00Z','{"measurement":"google_ads_search_volume","purpose":"revenue-seo"}'),
('canonical','nl','Netherlands','nl','data soevereiniteit',260,6.33,'MEDIUM',51,'commercial','https://www.bedrijfsgeheugen.nl/data-soevereiniteit','https://www.bedrijfsgeheugen.nl/ai-governance','dataforseo','2026-09-30T10:00:00Z','{"measurement":"google_ads_search_volume","purpose":"revenue-seo"}'),
('canonical','nl','Netherlands','nl','bedrijfsprocessen automatiseren',480,14.53,'MEDIUM',52,'transactional','https://www.bedrijfsgeheugen.nl/bedrijfsprocessen-automatiseren','https://www.bedrijfsgeheugen.nl/frisse-blik','dataforseo','2026-09-30T10:00:00Z','{"measurement":"google_ads_search_volume","purpose":"revenue-seo"}'),
('canonical','en','Netherlands','en','ai model comparison',140,5.45,'LOW',7,'commercial','https://www.bedrijfsgeheugen.nl/en/ai-modelwijzer','https://www.bedrijfsgeheugen.nl/en/frisse-blik','dataforseo','2026-09-30T10:00:00Z','{"measurement":"google_ads_search_volume","purpose":"revenue-seo"}'),
('canonical','en','United Kingdom','en','ai model comparison',390,3.30,'LOW',13,'commercial','https://www.bedrijfsgeheugen.nl/en/ai-modelwijzer','https://www.bedrijfsgeheugen.nl/en/frisse-blik','dataforseo','2026-09-30T10:00:00Z','{"measurement":"google_ads_search_volume","purpose":"revenue-seo"}'),
('canonical','en','United Kingdom','en','ai governance',1300,24.01,'HIGH',70,'commercial','https://www.bedrijfsgeheugen.nl/en/ai-governance','https://www.bedrijfsgeheugen.nl/en/frisse-blik','dataforseo','2026-09-30T10:00:00Z','{"measurement":"google_ads_search_volume","purpose":"revenue-seo"}'),
('canonical','en','United Kingdom','en','sovereign ai',2400,13.28,'LOW',30,'commercial','https://www.bedrijfsgeheugen.nl/en/data-soevereiniteit','https://www.bedrijfsgeheugen.nl/en/ai-governance','dataforseo','2026-09-30T10:00:00Z','{"measurement":"google_ads_search_volume","purpose":"revenue-seo"}')
on conflict (tenant_id,locale,market,keyword) do update set
language_code=excluded.language_code,search_volume=excluded.search_volume,cpc_eur=excluded.cpc_eur,competition=excluded.competition,competition_index=excluded.competition_index,intent_class=excluded.intent_class,canonical_owner=excluded.canonical_owner,conversion_destination=excluded.conversion_destination,source=excluded.source,observed_at=excluded.observed_at,evidence=excluded.evidence;
