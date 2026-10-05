create or replace function public.powerhouse_fill_action_identity()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_context jsonb;
  v_opportunity public.powerhouse_opportunities;
begin
  if new.event_id is not null and (new.person_name is null or new.company_name is null or new.role is null) then
    select context into v_context from public.powerhouse_runtime_events where event_id=new.event_id;
    new.person_name=coalesce(new.person_name,nullif(v_context->>'personName',''),nullif(v_context->>'person_name',''),nullif(v_context->>'author',''));
    new.company_name=coalesce(new.company_name,nullif(v_context->>'company',''),nullif(v_context->>'companyName',''),nullif(v_context->>'company_name',''));
    new.role=coalesce(new.role,nullif(v_context->>'role',''),nullif(v_context->>'functie',''));
  end if;

  if new.opportunity_key is null and coalesce(new.person_key,new.subject_key) is not null then
    select * into v_opportunity
    from public.powerhouse_opportunities o
    where o.status='open'
      and (
        (new.person_key is not null and o.person_key=new.person_key)
        or (new.subject_key is not null and o.subject_key=new.subject_key)
      )
    order by o.expected_revenue_value desc nulls last, o.updated_at desc
    limit 1;

    if found then
      new.opportunity_key=coalesce(new.opportunity_key,v_opportunity.opportunity_key);
      new.person_key=coalesce(new.person_key,v_opportunity.person_key);
      new.company_key=coalesce(new.company_key,v_opportunity.company_key);
      new.expected_value_eur=coalesce(nullif(new.expected_value_eur,0),v_opportunity.expected_value_eur,0);
    end if;
  end if;

  return new;
end;
$function$;

create or replace function public.powerhouse_record_outcome(
  p_action_id uuid,
  p_dedupe_key text,
  p_outcome_type text,
  p_evidence jsonb default '{}'::jsonb,
  p_revenue_eur numeric default 0
)
returns public.powerhouse_sales_outcomes
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_action public.powerhouse_sales_actions;
  v_outcome public.powerhouse_sales_outcomes;
begin
  select * into v_action from public.powerhouse_sales_actions where action_id=p_action_id for update;
  if not found then raise exception 'ACTION_NOT_FOUND'; end if;

  insert into public.powerhouse_sales_outcomes(
    action_id,dedupe_key,outcome_type,subject_key,person_key,company_key,
    content_key,topic_key,campaign_key,opportunity_key,channel,revenue_eur,evidence
  ) values(
    v_action.action_id,p_dedupe_key,p_outcome_type,v_action.subject_key,v_action.person_key,v_action.company_key,
    v_action.content_key,v_action.topic_key,v_action.campaign_key,v_action.opportunity_key,v_action.channel,
    coalesce(p_revenue_eur,0),coalesce(p_evidence,'{}'::jsonb)
  )
  on conflict(dedupe_key) do update set
    evidence=excluded.evidence,
    revenue_eur=excluded.revenue_eur
  returning * into v_outcome;

  update public.powerhouse_sales_actions
  set outcome_id=v_outcome.outcome_id,
      status=case when p_outcome_type in ('waiting','no_response') then 'waiting' else 'done' end,
      executed_at=coalesce(executed_at,now()),
      updated_at=now()
  where action_id=v_action.action_id;

  if v_action.opportunity_key is not null then
    update public.powerhouse_opportunities
    set evidence=coalesce(evidence,'{}'::jsonb) || jsonb_build_object(
          'last_sales_outcome', jsonb_build_object(
            'outcome_id',v_outcome.outcome_id,
            'action_id',v_action.action_id,
            'outcome_type',p_outcome_type,
            'channel',v_action.channel,
            'revenue_eur',coalesce(p_revenue_eur,0),
            'occurred_at',v_outcome.occurred_at,
            'evidence',coalesce(p_evidence,'{}'::jsonb)
          )
        ),
        last_action_at=coalesce(v_outcome.occurred_at,now()),
        last_evidence_at=coalesce(v_outcome.occurred_at,now()),
        updated_at=now()
    where opportunity_key=v_action.opportunity_key;
  end if;

  if v_action.event_id is not null then
    update public.powerhouse_runtime_events set state='closed',updated_at=now() where event_id=v_action.event_id;
  end if;

  return v_outcome;
end;
$function$;
