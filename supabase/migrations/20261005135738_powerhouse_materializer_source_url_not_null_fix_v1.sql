CREATE OR REPLACE FUNCTION public.powerhouse_materialize_command_center_actions_v1(p_run_date date DEFAULT ((now() AT TIME ZONE 'Europe/Amsterdam'::text))::date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
declare v_now timestamptz:=now(); v_touched int:=0; v_research int:=0; v_social int:=0; v_email int:=0; v_dm int:=0;
begin
  with base as (
    select s.*,
      coalesce(
        nullif(s.command_evidence->>'source_url',''),
        nullif(s.command_evidence#>>'{evidence,source_url}',''),
        nullif(s.command_evidence#>>'{public_source_evidence,evidence,source_url}','')
      ) source_url,
      coalesce(
        nullif(s.command_evidence->>'headline',''),
        nullif(s.command_evidence#>>'{evidence,headline}',''),
        nullif(s.command_evidence#>>'{public_source_evidence,evidence,headline}','')
      ) headline,
      coalesce(
        nullif(s.command_evidence->>'summary',''),
        nullif(s.command_evidence#>>'{evidence,summary}',''),
        nullif(s.command_evidence#>>'{public_source_evidence,evidence,summary}','')
      ) summary
    from public.powerhouse_revenue_command_center_snapshot_v1 s
    where s.revenue_rank<=20
      and s.buying_window_score>=.30 and s.buying_window_confidence>=.25
      and coalesce(s.pressure_state,'ready') not in ('cooldown','wait','suppressed','do_not_contact')
      and (s.cooldown_until is null or s.cooldown_until<=v_now)
      and coalesce(s.identity_conflict,false)=false
      and coalesce(s.structural_lineage_gap,false)=false
  ), enriched as (
    select b.*,c.email,c.linkedin_url,c.extra contact_extra,
      (b.source_url ~* '^https?://') and nullif(trim(coalesce(b.headline,b.summary,'')),'') is not null social_source_ready,
      (c.email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+[.][A-Z]{2,}$') email_ready,
      (
        coalesce(c.extra->>'salesrobot_prospect_uuid','')<>'' or coalesce(c.extra->>'prospect_uuid','')<>'' or
        coalesce(c.extra->>'salesrobot_thread_id','')<>'' or coalesce(c.extra->>'thread_id','')<>'' or
        coalesce(c.extra->>'salesrobot_unipile_chat_id','')<>'' or coalesce(c.extra->>'unipile_chat_id','')<>'' or
        coalesce(c.extra->>'salesrobot_sales_nav_chat_id','')<>'' or coalesce(c.extra->>'unipile_sales_nav_chat_id','')<>''
      ) dm_ready
    from base b
    left join lateral (
      select x.email,x.linkedin_url,x.extra
      from public.bg_connecties x
      where x.sleutel=b.person_key or x.linkedin_url=b.person_key
      order by (x.sleutel=b.person_key) desc,x.bijgewerkt_op desc nulls last
      limit 1
    ) c on true
  ), routed as (
    select e.*,
      case
        when e.recommended_channel='email' and e.email_ready then 'autonomous_email'
        when e.recommended_channel='linkedin_dm' and e.dm_ready then 'activate_connection'
        when e.recommended_channel='linkedin_comment' and e.social_source_ready then 'reply_post'
        else 'research_enrichment'
      end action_type_final,
      case
        when e.recommended_channel='email' and e.email_ready then 'email'
        when e.recommended_channel='linkedin_dm' and e.dm_ready then 'linkedin_dm'
        when e.recommended_channel='linkedin_comment' and e.social_source_ready then 'linkedin_personal'
        else 'internal'
      end channel_final
    from enriched e
  ), up as (
    insert into public.powerhouse_sales_actions(
      dedupe_key,subject_key,person_key,company_key,action_type,channel,priority,reason,evidence,message_draft,
      source_url,status,due_at,opportunity_key,expected_value_eur,person_name,company_name,role
    )
    select
      case
        when r.action_type_final='research_enrichment' then 'relationship-research:'||p_run_date::text||':'||r.opportunity_key
        when r.action_type_final='reply_post' then 'command-social:'||p_run_date::text||':'||r.opportunity_key
        when r.action_type_final='autonomous_email' then 'command-email:'||p_run_date::text||':'||r.opportunity_key
        else 'command-dm:'||p_run_date::text||':'||r.opportunity_key
      end,
      coalesce(r.person_key,r.company_key,r.opportunity_key),r.person_key,r.company_key,
      r.action_type_final,r.channel_final,
      round(least(100,greatest(0,100*coalesce(r.action_confidence,r.buying_window_score)))::numeric,2),
      case
        when r.action_type_final='research_enrichment' then 'NBA requires verified human-readable source context before external outreach.'
        else 'Executable action materialized from canonical revenue command-center decision.'
      end,
      coalesce(r.command_evidence,'{}'::jsonb) ||
      jsonb_build_object(
        'source_ref',case when r.source_url is not null then r.source_url else null end,
        'headline',r.headline,'summary',r.summary,
        'recipient_email',case when r.action_type_final='autonomous_email' then r.email else null end,
        'salesrobot_prospect_uuid',coalesce(r.contact_extra->>'salesrobot_prospect_uuid',r.contact_extra->>'prospect_uuid'),
        'salesrobot_thread_id',coalesce(r.contact_extra->>'salesrobot_thread_id',r.contact_extra->>'thread_id'),
        'salesrobot_unipile_chat_id',coalesce(r.contact_extra->>'salesrobot_unipile_chat_id',r.contact_extra->>'unipile_chat_id'),
        'salesrobot_sales_nav_chat_id',coalesce(r.contact_extra->>'salesrobot_sales_nav_chat_id',r.contact_extra->>'unipile_sales_nav_chat_id'),
        'human_approved',lower(coalesce(r.contact_extra->>'human_approved','false'))='true',
        'commercial_intelligence',jsonb_build_object(
          'contract','powerhouse-command-center-action-materializer-v1',
          'source_nba','powerhouse_commercial_next_best_action_v5',
          'runtime_read_model','powerhouse_revenue_command_center_snapshot_v1',
          'snapshot_refreshed_at',r.refreshed_at,
          'why_now',r.why_now,'account_thesis',r.account_thesis,'recommended_account_move',r.recommended_account_move,
          'recommended_action',r.recommended_action,'message_strategy',r.message_strategy,
          'recommended_asset',r.effective_recommended_asset,'verified_asset_reference',r.verified_asset_reference,
          'recommended_cta',r.recommended_cta,'pressure_state',r.pressure_state,'cooldown_until',r.cooldown_until,
          'prediction_reply',r.prediction_reply,'prediction_meeting',r.prediction_meeting,
          'prediction_proposal',r.prediction_proposal,'prediction_win',r.prediction_win,
          'prediction_model_version',r.prediction_model_version,'prediction_confidence',r.prediction_confidence,
          'route_decision',r.action_type_final,'source_context_ready',r.social_source_ready,
          'policy','One canonical candidate decision; research before outreach whenever human-readable evidence is insufficient.'
        )
      ),
      '',r.source_url,
      case when r.action_type_final='research_enrichment' then 'suggested' else 'prepared' end,
      v_now,r.opportunity_key,r.expected_commercial_value_eur,r.person_name,r.company_key,r.role
    from routed r
    on conflict(dedupe_key) do update set
      action_type=excluded.action_type,channel=excluded.channel,priority=excluded.priority,reason=excluded.reason,
      evidence=excluded.evidence,source_url=excluded.source_url,expected_value_eur=excluded.expected_value_eur,
      person_name=coalesce(excluded.person_name,powerhouse_sales_actions.person_name),
      company_name=coalesce(excluded.company_name,powerhouse_sales_actions.company_name),
      role=coalesce(excluded.role,powerhouse_sales_actions.role),updated_at=v_now
    where powerhouse_sales_actions.status in ('suggested','prepared','waiting')
    returning action_type,channel
  )
  select count(*),
    count(*) filter(where action_type='research_enrichment'),
    count(*) filter(where action_type='reply_post'),
    count(*) filter(where action_type='autonomous_email'),
    count(*) filter(where channel='linkedin_dm')
  into v_touched,v_research,v_social,v_email,v_dm from up;

  return jsonb_build_object('contract','powerhouse-command-center-action-materializer-v1','run_date',p_run_date,
    'actions_touched',v_touched,'research_actions',v_research,'linkedin_comments',v_social,
    'email_actions',v_email,'linkedin_dm_actions',v_dm,'executed_at',v_now);
end $function$
