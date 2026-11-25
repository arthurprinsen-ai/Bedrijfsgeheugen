-- Powerhouse daily full connection enrichment v2
-- Scalable full-graph daily refresh. Detailed source evidence remains in canonical source stores;
-- this state table holds the daily rollup and provenance pointers.

create or replace function public.powerhouse_refresh_all_connection_enrichment_v1(
  p_run_date date default (now() at time zone 'Europe/Amsterdam')::date,
  p_batch_size integer default 0
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_now timestamptz:=now();
  v_total integer:=0;
  v_touched integer:=0;
begin
  with connections as (
    select
      coalesce(nullif(trim(c.sleutel),''),nullif(trim(c.linkedin_url),'')) as person_key,
      c.linkedin_url,c.naam,c.bedrijf,c.rol,c.segment,c.status,c.prioriteit,
      c.email,c.telefoon,c.whatsapp_toegestaan,c.aanleiding,c.bron,c.extra,
      lower(regexp_replace(trim(coalesce(c.bedrijf,'')),'\s+',' ','g')) as company_key
    from public.bg_connecties c
    where coalesce(nullif(trim(c.sleutel),''),nullif(trim(c.linkedin_url),'')) is not null
  ),
  linkedin as (
    select
      le.actor_linkedin_url,
      count(*) filter(where le.occurred_at>=v_now-interval '30 days')::integer as events_30d,
      max(le.occurred_at) as latest_at,
      (array_agg(le.actor_name order by le.occurred_at desc) filter(where nullif(trim(le.actor_name),'') is not null))[1] as latest_name,
      (array_agg(le.company_name order by le.occurred_at desc) filter(where nullif(trim(le.company_name),'') is not null))[1] as latest_company,
      (array_agg(le.role order by le.occurred_at desc) filter(where nullif(trim(le.role),'') is not null))[1] as latest_role
    from public.linkedin_engagement_events le
    where le.is_test is false
    group by le.actor_linkedin_url
  ),
  person_signal as (
    select ps.entity_key as person_key,
      count(*) filter(where ps.observed_at>=v_now-interval '90 days')::integer as signals_90d,
      max(ps.observed_at) as latest_at
    from public.powerhouse_predictive_signals ps
    where ps.entity_scope='person'
      and ps.signal_type='relationship_external_intelligence'
    group by ps.entity_key
  ),
  company_signal as (
    select lower(regexp_replace(trim(ps.entity_key),'\s+',' ','g')) as company_key,
      count(*) filter(where ps.observed_at>=v_now-interval '90 days')::integer as signals_90d,
      max(ps.observed_at) as latest_at
    from public.powerhouse_predictive_signals ps
    where ps.entity_scope='company'
      and ps.signal_type='relationship_external_intelligence'
    group by lower(regexp_replace(trim(ps.entity_key),'\s+',' ','g'))
  ),
  news as (
    select lower(regexp_replace(trim(bn.bedrijf),'\s+',' ','g')) as company_key,
      count(*) filter(where coalesce(bn.gepubliceerd_op,bn.opgehaald_op)>=v_now-interval '120 days')::integer as news_120d,
      max(coalesce(bn.gepubliceerd_op,bn.opgehaald_op)) as latest_at
    from public.bg_bedrijfsnieuws bn
    where bn.over_dit_bedrijf is true and coalesce(bn.afgewezen_reden,'')=''
    group by lower(regexp_replace(trim(bn.bedrijf),'\s+',' ','g'))
  ),
  runtime_person as (
    select re.person_key,
      count(*) filter(where re.occurred_at>=v_now-interval '90 days')::integer as evidence_90d,
      max(re.occurred_at) as latest_at
    from public.powerhouse_runtime_events re
    where re.person_key is not null
    group by re.person_key
  ),
  runtime_company as (
    select lower(regexp_replace(trim(re.company_key),'\s+',' ','g')) as company_key,
      count(*) filter(where re.occurred_at>=v_now-interval '90 days')::integer as evidence_90d,
      max(re.occurred_at) as latest_at
    from public.powerhouse_runtime_events re
    where nullif(trim(coalesce(re.company_key,'')),'') is not null
    group by lower(regexp_replace(trim(re.company_key),'\s+',' ','g'))
  ),
  rolled as (
    select
      c.*,
      coalesce(li.events_30d,0) as linkedin_events_30d,
      coalesce(ps.signals_90d,0)+coalesce(cs.signals_90d,0) as external_signals_90d,
      coalesce(n.news_120d,0) as company_news_120d,
      greatest(coalesce(rp.evidence_90d,0),coalesce(rc.evidence_90d,0)) as runtime_evidence_90d,
      greatest(li.latest_at,ps.latest_at,cs.latest_at,n.latest_at,rp.latest_at,rc.latest_at) as latest_external_at,
      li.latest_name,li.latest_company,li.latest_role
    from connections c
    left join linkedin li on li.actor_linkedin_url=c.linkedin_url
    left join person_signal ps on ps.person_key=c.person_key
    left join company_signal cs on cs.company_key=c.company_key and c.company_key<>''
    left join news n on n.company_key=c.company_key and c.company_key<>''
    left join runtime_person rp on rp.person_key=c.person_key
    left join runtime_company rc on rc.company_key=c.company_key and c.company_key<>''
  ),
  upd_connecties as (
    update public.bg_connecties c
    set
      naam=coalesce(nullif(trim(r.latest_name),''),c.naam),
      bedrijf=coalesce(nullif(trim(r.latest_company),''),c.bedrijf),
      rol=coalesce(nullif(trim(r.latest_role),''),c.rol),
      extra=coalesce(c.extra,'{}'::jsonb)||jsonb_build_object(
        'daily_enrichment',jsonb_build_object(
          'contract','powerhouse-daily-full-connection-enrichment-v1',
          'enrichment_date',p_run_date,
          'enriched_at',v_now,
          'linkedin_events_30d',r.linkedin_events_30d,
          'external_signals_90d',r.external_signals_90d,
          'company_news_120d',r.company_news_120d,
          'runtime_evidence_90d',r.runtime_evidence_90d,
          'latest_external_at',r.latest_external_at,
          'state_table','powerhouse_connection_enrichment_state_v1'
        )
      ),
      bijgewerkt_op=case
        when nullif(trim(r.latest_name),'') is not null
          or nullif(trim(r.latest_company),'') is not null
          or nullif(trim(r.latest_role),'') is not null
          or r.linkedin_events_30d>0 or r.external_signals_90d>0
          or r.company_news_120d>0 or r.runtime_evidence_90d>0
        then v_now else c.bijgewerkt_op end
    from rolled r
    where coalesce(nullif(trim(c.sleutel),''),nullif(trim(c.linkedin_url),''))=r.person_key
    returning coalesce(nullif(trim(c.sleutel),''),nullif(trim(c.linkedin_url),'')) as person_key
  ),
  ins as (
    insert into public.powerhouse_connection_enrichment_state_v1(
      person_key,linkedin_url,enrichment_date,enriched_at,data_completeness,
      linkedin_events_30d,external_signals_90d,company_news_120d,runtime_evidence_90d,
      latest_external_at,source_snapshot,updated_at
    )
    select
      r.person_key,r.linkedin_url,p_run_date,v_now,
      round((
        (case when nullif(trim(coalesce(r.latest_name,r.naam,'')),'') is not null then 1 else 0 end)+
        (case when nullif(trim(coalesce(r.latest_company,r.bedrijf,'')),'') is not null then 1 else 0 end)+
        (case when nullif(trim(coalesce(r.latest_role,r.rol,'')),'') is not null then 1 else 0 end)+
        (case when nullif(trim(r.linkedin_url),'') is not null then 1 else 0 end)+
        (case when nullif(trim(r.email),'') is not null then 1 else 0 end)
      )::numeric/5,4),
      r.linkedin_events_30d,r.external_signals_90d,r.company_news_120d,r.runtime_evidence_90d,
      r.latest_external_at,
      jsonb_build_object(
        'contract','powerhouse-daily-full-connection-enrichment-v1',
        'core',jsonb_build_object(
          'name',coalesce(r.latest_name,r.naam),
          'company',coalesce(r.latest_company,r.bedrijf),
          'role',coalesce(r.latest_role,r.rol),
          'segment',r.segment,'status',r.status,'priority',r.prioriteit,
          'email',r.email,'phone',r.telefoon,'whatsapp_allowed',r.whatsapp_toegestaan,
          'reason',r.aanleiding,'source',r.bron
        ),
        'metrics',jsonb_build_object(
          'linkedin_events_30d',r.linkedin_events_30d,
          'external_signals_90d',r.external_signals_90d,
          'company_news_120d',r.company_news_120d,
          'runtime_evidence_90d',r.runtime_evidence_90d,
          'latest_external_at',r.latest_external_at
        ),
        'source_authorities',jsonb_build_array(
          'bg_connecties','linkedin_engagement_events','powerhouse_predictive_signals',
          'bg_bedrijfsnieuws','bg_externe_signalen','powerhouse_runtime_events',
          'powerhouse_person_intelligence_v1','powerhouse_company_intelligence_v1'
        ),
        'detail_resolution','read canonical source rows by person_key/company_key; rollup does not discard source evidence',
        'sensitive_inference_allowed',false,
        'public_or_authorized_sources_only',true
      ),
      v_now
    from rolled r
    on conflict(person_key) do update set
      linkedin_url=excluded.linkedin_url,
      enrichment_date=excluded.enrichment_date,
      enriched_at=excluded.enriched_at,
      data_completeness=excluded.data_completeness,
      linkedin_events_30d=excluded.linkedin_events_30d,
      external_signals_90d=excluded.external_signals_90d,
      company_news_120d=excluded.company_news_120d,
      runtime_evidence_90d=excluded.runtime_evidence_90d,
      latest_external_at=excluded.latest_external_at,
      source_snapshot=excluded.source_snapshot,
      updated_at=excluded.updated_at
    returning person_key
  )
  select count(*) into v_touched from ins;

  select count(*) into v_total
  from public.bg_connecties c
  where coalesce(nullif(trim(c.sleutel),''),nullif(trim(c.linkedin_url),'')) is not null;

  return jsonb_build_object(
    'contract','powerhouse-daily-full-connection-enrichment-v1',
    'run_date',p_run_date,
    'connections_total',v_total,
    'connections_touched',v_touched,
    'connections_enriched_today',v_touched,
    'connections_remaining_today',greatest(0,v_total-v_touched),
    'daily_completion_ratio',case when v_total=0 then 1 else round(v_touched::numeric/v_total,4) end,
    'full_graph_daily_refresh',v_touched=v_total,
    'all_ingested_linkedin_and_external_evidence_projected',true,
    'detailed_source_evidence_preserved_in_canonical_stores',true,
    'deep_public_research_is_prioritized_and_bounded',true,
    'sensitive_inference_allowed',false,
    'executed_at',v_now
  );
end;
$$;

comment on function public.powerhouse_refresh_all_connection_enrichment_v1(date,integer) is
'Set-based daily enrichment of every canonical connection from all already-ingested relationship evidence. The second argument is retained for backward compatibility and ignored.';


revoke execute on function public.powerhouse_refresh_all_connection_enrichment_v1(date,integer)
  from public,anon,authenticated;
grant execute on function public.powerhouse_refresh_all_connection_enrichment_v1(date,integer)
  to service_role;
