
create or replace function public.powerhouse_commercial_intelligence_context_stage_v1(
 p_run_date date default ((now() at time zone 'Europe/Amsterdam'))::date
) returns jsonb language plpgsql security definer set search_path='public','pg_catalog' as $$
declare r jsonb; e jsonb; t timestamptz:=now();
begin
 r:=public.powerhouse_resolve_company_person_signals_v1(p_run_date);
 e:=public.powerhouse_refresh_all_connection_enrichment_v1(p_run_date,0);
 insert into public.powerhouse_runtime_events(dedupe_key,event_type,source,subject_key,occurred_at,evidence,context,state,data_quality,confidence)
 values('commercial-context:'||p_run_date,'commercial_intelligence_context','powerhouse-commercial-intelligence-context-stage-v1','company-person-commercial',t,
 jsonb_build_object('resolution',r,'enrichment',e),jsonb_build_object('bounded',true,'no_provider_send',true),'actioned','VERIFIED',1)
 on conflict(dedupe_key) do update set occurred_at=excluded.occurred_at,evidence=excluded.evidence,context=excluded.context,state=excluded.state,updated_at=now();
 return jsonb_build_object('healthy',true,'contract','powerhouse-commercial-intelligence-context-stage-v1','resolution',r,'enrichment',e,'executed_at',t);
end $$;

create or replace function public.powerhouse_commercial_intelligence_actions_stage_v1(
 p_run_date date default ((now() at time zone 'Europe/Amsterdam'))::date
) returns jsonb language plpgsql security definer set search_path='public','pg_catalog' as $$
declare n int:=0; t timestamptz:=now();
begin
 with ranked as (
  select n.*,row_number() over(order by n.expected_commercial_value_eur desc,n.action_confidence desc,n.buying_window_score desc,n.updated_at desc) rn
  from public.powerhouse_commercial_next_best_action_v2 n where n.buying_window_score>=.30 and n.buying_window_confidence>=.25
 )
 insert into public.powerhouse_sales_actions(dedupe_key,subject_key,person_key,company_key,action_type,channel,priority,reason,evidence,message_draft,status,due_at,content_key,topic_key,campaign_key,opportunity_key,expected_value_eur,person_name,company_name,role)
 select 'autonomy:'||p_run_date::text||':'||r.opportunity_key,r.subject_key,r.person_key,r.company_key,
 case when r.recommended_channel='linkedin_comment' then 'expert_comment' when r.recommended_channel in ('linkedin_dm','email') then 'commercial_outreach' else 'research_enrichment' end,
 r.recommended_channel,round(least(100,greatest(0,100*r.commercial_progression_probability))::numeric,2),
 'Bounded contextual next-best-action from canonical company/person/predictive evidence.',
 coalesce(r.evidence,'{}'::jsonb)||jsonb_build_object('commercial_intelligence',jsonb_build_object('contract','powerhouse-commercial-intelligence-actions-stage-v1',
 'buying_window_score',r.buying_window_score,'buying_window_confidence',r.buying_window_confidence,'commercial_progression',r.commercial_progression_probability,
 'recommended_channel',r.recommended_channel,'message_strategy',r.message_strategy,'recommended_asset',r.recommended_asset,'recommended_cta',r.recommended_cta,
 'best_context',r.best_context,'policy','Suggested only; provider execution remains separately governed.')),
 '', 'suggested',t,r.content_key,r.topic_key,r.campaign_key,r.opportunity_key,r.expected_commercial_value_eur,r.person_name,coalesce(r.person_company_name,r.company_key),r.role
 from ranked r where r.rn<=20
 on conflict(dedupe_key) do update set channel=excluded.channel,priority=excluded.priority,reason=excluded.reason,evidence=excluded.evidence,
 expected_value_eur=excluded.expected_value_eur,updated_at=t;
 get diagnostics n=row_count;
 insert into public.powerhouse_runtime_events(dedupe_key,event_type,source,subject_key,occurred_at,evidence,context,state,data_quality,confidence)
 values('commercial-actions:'||p_run_date,'commercial_intelligence_actions','powerhouse-commercial-intelligence-actions-stage-v1','company-person-commercial',t,
 jsonb_build_object('actions_upserted',n),jsonb_build_object('bounded_top_n',20,'no_provider_send',true),'actioned','VERIFIED',1)
 on conflict(dedupe_key) do update set occurred_at=excluded.occurred_at,evidence=excluded.evidence,context=excluded.context,state=excluded.state,updated_at=now();
 return jsonb_build_object('healthy',true,'contract','powerhouse-commercial-intelligence-actions-stage-v1','actions_upserted',n,'provider_send_executed',false,'executed_at',t);
end $$;
