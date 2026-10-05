create or replace view public.bg_vandaag with (security_invoker=true) as
select
  round(a.priority) as prioriteit,
  coalesce(nullif(a.person_name,''),c.naam,'?') as persoon,
  coalesce(nullif(a.company_name,''),c.bedrijf,'') as bedrijf,
  coalesce(nullif(a.role,''),c.rol,'') as rol,
  a.channel as kanaal,
  a.action_type as soort,
  a.message_draft as tekst_om_te_versturen,
  a.reason as waarom,
  coalesce(a.source_url,c.linkedin_url) as link,
  case when c.sleutel is not null then 'https://www.bedrijfsgeheugen.nl/g/'||c.sleutel else null end as persoonlijke_link,
  a.action_id::text as action_id,
  coalesce(a.expected_value_eur,0)::numeric as verwachte_waarde_eur,
  case
    when c.linkedin_url is not null then 'Bekende relatie'
    when coalesce(a.evidence->'commercial_intelligence'->>'relationship_warmth','') <> '' then 'Relatie bekend, connectie niet geverifieerd'
    else 'Connectie niet geverifieerd'
  end as connectie_status,
  greatest(
    coalesce((a.evidence->'commercial_intelligence'->>'relationship_warmth')::numeric,0),
    coalesce((a.evidence->>'relationship_warmth')::numeric,0)
  ) as relatie_score,
  coalesce(a.evidence->>'give_asset',a.evidence->'commercial_intelligence'->>'recommended_asset','') as asset_type,
  case
    when lower(coalesce(a.evidence->>'asset_format',''))='pdf' then true
    when lower(coalesce(a.evidence->>'give_asset','')) in
      ('board_one_pager','evidence_teardown','lost_knowledge_case','friction_business_case','mini_benchmark','peer_benchmark')
      then true
    else false
  end as pdf_nodig,
  case
    when lower(a.action_type) like '%dm%' or lower(a.channel) in ('linkedin dm','linkedin_dm','linkedin-direct-message')
      or lower(coalesce(a.evidence->>'manual_handoff',''))='true'
      then true
    else false
  end as handmatig_nodig,
  coalesce(
    a.evidence->'trigger_evidence'->'raw_evidence'->'evidence'->>'headline',
    a.evidence->>'headline',a.evidence->>'latest_reason',a.reason,''
  ) as trigger_kort,
  a.evidence as evidence
from public.powerhouse_sales_actions a
left join public.bg_connecties c on c.linkedin_url=a.subject_key
where a.status in ('suggested','prepared')
  and coalesce(a.subject_key,'') not ilike '%test%'
  and (
    a.dedupe_key like ('autonomy:'||(now() at time zone 'Europe/Amsterdam')::date::text||':%')
    or lower(a.action_type) like '%dm%'
    or lower(a.channel) in ('linkedin dm','linkedin_dm','linkedin-direct-message')
    or lower(coalesce(a.evidence->>'manual_handoff',''))='true'
  )
order by
  case when lower(a.action_type) like '%dm%' or lower(a.channel) in ('linkedin dm','linkedin_dm','linkedin-direct-message') then 0 else 1 end,
  a.priority desc;
revoke all on public.bg_vandaag from public, anon, authenticated;
grant select on public.bg_vandaag to service_role;
