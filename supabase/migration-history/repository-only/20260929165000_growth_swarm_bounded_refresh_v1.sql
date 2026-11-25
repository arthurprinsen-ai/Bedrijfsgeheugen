-- Growth Swarm bounded refresh v1
create index if not exists bg_connecties_company_norm_idx
  on public.bg_connecties ((lower(regexp_replace(trim(coalesce(bedrijf,'')),'\s+',' ','g'))));
create index if not exists powerhouse_opportunities_company_status_idx
  on public.powerhouse_opportunities(company_key,status,last_evidence_at desc);
create index if not exists powerhouse_sales_outcomes_company_recent_idx
  on public.powerhouse_sales_outcomes(company_key,occurred_at desc);

create or replace function public.powerhouse_refresh_growth_swarm_v1(
  p_run_date date default (now() at time zone 'Europe/Amsterdam')::date
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_now timestamptz:=now();
  v_accounts integer:=0;
  v_dossiers integer:=0;
  v_content integer:=0;
  v_referrals integer:=0;
begin
  with candidate_companies as (
    select distinct company_key
    from public.powerhouse_mkb_trigger_intelligence_v1
    where do_not_contact_reason is null and observed_at>=v_now-interval '90 days'
    union
    select distinct lower(regexp_replace(trim(company_key),'\s+',' ','g'))
    from public.powerhouse_opportunities
    where nullif(trim(company_key),'') is not null
      and coalesce(status,'') not in ('closed','won','lost')
    union
    select distinct lower(regexp_replace(trim(entity_key),'\s+',' ','g'))
    from public.powerhouse_predictive_signals
    where entity_scope='company' and observed_at>=v_now-interval '90 days'
    union
    select distinct lower(regexp_replace(trim(company_key),'\s+',' ','g'))
    from public.powerhouse_sales_outcomes
    where nullif(trim(company_key),'') is not null and occurred_at>=v_now-interval '180 days'
    union
    select distinct lower(regexp_replace(trim(company_key),'\s+',' ','g'))
    from public.scan_inzendingen
    where nullif(trim(company_key),'') is not null and aangemaakt>=v_now-interval '180 days'
  ),
  best_people as (
    select distinct on (lower(regexp_replace(trim(coalesce(c.bedrijf,'')),'\s+',' ','g')))
      lower(regexp_replace(trim(coalesce(c.bedrijf,'')),'\s+',' ','g')) company_key,
      coalesce(nullif(trim(c.sleutel),''),nullif(trim(c.linkedin_url),'')) person_key,
      c.naam person_name,c.bedrijf company_name,c.rol role,
      least(1::numeric,greatest(0::numeric,
        .55*(case c.status when 'klant' then .65 when 'in_gesprek' then .42 when 'aangeboden' then .20 else .10 end)
        +.45*(case
          when coalesce(c.rol,'') ~* '(ceo|chief executive|eigenaar|owner|founder|oprichter|directeur|managing director)' then 1.00
          when coalesce(c.rol,'') ~* '(cfo|coo|cto|cio|cdo|chief|vp|vice president|head of|partner)' then .88
          when coalesce(c.rol,'') ~* '(manager|lead|principal|director)' then .68
          else .42 end)
      )) relationship_score
    from public.bg_connecties c
    join candidate_companies cc
      on cc.company_key=lower(regexp_replace(trim(coalesce(c.bedrijf,'')),'\s+',' ','g'))
    where nullif(trim(coalesce(c.bedrijf,'')),'') is not null
      and coalesce(nullif(trim(c.sleutel),''),nullif(trim(c.linkedin_url),'')) is not null
    order by lower(regexp_replace(trim(coalesce(c.bedrijf,'')),'\s+',' ','g')),
      relationship_score desc,c.bijgewerkt_op desc nulls last
  ),
  triggers as (
    select distinct on (company_key)
      company_key,trigger_key,trigger_type,confidence,observed_at,problem_hypothesis,trigger_evidence_ref
    from public.powerhouse_mkb_trigger_intelligence_v1
    where do_not_contact_reason is null and observed_at>=v_now-interval '90 days'
    order by company_key,confidence desc,observed_at desc
  ),
  opp as (
    select lower(regexp_replace(trim(company_key),'\s+',' ','g')) company_key,
      max(coalesce(expected_value_eur,0)) expected_value_eur,
      max(coalesce(expected_revenue_value,0)) expected_revenue_eur,
      count(*) filter(where coalesce(status,'') not in ('closed','won','lost'))::int open_opportunities
    from public.powerhouse_opportunities
    where nullif(trim(company_key),'') is not null
    group by 1
  ),
  latest_scan as (
    select distinct on (lower(regexp_replace(trim(company_key),'\s+',' ','g')))
      lower(regexp_replace(trim(company_key),'\s+',' ','g')) company_key,branche,score,payload,aangemaakt
    from public.scan_inzendingen
    where nullif(trim(company_key),'') is not null
    order by lower(regexp_replace(trim(company_key),'\s+',' ','g')),aangemaakt desc
  ),
  predictive as (
    select lower(regexp_replace(trim(entity_key),'\s+',' ','g')) company_key,
      round(avg(least(1::numeric,greatest(0::numeric,coalesce(strength,0))) *
        (.65+.35*least(1::numeric,greatest(0::numeric,coalesce(novelty,0))))),4) external_signal_score
    from public.powerhouse_predictive_signals
    where entity_scope='company' and observed_at>=v_now-interval '90 days'
    group by 1
  ),
  source as (
    select
      cc.company_key,
      coalesce(bp.company_name,cc.company_key) company_name,
      bp.person_key,bp.person_name,bp.role,coalesce(bp.relationship_score,0) relationship_score,
      coalesce(t.confidence,0) trigger_score,
      t.trigger_key,t.trigger_type,t.problem_hypothesis,t.trigger_evidence_ref,t.observed_at trigger_observed_at,
      coalesce(prev.dark_funnel_score,0) dark_funnel_score,
      case when ls.score is null then 0
           when ls.score>1 then 1-least(1,greatest(0,ls.score/100.0))
           else 1-least(1,greatest(0,ls.score)) end friction_score,
      least(1::numeric,greatest(0::numeric,
        .45*(case when ls.score is null then 0 when ls.score>1 then 1-least(1,greatest(0,ls.score/100.0)) else 1-least(1,greatest(0,ls.score)) end)
        +.30*coalesce(ps.external_signal_score,0)+.25*coalesce(bp.relationship_score,0)
      )) knowledge_risk_score,
      least(1::numeric,greatest(0::numeric,
        .40*(case when coalesce(t.trigger_type,'') in ('buy_sell_ma','post_merger_integration','investor_pe') then coalesce(t.confidence,0) else 0 end)
        +.30*(case when ls.score is null then 0 when ls.score>1 then 1-least(1,greatest(0,ls.score/100.0)) else 1-least(1,greatest(0,ls.score)) end)
        +.30*coalesce(ps.external_signal_score,0)
      )) ma_risk_score,
      greatest(coalesce(o.expected_value_eur,0),case when coalesce(t.confidence,0)>=.60 and coalesce(bp.relationship_score,0)>=.50 then 2900 else 0 end) expected_value_eur,
      greatest(coalesce(o.expected_revenue_eur,0),coalesce(prev.expected_revenue_eur,0)) expected_revenue_eur,
      coalesce(o.open_opportunities,0) open_opportunities,
      ls.branche,ls.aangemaakt last_scan_at,
      coalesce(ps.external_signal_score,0) external_signal_score
    from candidate_companies cc
    left join best_people bp on bp.company_key=cc.company_key
    left join triggers t on t.company_key=cc.company_key
    left join opp o on o.company_key=cc.company_key
    left join latest_scan ls on ls.company_key=cc.company_key
    left join predictive ps on ps.company_key=cc.company_key
    left join public.powerhouse_growth_swarm_accounts_v1 prev on prev.company_key=cc.company_key
  )
  insert into public.powerhouse_growth_swarm_accounts_v1(
    company_key,company_name,best_person_key,best_person_name,best_person_role,
    relationship_score,trigger_score,dark_funnel_score,friction_score,knowledge_risk_score,ma_risk_score,
    expected_value_eur,expected_revenue_eur,swarm_score,next_best_action,next_best_channel,play_keys,evidence,updated_at
  )
  select
    s.company_key,s.company_name,s.person_key,s.person_name,s.role,
    round(s.relationship_score,4),round(s.trigger_score,4),round(s.dark_funnel_score,4),
    round(s.friction_score,4),round(s.knowledge_risk_score,4),round(s.ma_risk_score,4),
    s.expected_value_eur,s.expected_revenue_eur,
    round(least(1::numeric,
       .24*s.relationship_score+.24*s.trigger_score+.18*s.dark_funnel_score+.12*s.friction_score
      +.10*s.knowledge_risk_score+.12*least(1,greatest(s.expected_value_eur,s.expected_revenue_eur)/25000.0)
    ),4),
    case
      when s.ma_risk_score>=.60 then 'ma_knowledge_execution_risk_brief'
      when s.trigger_score>=.70 and s.relationship_score>=.55 then 'prebuilt_prospect_dossier_and_direct_followup'
      when s.dark_funnel_score>=.55 and s.relationship_score>=.45 then 'dark_funnel_context_followup'
      when s.friction_score>=.50 then 'benchmark_friction_teardown'
      when s.knowledge_risk_score>=.50 then 'lost_knowledge_value_hypothesis'
      when s.relationship_score>=.65 then 'relationship_nurture'
      else 'research_and_wait'
    end,
    case
      when s.trigger_score>=.70 and s.relationship_score>=.55 then 'linkedin_or_email'
      when s.dark_funnel_score>=.55 then 'linkedin_or_email'
      when s.ma_risk_score>=.60 then 'partner_or_email'
      else 'internal'
    end,
    array_remove(array[
      case when s.friction_score>=.35 then 'mkb-friction-index' end,
      case when s.knowledge_risk_score>=.40 then 'lost-knowledge-calculator' end,
      case when s.ma_risk_score>=.40 then 'ma-knowledge-risk' end,
      case when s.dark_funnel_score>=.35 then 'dark-funnel' end,
      case when s.trigger_score>=.55 then 'trigger-hijacking' end,
      case when s.relationship_score>=.55 then 'prebuilt-prospect-dossier' end,
      'revenue-swarm'
    ],null),
    jsonb_build_object(
      'contract','powerhouse-growth-swarm-v1',
      'trigger',jsonb_build_object('trigger_key',s.trigger_key,'trigger_type',s.trigger_type,'confidence',s.trigger_score,'problem_hypothesis',s.problem_hypothesis,'evidence_ref',s.trigger_evidence_ref,'observed_at',s.trigger_observed_at),
      'open_opportunities',s.open_opportunities,
      'external_signal_score',s.external_signal_score,
      'entry_offer_floor_eur',2900,
      'truth_boundary','Expected value and risk values are hypotheses until supported by tenant or transactional evidence.'
    ),
    v_now
  from source s
  on conflict(company_key) do update set
    company_name=excluded.company_name,best_person_key=excluded.best_person_key,best_person_name=excluded.best_person_name,
    best_person_role=excluded.best_person_role,relationship_score=excluded.relationship_score,trigger_score=excluded.trigger_score,
    dark_funnel_score=excluded.dark_funnel_score,friction_score=excluded.friction_score,knowledge_risk_score=excluded.knowledge_risk_score,
    ma_risk_score=excluded.ma_risk_score,expected_value_eur=excluded.expected_value_eur,expected_revenue_eur=excluded.expected_revenue_eur,
    swarm_score=excluded.swarm_score,next_best_action=excluded.next_best_action,next_best_channel=excluded.next_best_channel,
    play_keys=excluded.play_keys,evidence=excluded.evidence,updated_at=excluded.updated_at;
  get diagnostics v_accounts=row_count;

  with ranked as (
    select g.*,row_number() over(order by swarm_score desc,expected_revenue_eur desc,expected_value_eur desc,company_key) rn
    from public.powerhouse_growth_swarm_accounts_v1 g
    where swarm_score>=.55 and best_person_key is not null
  )
  insert into public.powerhouse_sales_actions(
    dedupe_key,subject_key,person_key,company_key,action_type,channel,priority,reason,evidence,
    message_draft,source_url,status,due_at,expected_value_eur,person_name,company_name,role
  )
  select
    'growth-swarm-dossier:'||md5(r.company_key)||':'||p_run_date::text,
    'company:'||r.company_key,r.best_person_key,r.company_key,
    'growth_swarm_dossier','internal',round(100*r.swarm_score,2),
    'Build a pre-contact commercial dossier from verified relationship, trigger and opportunity evidence.',
    r.evidence||jsonb_build_object('swarm_score',r.swarm_score,'next_best_action',r.next_best_action,'next_best_channel',r.next_best_channel,'play_keys',r.play_keys,'expected_value_eur',r.expected_value_eur,'expected_revenue_eur',r.expected_revenue_eur),
    '', '', 'suggested',v_now,r.expected_value_eur,r.best_person_name,r.company_name,r.best_person_role
  from ranked r where rn<=20
  on conflict(dedupe_key) do update set priority=excluded.priority,reason=excluded.reason,evidence=excluded.evidence,due_at=excluded.due_at,expected_value_eur=excluded.expected_value_eur,updated_at=v_now;
  get diagnostics v_dossiers=row_count;

  with dominant as (
    select trigger_type,count(*)::int n,round(avg(confidence)::numeric,3) avg_confidence
    from public.powerhouse_mkb_trigger_intelligence_v1
    where do_not_contact_reason is null and observed_at>=v_now-interval '14 days' and confidence>=.60
    group by trigger_type order by count(*) desc,avg(confidence) desc,trigger_type limit 3
  )
  insert into public.powerhouse_content_recommendations(
    dedupe_key,run_date,topic_key,content_key,target_channel,recommendation_type,priority,reason,evidence,status
  )
  select 'growth-swarm-contrarian:'||p_run_date::text||':'||d.trigger_type,p_run_date,'growth-swarm:'||d.trigger_type,null,
    'linkedin_company','contrarian_demand_creation',99,
    'Maak evidence-backed bedrijfspaginacontent rond dit actuele patroon en stuur naar Frisse Blik/benchmark zonder individuele prospects te noemen.',
    jsonb_build_object('contract','powerhouse-growth-swarm-v1','trigger_type',d.trigger_type,'signal_count',d.n,'avg_confidence',d.avg_confidence,'anonymized',true,'prospect_names_forbidden',true),
    'suggested'
  from dominant d
  on conflict(dedupe_key) do update set priority=excluded.priority,reason=excluded.reason,evidence=excluded.evidence,updated_at=v_now;
  get diagnostics v_content=row_count;

  with positive as (
    select distinct on (o.person_key)
      o.person_key,o.company_key,o.occurred_at,c.naam person_name,c.bedrijf company_name,c.rol role
    from public.powerhouse_sales_outcomes o
    join public.bg_connecties c
      on coalesce(nullif(trim(c.sleutel),''),nullif(trim(c.linkedin_url),''))=o.person_key
    where o.occurred_at>=v_now-interval '45 days'
      and lower(coalesce(o.outcome_type,'')) in ('won','paid','meeting_completed','scan_completed','positive_reply')
    order by o.person_key,o.occurred_at desc
  )
  insert into public.powerhouse_sales_actions(
    dedupe_key,subject_key,person_key,company_key,action_type,channel,priority,reason,evidence,
    message_draft,source_url,status,due_at,expected_value_eur,person_name,company_name,role
  )
  select
    'growth-referral:'||md5(p.person_key)||':'||to_char(p.occurred_at,'YYYYMM'),
    'relationship:'||p.person_key,p.person_key,p.company_key,'referral_activation','internal',88,
    'Positive commercial outcome creates a high-trust referral moment; prepare one contextual peer-introduction request.',
    jsonb_build_object('contract','powerhouse-growth-swarm-v1','play','referral-without-referral-program','positive_outcome_at',p.occurred_at,'external_side_effect_allowed',false),
    '', '', 'suggested',v_now,0,p.person_name,p.company_name,p.role
  from positive p
  on conflict(dedupe_key) do nothing;
  get diagnostics v_referrals=row_count;

  return jsonb_build_object(
    'contract','powerhouse-growth-swarm-v1',
    'bounded_candidate_refresh',true,
    'run_date',p_run_date,
    'accounts_touched',v_accounts,
    'dossiers_touched',v_dossiers,
    'content_recommendations_touched',v_content,
    'referral_actions_touched',v_referrals,
    'executed_at',v_now
  );
end;
$$;

revoke execute on function public.powerhouse_refresh_growth_swarm_v1(date) from public,anon,authenticated;
grant execute on function public.powerhouse_refresh_growth_swarm_v1(date) to service_role;
