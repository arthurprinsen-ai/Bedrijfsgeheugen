begin;

create or replace function public.powerhouse_enrich_outbound_execution_gates_v1(
  p_run_date date default ((now() at time zone 'Europe/Amsterdam')::date)
) returns jsonb
language plpgsql
security definer
set search_path = 'public','pg_catalog'
as $$
declare
  v_updated integer := 0;
  v_gmail_capable boolean := false;
  v_linkedin_capable boolean := false;
  v_now timestamptz := now();
begin
  select exists(
    select 1 from public.powerhouse_runtime_events e
    where e.event_type='provider_readback_verified'
      and lower(coalesce(e.source,''))='gmail'
      and coalesce(e.state,'') not in ('error','blocked')
      and e.occurred_at >= v_now - interval '7 days'
  ) into v_gmail_capable;

  select exists(
    select 1 from public.powerhouse_runtime_events e
    where e.event_type='provider_readback_verified'
      and lower(coalesce(e.source,''))='linkedin'
      and e.subject_key='linkedin-outbound'
      and coalesce(e.state,'') not in ('error','blocked')
      and e.occurred_at >= v_now - interval '7 days'
  ) into v_linkedin_capable;

  with nba as (
    select distinct on (opportunity_key,person_key)
      opportunity_key,person_key,status,email,linkedin_url,
      expected_commercial_value_eur,buying_window_confidence,
      action_confidence,best_context,evidence_density
    from public.powerhouse_commercial_next_best_action_v2
    where opportunity_key is not null
    order by opportunity_key,person_key,updated_at desc nulls last
  ), enriched as (
    select a.action_id,a.priority,
      lower(coalesce(a.channel,'')) as channel_norm,
      n.email,n.linkedin_url,n.status as opportunity_status,
      n.expected_commercial_value_eur,n.buying_window_confidence,
      n.action_confidence,n.best_context,n.evidence_density,
      not exists(
        select 1 from public.powerhouse_sales_actions p
        where p.person_key=a.person_key
          and p.action_id<>a.action_id
          and lower(coalesce(p.channel,'')) in ('e-mail','email','linkedin dm','linkedin_dm')
          and p.status in ('prepared','waiting','queued','approved','scheduled','executed','completed','done')
          and coalesce(p.executed_at,p.updated_at,p.created_at) >= v_now - interval '5 days'
      ) as contact_pressure_ok
    from public.powerhouse_sales_actions a
    left join nba n
      on n.opportunity_key=a.opportunity_key
     and (n.person_key=a.person_key or (n.person_key is null and a.person_key is null))
    where a.status='suggested'
      and lower(coalesce(a.channel,'')) in ('e-mail','email','linkedin dm','linkedin_dm')
  )
  update public.powerhouse_sales_actions a
  set evidence=coalesce(a.evidence,'{}'::jsonb) || jsonb_build_object(
    'execution_gate',jsonb_build_object(
      'exact_destination_verified',case
        when e.channel_norm in ('e-mail','email') then nullif(btrim(coalesce(e.email,'')),'') is not null
        when e.channel_norm in ('linkedin dm','linkedin_dm') then nullif(btrim(coalesce(e.linkedin_url,'')),'') is not null
        else false end,
      'eligibility_verified',coalesce(e.opportunity_status,'') in ('open','active','qualified','discovery','proposal')
        and coalesce(e.priority,0)>=80
        and coalesce(e.buying_window_confidence,0)>=0.50
        and coalesce(e.action_confidence,0)>=0.25,
      'contact_pressure_ok',e.contact_pressure_ok,
      'identity_verified',nullif(btrim(coalesce(a.person_key,'')),'') is not null,
      'truth_verified',nullif(btrim(coalesce(e.best_context,'')),'') is not null and coalesce(e.evidence_density,0)>0,
      'provider_capability_verified',case
        when e.channel_norm in ('e-mail','email') then v_gmail_capable
        when e.channel_norm in ('linkedin dm','linkedin_dm') then v_linkedin_capable
        else false end,
      'eligibility_basis','open_opportunity+priority>=80+buying_window_confidence>=0.50+action_confidence>=0.25',
      'economic_value_required',false,
      'observed_expected_commercial_value_eur',coalesce(e.expected_commercial_value_eur,0),
      'provider_readback_contract',case
        when e.channel_norm in ('e-mail','email') then 'gmail-outbound-replies'
        when e.channel_norm in ('linkedin dm','linkedin_dm') then 'linkedin-outbound'
        else null end,
      'outbound_daily_limit',5,
      'checked_at',v_now,
      'fail_closed',true
    )
  ),updated_at=v_now
  from enriched e
  where a.action_id=e.action_id;
  get diagnostics v_updated=row_count;

  insert into public.powerhouse_runtime_events(
    dedupe_key,event_type,source,subject_key,channel,occurred_at,evidence,context,state,data_quality,confidence,updated_at
  ) values (
    'outbound-gate-enrichment:'||to_char(v_now at time zone 'UTC','YYYYMMDDHH24'),
    'outbound_execution_gates_enriched','powerhouse-revenue-acceleration-v1','powerhouse','sales',v_now,
    jsonb_build_object(
      'updated_actions',v_updated,'gmail_provider_capable',v_gmail_capable,'linkedin_provider_capable',v_linkedin_capable,
      'eligibility_basis','open_opportunity+priority>=80+buying_window_confidence>=0.50+action_confidence>=0.25',
      'economic_value_required',false,'outbound_daily_limit',5
    ),
    jsonb_build_object('existing_state_first',true,'reuse_first',true,'fail_closed',true,'no_fabricated_economic_value',true),
    'observed','OBSERVED',1,v_now
  ) on conflict(dedupe_key) do update set evidence=excluded.evidence,context=excluded.context,state=excluded.state,updated_at=v_now;

  return jsonb_build_object(
    'contract','powerhouse-revenue-acceleration-v1','updated_actions',v_updated,
    'gmail_provider_capable',v_gmail_capable,'linkedin_provider_capable',v_linkedin_capable,
    'eligibility_basis','open_opportunity+priority>=80+buying_window_confidence>=0.50+action_confidence>=0.25',
    'economic_value_required',false,'outbound_daily_limit',5
  );
end;
$$;

revoke execute on function public.powerhouse_enrich_outbound_execution_gates_v1(date) from public, anon, authenticated;
grant execute on function public.powerhouse_enrich_outbound_execution_gates_v1(date) to service_role;

commit;
