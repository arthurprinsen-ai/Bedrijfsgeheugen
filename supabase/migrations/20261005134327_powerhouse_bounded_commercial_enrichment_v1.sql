create or replace function public.powerhouse_refresh_connection_enrichment_batch_v1(
  p_run_date date default ((now() at time zone 'Europe/Amsterdam'))::date,
  p_batch_size integer default 200
)
returns jsonb language plpgsql security definer set search_path='public','pg_catalog' as $$
declare v_now timestamptz:=now(); v_touched int:=0; v_total int:=0; v_done int:=0;
begin
 with candidates as (
   select
     coalesce(nullif(trim(c.sleutel),''),nullif(trim(c.linkedin_url),'')) person_key,
     c.linkedin_url,c.naam,c.bedrijf,c.rol,c.segment,c.status,c.prioriteit,c.email,c.bron,
     lower(regexp_replace(trim(coalesce(c.bedrijf,'')),'\s+',' ','g')) company_key
   from public.bg_connecties c
   left join public.powerhouse_connection_enrichment_state_v1 s
     on s.person_key=coalesce(nullif(trim(c.sleutel),''),nullif(trim(c.linkedin_url),''))
   where coalesce(nullif(trim(c.sleutel),''),nullif(trim(c.linkedin_url),'')) is not null
   order by (s.enrichment_date is distinct from p_run_date) desc,s.enriched_at asc nulls first,c.bijgewerkt_op desc nulls last
   limit greatest(1,least(coalesce(p_batch_size,200),500))
 ), rolled as (
   select c.*,
     coalesce(li.events_30d,0) linkedin_events_30d,
     coalesce(ps.signals_90d,0)+coalesce(cs.signals_90d,0) external_signals_90d,
     coalesce(n.news_120d,0) company_news_120d,
     greatest(coalesce(rp.evidence_90d,0),coalesce(rc.evidence_90d,0)) runtime_evidence_90d,
     greatest(li.latest_at,ps.latest_at,cs.latest_at,n.latest_at,rp.latest_at,rc.latest_at) latest_external_at
   from candidates c
   left join lateral (
     select count(*) filter(where le.occurred_at>=v_now-interval '30 days')::int events_30d,max(le.occurred_at) latest_at
     from public.linkedin_engagement_events le
     where coalesce(le.is_test,false)=false and nullif(c.linkedin_url,'') is not null
       and lower(trim(le.actor_linkedin_url))=lower(trim(c.linkedin_url))
   ) li on true
   left join lateral (
     select count(*) filter(where ps.observed_at>=v_now-interval '90 days')::int signals_90d,max(ps.observed_at) latest_at
     from public.powerhouse_predictive_signals ps
     where ps.entity_scope='person' and ps.entity_key in (c.person_key,c.linkedin_url)
   ) ps on true
   left join lateral (
     select count(*) filter(where ps.observed_at>=v_now-interval '90 days')::int signals_90d,max(ps.observed_at) latest_at
     from public.powerhouse_predictive_signals ps
     where ps.entity_scope='company' and c.company_key<>'' and lower(regexp_replace(trim(ps.entity_key),'\s+',' ','g'))=c.company_key
   ) cs on true
   left join lateral (
     select count(*) filter(where coalesce(bn.gepubliceerd_op,bn.opgehaald_op)>=v_now-interval '120 days')::int news_120d,
       max(coalesce(bn.gepubliceerd_op,bn.opgehaald_op)) latest_at
     from public.bg_bedrijfsnieuws bn
     where c.company_key<>'' and bn.over_dit_bedrijf is true and coalesce(bn.afgewezen_reden,'')=''
       and lower(regexp_replace(trim(bn.bedrijf),'\s+',' ','g'))=c.company_key
   ) n on true
   left join lateral (
     select count(*) filter(where re.occurred_at>=v_now-interval '90 days')::int evidence_90d,max(re.occurred_at) latest_at
     from public.powerhouse_runtime_events re where re.person_key=c.person_key
   ) rp on true
   left join lateral (
     select count(*) filter(where re.occurred_at>=v_now-interval '90 days')::int evidence_90d,max(re.occurred_at) latest_at
     from public.powerhouse_runtime_events re
     where c.company_key<>'' and lower(regexp_replace(trim(coalesce(re.company_key,'')),'\s+',' ','g'))=c.company_key
   ) rc on true
 ), ins as (
   insert into public.powerhouse_connection_enrichment_state_v1(
     person_key,linkedin_url,enrichment_date,enriched_at,data_completeness,
     linkedin_events_30d,external_signals_90d,company_news_120d,runtime_evidence_90d,
     latest_external_at,source_snapshot,updated_at
   )
   select r.person_key,r.linkedin_url,p_run_date,v_now,
     round(((case when nullif(trim(coalesce(r.naam,'')),'') is not null then 1 else 0 end)+
            (case when nullif(trim(coalesce(r.bedrijf,'')),'') is not null then 1 else 0 end)+
            (case when nullif(trim(coalesce(r.rol,'')),'') is not null then 1 else 0 end)+
            (case when nullif(trim(coalesce(r.linkedin_url,'')),'') is not null then 1 else 0 end)+
            (case when nullif(trim(coalesce(r.email,'')),'') is not null then 1 else 0 end))::numeric/5,4),
     r.linkedin_events_30d,r.external_signals_90d,r.company_news_120d,r.runtime_evidence_90d,r.latest_external_at,
     jsonb_build_object(
       'contract','powerhouse-connection-enrichment-batch-v1',
       'core',jsonb_build_object('name',r.naam,'company',r.bedrijf,'role',r.rol,'segment',r.segment,'status',r.status,'priority',r.prioriteit,'source',r.bron),
       'metrics',jsonb_build_object('linkedin_events_30d',r.linkedin_events_30d,'external_signals_90d',r.external_signals_90d,
         'company_news_120d',r.company_news_120d,'runtime_evidence_90d',r.runtime_evidence_90d,'latest_external_at',r.latest_external_at),
       'bounded',true,'sensitive_inference_allowed',false
     ),v_now
   from rolled r
   on conflict(person_key) do update set
     linkedin_url=excluded.linkedin_url,enrichment_date=excluded.enrichment_date,enriched_at=excluded.enriched_at,
     data_completeness=excluded.data_completeness,linkedin_events_30d=excluded.linkedin_events_30d,
     external_signals_90d=excluded.external_signals_90d,company_news_120d=excluded.company_news_120d,
     runtime_evidence_90d=excluded.runtime_evidence_90d,latest_external_at=excluded.latest_external_at,
     source_snapshot=excluded.source_snapshot,updated_at=excluded.updated_at
   returning person_key
 )
 select count(*) into v_touched from ins;

 select count(*) into v_total
 from public.bg_connecties c
 where coalesce(nullif(trim(c.sleutel),''),nullif(trim(c.linkedin_url),'')) is not null;

 select count(*) into v_done
 from public.powerhouse_connection_enrichment_state_v1 s
 where s.enrichment_date=p_run_date;

 return jsonb_build_object(
   'contract','powerhouse-connection-enrichment-batch-v1','run_date',p_run_date,'batch_size',p_batch_size,
   'connections_total',v_total,'connections_touched',v_touched,'connections_enriched_today',v_done,
   'connections_remaining_today',greatest(0,v_total-v_done),
   'daily_completion_ratio',case when v_total=0 then 1 else round(v_done::numeric/v_total,4) end,
   'full_graph_daily_refresh',v_done>=v_total,'bounded_incremental',true,'executed_at',v_now
 );
end $$;
revoke execute on function public.powerhouse_refresh_connection_enrichment_batch_v1(date,integer) from public,anon,authenticated;
grant execute on function public.powerhouse_refresh_connection_enrichment_batch_v1(date,integer) to service_role;

create or replace function public.powerhouse_commercial_intelligence_heartbeat_v1(
  p_run_date date default ((now() at time zone 'Europe/Amsterdam'))::date
)
returns jsonb language plpgsql security definer set search_path='public','pg_catalog' as $$
declare
 v_res jsonb; v_enrich jsonb; v_now timestamptz:=now(); v_actions int:=0; v_forecasts int:=0;
begin
 v_res:=public.powerhouse_resolve_company_person_signals_v1(p_run_date);
 v_enrich:=public.powerhouse_refresh_connection_enrichment_batch_v1(p_run_date,200);

 with ranked as (
  select n.*,row_number() over(order by n.expected_commercial_value_eur desc,n.action_confidence desc,n.buying_window_score desc,n.updated_at desc) rn
  from public.powerhouse_commercial_next_best_action_v5 n
  where n.buying_window_score>=.30 and n.buying_window_confidence>=.25
    and coalesce(n.pending_response,false)=false
    and (n.cooldown_until is null or n.cooldown_until<=v_now)
    and coalesce(n.pressure_state,'ready') not in ('cooldown','wait','suppressed','do_not_contact')
 )
 insert into public.powerhouse_sales_actions(
   dedupe_key,subject_key,person_key,company_key,action_type,channel,priority,reason,evidence,message_draft,status,due_at,
   content_key,topic_key,campaign_key,opportunity_key,expected_value_eur,person_name,company_name,role
 )
 select 'autonomy:'||p_run_date::text||':'||r.opportunity_key,r.subject_key,r.person_key,r.company_key,
   case when r.recommended_channel='linkedin_comment' then 'expert_comment'
        when r.recommended_channel in ('linkedin_dm','email') then 'commercial_outreach' else 'research_enrichment' end,
   r.recommended_channel,round(least(100,greatest(0,100*r.commercial_progression_probability))::numeric,2),
   'Current-v5 contextual next-best-action from canonical company/person/predictive/revenue evidence.',
   coalesce(r.evidence,'{}'::jsonb)||jsonb_build_object('commercial_intelligence',
     coalesce(r.commercial_intelligence,'{}'::jsonb)||jsonb_build_object(
       'contract','powerhouse-commercial-intelligence-heartbeat-v2','source_nba','powerhouse_commercial_next_best_action_v5',
       'buying_window_score',r.buying_window_score,'buying_window_confidence',r.buying_window_confidence,
       'commercial_progression',r.commercial_progression_probability,'recommended_channel',r.recommended_channel,
       'message_strategy',r.message_strategy,'recommended_asset',r.effective_recommended_asset,'recommended_cta',r.recommended_cta,
       'best_context',r.best_context,'pressure_state',r.pressure_state,'cooldown_until',r.cooldown_until,
       'pending_response',r.pending_response,'prediction_reply',r.prediction_reply,'prediction_meeting',r.prediction_meeting,
       'prediction_proposal',r.prediction_proposal,'prediction_win',r.prediction_win,
       'prediction_model_version',r.prediction_model_version,'prediction_confidence',r.prediction_confidence,
       'policy','Suggested only; provider execution remains separately governed and exact-message-quality gated.'
     )),
   '', 'suggested',v_now,r.content_key,r.topic_key,r.campaign_key,r.opportunity_key,r.expected_commercial_value_eur,
   r.person_name,coalesce(r.person_company_name,r.company_key),r.role
 from ranked r where r.rn<=20
 on conflict(dedupe_key) do update set
   channel=excluded.channel,priority=excluded.priority,reason=excluded.reason,evidence=excluded.evidence,
   expected_value_eur=excluded.expected_value_eur,person_name=coalesce(excluded.person_name,powerhouse_sales_actions.person_name),
   company_name=coalesce(excluded.company_name,powerhouse_sales_actions.company_name),
   role=coalesce(excluded.role,powerhouse_sales_actions.role),updated_at=v_now
 where powerhouse_sales_actions.status in ('suggested','prepared','waiting');
 get diagnostics v_actions=row_count;

 with ranked as (
  select n.*,row_number() over(order by n.expected_commercial_value_eur desc,n.action_confidence desc) rn
  from public.powerhouse_commercial_next_best_action_v5 n
  where n.buying_window_confidence>=.25 and n.buying_window_score>=.30
    and coalesce(n.pending_response,false)=false
    and (n.cooldown_until is null or n.cooldown_until<=v_now)
    and coalesce(n.pressure_state,'ready') not in ('cooldown','wait','suppressed','do_not_contact')
 )
 insert into public.powerhouse_forecasts(
   forecast_key,horizon_start,horizon_end,expected_by,scope,scope_key,topic_key,predicted_event,predicted_problem,
   predicted_question,predicted_search_intent,predicted_buying_trigger,probability,confidence,expected_lead_days,
   first_mover_score,strategic_fit,revenue_potential,signal_acceleration,market_saturation,whitespace_score,
   prediction_mode,evidence,status,last_scored_at,updated_at
 )
 select 'commercial:'||p_run_date::text||':'||r.opportunity_key,p_run_date,
   p_run_date+(case when r.buying_window_score>=.72 then 7 when r.buying_window_score>=.55 then 14 else 30 end),
   p_run_date+(case when r.buying_window_score>=.72 then 7 when r.buying_window_score>=.55 then 14 else 30 end),
   case when r.person_key is not null then 'person' else 'company' end,coalesce(r.person_key,r.company_key,r.opportunity_key),
   r.topic_key,'commercial_progression',nullif(r.best_context,''),
   'Will this relationship progress to an observed positive commercial outcome inside the horizon?','commercial_intent',
   r.recommended_cta,coalesce(r.prediction_win,r.commercial_progression_probability),
   greatest(r.buying_window_confidence,coalesce(r.prediction_confidence,0)),
   case when r.buying_window_score>=.72 then 7 when r.buying_window_score>=.55 then 14 else 30 end,
   round(100*r.buying_window_score,2),r.buying_window_score,least(1,coalesce(r.expected_commercial_value_eur,0)/25000.0),
   least(1,greatest(0,r.company_intent_score)),greatest(0,1-r.company_intent_score),least(1,greatest(0,r.evidence_density)),
   'anticipatory',jsonb_build_object('contract','powerhouse-commercial-intelligence-heartbeat-v2','source_nba','v5',
     'opportunity_key',r.opportunity_key,'person_key',r.person_key,'company_key',r.company_key,
     'buying_window_score',r.buying_window_score,'message_strategy',r.message_strategy,
     'recommended_channel',r.recommended_channel,'recommended_cta',r.recommended_cta,
     'prediction_model_version',r.prediction_model_version,'prediction_confidence',r.prediction_confidence),
   'active',v_now,v_now
 from ranked r where r.rn<=20
 on conflict(forecast_key) do update set probability=excluded.probability,confidence=excluded.confidence,
   predicted_problem=excluded.predicted_problem,predicted_buying_trigger=excluded.predicted_buying_trigger,
   evidence=excluded.evidence,last_scored_at=v_now,updated_at=v_now;
 get diagnostics v_forecasts=row_count;

 insert into public.powerhouse_runtime_events(dedupe_key,event_type,source,subject_key,occurred_at,evidence,context,state,data_quality,confidence)
 values('commercial-intelligence-heartbeat:'||p_run_date,'commercial_intelligence_heartbeat',
   'powerhouse-commercial-intelligence-heartbeat-v2','company-person-commercial',v_now,
   jsonb_build_object('resolution',v_res,'enrichment',v_enrich,'actions_upserted',v_actions,'forecasts_upserted',v_forecasts,'source_nba','v5'),
   jsonb_build_object('bounded',true,'no_provider_send',true,'same_canonical_lineage',true,'pressure_gated',true,'incremental_enrichment',true),
   'actioned','VERIFIED',1)
 on conflict(dedupe_key) do update set occurred_at=excluded.occurred_at,evidence=excluded.evidence,context=excluded.context,state=excluded.state,updated_at=now();

 return jsonb_build_object('contract','powerhouse-commercial-intelligence-heartbeat-v2','healthy',true,'source_nba','v5',
   'resolution',v_res,'enrichment',v_enrich,'actions_upserted',v_actions,'forecasts_upserted',v_forecasts,
   'provider_send_executed',false,'executed_at',v_now);
exception when others then
 return jsonb_build_object('contract','powerhouse-commercial-intelligence-heartbeat-v2','healthy',false,'error',sqlerrm,'sqlstate',sqlstate,'executed_at',now());
end $$;
