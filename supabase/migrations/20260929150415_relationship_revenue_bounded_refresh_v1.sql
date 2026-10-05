-- Relationship Revenue bounded refresh v1
create index if not exists powerhouse_runtime_events_person_occurred_idx
  on public.powerhouse_runtime_events(person_key,occurred_at desc)
  where person_key is not null;
create index if not exists powerhouse_opportunities_person_status_idx
  on public.powerhouse_opportunities(person_key,status,last_evidence_at desc)
  where person_key is not null;
create index if not exists powerhouse_sales_outcomes_person_occurred_idx
  on public.powerhouse_sales_outcomes(person_key,occurred_at desc)
  where person_key is not null;

create or replace function public.powerhouse_refresh_relationship_revenue_v1(
  p_run_date date default (now() at time zone 'Europe/Amsterdam')::date
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_now timestamptz:=now();
  v_research integer:=0;
  v_activation integer:=0;
  v_ranked integer:=0;
  v_result jsonb;
begin
  with candidate_people as (
    select distinct person_key
    from public.powerhouse_runtime_events
    where person_key is not null and occurred_at>=v_now-interval '180 days'
    union
    select distinct person_key
    from public.powerhouse_opportunities
    where person_key is not null and coalesce(status,'') not in ('closed','won','lost')
    union
    select distinct person_key
    from public.powerhouse_sales_outcomes
    where person_key is not null and occurred_at>=v_now-interval '180 days'
    union
    select distinct coalesce(nullif(trim(sleutel),''),nullif(trim(linkedin_url),''))
    from public.bg_connecties
    where status in ('in_gesprek','aangeboden')
      and bijgewerkt_op>=v_now-interval '180 days'
      and coalesce(nullif(trim(sleutel),''),nullif(trim(linkedin_url),'')) is not null
  ),
  scored as (
    select
      cp.person_key,
      c.naam person_name,
      c.bedrijf company_name,
      lower(regexp_replace(trim(coalesce(c.bedrijf,'')),'\s+',' ','g')) company_key,
      c.rol role,
      c.linkedin_url,
      c.email,
      c.aanleiding,
      c.status relationship_status,
      case c.status when 'in_gesprek' then .42 when 'aangeboden' then .24 when 'klant' then .65 else .10 end::numeric relationship_warmth,
      case
        when coalesce(c.rol,'') ~* '(ceo|chief executive|eigenaar|owner|founder|oprichter|directeur|managing director)' then 1.00
        when coalesce(c.rol,'') ~* '(cfo|coo|cto|cio|cdo|chief|vp|vice president|head of|partner)' then .88
        when coalesce(c.rol,'') ~* '(manager|lead|principal|director)' then .68
        else .42
      end::numeric decision_influence,
      coalesce(ev.events_30d,0) events_30d,
      coalesce(ac.actions_30d,0) actions_30d,
      coalesce(ou.positive_outcomes,0) positive_outcomes,
      coalesce(op.open_opportunities,0) open_opportunities,
      coalesce(op.max_expected_value_eur,0) max_expected_value_eur,
      coalesce(op.max_expected_revenue_value,0) max_expected_revenue_value,
      greatest(c.bijgewerkt_op,ev.last_event_at,ou.last_outcome_at,op.last_opportunity_evidence_at) last_relevant_at,
      least(1::numeric,greatest(0::numeric,
        .38*(case c.status when 'in_gesprek' then .42 when 'aangeboden' then .24 when 'klant' then .65 else .10 end)
        +.27*(case
          when coalesce(c.rol,'') ~* '(ceo|chief executive|eigenaar|owner|founder|oprichter|directeur|managing director)' then 1.00
          when coalesce(c.rol,'') ~* '(cfo|coo|cto|cio|cdo|chief|vp|vice president|head of|partner)' then .88
          when coalesce(c.rol,'') ~* '(manager|lead|principal|director)' then .68
          else .42 end)
        +.12*least(1,coalesce(ev.events_30d,0)/4.0)
        +.13*(case when coalesce(op.open_opportunities,0)>0 then 1 else 0 end)
        +.10*least(1,coalesce(ou.positive_outcomes,0)/2.0)
      )) relationship_revenue_score,
      least(1::numeric,greatest(0::numeric,
        .30*(case when nullif(trim(c.linkedin_url),'') is not null then 1 else 0 end)
        +.15*(case when nullif(trim(c.email),'') is not null then 1 else 0 end)
        +.20*(case when nullif(trim(c.bedrijf),'') is not null then 1 else 0 end)
        +.15*(case when nullif(trim(c.rol),'') is not null then 1 else 0 end)
        +.10*(case when greatest(c.bijgewerkt_op,ev.last_event_at,ou.last_outcome_at,op.last_opportunity_evidence_at) is not null then 1 else 0 end)
        +.10*(case when coalesce(ev.events_30d,0)>0 or coalesce(op.open_opportunities,0)>0 then 1 else 0 end)
      )) first_party_evidence_score
    from candidate_people cp
    join public.bg_connecties c
      on coalesce(nullif(trim(c.sleutel),''),nullif(trim(c.linkedin_url),''))=cp.person_key
       or c.linkedin_url=cp.person_key
    left join lateral (
      select count(*) filter(where occurred_at>=v_now-interval '30 days')::int events_30d,
             max(occurred_at) last_event_at
      from public.powerhouse_runtime_events e
      where e.person_key=cp.person_key and e.occurred_at>=v_now-interval '180 days'
    ) ev on true
    left join lateral (
      select count(*) filter(where executed_at>=v_now-interval '30 days')::int actions_30d
      from public.powerhouse_sales_actions a where a.person_key=cp.person_key
    ) ac on true
    left join lateral (
      select count(*) filter(where lower(coalesce(outcome_type,'')) ~ '(reply|response|meeting|appointment|proposal|qualified|won|order|revenue)')::int positive_outcomes,
             max(occurred_at) last_outcome_at
      from public.powerhouse_sales_outcomes o where o.person_key=cp.person_key
    ) ou on true
    left join lateral (
      select count(*) filter(where coalesce(status,'') not in ('closed','won','lost'))::int open_opportunities,
             max(coalesce(expected_value_eur,0)) max_expected_value_eur,
             max(coalesce(expected_revenue_value,0)) max_expected_revenue_value,
             max(last_evidence_at) last_opportunity_evidence_at
      from public.powerhouse_opportunities o
      where o.person_key=cp.person_key
    ) op on true
  ),
  research_ranked as (
    select s.*,
      case
        when s.actions_30d>=3 then 'fatigue_hold'
        when nullif(trim(s.company_key),'') is null then 'company_identity_research'
        when s.decision_influence<.60 then 'decision_role_research'
        when s.last_relevant_at is null or s.last_relevant_at<v_now-interval '120 days' then 'freshness_research'
        when s.events_30d=0 and s.open_opportunities=0 then 'public_web_signal_research'
        else 'powerhouse_self_sufficient'
      end research_need,
      row_number() over(order by s.relationship_revenue_score desc,s.first_party_evidence_score desc,s.last_relevant_at desc nulls last,s.person_key) rn
    from scored s
    where s.relationship_revenue_score>=.50 and s.actions_30d<3
  )
  insert into public.powerhouse_sales_actions(
    dedupe_key,subject_key,person_key,company_key,action_type,channel,priority,reason,
    evidence,message_draft,source_url,status,due_at,expected_value_eur,person_name,company_name,role
  )
  select
    'relationship-research:'||md5(r.person_key)||':'||r.research_need,
    'relationship:'||r.person_key,
    r.person_key,r.company_key,'research_enrichment','internal',
    round((100*r.relationship_revenue_score)::numeric,2),
    'Enrich this high-value existing relationship from first-party evidence and bounded public-web sources before deciding on outreach.',
    jsonb_build_object(
      'contract','powerhouse-relationship-revenue-engine-v1',
      'research_need',r.research_need,
      'relationship_revenue_score',r.relationship_revenue_score,
      'first_party_evidence_score',r.first_party_evidence_score,
      'external_side_effect_allowed',false,
      'unsolicited_outreach_requires_human_authorization',true
    ),
    '',coalesce(r.linkedin_url,''),'suggested',v_now,0,r.person_name,r.company_name,r.role
  from research_ranked r
  where r.rn<=50 and r.research_need not in ('powerhouse_self_sufficient','fatigue_hold')
  on conflict(dedupe_key) do update set
    priority=excluded.priority,reason=excluded.reason,evidence=excluded.evidence,source_url=excluded.source_url,due_at=excluded.due_at,updated_at=v_now;
  get diagnostics v_research=row_count;

  with candidate_people as (
    select distinct person_key
    from public.powerhouse_opportunities
    where person_key is not null and coalesce(status,'') not in ('closed','won','lost')
  ),
  activation as (
    select
      cp.person_key,c.naam person_name,c.bedrijf company_name,c.rol role,c.linkedin_url,c.aanleiding,
      lower(regexp_replace(trim(coalesce(c.bedrijf,'')),'\s+',' ','g')) company_key,
      case c.status when 'in_gesprek' then .42 when 'aangeboden' then .24 when 'klant' then .65 else .10 end::numeric relationship_warmth,
      case
        when coalesce(c.rol,'') ~* '(ceo|chief executive|eigenaar|owner|founder|oprichter|directeur|managing director)' then 1.00
        when coalesce(c.rol,'') ~* '(cfo|coo|cto|cio|cdo|chief|vp|vice president|head of|partner)' then .88
        when coalesce(c.rol,'') ~* '(manager|lead|principal|director)' then .68
        else .42
      end::numeric decision_influence,
      coalesce(op.open_opportunities,0) open_opportunities,
      coalesce(op.max_expected_value_eur,0) max_expected_value_eur,
      coalesce(op.max_expected_revenue_value,0) max_expected_revenue_value,
      coalesce(ac.actions_30d,0) actions_30d
    from candidate_people cp
    join public.bg_connecties c
      on coalesce(nullif(trim(c.sleutel),''),nullif(trim(c.linkedin_url),''))=cp.person_key
       or c.linkedin_url=cp.person_key
    left join lateral (
      select count(*) filter(where coalesce(status,'') not in ('closed','won','lost'))::int open_opportunities,
             max(coalesce(expected_value_eur,0)) max_expected_value_eur,
             max(coalesce(expected_revenue_value,0)) max_expected_revenue_value
      from public.powerhouse_opportunities o where o.person_key=cp.person_key
    ) op on true
    left join lateral (
      select count(*) filter(where executed_at>=v_now-interval '30 days')::int actions_30d
      from public.powerhouse_sales_actions a where a.person_key=cp.person_key
    ) ac on true
  ),
  ranked as (
    select a.*,
      least(1::numeric,greatest(0::numeric,.55*a.relationship_warmth+.45*a.decision_influence)) relationship_revenue_score,
      row_number() over(order by a.max_expected_revenue_value desc,.55*a.relationship_warmth+.45*a.decision_influence desc,a.person_key) rn
    from activation a
    where a.open_opportunities>0 and a.max_expected_value_eur>0 and a.actions_30d<3
      and (.55*a.relationship_warmth+.45*a.decision_influence)>=.55
  )
  insert into public.powerhouse_sales_actions(
    dedupe_key,subject_key,person_key,company_key,action_type,channel,priority,reason,
    evidence,message_draft,source_url,status,due_at,expected_value_eur,person_name,company_name,role
  )
  select
    'relationship-activation-review:'||md5(r.person_key),
    'relationship:'||r.person_key,
    r.person_key,r.company_key,'commercial_outreach_review','internal',
    round((100*r.relationship_revenue_score)::numeric,2),
    'Existing relationship plus observed opportunity/value evidence merits an activation decision.',
    jsonb_build_object(
      'contract','powerhouse-relationship-revenue-engine-v1',
      'activation_review_ready',true,
      'open_opportunities',r.open_opportunities,
      'max_expected_value_eur',r.max_expected_value_eur,
      'max_expected_revenue_value',r.max_expected_revenue_value,
      'external_side_effect_allowed',false,
      'identity_and_destination_verification_required',true
    ),
    case when r.aanleiding is not null and trim(r.aanleiding)<>''
         then 'Persoonlijke opvolging voorbereiden op basis van deze concrete aanleiding: '||left(r.aanleiding,220)
         else 'Persoonlijke opvolging voorbereiden op basis van bestaande relatie plus actuele opportunity-evidence; geen generieke pitch.'
    end,
    coalesce(r.linkedin_url,''),'prepared',v_now,r.max_expected_value_eur,r.person_name,r.company_name,r.role
  from ranked r where r.rn<=20
  on conflict(dedupe_key) do update set
    priority=excluded.priority,reason=excluded.reason,evidence=excluded.evidence,message_draft=excluded.message_draft,
    source_url=excluded.source_url,expected_value_eur=excluded.expected_value_eur,updated_at=v_now;
  get diagnostics v_activation=row_count;

  with candidate_people as (
    select distinct person_key from public.powerhouse_runtime_events where person_key is not null and occurred_at>=v_now-interval '180 days'
    union select distinct person_key from public.powerhouse_opportunities where person_key is not null and coalesce(status,'') not in ('closed','won','lost')
    union select distinct person_key from public.powerhouse_sales_outcomes where person_key is not null and occurred_at>=v_now-interval '180 days'
  )
  select count(*) into v_ranked from candidate_people;

  v_result:=jsonb_build_object(
    'contract','powerhouse-relationship-revenue-engine-v1',
    'bounded_candidate_refresh',true,
    'run_date',p_run_date,
    'executed_at',v_now,
    'ranked_relationships',v_ranked,
    'research_actions_touched',v_research,
    'activation_reviews_touched',v_activation,
    'apollo_required',false,
    'source_priority',jsonb_build_array('powerhouse_first_party','public_web','optional_vendor_fallback'),
    'external_outreach_executed',false
  );

  insert into public.powerhouse_runtime_events(
    dedupe_key,event_type,source,subject_key,occurred_at,evidence,context,state,data_quality,confidence
  ) values (
    'relationship-revenue:'||p_run_date::text,
    'relationship_revenue_cycle',
    'powerhouse-relationship-revenue-engine-v1',
    'growth-revenue-os',v_now,v_result,
    jsonb_build_object('reuse_first',true,'no_parallel_crm',true,'vendor_dependency',false,'external_side_effects',false),
    'actioned','VERIFIED',1
  )
  on conflict(dedupe_key) do update set
    occurred_at=excluded.occurred_at,evidence=excluded.evidence,context=excluded.context,state=excluded.state,updated_at=v_now;

  return v_result;
exception when others then
  return jsonb_build_object('contract','powerhouse-relationship-revenue-engine-v1','healthy',false,'error',sqlerrm,'sqlstate',sqlstate);
end;
$$;

revoke execute on function public.powerhouse_refresh_relationship_revenue_v1(date) from public,anon,authenticated;
grant execute on function public.powerhouse_refresh_relationship_revenue_v1(date) to service_role;
