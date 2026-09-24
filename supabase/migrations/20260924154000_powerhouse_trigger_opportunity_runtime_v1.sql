-- Trigger-based MKB opportunity runtime v1
-- Company-scoped observed signals -> canonical opportunity -> safe internal next-best-action.
-- Never invent revenue and never unlock direct outreach from trigger evidence alone.

create or replace function public.powerhouse_materialize_trigger_opportunity_v1(p_signal_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  s public.powerhouse_predictive_signals%rowtype;
  v_text text;
  v_trigger text;
  v_problem text;
  v_role text;
  v_next_action text;
  v_content_angle text;
  v_confidence numeric;
  v_priority numeric;
  v_opportunity_key text;
  v_opportunity_id uuid;
begin
  select * into s
  from public.powerhouse_predictive_signals
  where signal_id=p_signal_id;

  if not found or s.entity_scope<>'company' or nullif(btrim(s.entity_key),'') is null then
    return null;
  end if;

  v_text := lower(concat_ws(' ',s.source_type,s.signal_type,s.topic_key,s.direction,coalesce(s.evidence::text,'')));

  v_trigger := case
    when v_text ~ '(post.?merger|integrat.*acqui|integrat.*overname)' then 'post_merger_integration'
    when v_text ~ '(acqui|merger|overname|bedrijf verkopen|sale process|sell-side|buy-side|m&a|exit)' then 'buy_sell_ma'
    when v_text ~ '(private equity|investor|investeerder|portfolio company|pe-backed|funding round)' then 'investor_pe'
    when v_text ~ '(erp|afas|sap|dynamics|system migration|implementatie.*systeem)' then 'erp_afas_change'
    when v_text ~ '(turnaround|restruct|reorgan|distress|bankrupt|faill|verlieslatend)' then 'turnaround'
    when v_text ~ '(margin|marge|cost|kosten|cashflow|profit|winst|ebitda)' then 'margin_cost_cashflow_pressure'
    when v_text ~ '(talent shortage|staff shortage|personeelstekort|vacature|key person|sleutelpersoon|kennis.*hoofd)' then 'talent_shortage_key_person_risk'
    when v_text ~ '(regulat|wetgeving|compliance|nis2|ai act|csrd|privacy|avg)' then 'regulation'
    when v_text ~ '(refinanc|financier|funding|lening|krediet|credit facility)' then 'financing'
    when v_text ~ '(new ceo|new coo|new cfo|nieuwe direct|management change|leadership change)' then 'new_management'
    when v_text ~ '(headcount|hiring|groei|growth|nieuwe vestiging|new location|scale)' then 'growth'
    when v_text ~ '(ai |artificial intelligence|data platform|digitalis|automatis|automation)' then 'ai_data_digitalisation'
    else 'unclassified_company_signal'
  end;

  v_problem := case v_trigger
    when 'growth' then 'Snelle groei kan besturing, processen, informatie en kennis versnipperen.'
    when 'new_management' then 'Nieuwe directie heeft snel een betrouwbaar beeld nodig van prestaties, risico’s, systemen en uitvoeringskracht.'
    when 'buy_sell_ma' then 'Koop/verkoop vraagt aantoonbare overdraagbaarheid, betrouwbare informatie en zicht op risico’s en waardedrijvers.'
    when 'investor_pe' then 'Investeerder of PE vraagt versneld inzicht in value creation, risico, governance en uitvoerbaarheid.'
    when 'post_merger_integration' then 'Na een overname lopen KPI’s, processen, systemen en verantwoordelijkheden vaak parallel en inconsistent.'
    when 'erp_afas_change' then 'Een ERP/AFAS-verandering legt proces-, datakwaliteits- en adoptieproblemen bloot.'
    when 'margin_cost_cashflow_pressure' then 'Marge-, kosten- of cashdruk vraagt snel zicht op oorzaken, prioriteiten en meetbare verbeteracties.'
    when 'talent_shortage_key_person_risk' then 'Personeelsschaarste of sleutelpersoonsafhankelijkheid vergroot continuïteits- en kennisrisico.'
    when 'regulation' then 'Nieuwe regelgeving vraagt aantoonbare toepasselijkheid, bewijs, eigenaarschap en concrete acties.'
    when 'financing' then 'Financiering vraagt consistente cijfers, scenario’s, risico-inzicht en onderbouwde uitvoeringsplannen.'
    when 'turnaround' then 'Turnaround vraagt directe prioritering op cash, marge, capaciteit, risico en bestuurbare uitvoering.'
    when 'ai_data_digitalisation' then 'AI/data-ambitie zonder concrete use-cases, goede data en governance blijft vaak hangen in losse pilots.'
    else 'Er is een bedrijfssignaal, maar het onderliggende koopprobleem is nog onvoldoende geclassificeerd.'
  end;

  v_role := case v_trigger
    when 'buy_sell_ma' then 'CEO/CFO/eigenaar'
    when 'investor_pe' then 'CEO/CFO/investment lead'
    when 'financing' then 'CFO/eigenaar'
    when 'regulation' then 'CEO/COO/compliance'
    when 'erp_afas_change' then 'COO/CFO/IT'
    when 'ai_data_digitalisation' then 'CEO/COO/CIO'
    when 'turnaround' then 'CEO/CFO/eigenaar'
    else 'CEO/COO/eigenaar'
  end;

  v_next_action := case
    when v_trigger='unclassified_company_signal' then 'research_and_classify'
    else 'validate_trigger_and_problem_hypothesis'
  end;

  v_content_angle := case v_trigger
    when 'growth' then 'Hoe voorkom je dat groei sneller gaat dan je besturing en informatievoorziening?'
    when 'post_merger_integration' then 'Welke KPI’s, processen en systemen moet je als eerste harmoniseren na een overname?'
    when 'buy_sell_ma' then 'Hoe maak je een bedrijf aantoonbaar overdraagbaar en verkoopklaar?'
    when 'margin_cost_cashflow_pressure' then 'Waar verlies je marge en cash, en welke oorzaken zijn aantoonbaar?'
    when 'talent_shortage_key_person_risk' then 'Welke bedrijfskennis mag niet in één hoofd blijven zitten?'
    when 'erp_afas_change' then 'Hoe voorkom je dat een ERP-wijziging een IT-project wordt zonder procesresultaat?'
    when 'ai_data_digitalisation' then 'Welke AI-toepassing levert aantoonbaar bedrijfsresultaat met de data die je al hebt?'
    else 'Wat betekent dit concrete bedrijfssignaal voor besturing, risico en uitvoering?'
  end;

  v_confidence := least(1,greatest(0,0.25+0.50*coalesce(s.strength,0)+0.25*coalesce(s.novelty,0)));
  v_priority := round(100*least(1,greatest(0,coalesce(s.strength,0)))*v_confidence,2);
  v_opportunity_key := 'trigger:'||s.signal_id::text;

  insert into public.powerhouse_opportunities(
    opportunity_key,subject_key,company_key,topic_key,stage,
    expected_value_eur,probability,confidence,expected_revenue_value,
    score_components,evidence,last_evidence_at,next_action_at,status,updated_at
  ) values (
    v_opportunity_key,s.entity_key,s.entity_key,s.topic_key,'signal',
    0,least(1,greatest(0,coalesce(s.strength,0))),v_confidence,0,
    jsonb_build_object(
      'trigger_strength',least(1,greatest(0,coalesce(s.strength,0))),
      'novelty',least(1,greatest(0,coalesce(s.novelty,0))),
      'confidence',v_confidence,
      'priority',v_priority,
      'revenue_truth','zero_until_observed_commercial_evidence'
    ),
    jsonb_build_object(
      'contract','powerhouse-trigger-opportunity-runtime-v1',
      'trigger_type',v_trigger,
      'trigger_evidence_ref',coalesce(s.source_ref,'powerhouse_predictive_signals:'||s.signal_id::text),
      'observed_at',s.observed_at,
      'source_type',s.source_type,
      'signal_type',s.signal_type,
      'problem_hypothesis',v_problem,
      'economic_impact_hypothesis','Unknown until validated; do not invent value.',
      'decision_maker_role',v_role,
      'buyer_stage','signal',
      'recommended_next_action',v_next_action,
      'recommended_content_angle',v_content_angle,
      'channel','internal_research',
      'hypothesis_not_fact',true,
      'source_evidence',s.evidence
    ),
    s.observed_at,now(),'open',now()
  )
  on conflict (opportunity_key) do update set
    subject_key=excluded.subject_key,
    company_key=excluded.company_key,
    topic_key=excluded.topic_key,
    probability=excluded.probability,
    confidence=excluded.confidence,
    score_components=excluded.score_components,
    evidence=coalesce(public.powerhouse_opportunities.evidence,'{}'::jsonb)||excluded.evidence,
    last_evidence_at=greatest(public.powerhouse_opportunities.last_evidence_at,excluded.last_evidence_at),
    next_action_at=case when public.powerhouse_opportunities.status='open' then excluded.next_action_at else public.powerhouse_opportunities.next_action_at end,
    expected_value_eur=greatest(public.powerhouse_opportunities.expected_value_eur,excluded.expected_value_eur),
    expected_revenue_value=greatest(public.powerhouse_opportunities.expected_revenue_value,excluded.expected_revenue_value),
    stage=case when public.powerhouse_opportunities.stage='signal' then 'signal' else public.powerhouse_opportunities.stage end,
    updated_at=now()
  returning opportunity_id into v_opportunity_id;

  update public.powerhouse_forecasts
  set predicted_buying_trigger=v_trigger,
      predicted_problem=coalesce(predicted_problem,v_problem),
      evidence=coalesce(evidence,'{}'::jsonb)||jsonb_build_object(
        'trigger_contract','powerhouse-trigger-opportunity-runtime-v1',
        'trigger_type',v_trigger,
        'problem_hypothesis',v_problem
      ),
      updated_at=now()
  where forecast_key='signal:'||s.signal_id::text;

  insert into public.powerhouse_sales_actions(
    dedupe_key,subject_key,company_key,action_type,channel,priority,reason,evidence,
    message_draft,source_url,status,due_at,topic_key,opportunity_key,expected_value_eur,role
  ) values (
    'trigger-intel:'||s.signal_id::text,s.entity_key,s.entity_key,
    case when v_trigger='unclassified_company_signal' then 'trigger_research' else 'trigger_validation' end,
    'internal_research',v_priority,v_problem,
    jsonb_build_object(
      'contract','powerhouse-trigger-opportunity-runtime-v1',
      'trigger_type',v_trigger,
      'problem_hypothesis',v_problem,
      'decision_maker_role',v_role,
      'recommended_next_action',v_next_action,
      'recommended_content_angle',v_content_angle,
      'source_signal_id',s.signal_id,
      'source_ref',s.source_ref,
      'outbound_allowed',false,
      'revenue_truth','zero_until_observed_commercial_evidence'
    ),
    '',coalesce(s.source_ref,''),'suggested',now(),s.topic_key,v_opportunity_key,0,v_role
  )
  on conflict (dedupe_key) do update set
    priority=excluded.priority,
    reason=excluded.reason,
    evidence=coalesce(public.powerhouse_sales_actions.evidence,'{}'::jsonb)||excluded.evidence,
    source_url=excluded.source_url,
    role=excluded.role,
    updated_at=now()
  where public.powerhouse_sales_actions.status in ('suggested','prepared','waiting');

  return v_opportunity_id;
end
$$;

revoke execute on function public.powerhouse_materialize_trigger_opportunity_v1(uuid) from public,anon,authenticated;
grant execute on function public.powerhouse_materialize_trigger_opportunity_v1(uuid) to service_role;

create or replace function public.powerhouse_trigger_opportunity_signal_hook_v1()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  perform public.powerhouse_materialize_trigger_opportunity_v1(new.signal_id);
  return new;
end
$$;

revoke execute on function public.powerhouse_trigger_opportunity_signal_hook_v1() from public,anon,authenticated;
grant execute on function public.powerhouse_trigger_opportunity_signal_hook_v1() to service_role;

drop trigger if exists powerhouse_trigger_opportunity_signal_hook_v1 on public.powerhouse_predictive_signals;
create trigger powerhouse_trigger_opportunity_signal_hook_v1
after insert or update of observed_at,source_type,source_ref,entity_scope,entity_key,topic_key,signal_type,direction,strength,novelty,evidence
on public.powerhouse_predictive_signals
for each row execute function public.powerhouse_trigger_opportunity_signal_hook_v1();

select public.powerhouse_materialize_trigger_opportunity_v1(signal_id)
from public.powerhouse_predictive_signals
where entity_scope='company' and entity_key is not null;

comment on function public.powerhouse_materialize_trigger_opportunity_v1(uuid) is
'Materializes an observed company-scoped predictive signal into the canonical opportunity/action lineage. Trigger evidence remains a hypothesis; revenue stays zero and first action stays internal until observed commercial evidence exists.';
