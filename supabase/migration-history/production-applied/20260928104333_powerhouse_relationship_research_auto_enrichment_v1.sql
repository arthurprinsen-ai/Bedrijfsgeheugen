
-- Powerhouse relationship research auto-enrichment v1
-- Executes internal research from existing public evidence stores and feeds verified evidence
-- back into the canonical runtime event -> trigger -> opportunity lineage.

create or replace function public.powerhouse_execute_relationship_research_v1(
  p_run_date date default (now() at time zone 'Europe/Amsterdam')::date
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_now timestamptz:=now();
  v_executed integer:=0;
  v_events integer:=0;
  v_result jsonb;
begin
  with candidates as (
    select a.*
    from public.powerhouse_sales_actions a
    where a.action_type='research_enrichment'
      and a.channel='internal'
      and a.status in ('suggested','prepared','waiting')
      and a.dedupe_key like 'relationship-research:%'
    order by a.priority desc,a.created_at asc
    limit 25
  ), evidence_match as (
    select c.action_id,c.dedupe_key,c.person_key,c.company_key,c.company_name,c.person_name,c.role,
      coalesce(n.url,s.url,p.source_ref) as source_url,
      coalesce(n.titel,s.titel,p.evidence->>'headline',p.evidence->>'title') as headline,
      coalesce(n.haak,s.samenvatting,p.evidence->>'summary',p.evidence->>'signal') as summary,
      greatest(
        coalesce(n.zekerheid,0),
        coalesce(s.vertrouwen,0),
        least(1,0.7*coalesce(p.strength,0)+0.3*coalesce(p.novelty,0))
      ) as evidence_confidence,
      greatest(
        coalesce(n.gepubliceerd_op,n.opgehaald_op,'epoch'::timestamptz),
        coalesce(s.gepubliceerd_op,s.opgehaald_op,'epoch'::timestamptz),
        coalesce(p.observed_at,'epoch'::timestamptz)
      ) as observed_at
    from candidates c
    left join lateral (
      select b.*
      from public.bg_bedrijfsnieuws b
      where b.over_dit_bedrijf is true
        and coalesce(b.afgewezen_reden,'')=''
        and b.gepubliceerd_op>=v_now-interval '120 days'
        and (
          lower(trim(b.bedrijf))=lower(trim(coalesce(c.company_name,c.company_key,'')))
          or lower(trim(b.bedrijf))=lower(trim(coalesce(c.company_key,'')))
        )
      order by b.gepubliceerd_op desc nulls last,b.opgehaald_op desc
      limit 1
    ) n on true
    left join lateral (
      select x.*
      from public.bg_externe_signalen x
      where x.toegestaan is true
        and coalesce(x.ruis_reden,'')=''
        and coalesce(x.gepubliceerd_op,x.opgehaald_op)>=v_now-interval '120 days'
        and nullif(trim(coalesce(c.company_name,c.company_key,'')),'') is not null
        and lower(concat_ws(' ',x.titel,x.samenvatting,x.onderwerp,x.domein))
              like '%'||lower(trim(coalesce(c.company_name,c.company_key,'')))||'%'
      order by coalesce(x.gepubliceerd_op,x.opgehaald_op) desc
      limit 1
    ) s on n.url is null
    left join lateral (
      select ps.*
      from public.powerhouse_predictive_signals ps
      where ps.entity_scope='company'
        and ps.observed_at>=v_now-interval '120 days'
        and lower(trim(ps.entity_key))=lower(trim(coalesce(c.company_key,c.company_name,'')))
      order by ps.observed_at desc
      limit 1
    ) p on n.url is null and s.url is null
  ), usable as (
    select *
    from evidence_match
    where nullif(trim(coalesce(source_url,'')),'') is not null
       or nullif(trim(coalesce(headline,'')),'') is not null
       or nullif(trim(coalesce(summary,'')),'') is not null
  )
  update public.powerhouse_sales_actions a
  set status='executed',
      executed_at=v_now,
      evidence=coalesce(a.evidence,'{}'::jsonb)||jsonb_build_object(
        'public_research_execution',jsonb_build_object(
          'contract','powerhouse-relationship-research-auto-enrichment-v1',
          'source_url',u.source_url,
          'headline',u.headline,
          'summary',u.summary,
          'confidence',u.evidence_confidence,
          'observed_at',u.observed_at,
          'executed_at',v_now,
          'vendor_used',false,
          'evidence_only',true
        )
      ),
      source_url=coalesce(nullif(u.source_url,''),a.source_url),
      updated_at=v_now
  from usable u
  where a.action_id=u.action_id;
  get diagnostics v_executed=row_count;

  with executed as (
    select a.*
    from public.powerhouse_sales_actions a
    where a.action_type='research_enrichment'
      and a.dedupe_key like 'relationship-research:%'
      and a.executed_at=v_now
  )
  insert into public.powerhouse_runtime_events(
    dedupe_key,event_type,source,subject_key,person_key,company_key,occurred_at,evidence,context,state,data_quality,confidence
  )
  select
    'relationship-research-evidence:'||a.action_id::text,
    'relationship_public_research_evidence',
    'powerhouse-relationship-research-auto-enrichment-v1',
    a.subject_key,a.person_key,a.company_key,v_now,
    jsonb_build_object(
      'action_id',a.action_id,
      'headline',a.evidence#>>'{public_research_execution,headline}',
      'summary',a.evidence#>>'{public_research_execution,summary}',
      'source_url',a.evidence#>>'{public_research_execution,source_url}',
      'trigger',a.evidence#>>'{public_research_execution,headline}',
      'evidence_only',true,
      'vendor_used',false
    ),
    jsonb_build_object(
      'person_name',a.person_name,
      'company_name',a.company_name,
      'role',a.role,
      'research_contract','powerhouse-relationship-research-auto-enrichment-v1',
      'external_side_effects',false
    ),
    'observed','VERIFIED',
    least(1,greatest(0,coalesce((a.evidence#>>'{public_research_execution,confidence}')::numeric,0.5)))
  from executed a
  on conflict(dedupe_key) do update set
    occurred_at=excluded.occurred_at,evidence=excluded.evidence,context=excluded.context,
    state=excluded.state,data_quality=excluded.data_quality,confidence=excluded.confidence,updated_at=v_now;
  get diagnostics v_events=row_count;

  v_result:=jsonb_build_object(
    'contract','powerhouse-relationship-research-auto-enrichment-v1',
    'run_date',p_run_date,
    'executed_at',v_now,
    'research_actions_executed',v_executed,
    'runtime_evidence_events_touched',v_events,
    'vendor_used',false,
    'external_outreach_executed',false
  );
  return v_result;
end;
$$;

revoke execute on function public.powerhouse_execute_relationship_research_v1(date) from public,anon,authenticated;
grant execute on function public.powerhouse_execute_relationship_research_v1(date) to service_role;

create or replace function public.powerhouse_trigger_based_mkb_acquisition_cycle_v1(
  p_run_date date default (now() at time zone 'Europe/Amsterdam')::date
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_relationship jsonb;
  v_research jsonb;
  v_trigger jsonb;
  v_learning jsonb;
begin
  v_relationship:=public.powerhouse_refresh_relationship_revenue_v1(p_run_date);
  v_research:=public.powerhouse_execute_relationship_research_v1(p_run_date);
  v_trigger:=public.powerhouse_refresh_trigger_based_mkb_acquisition_v1(p_run_date);
  v_learning:=public.powerhouse_commercial_learning_cycle_v1(p_run_date);
  return jsonb_build_object(
    'contract','powerhouse-trigger-based-mkb-acquisition-cycle-v1',
    'relationship_revenue',v_relationship,
    'relationship_research',v_research,
    'trigger_acquisition',v_trigger,
    'commercial_learning',v_learning,
    'run_date',p_run_date,
    'executed_at',now()
  );
end;
$$;

revoke execute on function public.powerhouse_execute_relationship_research_v1(date) from public,anon,authenticated;
grant execute on function public.powerhouse_execute_relationship_research_v1(date) to service_role;
