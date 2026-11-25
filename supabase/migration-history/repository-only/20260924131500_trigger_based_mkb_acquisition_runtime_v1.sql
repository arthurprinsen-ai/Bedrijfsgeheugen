-- Trigger-based MKB acquisition runtime v1
-- Reuse-first: projects observed company trigger evidence into existing Powerhouse opportunities,
-- forecasts and internal research actions. No parallel CRM, store or scheduler.

create or replace view public.powerhouse_mkb_trigger_intelligence_v1
with (security_invoker=true) as
with runtime_source as (
  select
    'runtime_event'::text as source_kind,
    e.event_id::text as source_id,
    e.company_key,
    e.person_key,
    e.topic_key,
    e.occurred_at as observed_at,
    least(1::numeric,greatest(0::numeric,coalesce(e.confidence,0.5))) as source_confidence,
    lower(concat_ws(' ',
      e.event_type,
      e.source,
      e.topic_key,
      e.evidence->>'trigger_type',
      e.evidence->>'trigger',
      e.evidence->>'headline',
      e.evidence->>'title',
      e.evidence->>'summary',
      e.evidence->>'signal',
      e.evidence->>'change',
      e.context->>'trigger_type',
      e.context->>'trigger',
      e.context->>'headline',
      e.context->>'title',
      e.context->>'summary',
      e.context->>'signal',
      e.context->>'change'
    )) as signal_text,
    coalesce(nullif(e.context->>'role',''),nullif(e.evidence->>'role','')) as observed_role,
    jsonb_build_object(
      'source_kind','runtime_event',
      'event_id',e.event_id,
      'event_type',e.event_type,
      'source',e.source,
      'data_quality',e.data_quality,
      'confidence',e.confidence,
      'evidence',coalesce(e.evidence,'{}'::jsonb),
      'context',coalesce(e.context,'{}'::jsonb)
    ) as raw_evidence
  from public.powerhouse_runtime_events e
  where e.company_key is not null
    and e.occurred_at >= now()-interval '120 days'
    and e.state <> 'error'
    and (
      nullif(e.evidence->>'trigger_type','') is not null
      or nullif(e.evidence->>'trigger','') is not null
      or nullif(e.evidence->>'headline','') is not null
      or nullif(e.evidence->>'summary','') is not null
      or nullif(e.context->>'trigger_type','') is not null
      or nullif(e.context->>'trigger','') is not null
      or nullif(e.context->>'headline','') is not null
      or nullif(e.context->>'summary','') is not null
    )
), predictive_source as (
  select
    'predictive_signal'::text as source_kind,
    s.signal_id::text as source_id,
    s.entity_key as company_key,
    null::text as person_key,
    s.topic_key,
    s.observed_at,
    least(1::numeric,greatest(0::numeric,0.7*coalesce(s.strength,0)+0.3*coalesce(s.novelty,0))) as source_confidence,
    lower(concat_ws(' ',
      s.source_type,
      s.topic_key,
      s.signal_type,
      s.direction,
      s.evidence->>'trigger_type',
      s.evidence->>'trigger',
      s.evidence->>'headline',
      s.evidence->>'title',
      s.evidence->>'summary',
      s.evidence->>'signal',
      s.evidence->>'change'
    )) as signal_text,
    null::text as observed_role,
    jsonb_build_object(
      'source_kind','predictive_signal',
      'signal_id',s.signal_id,
      'signal_key',s.signal_key,
      'source_type',s.source_type,
      'source_ref',s.source_ref,
      'strength',s.strength,
      'novelty',s.novelty,
      'lead_time_days',s.lead_time_days,
      'evidence',coalesce(s.evidence,'{}'::jsonb)
    ) as raw_evidence
  from public.powerhouse_predictive_signals s
  where s.entity_scope='company'
    and s.entity_key is not null
    and s.observed_at >= now()-interval '120 days'
), source_union as (
  select * from runtime_source
  union all
  select * from predictive_source
), classified as (
  select s.*,
    case
      when signal_text ~ '(post[- ]?merger|post[- ]?acquisition|integratie na overname|integration after acquisition)' then 'post_merger_integration'
      when signal_text ~ '(private equity|\bpe\b|investeerder|investor|participatie|portfolio company)' then 'investor_pe'
      when signal_text ~ '(overname|acquisition|merger|fusie|bedrijf verkopen|company sale|sell[- ]side|buy[- ]side|m&a)' then 'buy_sell_ma'
      when signal_text ~ '(nieuwe (ceo|cfo|coo|directeur)|new (ceo|cfo|coo|director)|benoemd tot|appointed as)' then 'new_management'
      when signal_text ~ '(snelle groei|rapid growth|headcount growth|personeelsgroei|vestigingsgroei|nieuwe vestiging|new location|scale[- ]up|scaling)' then 'growth'
      when signal_text ~ '(afas|\berp\b|sap s/4|dynamics 365|exact online|erp implementatie|erp migration|systeemmigratie|system migration)' then 'erp_afas_change'
      when signal_text ~ '(margedruk|margin pressure|kostenstijging|cost pressure|cashflow|werkkapitaal|rendementsdruk|verlieslatend|profit warning)' then 'margin_cost_cashflow_pressure'
      when signal_text ~ '(personeelstekort|staff shortage|talent shortage|sleutelpersoon|key person|kennis.*hoofd|vacaturestop|hiring freeze)' then 'talent_shortage_key_person_risk'
      when signal_text ~ '(ai act|nis2|csrd|avg|gdpr|wetgeving|regulation|compliance verplicht|compliance requirement)' then 'regulation'
      when signal_text ~ '(financiering|funding round|funding|refinancing|refinanciering|bankfinanciering|lening)' then 'financing'
      when signal_text ~ '(turnaround|reorganisatie|restructuring|herstructurering|faillissement|insolvency|surseance)' then 'turnaround'
      when signal_text ~ '(kunstmatige intelligentie|artificial intelligence|digitalisering|digital transformation|automatisering|automation|data platform|dataplatform|(^|[^a-z])ai([^a-z]|$))' then 'ai_data_digitalisation'
      else null
    end as trigger_type
  from source_union s
), enriched as (
  select c.*,
    case trigger_type
      when 'growth' then 'Snelle groei kan informatie, verantwoordelijkheden en managementsturing versnipperen.'
      when 'new_management' then 'Nieuwe directie kan snel behoefte hebben aan betrouwbare managementinformatie, prioriteiten en uitvoeringsgrip.'
      when 'buy_sell_ma' then 'Een koop- of verkooptraject kan afhankelijkheden, datakwaliteit en overdraagbaarheid zichtbaar moeten maken.'
      when 'investor_pe' then 'Een investeerder kan behoefte hebben aan portfolio-overzicht, waardecreatie en aantoonbare executie.'
      when 'post_merger_integration' then 'Na een overname kunnen processen, KPI’s, systemen en verantwoordelijkheden dubbel of inconsistent blijven.'
      when 'erp_afas_change' then 'Een ERP/AFAS-verandering kan processen, definities, data en rapportages tijdelijk uit elkaar trekken.'
      when 'margin_cost_cashflow_pressure' then 'Marge- of cashflowdruk kan vragen om snelle zichtbaarheid van kosten, verspilling en operationele stuurinformatie.'
      when 'talent_shortage_key_person_risk' then 'Personeelsschaarste of sleutelpersoonsafhankelijkheid kan continuïteit en kennisoverdracht bedreigen.'
      when 'regulation' then 'Nieuwe regelgeving kan aantoonbare controls, data, eigenaarschap en bewijs vereisen.'
      when 'financing' then 'Financiering kan betrouwbare cijfers, scenario’s, governance en een onderbouwd verbeterplan vereisen.'
      when 'turnaround' then 'Een turnaround kan snelle prioritering, cash- en operationele grip en uitvoeringsdiscipline vereisen.'
      when 'ai_data_digitalisation' then 'Een AI/data-initiatief kan vastlopen zonder concrete use-cases, betrouwbare data, governance en uitvoeringspad.'
    end as problem_hypothesis,
    case trigger_type
      when 'growth' then 'Mogelijke impact: besluitvertraging, dubbel werk, gemiste overdracht en verlies van schaalvoordeel.'
      when 'new_management' then 'Mogelijke impact: langere time-to-control en vertraagde prioritering.'
      when 'buy_sell_ma' then 'Mogelijke impact: lagere deal-readiness, hogere due-diligencefrictie en integratierisico.'
      when 'investor_pe' then 'Mogelijke impact: minder zicht op waardecreatie, risico en portfolio-executie.'
      when 'post_merger_integration' then 'Mogelijke impact: synergieverlies, dubbele kosten en inconsistent bestuur.'
      when 'erp_afas_change' then 'Mogelijke impact: rapportageverschillen, procesfrictie en adoptievertraging.'
      when 'margin_cost_cashflow_pressure' then 'Mogelijke impact: verdere marge-erosie, cashdruk en late corrigerende acties.'
      when 'talent_shortage_key_person_risk' then 'Mogelijke impact: continuïteitsrisico, langere inwerktijd en operationele bottlenecks.'
      when 'regulation' then 'Mogelijke impact: compliancekosten, auditrisico en vertraging door ontbrekend bewijs.'
      when 'financing' then 'Mogelijke impact: tragere financiering, slechtere voorwaarden of onvoldoende onderbouwing.'
      when 'turnaround' then 'Mogelijke impact: liquiditeitsverlies, vertraagd herstel en onvoldoende executiefocus.'
      when 'ai_data_digitalisation' then 'Mogelijke impact: pilot-sprawl, lage adoptie en investeringen zonder meetbare waarde.'
    end as economic_impact_hypothesis,
    coalesce(
      nullif(observed_role,''),
      case trigger_type
        when 'growth' then 'CEO/COO/eigenaar'
        when 'new_management' then 'CEO/COO/CFO'
        when 'buy_sell_ma' then 'CEO/eigenaar/CFO'
        when 'investor_pe' then 'CEO/CFO/investeringsverantwoordelijke'
        when 'post_merger_integration' then 'CEO/COO/CIO'
        when 'erp_afas_change' then 'CFO/COO/CIO'
        when 'margin_cost_cashflow_pressure' then 'CEO/CFO/COO'
        when 'talent_shortage_key_person_risk' then 'CEO/COO/HR'
        when 'regulation' then 'CEO/CFO/COO/compliance'
        when 'financing' then 'CEO/CFO/eigenaar'
        when 'turnaround' then 'CEO/CFO/eigenaar'
        when 'ai_data_digitalisation' then 'CEO/CIO/CTO/COO'
      end
    ) as decision_maker_role,
    case trigger_type
      when 'growth' then 'problem_recognition'
      when 'new_management' then 'problem_recognition'
      when 'buy_sell_ma' then 'active_change'
      when 'investor_pe' then 'active_change'
      when 'post_merger_integration' then 'active_change'
      when 'erp_afas_change' then 'solution_exploration'
      when 'margin_cost_cashflow_pressure' then 'problem_recognition'
      when 'talent_shortage_key_person_risk' then 'problem_recognition'
      when 'regulation' then 'active_change'
      when 'financing' then 'active_change'
      when 'turnaround' then 'active_change'
      when 'ai_data_digitalisation' then 'solution_exploration'
    end as buyer_stage,
    case trigger_type
      when 'buy_sell_ma' then 'prepare_sale_or_acquisition_diagnostic'
      when 'investor_pe' then 'prepare_portfolio_value_diagnostic'
      when 'post_merger_integration' then 'prepare_integration_diagnostic'
      when 'turnaround' then 'prepare_turnaround_diagnostic'
      else 'prepare_frisse_blik'
    end as recommended_next_action,
    case trigger_type
      when 'growth' then 'Groei zonder verlies van grip: waar informatie, eigenaarschap en processen als eerste breken.'
      when 'new_management' then 'Hoe nieuwe directie in weken in plaats van maanden betrouwbare stuurinformatie krijgt.'
      when 'buy_sell_ma' then 'Verkoop- en koopklaar worden: welke operationele afhankelijkheden due diligence blootlegt.'
      when 'investor_pe' then 'Van portfolio-overzicht naar aantoonbare waardecreatie en executie.'
      when 'post_merger_integration' then 'Na de deal: KPI’s, processen, systemen en verantwoordelijkheden werkelijk integreren.'
      when 'erp_afas_change' then 'ERP/AFAS veranderen zonder definities, rapportages en processen uit elkaar te trekken.'
      when 'margin_cost_cashflow_pressure' then 'Waar marge en cash verdwijnen voordat het in de maandrapportage zichtbaar wordt.'
      when 'talent_shortage_key_person_risk' then 'Bedrijfskennis uit hoofden halen voordat een sleutelpersoon de bottleneck wordt.'
      when 'regulation' then 'Compliance als bestuurbare capability: bewijs, eigenaarschap en acties in één lijn.'
      when 'financing' then 'Financieringsklaar: cijfers, scenario’s en operationele onderbouwing die standhouden.'
      when 'turnaround' then 'Turnaround met één stuurbeeld voor cash, prioriteiten en uitvoering.'
      when 'ai_data_digitalisation' then 'Van AI-pilot naar meetbare bedrijfswaarde met data, governance en uitvoering.'
    end as recommended_content_angle,
    case trigger_type
      when 'buy_sell_ma' then 'ma_advisor'
      when 'investor_pe' then 'investor_pe'
      when 'post_merger_integration' then 'ma_advisor_or_it_partner'
      when 'erp_afas_change' then 'erp_afas_partner'
      when 'margin_cost_cashflow_pressure' then 'accountant_or_bank'
      when 'regulation' then 'accountant_or_industry_association'
      when 'financing' then 'bank_or_accountant'
      when 'turnaround' then 'accountant_or_bank_or_ma_advisor'
      when 'ai_data_digitalisation' then 'msp_it_partner'
      else 'accountant_or_business_advisor'
    end as partner_route,
    extract(epoch from (now()-observed_at))/86400.0 as freshness_days
  from classified c
  where trigger_type is not null
)
select
  source_kind||':'||source_id||':'||trigger_type as trigger_key,
  company_key,
  person_key,
  topic_key,
  source_kind,
  source_id,
  'powerhouse_'||source_kind||':'||source_id as trigger_evidence_ref,
  observed_at,
  trigger_type,
  source_confidence as confidence,
  freshness_days,
  problem_hypothesis,
  economic_impact_hypothesis,
  decision_maker_role,
  buyer_stage,
  recommended_next_action,
  recommended_content_angle,
  partner_route,
  case
    when source_confidence < 0.60 then 'insufficient_trigger_confidence'
    when freshness_days > 45 then 'stale_trigger'
    else null
  end as do_not_contact_reason,
  jsonb_build_object(
    'contract','powerhouse-trigger-based-mkb-acquisition-runtime-v1',
    'truth_boundary','trigger is observed/derived evidence; problem, impact, buyer role and next action are hypotheses until validated',
    'raw_evidence',raw_evidence
  ) as evidence
from enriched;

revoke all on public.powerhouse_mkb_trigger_intelligence_v1 from public,anon,authenticated;
grant select on public.powerhouse_mkb_trigger_intelligence_v1 to service_role;

create or replace function public.powerhouse_refresh_trigger_based_mkb_acquisition_v1(
  p_run_date date default (now() at time zone 'Europe/Amsterdam')::date
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_now timestamptz:=now();
  v_candidates integer:=0;
  v_opportunities integer:=0;
  v_actions integer:=0;
  v_forecasts integer:=0;
  v_result jsonb;
begin
  with ranked as (
    select t.*,
      row_number() over(partition by t.company_key,t.trigger_type order by t.observed_at desc,t.confidence desc,t.trigger_key) rn
    from public.powerhouse_mkb_trigger_intelligence_v1 t
    where t.do_not_contact_reason is null
      and t.observed_at >= v_now-interval '45 days'
  )
  select count(*)::integer into v_candidates from ranked where rn=1;

  with ranked as (
    select t.*,
      row_number() over(partition by t.company_key,t.trigger_type order by t.observed_at desc,t.confidence desc,t.trigger_key) rn
    from public.powerhouse_mkb_trigger_intelligence_v1 t
    where t.do_not_contact_reason is null
      and t.observed_at >= v_now-interval '45 days'
  )
  insert into public.powerhouse_opportunities(
    opportunity_key,subject_key,person_key,company_key,topic_key,stage,
    expected_value_eur,probability,confidence,expected_revenue_value,
    score_components,evidence,last_evidence_at,next_action_at,status,updated_at
  )
  select
    'mkb-trigger:'||md5(r.company_key)||':'||r.trigger_type,
    r.company_key,r.person_key,r.company_key,'mkb-trigger:'||r.trigger_type,'signal',
    0,0.08,least(0.80,r.confidence),0,
    jsonb_build_object(
      'trigger_based_mkb_acquisition',jsonb_build_object(
        'trigger_type',r.trigger_type,
        'problem_hypothesis',r.problem_hypothesis,
        'economic_impact_hypothesis',r.economic_impact_hypothesis,
        'decision_maker_role',r.decision_maker_role,
        'buyer_stage',r.buyer_stage,
        'recommended_next_action',r.recommended_next_action,
        'recommended_content_angle',r.recommended_content_angle,
        'partner_route',r.partner_route,
        'trigger_evidence_ref',r.trigger_evidence_ref,
        'observed_at',r.observed_at,
        'confidence',r.confidence,
        'commercial_ready',true,
        'truth_boundary','expected_value_eur and expected_revenue_value remain zero until observed/declared commercial evidence exists'
      )
    ),
    jsonb_build_object(
      'contract','powerhouse-trigger-based-mkb-acquisition-runtime-v1',
      'trigger_key',r.trigger_key,
      'trigger_evidence_ref',r.trigger_evidence_ref,
      'trigger_evidence',r.evidence
    ),
    r.observed_at,v_now,'open',v_now
  from ranked r
  where r.rn=1
  on conflict(opportunity_key) do update set
    person_key=coalesce(excluded.person_key,public.powerhouse_opportunities.person_key),
    topic_key=excluded.topic_key,
    confidence=excluded.confidence,
    score_components=coalesce(public.powerhouse_opportunities.score_components,'{}'::jsonb)||excluded.score_components,
    evidence=coalesce(public.powerhouse_opportunities.evidence,'{}'::jsonb)||excluded.evidence,
    last_evidence_at=excluded.last_evidence_at,
    next_action_at=excluded.next_action_at,
    status=case when public.powerhouse_opportunities.status in ('won','lost') then public.powerhouse_opportunities.status else 'open' end,
    updated_at=v_now;
  get diagnostics v_opportunities=row_count;

  with ranked as (
    select t.*,
      row_number() over(partition by t.company_key,t.trigger_type order by t.observed_at desc,t.confidence desc,t.trigger_key) rn
    from public.powerhouse_mkb_trigger_intelligence_v1 t
    where t.do_not_contact_reason is null
      and t.observed_at >= v_now-interval '45 days'
  )
  insert into public.powerhouse_sales_actions(
    dedupe_key,subject_key,person_key,company_key,action_type,channel,priority,reason,
    evidence,message_draft,status,due_at,topic_key,opportunity_key,expected_value_eur
  )
  select
    'trigger-research:'||p_run_date::text||':'||md5(r.company_key)||':'||r.trigger_type,
    'mkb-trigger:'||md5(r.company_key)||':'||r.trigger_type,
    r.person_key,r.company_key,'research_enrichment','internal',
    round((100*r.confidence)::numeric,2),
    'Validate trigger evidence, decision-maker, problem hypothesis and best low-friction entry offer before any external contact.',
    jsonb_build_object(
      'contract','powerhouse-trigger-based-mkb-acquisition-runtime-v1',
      'trigger_type',r.trigger_type,
      'trigger_evidence_ref',r.trigger_evidence_ref,
      'problem_hypothesis',r.problem_hypothesis,
      'economic_impact_hypothesis',r.economic_impact_hypothesis,
      'decision_maker_role',r.decision_maker_role,
      'buyer_stage',r.buyer_stage,
      'recommended_next_action',r.recommended_next_action,
      'recommended_content_angle',r.recommended_content_angle,
      'partner_route',r.partner_route,
      'execution_gate',jsonb_build_object(
        'fail_closed',true,
        'external_side_effect_allowed',false,
        'requires_identity_and_destination_verification_before_outreach',true
      )
    ),
    '','suggested',v_now,
    'mkb-trigger:'||r.trigger_type,
    'mkb-trigger:'||md5(r.company_key)||':'||r.trigger_type,
    0
  from ranked r
  where r.rn=1
  on conflict(dedupe_key) do update set
    priority=excluded.priority,
    reason=excluded.reason,
    evidence=excluded.evidence,
    updated_at=v_now;
  get diagnostics v_actions=row_count;

  with ranked as (
    select t.*,
      row_number() over(partition by t.company_key,t.trigger_type order by t.observed_at desc,t.confidence desc,t.trigger_key) rn
    from public.powerhouse_mkb_trigger_intelligence_v1 t
    where t.do_not_contact_reason is null
      and t.observed_at >= v_now-interval '45 days'
  )
  insert into public.powerhouse_forecasts(
    forecast_key,horizon_start,horizon_end,expected_by,scope,scope_key,topic_key,
    predicted_event,predicted_problem,predicted_question,predicted_search_intent,predicted_buying_trigger,
    probability,confidence,expected_lead_days,first_mover_score,strategic_fit,revenue_potential,
    signal_acceleration,market_saturation,whitespace_score,prediction_mode,evidence,status,last_scored_at,updated_at
  )
  select
    'mkb-trigger:'||p_run_date::text||':'||md5(r.company_key)||':'||r.trigger_type,
    p_run_date,p_run_date+30,p_run_date+30,'company',r.company_key,'mkb-trigger:'||r.trigger_type,
    'commercial_buying_window',r.problem_hypothesis,
    'Does this observed trigger develop into a validated business problem and commercial conversation inside 30 days?',
    'problem_research',r.trigger_type,
    least(0.60,0.20+0.40*r.confidence),r.confidence,30,
    round((100*r.confidence)::numeric,2),0.80,0,
    0.50,0.50,0.50,'anticipatory',
    jsonb_build_object(
      'contract','powerhouse-trigger-based-mkb-acquisition-runtime-v1',
      'trigger_evidence_ref',r.trigger_evidence_ref,
      'problem_hypothesis',r.problem_hypothesis,
      'decision_maker_role',r.decision_maker_role,
      'recommended_next_action',r.recommended_next_action,
      'truth_boundary','forecast only; revenue_potential stays zero until observed/declared commercial value exists'
    ),
    'active',v_now,v_now
  from ranked r
  where r.rn=1
  on conflict(forecast_key) do update set
    predicted_problem=excluded.predicted_problem,
    predicted_buying_trigger=excluded.predicted_buying_trigger,
    probability=excluded.probability,
    confidence=excluded.confidence,
    evidence=excluded.evidence,
    last_scored_at=v_now,
    updated_at=v_now;
  get diagnostics v_forecasts=row_count;

  v_result:=jsonb_build_object(
    'contract','powerhouse-trigger-based-mkb-acquisition-runtime-v1',
    'run_date',p_run_date,
    'executed_at',v_now,
    'eligible_trigger_candidates',v_candidates,
    'opportunities_touched',v_opportunities,
    'internal_research_actions_touched',v_actions,
    'forecasts_touched',v_forecasts,
    'external_outreach_executed',false,
    'truth_boundary','zero candidates is a valid result when no current company-level trigger evidence exists'
  );

  insert into public.powerhouse_runtime_events(
    dedupe_key,event_type,source,subject_key,occurred_at,evidence,context,state,data_quality,confidence
  ) values (
    'trigger-based-mkb-acquisition:'||to_char(v_now at time zone 'UTC','YYYYMMDDHH24'),
    'trigger_based_mkb_acquisition_cycle',
    'powerhouse-trigger-based-mkb-acquisition-runtime-v1',
    'growth-revenue-os',v_now,v_result,
    jsonb_build_object('reuse_first',true,'no_parallel_crm',true,'external_side_effects',false),
    'actioned','VERIFIED',1
  )
  on conflict(dedupe_key) do update set
    occurred_at=excluded.occurred_at,evidence=excluded.evidence,context=excluded.context,state=excluded.state,updated_at=v_now;

  return v_result;
exception when others then
  insert into public.powerhouse_runtime_events(
    dedupe_key,event_type,source,subject_key,occurred_at,evidence,context,state,data_quality,confidence
  ) values (
    'trigger-based-mkb-acquisition-error:'||to_char(now() at time zone 'UTC','YYYYMMDDHH24MI'),
    'trigger_based_mkb_acquisition_cycle_failed',
    'powerhouse-trigger-based-mkb-acquisition-runtime-v1',
    'growth-revenue-os',now(),
    jsonb_build_object('error',sqlerrm,'sqlstate',sqlstate),
    jsonb_build_object('fail_closed',true),
    'error','VERIFIED',1
  )
  on conflict(dedupe_key) do nothing;
  return jsonb_build_object('contract','powerhouse-trigger-based-mkb-acquisition-runtime-v1','healthy',false,'error',sqlerrm,'sqlstate',sqlstate);
end;
$$;

revoke execute on function public.powerhouse_refresh_trigger_based_mkb_acquisition_v1(date) from public,anon,authenticated;
grant execute on function public.powerhouse_refresh_trigger_based_mkb_acquisition_v1(date) to service_role;

create or replace function public.powerhouse_trigger_based_mkb_acquisition_cycle_v1(
  p_run_date date default (now() at time zone 'Europe/Amsterdam')::date
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_trigger jsonb;
  v_learning jsonb;
begin
  v_trigger:=public.powerhouse_refresh_trigger_based_mkb_acquisition_v1(p_run_date);
  v_learning:=public.powerhouse_commercial_learning_cycle_v1(p_run_date);
  return jsonb_build_object(
    'contract','powerhouse-trigger-based-mkb-acquisition-cycle-v1',
    'trigger_acquisition',v_trigger,
    'commercial_learning',v_learning,
    'run_date',p_run_date,
    'executed_at',now()
  );
end;
$$;

revoke execute on function public.powerhouse_trigger_based_mkb_acquisition_cycle_v1(date) from public,anon,authenticated;
grant execute on function public.powerhouse_trigger_based_mkb_acquisition_cycle_v1(date) to service_role;

do $$
declare v_job_id bigint;
begin
  select jobid into v_job_id
  from cron.job
  where jobname='powerhouse-commercial-learning-v1'
  limit 1;
  if v_job_id is null then
    raise exception 'Required existing cron job powerhouse-commercial-learning-v1 not found';
  end if;
  perform cron.alter_job(
    v_job_id,
    command := 'select public.powerhouse_trigger_based_mkb_acquisition_cycle_v1();'
  );
end $$;

comment on view public.powerhouse_mkb_trigger_intelligence_v1 is
'Evidence-first company trigger projection. Generic relationship activation is not a trigger; only explicit trigger fields/headlines/summaries or company-scoped predictive signals are classified.';

comment on function public.powerhouse_refresh_trigger_based_mkb_acquisition_v1(date) is
'Projects observed trigger evidence into canonical opportunities, zero-value forecasts and internal research actions only. No external side effect is executed.';

comment on function public.powerhouse_trigger_based_mkb_acquisition_cycle_v1(date) is
'Wrapper around the canonical commercial learning job: trigger materialization first, then existing commercial learning. Reuses the existing cron job.';
