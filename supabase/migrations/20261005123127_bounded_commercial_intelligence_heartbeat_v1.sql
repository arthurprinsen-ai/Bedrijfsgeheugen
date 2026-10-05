create or replace function public.powerhouse_commercial_intelligence_heartbeat_v1(
 p_run_date date default ((now() at time zone 'Europe/Amsterdam'))::date
) returns jsonb language plpgsql security definer set search_path='public','pg_catalog' as $$
declare v_res jsonb; v_enrich jsonb; v_now timestamptz:=now(); v_actions int; v_forecasts int;
begin
 v_res:=public.powerhouse_resolve_company_person_signals_v1(p_run_date);
 v_enrich:=public.powerhouse_refresh_all_connection_enrichment_v1(p_run_date,0);

 with ranked as (
  select n.*,row_number() over(order by n.expected_commercial_value_eur desc,n.action_confidence desc,n.buying_window_score desc,n.updated_at desc) rn
  from public.powerhouse_commercial_next_best_action_v2 n
  where n.buying_window_score>=.30 and n.buying_window_confidence>=.25
 )
 insert into public.powerhouse_sales_actions(dedupe_key,subject_key,person_key,company_key,action_type,channel,priority,reason,evidence,message_draft,status,due_at,content_key,topic_key,campaign_key,opportunity_key,expected_value_eur,person_name,company_name,role)
 select 'autonomy:'||p_run_date::text||':'||r.opportunity_key,r.subject_key,r.person_key,r.company_key,
 case when r.recommended_channel='linkedin_comment' then 'expert_comment' when r.recommended_channel in ('linkedin_dm','email') then 'commercial_outreach' else 'research_enrichment' end,
 r.recommended_channel,round(least(100,greatest(0,100*r.commercial_progression_probability))::numeric,2),
 'Bounded contextual next-best-action from canonical company/person/predictive evidence.',
 coalesce(r.evidence,'{}'::jsonb)||jsonb_build_object('commercial_intelligence',jsonb_build_object(
 'contract','powerhouse-commercial-intelligence-heartbeat-v1','buying_window_score',r.buying_window_score,'buying_window_confidence',r.buying_window_confidence,
 'commercial_progression',r.commercial_progression_probability,'recommended_channel',r.recommended_channel,'message_strategy',r.message_strategy,
 'recommended_asset',r.recommended_asset,'recommended_cta',r.recommended_cta,'best_context',r.best_context,
 'policy','Suggested only; provider execution remains separately governed and requires its canonical gates.')),
 '', 'suggested',v_now,r.content_key,r.topic_key,r.campaign_key,r.opportunity_key,r.expected_commercial_value_eur,r.person_name,coalesce(r.person_company_name,r.company_key),r.role
 from ranked r where r.rn<=20
 on conflict(dedupe_key) do update set channel=excluded.channel,priority=excluded.priority,reason=excluded.reason,evidence=excluded.evidence,
 expected_value_eur=excluded.expected_value_eur,person_name=coalesce(excluded.person_name,powerhouse_sales_actions.person_name),
 company_name=coalesce(excluded.company_name,powerhouse_sales_actions.company_name),role=coalesce(excluded.role,powerhouse_sales_actions.role),updated_at=v_now;
 get diagnostics v_actions=row_count;

 with ranked as (
  select n.*,row_number() over(order by n.expected_commercial_value_eur desc,n.action_confidence desc) rn
  from public.powerhouse_commercial_next_best_action_v2 n where n.buying_window_confidence>=.25 and n.buying_window_score>=.30
 )
 insert into public.powerhouse_forecasts(forecast_key,horizon_start,horizon_end,expected_by,scope,scope_key,topic_key,predicted_event,predicted_problem,predicted_question,predicted_search_intent,predicted_buying_trigger,probability,confidence,expected_lead_days,first_mover_score,strategic_fit,revenue_potential,signal_acceleration,market_saturation,whitespace_score,prediction_mode,evidence,status,last_scored_at,updated_at)
 select 'commercial:'||p_run_date::text||':'||r.opportunity_key,p_run_date,p_run_date+(case when r.buying_window_score>=.72 then 7 when r.buying_window_score>=.55 then 14 else 30 end),
 p_run_date+(case when r.buying_window_score>=.72 then 7 when r.buying_window_score>=.55 then 14 else 30 end),
 case when r.person_key is not null then 'person' else 'company' end,coalesce(r.person_key,r.company_key,r.opportunity_key),r.topic_key,'commercial_progression',
 nullif(r.best_context,''),'Will this relationship progress to an observed positive commercial outcome inside the horizon?','commercial_intent',r.recommended_cta,
 r.commercial_progression_probability,r.buying_window_confidence,case when r.buying_window_score>=.72 then 7 when r.buying_window_score>=.55 then 14 else 30 end,
 round(100*r.buying_window_score,2),r.buying_window_score,least(1,coalesce(r.expected_commercial_value_eur,0)/25000.0),
 least(1,greatest(0,r.company_intent_score)),greatest(0,1-r.company_intent_score),least(1,greatest(0,r.evidence_density)),'anticipatory',
 jsonb_build_object('contract','powerhouse-commercial-intelligence-heartbeat-v1','opportunity_key',r.opportunity_key,'person_key',r.person_key,'company_key',r.company_key,
 'buying_window_score',r.buying_window_score,'message_strategy',r.message_strategy,'recommended_channel',r.recommended_channel,'recommended_cta',r.recommended_cta),
 'active',v_now,v_now
 from ranked r where r.rn<=20
 on conflict(forecast_key) do update set probability=excluded.probability,confidence=excluded.confidence,predicted_problem=excluded.predicted_problem,
 predicted_buying_trigger=excluded.predicted_buying_trigger,evidence=excluded.evidence,last_scored_at=v_now,updated_at=v_now;
 get diagnostics v_forecasts=row_count;

 insert into public.powerhouse_runtime_events(dedupe_key,event_type,source,subject_key,occurred_at,evidence,context,state,data_quality,confidence)
 values('commercial-intelligence-heartbeat:'||p_run_date,'commercial_intelligence_heartbeat','powerhouse-commercial-intelligence-heartbeat-v1','company-person-commercial',v_now,
 jsonb_build_object('resolution',v_res,'enrichment',v_enrich,'actions_upserted',v_actions,'forecasts_upserted',v_forecasts),
 jsonb_build_object('bounded',true,'no_provider_send',true,'same_canonical_lineage',true),'actioned','VERIFIED',1)
 on conflict(dedupe_key) do update set occurred_at=excluded.occurred_at,evidence=excluded.evidence,context=excluded.context,state=excluded.state,updated_at=now();

 return jsonb_build_object('contract','powerhouse-commercial-intelligence-heartbeat-v1','healthy',true,'resolution',v_res,'enrichment',v_enrich,
 'actions_upserted',v_actions,'forecasts_upserted',v_forecasts,'provider_send_executed',false,'executed_at',v_now);
exception when others then
 return jsonb_build_object('contract','powerhouse-commercial-intelligence-heartbeat-v1','healthy',false,'error',sqlerrm,'sqlstate',sqlstate,'executed_at',now());
end $$;
