-- Trigger-based MKB acquisition runtime v1
-- Reuses canonical predictive signals, opportunities, sales actions and decision-cycle materialization.
-- Market-level signals never become company opportunities. Direct outbound is never created here.

create or replace function public.powerhouse_trigger_acquisition_classify_v1(
  p_topic text,
  p_signal_type text,
  p_evidence jsonb default '{}'::jsonb
) returns jsonb
language plpgsql
immutable
set search_path = public, pg_temp
as $$
declare
  v text := lower(coalesce(p_topic,'')||' '||coalesce(p_signal_type,'')||' '||coalesce(p_evidence::text,''));
  t text := 'other_business_change';
  problem text := 'Er is een bedrijfsspecifiek signaal, maar het onderliggende probleem moet eerst worden bevestigd.';
  buyer text := 'directie';
  angle text := 'Onderzoek het signaal, de bedrijfsimpact en de beslisser vóór commerciële benadering.';
begin
  if v ~ '(groei|growth|hiring|headcount|vestiging|expansion)' then
    t:='growth'; problem:='Snelle groei kan processen, informatie, verantwoordelijkheden en managementinformatie laten versnipperen.'; buyer:='ceo_or_coo';
  elsif v ~ '(ceo|cfo|coo|directeur|management change|new management|leadership)' then
    t:='new_management'; problem:='Nieuwe directie creëert vaak een herijkingsmoment voor besturing, data, processen en prioriteiten.'; buyer:='ceo_or_cfo_or_coo';
  elsif v ~ '(acquisition|overname|fusie|merger|m&a|verkoop|sell-side|buy-side)' then
    t:='ma_buy_sell'; problem:='Een koop-, verkoop- of integratiemoment vergroot de behoefte aan aantoonbare grip op processen, data, afhankelijkheden en waarde.'; buyer:='ceo_or_cfo';
  elsif v ~ '(private equity|investor|investeerder|participatie|portfolio)' then
    t:='investor_pe'; problem:='Een investeerder of portfolio-context verhoogt de behoefte aan transparante prestaties, risico’s en uitvoerbaarheid.'; buyer:='ceo_or_cfo_or_investment_team';
  elsif v ~ '(erp|afas|dynamics|sap|crm|system migration|implementatie)' then
    t:='erp_change'; problem:='Een systeemverandering kan datadefinities, processen, eigenaarschap en rapportage blootleggen of ontregelen.'; buyer:='cfo_or_coo_or_it_lead';
  elsif v ~ '(marge|margin|kosten|cost|cashflow|cash flow|rendement|profit)' then
    t:='margin_cost_cashflow'; problem:='Marge- of kostendruk vraagt om betrouwbare stuurinformatie, oorzaakanalyse en uitvoerbare verbeteracties.'; buyer:='cfo_or_ceo';
  elsif v ~ '(personeel|labour|labor|talent|vacature|vacancy|skills shortage|sleutelpersoon)' then
    t:='talent_key_person'; problem:='Personeelsschaarste of sleutelpersoonsafhankelijkheid kan kennis, capaciteit en continuïteit bedreigen.'; buyer:='ceo_or_coo_or_hr';
  elsif v ~ '(wetgeving|regulation|compliance|ai act|nis2|csrd|privacy)' then
    t:='regulation'; problem:='Nieuwe verplichtingen kunnen bewijs, processen, eigenaarschap en datakwaliteit vereisen voordat deadlines raken.'; buyer:='ceo_or_cfo_or_compliance';
  elsif v ~ '(financiering|funding|refinancing|loan|bank|kapitaal)' then
    t:='financing'; problem:='Financiering vraagt om aantoonbare prestaties, prognoses, risico’s en betrouwbare bedrijfsinformatie.'; buyer:='cfo_or_ceo';
  elsif v ~ '(turnaround|reorganisatie|restructuring|distress|verlies|loss-making)' then
    t:='turnaround'; problem:='Een turnaround vraagt om snelle zichtbaarheid van cash, marge, processen, prioriteiten en uitvoeringsdiscipline.'; buyer:='ceo_or_cfo';
  elsif v ~ '(ai|artificial intelligence|data|digitalisering|automation|automatisering)' then
    t:='ai_data_digitalisation'; problem:='Een AI- of digitaliseringsinitiatief levert pas waarde als data, processen, eigenaarschap en besluitvorming aansluiten.'; buyer:='ceo_or_coo_or_cio';
  end if;
  return jsonb_build_object('trigger_type',t,'problem_hypothesis',problem,'decision_maker_role',buyer,'content_angle',angle);
end $$;

revoke execute on function public.powerhouse_trigger_acquisition_classify_v1(text,text,jsonb) from public, anon, authenticated;
grant execute on function public.powerhouse_trigger_acquisition_classify_v1(text,text,jsonb) to service_role;

create or replace function public.powerhouse_materialize_trigger_acquisition_v1(p_signal_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  s public.powerhouse_predictive_signals%rowtype;
  c jsonb;
  v_scope text;
  v_company_key text;
  v_confidence numeric;
  v_probability numeric;
  v_opportunity_key text;
  v_action_key text;
  v_person_key text;
  v_role text;
  v_priority numeric;
begin
  select * into s from public.powerhouse_predictive_signals where signal_id=p_signal_id;
  if not found then return jsonb_build_object('materialized',false,'reason','signal_not_found'); end if;

  v_scope:=lower(coalesce(s.entity_scope,''));
  if v_scope not in ('company','account','organization','organisation','prospect','business') then
    return jsonb_build_object('materialized',false,'reason','not_company_specific','entity_scope',s.entity_scope);
  end if;
  if nullif(btrim(s.entity_key),'') is null then return jsonb_build_object('materialized',false,'reason','missing_company_identity'); end if;
  if nullif(btrim(s.source_ref),'') is null then return jsonb_build_object('materialized',false,'reason','missing_evidence_ref'); end if;
  if s.observed_at < now()-interval '90 days' then return jsonb_build_object('materialized',false,'reason','stale_signal'); end if;
  if coalesce(s.strength,0) < 0.55 then return jsonb_build_object('materialized',false,'reason','weak_signal'); end if;

  c:=public.powerhouse_trigger_acquisition_classify_v1(s.topic_key,s.signal_type,s.evidence);
  v_company_key:=lower(regexp_replace(btrim(s.entity_key),'\s+',' ','g'));
  v_confidence:=least(0.90,greatest(0.35,0.30+0.40*coalesce(s.strength,0)+0.15*coalesce(s.novelty,0)+0.10));
  v_probability:=least(0.70,greatest(0.10,0.10+0.45*coalesce(s.strength,0)+0.10*coalesce(s.novelty,0)));
  v_opportunity_key:='trigger:'||s.signal_id::text;
  v_action_key:='trigger-acquisition:research:'||s.signal_id::text;
  v_priority:=round(100*least(1,v_confidence*coalesce(s.strength,0)),2);

  select b.person_key,b.inferred_buying_role into v_person_key,v_role
  from public.powerhouse_buying_committee_v1 b
  where b.company_key=v_company_key
  order by b.committee_priority desc nulls last,b.person_key
  limit 1;

  insert into public.powerhouse_opportunities(
    opportunity_key,subject_key,person_key,company_key,topic_key,stage,
    expected_value_eur,probability,confidence,expected_revenue_value,
    score_components,evidence,last_evidence_at,next_action_at,status,updated_at
  ) values (
    v_opportunity_key,v_company_key,v_person_key,v_company_key,s.topic_key,'signal',
    0,v_probability,v_confidence,0,
    jsonb_build_object('trigger_based_acquisition_v1',jsonb_build_object(
      'trigger_strength',s.strength,'novelty',s.novelty,'evidence_quality',v_confidence,
      'recency_days',greatest(0,extract(day from now()-s.observed_at)),
      'problem_fit','hypothesis_only','economic_impact','unknown_until_enrichment',
      'decision_maker_reachability',case when v_person_key is null then 0 else 0.5 end,
      'next_best_action',jsonb_build_object('action','research_enrichment','channel','internal_research')
    )),
    jsonb_build_object(
      'contract','powerhouse-trigger-based-acquisition-runtime-v1',
      'trigger_signal_id',s.signal_id,'trigger_signal_key',s.signal_key,
      'trigger_evidence_ref',s.source_ref,'observed_at',s.observed_at,
      'source_type',s.source_type,'entity_scope',s.entity_scope,'company_key',v_company_key,
      'classification',c,'selected_person_key',v_person_key,'observed_buying_role',v_role,
      'truth_boundary','trigger is observed; problem and economic impact remain hypotheses until enrichment/customer evidence',
      'revenue_policy','expected_value_eur and expected_revenue_value remain zero until observed or declared commercial evidence'
    ),
    s.observed_at,now(),'open',now()
  )
  on conflict(opportunity_key) do update set
    person_key=coalesce(excluded.person_key,public.powerhouse_opportunities.person_key),
    company_key=excluded.company_key,topic_key=excluded.topic_key,probability=excluded.probability,
    confidence=excluded.confidence,score_components=excluded.score_components,evidence=excluded.evidence,
    last_evidence_at=excluded.last_evidence_at,next_action_at=excluded.next_action_at,
    status=case when public.powerhouse_opportunities.status in ('won','lost') then public.powerhouse_opportunities.status else 'open' end,
    updated_at=now();

  insert into public.powerhouse_sales_actions(
    dedupe_key,subject_key,person_key,company_key,action_type,channel,priority,reason,
    evidence,message_draft,source_url,status,due_at,topic_key,opportunity_key,expected_value_eur
  ) values (
    v_action_key,v_opportunity_key,v_person_key,v_company_key,'research_enrichment','internal_research',v_priority,
    'Verify the observed company trigger, likely problem, economic impact and relevant decision maker before any outbound action.',
    jsonb_build_object(
      'contract','powerhouse-trigger-based-acquisition-runtime-v1',
      'trigger_evidence_ref',s.source_ref,'classification',c,
      'required_enrichment',jsonb_build_array('company_identity','trigger_validity','problem_confirmation','economic_impact','decision_maker','contact_pressure','lawfulness'),
      'execution_gate',jsonb_build_object('fail_closed',true,'direct_outbound_allowed',false),
      'truth_boundary','internal research only; no outreach is authorized by this action'
    ),
    '',case when s.source_ref ~ '^https?://' then s.source_ref else '' end,'suggested',now(),s.topic_key,v_opportunity_key,0
  )
  on conflict(dedupe_key) do update set
    person_key=coalesce(excluded.person_key,public.powerhouse_sales_actions.person_key),
    company_key=excluded.company_key,priority=excluded.priority,reason=excluded.reason,evidence=excluded.evidence,
    source_url=excluded.source_url,due_at=excluded.due_at,opportunity_key=excluded.opportunity_key,updated_at=now();

  insert into public.powerhouse_runtime_events(
    dedupe_key,event_type,source,subject_key,person_key,company_key,channel,occurred_at,
    evidence,context,state,content_key,topic_key,opportunity_key,data_quality,confidence,updated_at
  ) values (
    'trigger-acquisition:'||s.signal_id::text,'trigger_based_opportunity_materialized',
    'powerhouse-trigger-based-acquisition-runtime-v1',v_opportunity_key,v_person_key,v_company_key,'internal',now(),
    jsonb_build_object('signal_id',s.signal_id,'source_ref',s.source_ref,'classification',c),
    jsonb_build_object('no_parallel_crm',true,'outbound_fail_closed',true,'expected_value_eur',0),
    'actioned',null,s.topic_key,v_opportunity_key,'OBSERVED',v_confidence,now()
  )
  on conflict(dedupe_key) do update set
    occurred_at=excluded.occurred_at,evidence=excluded.evidence,context=excluded.context,
    person_key=excluded.person_key,company_key=excluded.company_key,confidence=excluded.confidence,updated_at=now();

  return jsonb_build_object('materialized',true,'opportunity_key',v_opportunity_key,'action_dedupe_key',v_action_key,'trigger_type',c->>'trigger_type','confidence',v_confidence);
end $$;

revoke execute on function public.powerhouse_materialize_trigger_acquisition_v1(uuid) from public, anon, authenticated;
grant execute on function public.powerhouse_materialize_trigger_acquisition_v1(uuid) to service_role;

create or replace function public.powerhouse_trigger_acquisition_signal_hook_v1()
returns trigger language plpgsql security definer set search_path = public, pg_catalog as $$
begin
  perform public.powerhouse_materialize_trigger_acquisition_v1(new.signal_id);
  return new;
end $$;

revoke execute on function public.powerhouse_trigger_acquisition_signal_hook_v1() from public, anon, authenticated;
grant execute on function public.powerhouse_trigger_acquisition_signal_hook_v1() to service_role;

drop trigger if exists powerhouse_trigger_acquisition_signal_hook_v1 on public.powerhouse_predictive_signals;
create trigger powerhouse_trigger_acquisition_signal_hook_v1
after insert or update of observed_at,source_ref,entity_scope,entity_key,topic_key,signal_type,direction,strength,novelty,evidence
on public.powerhouse_predictive_signals
for each row execute function public.powerhouse_trigger_acquisition_signal_hook_v1();

select public.powerhouse_materialize_trigger_acquisition_v1(signal_id)
from public.powerhouse_predictive_signals
where lower(coalesce(entity_scope,'')) in ('company','account','organization','organisation','prospect','business')
  and nullif(btrim(entity_key),'') is not null
  and nullif(btrim(source_ref),'') is not null
  and observed_at>=now()-interval '90 days'
  and strength>=0.55;

create or replace view public.powerhouse_trigger_acquisition_readiness_v1
with (security_invoker=true) as
select
  now() as observed_at,
  (select count(*) from public.powerhouse_predictive_signals where lower(coalesce(entity_scope,''))='market') as market_signals_held_from_account_outreach,
  (select count(*) from public.powerhouse_predictive_signals where lower(coalesce(entity_scope,'')) in ('company','account','organization','organisation','prospect','business')) as company_specific_signals,
  (select count(*) from public.powerhouse_opportunities where opportunity_key like 'trigger:%' and status='open') as open_trigger_opportunities,
  (select count(*) from public.powerhouse_sales_actions where dedupe_key like 'trigger-acquisition:research:%' and status in ('suggested','prepared','waiting')) as open_enrichment_actions,
  (select count(*) from public.powerhouse_sales_actions where dedupe_key like 'trigger-acquisition:%' and lower(channel) not in ('internal','internal_research')) as unsafe_outbound_actions;

revoke all on public.powerhouse_trigger_acquisition_readiness_v1 from public, anon, authenticated;
grant select on public.powerhouse_trigger_acquisition_readiness_v1 to service_role;

comment on view public.powerhouse_trigger_acquisition_readiness_v1 is
'Fail-closed trigger acquisition runtime: market signals remain held; only company-specific evidence can create zero-value signal-stage opportunities and internal enrichment actions.';
