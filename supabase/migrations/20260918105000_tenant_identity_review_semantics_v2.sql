-- Tenant identity review semantics v2
-- Keep unresolved raw rows visible, but distinguish test/smoke and truly anonymous scans
-- from actionable production identity defects.

create or replace view public.powerhouse_tenant_identity_review_v1
with (security_invoker=true) as
select
  'scan_inzendingen'::text as surface,
  s.id as source_id,
  s.klant_slug,
  s.tenant_identity_status,
  case
    when lower(btrim(coalesce(s.klant_slug,''))) in ('demo','test')
      or lower(btrim(coalesce(s.branche,''))) like '%smoke%'
      then 'demo_or_test'
    when nullif(btrim(s.klant_slug),'') is null
      and nullif(btrim(s.company_key),'') is null
      then 'anonymous_unattributable'
    else 'production_or_unknown'
  end as record_class,
  case
    when lower(btrim(coalesce(s.klant_slug,''))) in ('demo','test')
      or lower(btrim(coalesce(s.branche,''))) like '%smoke%'
      then 'demo_or_test'
    when nullif(btrim(s.klant_slug),'') is null
      and nullif(btrim(s.company_key),'') is null
      then 'no_identity_evidence'
    when nullif(btrim(s.klant_slug),'') is null then 'missing_slug'
    when (
      select count(*) from public.organisaties o
      where lower(btrim(o.slug))=lower(btrim(s.klant_slug))
    )=0 then 'no_organisatie_slug_match'
    else 'ambiguous_organisatie_slug_match'
  end as review_reason,
  (
    select count(*)::integer from public.organisaties o
    where nullif(btrim(s.klant_slug),'') is not null
      and lower(btrim(o.slug))=lower(btrim(s.klant_slug))
  ) as candidate_count,
  s.aangemaakt as observed_at
from public.scan_inzendingen s
where s.organisatie_id is null

union all

select
  'offerte_inzendingen'::text as surface,
  oin.id as source_id,
  oin.klant_slug,
  oin.tenant_identity_status,
  case
    when lower(btrim(coalesce(oin.klant_slug,''))) in ('demo','test') then 'demo_or_test'
    else 'production_or_unknown'
  end as record_class,
  case
    when lower(btrim(coalesce(oin.klant_slug,''))) in ('demo','test') then 'demo_or_test'
    when nullif(btrim(oin.klant_slug),'') is null then 'missing_slug'
    when (
      select count(*) from public.organisaties o
      where lower(btrim(o.slug))=lower(btrim(oin.klant_slug))
    )=0 then 'no_organisatie_slug_match'
    else 'ambiguous_organisatie_slug_match'
  end as review_reason,
  (
    select count(*)::integer from public.organisaties o
    where nullif(btrim(oin.klant_slug),'') is not null
      and lower(btrim(o.slug))=lower(btrim(oin.klant_slug))
  ) as candidate_count,
  oin.aangemaakt as observed_at
from public.offerte_inzendingen oin
where oin.organisatie_id is null;

revoke all on public.powerhouse_tenant_identity_review_v1 from anon, authenticated;
grant select on public.powerhouse_tenant_identity_review_v1 to service_role;

comment on view public.powerhouse_tenant_identity_review_v1 is
'Live unresolved identity review. Raw unresolved rows remain visible; demo/smoke and anonymous scans without identity evidence are separated from actionable production_or_unknown identity defects.';
