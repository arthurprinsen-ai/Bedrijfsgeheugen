-- Historical production migration. Superseded immediately by v2 after the regression test
-- exposed the NOT NULL revenue_eur invariant. Kept so GitHub remains migration-history SSOT.

create or replace function public.powerhouse_record_outcome(
  p_action_id uuid,
  p_dedupe_key text,
  p_outcome_type text,
  p_evidence jsonb default '{}'::jsonb,
  p_revenue_eur numeric default null
)
returns public.powerhouse_sales_outcomes
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_action public.powerhouse_sales_actions;
  v_outcome public.powerhouse_sales_outcomes;
  v_type text := lower(btrim(coalesce(p_outcome_type,'')));
  v_revenue numeric := nullif(p_revenue_eur,0);
  v_feedback_type text;
  v_human_ui boolean := coalesce(p_evidence->>'ui','') = 'powerhouse-revenue-command-center';
begin
  if nullif(btrim(p_dedupe_key),'') is null then raise exception 'DEDUPE_KEY_REQUIRED'; end if;
  if v_type = '' then raise exception 'OUTCOME_TYPE_REQUIRED'; end if;
  if p_revenue_eur is not null and p_revenue_eur < 0 then raise exception 'REVENUE_MUST_BE_NONNEGATIVE'; end if;
  if v_revenue is not null and v_type not in ('won','closed_won','order','won_order','order_won','realized_revenue','revenue_observed') then raise exception 'revenue not allowed for proposal or non-realized outcome'; end if;
  if v_revenue is not null and coalesce(p_evidence,'{}'::jsonb) = '{}'::jsonb then raise exception 'REVENUE_SOURCE_EVIDENCE_REQUIRED'; end if;
  if v_type in ('no_response','no_reply') and coalesce((p_evidence->>'observation_window_closed')::boolean,false) is not true and not v_human_ui then raise exception 'NO_RESPONSE_REQUIRES_CLOSED_OBSERVATION_WINDOW_OR_HUMAN_CONFIRMATION'; end if;
  select * into v_action from public.powerhouse_sales_actions where action_id=p_action_id for update;
  if not found then raise exception 'ACTION_NOT_FOUND'; end if;
  insert into public.powerhouse_sales_outcomes(action_id,dedupe_key,outcome_type,subject_key,person_key,company_key,content_key,topic_key,campaign_key,opportunity_key,channel,revenue_eur,evidence)
  values(v_action.action_id,p_dedupe_key,v_type,v_action.subject_key,v_action.person_key,v_action.company_key,v_action.content_key,v_action.topic_key,v_action.campaign_key,v_action.opportunity_key,v_action.channel,v_revenue,coalesce(p_evidence,'{}'::jsonb))
  on conflict(dedupe_key) do update set evidence=excluded.evidence,revenue_eur=excluded.revenue_eur,outcome_type=excluded.outcome_type returning * into v_outcome;
  update public.powerhouse_sales_actions set outcome_id=v_outcome.outcome_id,status=case when v_type in ('waiting','no_response','no_reply','defer','deferred','not_now') then 'waiting' else 'done' end,executed_at=case when v_type in ('defer','deferred','not_now') then executed_at else coalesce(executed_at,now()) end,updated_at=now() where action_id=v_action.action_id;
  if v_action.opportunity_key is not null then update public.powerhouse_opportunities set evidence=coalesce(evidence,'{}'::jsonb)||jsonb_build_object('last_sales_outcome',jsonb_build_object('outcome_id',v_outcome.outcome_id,'action_id',v_action.action_id,'outcome_type',v_type,'channel',v_action.channel,'revenue_eur',v_revenue,'occurred_at',v_outcome.occurred_at,'evidence',coalesce(p_evidence,'{}'::jsonb))),last_action_at=coalesce(v_outcome.occurred_at,now()),last_evidence_at=coalesce(v_outcome.occurred_at,now()),updated_at=now() where opportunity_key=v_action.opportunity_key; end if;
  if v_action.event_id is not null then update public.powerhouse_runtime_events set state='closed',updated_at=now() where event_id=v_action.event_id; end if;
  if v_human_ui then
    v_feedback_type:=case when v_type in ('not_relevant','defer','deferred','not_now','no_response','no_reply') then 'skip' else 'approve' end;
    perform public.powerhouse_record_human_feedback_v1('cockpit-outcome:'||p_dedupe_key,v_feedback_type,v_action.action_id,v_action.opportunity_key,v_action.subject_key,'Human cockpit outcome: '||v_type,v_action.message_draft,null,case when v_type in ('defer','deferred','not_now') then 'defer' else null end,coalesce(p_evidence,'{}'::jsonb)||jsonb_build_object('outcome_id',v_outcome.outcome_id,'outcome_type',v_type),coalesce(v_outcome.occurred_at,now()));
  end if;
  return v_outcome;
end;
$function$;

revoke execute on function public.powerhouse_record_outcome(uuid,text,text,jsonb,numeric) from public, anon, authenticated;
grant execute on function public.powerhouse_record_outcome(uuid,text,text,jsonb,numeric) to service_role;
