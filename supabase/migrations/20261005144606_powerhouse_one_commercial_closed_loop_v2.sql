-- One canonical Powerhouse commercial closed loop.
-- Production-aligned consolidation generated from verified runtime definitions on 2026-10-05.
-- Existing-state-first: reuses NBA v5 snapshot, existing message composer, provider executors,
-- revenue attribution and learning stores. Heavy graph/research work is bounded or asynchronous.

CREATE OR REPLACE FUNCTION public.powerhouse_outbound_message_quality_ready_v1(p_action_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_catalog', 'extensions'
AS $function$
  select coalesce((
    select case
      when nullif(trim(coalesce(a.message_draft,'')),'') is null then false
      when lower(replace(coalesce(a.channel,''),' ','_')) in ('email','e-mail','linkedin_dm')
        or (a.channel='linkedin_personal' and a.action_type='reply_post')
      then
        coalesce(a.evidence#>>'{commercial_intelligence,quality_passed}','false')='true'
        and coalesce(a.evidence#>>'{commercial_intelligence,message_hash}','')<>''
        and a.evidence#>>'{commercial_intelligence,message_hash}'
              = encode(extensions.digest(a.message_draft::bytea,'sha256'),'hex')
        and exists(
          select 1
          from public.powerhouse_message_quality_v1 q
          where q.action_id=a.action_id
            and q.message_hash=a.evidence#>>'{commercial_intelligence,message_hash}'
            and q.passed=true
        )
      else false
    end
    from public.powerhouse_sales_actions a
    where a.action_id=p_action_id
  ),false)
$function$;
REVOKE EXECUTE ON FUNCTION public.powerhouse_outbound_message_quality_ready_v1(p_action_id uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.powerhouse_outbound_message_quality_ready_v1(p_action_id uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.powerhouse_commercial_intelligence_heartbeat_v1(p_run_date date DEFAULT ((now() AT TIME ZONE 'Europe/Amsterdam'::text))::date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
declare
  v_now timestamptz:=now(); v_snapshot_at timestamptz; v_rows int:=0; v_age interval;
begin
  select max(refreshed_at),count(*)::int into v_snapshot_at,v_rows
  from public.powerhouse_revenue_command_center_snapshot_v1;
  v_age := case when v_snapshot_at is null then null else v_now-v_snapshot_at end;

  insert into public.powerhouse_runtime_events(
    dedupe_key,event_type,source,subject_key,occurred_at,evidence,context,state,data_quality,confidence
  ) values(
    'commercial-intelligence-heartbeat:'||p_run_date,
    'commercial_intelligence_heartbeat',
    'powerhouse-commercial-intelligence-heartbeat-v5',
    'company-person-commercial',
    v_now,
    jsonb_build_object(
      'source_nba','powerhouse_commercial_next_best_action_v5',
      'runtime_read_model','powerhouse_revenue_command_center_snapshot_v1',
      'snapshot_refreshed_at',v_snapshot_at,
      'snapshot_rows',v_rows,
      'snapshot_age_seconds',case when v_age is null then null else extract(epoch from v_age)::bigint end
    ),
    jsonb_build_object(
      'critical_path_mode','read_only_snapshot',
      'heavy_intelligence_refresh_inline',false,
      'reason','prevent lock contention/deadlocks with asynchronous research/composer/provider writebacks',
      'existing_refresh_owners_preserved',true,
      'single_action_materializer',true
    ),
    case when v_snapshot_at is not null and v_snapshot_at>=v_now-interval '6 hours' and v_rows>0 then 'actioned' else 'degraded' end,
    case when v_snapshot_at is not null and v_rows>0 then 'VERIFIED' else 'INCOMPLETE' end,
    case when v_snapshot_at is not null and v_snapshot_at>=v_now-interval '6 hours' and v_rows>0 then 1 else .4 end
  )
  on conflict(dedupe_key) do update set
    occurred_at=excluded.occurred_at,evidence=excluded.evidence,context=excluded.context,
    state=excluded.state,data_quality=excluded.data_quality,confidence=excluded.confidence,updated_at=now();

  return jsonb_build_object(
    'contract','powerhouse-commercial-intelligence-heartbeat-v5',
    'healthy',v_snapshot_at is not null and v_snapshot_at>=v_now-interval '6 hours' and v_rows>0,
    'source_nba','v5',
    'runtime_read_model','powerhouse_revenue_command_center_snapshot_v1',
    'snapshot_refreshed_at',v_snapshot_at,
    'snapshot_rows',v_rows,
    'snapshot_age_seconds',case when v_age is null then null else extract(epoch from v_age)::bigint end,
    'critical_path','read-only',
    'heavy_refresh_inline',false,
    'executed_at',v_now
  );
end $function$;

REVOKE EXECUTE ON FUNCTION public.powerhouse_commercial_intelligence_heartbeat_v1(p_run_date date) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.powerhouse_commercial_intelligence_heartbeat_v1(p_run_date date) TO service_role;

-- Fresh-preview bootstrap for production quality evidence dependency.
-- The production table/function predate this consolidation but were historically remote-only.
-- Keep this bootstrap idempotent so fresh hosted previews can replay the canonical forward lane.

CREATE TABLE IF NOT EXISTS public.powerhouse_message_quality_v1 (
  quality_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id uuid NOT NULL REFERENCES public.powerhouse_sales_actions(action_id) ON DELETE CASCADE,
  composer_version text NOT NULL,
  play_key text NOT NULL,
  channel text NOT NULL,
  message_hash text NOT NULL,
  passed boolean NOT NULL,
  score numeric NOT NULL CHECK (score >= 0 AND score <= 1),
  checks jsonb NOT NULL DEFAULT '{}'::jsonb,
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  evaluated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (action_id, message_hash)
);
ALTER TABLE public.powerhouse_message_quality_v1 ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.powerhouse_message_quality_v1 FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.powerhouse_outbound_message_quality_ready_v1(p_action_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_catalog', 'extensions'
AS $function$
  select coalesce((
    select case
      when nullif(trim(coalesce(a.message_draft,'')),'') is null then false
      when lower(replace(coalesce(a.channel,''),' ','_')) in ('email','e-mail','linkedin_dm')
        or (a.channel='linkedin_personal' and a.action_type='reply_post')
      then
        coalesce(a.evidence#>>'{commercial_intelligence,quality_passed}','false')='true'
        and coalesce(a.evidence#>>'{commercial_intelligence,message_hash}','')<>''
        and a.evidence#>>'{commercial_intelligence,message_hash}'
              = encode(extensions.digest(a.message_draft::bytea,'sha256'),'hex')
        and exists(
          select 1
          from public.powerhouse_message_quality_v1 q
          where q.action_id=a.action_id
            and q.message_hash=a.evidence#>>'{commercial_intelligence,message_hash}'
            and q.passed=true
        )
      else false
    end
    from public.powerhouse_sales_actions a
    where a.action_id=p_action_id
  ),false)
$function$;
REVOKE EXECUTE ON FUNCTION public.powerhouse_outbound_message_quality_ready_v1(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.powerhouse_outbound_message_quality_ready_v1(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.powerhouse_dispatch_linkedin_comment_autopilot_v1(p_run_date date DEFAULT ((now() AT TIME ZONE 'Europe/Amsterdam'::text))::date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
declare v_token text; v_request_id bigint; v_ready int:=0;
begin
  select count(*)::int into v_ready
  from public.powerhouse_sales_actions a
  where a.action_type='reply_post'
    and a.channel='linkedin_personal'
    and a.status='suggested'
    and (
      a.dedupe_key like 'command-social:'||p_run_date::text||':%'
      or (
        a.dedupe_key like 'research-social:%'
        and exists(
          select 1 from public.powerhouse_sales_actions r
          where r.action_id=nullif(a.evidence#>>'{commercial_intelligence,research_action_id}','')::uuid
            and r.executed_at>=now()-interval '24 hours'
        )
      )
    )
    and public.powerhouse_outbound_message_quality_ready_v1(a.action_id);

  if v_ready=0 then
    return jsonb_build_object('contract','powerhouse-linkedin-comment-autopilot-dispatch-v1',
      'dispatched',false,'reason','NO_CANONICAL_QUALITY_READY_COMMENTS');
  end if;

  select decrypted_secret into v_token
  from vault.decrypted_secrets
  where name='powerhouse_daily_scheduler_token'
  order by created_at desc limit 1;

  if nullif(v_token,'') is null then
    return jsonb_build_object('contract','powerhouse-linkedin-comment-autopilot-dispatch-v1',
      'dispatched',false,'reason','SCHEDULER_TOKEN_MISSING','ready',v_ready);
  end if;

  select net.http_post(
    url:='https://adhjwmvyoixzjtmiroln.supabase.co/functions/v1/powerhouse-social-publisher',
    headers:=jsonb_build_object('content-type','application/json','x-powerhouse-token',v_token),
    body:=jsonb_build_object('runDate',p_run_date,'mode','cockpit_autopilot'),
    timeout_milliseconds:=120000
  ) into v_request_id;

  return jsonb_build_object(
    'contract','powerhouse-linkedin-comment-autopilot-dispatch-v1',
    'dispatched',true,'ready',v_ready,'request_id',v_request_id,'run_date',p_run_date
  );
end $function$;

REVOKE EXECUTE ON FUNCTION public.powerhouse_dispatch_linkedin_comment_autopilot_v1(p_run_date date) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.powerhouse_dispatch_linkedin_comment_autopilot_v1(p_run_date date) TO service_role;

CREATE OR REPLACE FUNCTION public.powerhouse_dispatch_relationship_public_research_v1(p_run_date date DEFAULT ((now() AT TIME ZONE 'Europe/Amsterdam'::text))::date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
declare v_token text; v_request_id bigint; v_pending int;
begin
  select count(*)::int into v_pending
  from public.powerhouse_sales_actions
  where action_type='research_enrichment' and channel='internal'
    and status in ('suggested','prepared','waiting')
    and dedupe_key like 'relationship-research:%';

  if v_pending=0 then
    return jsonb_build_object('contract','powerhouse-relationship-public-research-dispatch-v1',
      'dispatched',false,'reason','NO_PENDING_RESEARCH');
  end if;

  select decrypted_secret into v_token
  from vault.decrypted_secrets
  where name='powerhouse_daily_scheduler_token'
  order by created_at desc limit 1;

  if nullif(v_token,'') is null then
    return jsonb_build_object('contract','powerhouse-relationship-public-research-dispatch-v1',
      'dispatched',false,'reason','SCHEDULER_TOKEN_MISSING','pending',v_pending);
  end if;

  select net.http_post(
    url:='https://adhjwmvyoixzjtmiroln.supabase.co/functions/v1/powerhouse-relationship-public-research',
    headers:=jsonb_build_object('content-type','application/json','x-powerhouse-token',v_token),
    body:=jsonb_build_object('run_date',p_run_date),
    timeout_milliseconds:=120000
  ) into v_request_id;

  return jsonb_build_object('contract','powerhouse-relationship-public-research-dispatch-v1',
    'dispatched',true,'pending',v_pending,'request_id',v_request_id,'run_date',p_run_date);
end $function$;

REVOKE EXECUTE ON FUNCTION public.powerhouse_dispatch_relationship_public_research_v1(p_run_date date) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.powerhouse_dispatch_relationship_public_research_v1(p_run_date date) TO service_role;

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
      '',coalesce(r.source_url,''),
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
end $function$;

REVOKE EXECUTE ON FUNCTION public.powerhouse_materialize_command_center_actions_v1(p_run_date date) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.powerhouse_materialize_command_center_actions_v1(p_run_date date) TO service_role;

CREATE OR REPLACE FUNCTION public.powerhouse_one_commercial_closed_loop_v1(p_run_date date DEFAULT ((now() AT TIME ZONE 'Europe/Amsterdam'::text))::date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
declare
 v_spine jsonb; v_intel jsonb; v_materialize jsonb; v_promote jsonb; v_plans jsonb; v_compose jsonb;
 v_social_gate jsonb; v_comment_dispatch jsonb; v_research_dispatch jsonb; v_email_dispatch jsonb; v_li_dispatch jsonb;
 v_no_response jsonb; v_learning jsonb; v_attribution jsonb; v_closure jsonb; v_health jsonb;
 v_email_ready int:=0; v_dm_ready int:=0; v_comment_ready int:=0; v_result jsonb;
begin
 v_spine:=public.powerhouse_revenue_event_spine_cycle_v1(p_run_date);
 v_intel:=public.powerhouse_commercial_intelligence_heartbeat_v1(p_run_date);
 v_materialize:=public.powerhouse_materialize_command_center_actions_v1(p_run_date);
 v_promote:=public.powerhouse_promote_research_to_social_v1();

 v_plans:=public.powerhouse_refresh_message_plans_v1(200);
 v_compose:=public.powerhouse_dispatch_human_sales_composer_v2(20);
 v_social_gate:=public.powerhouse_prepare_quality_social_comments_v1(p_run_date);
 v_comment_dispatch:=public.powerhouse_dispatch_linkedin_comment_autopilot_v1(p_run_date);

 select count(*)::int into v_email_ready
 from public.powerhouse_sales_actions a
 where a.action_type='autonomous_email' and a.channel='email' and a.status='prepared'
   and a.dedupe_key like 'command-email:'||p_run_date::text||':%'
   and public.powerhouse_outbound_message_quality_ready_v1(a.action_id);

 select count(*)::int into v_dm_ready
 from public.powerhouse_sales_actions a
 where a.channel='linkedin_dm' and a.status in ('prepared','suggested')
   and a.dedupe_key like 'command-dm:'||p_run_date::text||':%'
   and public.powerhouse_outbound_message_quality_ready_v1(a.action_id);

 select count(*)::int into v_comment_ready
 from public.powerhouse_sales_actions a
 where a.action_type='reply_post' and a.channel='linkedin_personal' and a.status='prepared'
   and nullif(trim(coalesce(a.source_url,'')),'') is not null
   and (
     a.dedupe_key like 'command-social:'||p_run_date::text||':%'
     or (
       a.dedupe_key like 'research-social:%'
       and exists(
         select 1 from public.powerhouse_sales_actions r
         where r.action_id=nullif(a.evidence#>>'{commercial_intelligence,research_action_id}','')::uuid
           and r.executed_at>=now()-interval '24 hours'
       )
     )
   );

 v_research_dispatch:=public.powerhouse_dispatch_relationship_public_research_v1(p_run_date);

 if v_email_ready>0 then
   v_email_dispatch:=public.powerhouse_dispatch_autonomous_outreach_v1(p_run_date);
 else
   v_email_dispatch:=jsonb_build_object('dispatched',false,'reason','NO_QUALITY_READY_EMAIL_ACTIONS');
 end if;

 if v_dm_ready>0 then
   v_li_dispatch:=public.powerhouse_dispatch_linkedin_sales_machine_v1(p_run_date);
 else
   v_li_dispatch:=jsonb_build_object('dispatched',false,'reason','NO_CANONICAL_QUALITY_READY_LINKEDIN_DM_ACTIONS');
 end if;

 v_no_response:=public.powerhouse_reconcile_no_response_outcomes_v1(now());
 v_learning:=public.powerhouse_refresh_outbound_learning_v1();
 v_attribution:=public.powerhouse_refresh_revenue_attribution_snapshot_v1();
 v_closure:=public.powerhouse_commercial_action_closure_watchdog_v1(now());
 select to_jsonb(h) into v_health from public.powerhouse_one_commercial_loop_health_v1 h;

 v_result:=jsonb_build_object(
   'contract','powerhouse-one-commercial-closed-loop-v2','run_date',p_run_date,
   'lineage','event->identity->intent/opportunity->nba-v5-snapshot->pressure/cooldown->single-materializer->research-if-needed->play/psychology->message/quality->provider->outcome->revenue->attribution->learning->next-nba',
   'revenue_spine',v_spine,'commercial_intelligence',v_intel,'action_materialization',v_materialize,
   'research_to_social_promotion',v_promote,'message_plans',v_plans,'composer_dispatch',v_compose,
   'social_quality_gate',v_social_gate,'linkedin_comment_dispatch',v_comment_dispatch,
   'email_quality_ready',v_email_ready,'linkedin_dm_quality_ready',v_dm_ready,'linkedin_comment_ready',v_comment_ready,
   'research_dispatch',v_research_dispatch,'email_provider_dispatch',v_email_dispatch,'linkedin_provider_dispatch',v_li_dispatch,
   'terminal_outcomes',v_no_response,'outbound_learning',v_learning,'attribution',v_attribution,'closure_watchdog',v_closure,
   'health',v_health,'executed_at',now()
 );

 insert into public.powerhouse_runtime_events(
   dedupe_key,event_type,source,subject_key,occurred_at,evidence,context,state,data_quality,confidence
 ) values(
   'one-commercial-closed-loop:'||p_run_date::text,'one_commercial_closed_loop',
   'powerhouse-one-commercial-closed-loop-v2','growth-revenue-os',now(),v_result,
   jsonb_build_object('existing_state_first',true,'single_candidate_owner',true,'provider_gates_preserved',true,
     'nba_version','v5','runtime_read_model','revenue_command_center_snapshot_v1','heavy_steps_async',true),
   'actioned','VERIFIED',1
 )
 on conflict(dedupe_key) do update set occurred_at=excluded.occurred_at,evidence=excluded.evidence,
   context=excluded.context,state=excluded.state,updated_at=now();

 return v_result;
end $function$;

REVOKE EXECUTE ON FUNCTION public.powerhouse_one_commercial_closed_loop_v1(p_run_date date) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.powerhouse_one_commercial_closed_loop_v1(p_run_date date) TO service_role;

CREATE OR REPLACE FUNCTION public.powerhouse_prepare_autonomous_outreach_v1(p_run_date date DEFAULT ((now() AT TIME ZONE 'Europe/Amsterdam'::text))::date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
declare v_n int;
begin
  select count(*)::int into v_n from public.powerhouse_sales_actions
  where action_type='autonomous_email' and channel='email' and status='prepared'
    and due_at<=now();
  return jsonb_build_object('contract','powerhouse-autonomous-outreach-canonical-adapter-v1',
    'prepared',v_n,'candidate_owner','powerhouse-command-center-action-materializer-v1',
    'duplicate_candidate_generation',false,'run_date',p_run_date,'executed_at',now());
end $function$;

REVOKE EXECUTE ON FUNCTION public.powerhouse_prepare_autonomous_outreach_v1(p_run_date date) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.powerhouse_prepare_autonomous_outreach_v1(p_run_date date) TO service_role;

CREATE OR REPLACE FUNCTION public.powerhouse_prepare_linkedin_sales_machine_v1(p_run_date date DEFAULT ((now() AT TIME ZONE 'Europe/Amsterdam'::text))::date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
declare v_comments int; v_dm int;
begin
  select count(*)::int into v_comments from public.powerhouse_sales_actions
  where action_type='reply_post' and channel='linkedin_personal' and status='prepared';
  select count(*)::int into v_dm from public.powerhouse_sales_actions
  where channel='linkedin_dm' and status in ('prepared','suggested');
  return jsonb_build_object('contract','powerhouse-linkedin-sales-canonical-adapter-v1',
    'comment_candidates',v_comments,'dm_candidates',v_dm,
    'candidate_owner','powerhouse-command-center-action-materializer-v1',
    'duplicate_candidate_generation',false,'run_date',p_run_date,'executed_at',now());
end $function$;

REVOKE EXECUTE ON FUNCTION public.powerhouse_prepare_linkedin_sales_machine_v1(p_run_date date) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.powerhouse_prepare_linkedin_sales_machine_v1(p_run_date date) TO service_role;

CREATE OR REPLACE FUNCTION public.powerhouse_prepare_quality_social_comments_v1(p_run_date date DEFAULT ((now() AT TIME ZONE 'Europe/Amsterdam'::text))::date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
declare v_ready int:=0; v_done_today int:=0; v_already_released int:=0; v_slots int:=0;
begin
  select count(*)::int into v_done_today
  from public.powerhouse_sales_actions
  where action_type='reply_post' and channel='linkedin_personal'
    and status='done'
    and executed_at>=date_trunc('day',now() at time zone 'Europe/Amsterdam') at time zone 'Europe/Amsterdam';

  select count(*)::int into v_already_released
  from public.powerhouse_sales_actions a
  where a.action_type='reply_post' and a.channel='linkedin_personal' and a.status in ('suggested','waiting')
    and (
      a.dedupe_key like 'command-social:'||p_run_date::text||':%'
      or (
        a.dedupe_key like 'research-social:%'
        and exists(
          select 1 from public.powerhouse_sales_actions r
          where r.action_id=nullif(a.evidence#>>'{commercial_intelligence,research_action_id}','')::uuid
            and r.executed_at>=now()-interval '24 hours'
        )
      )
    );

  v_slots:=greatest(0,3-v_done_today-v_already_released);

  with candidates as (
    select a.action_id
    from public.powerhouse_sales_actions a
    where a.action_type='reply_post'
      and a.channel='linkedin_personal'
      and a.status='prepared'
      and nullif(trim(coalesce(a.source_url,'')),'') is not null
      and (
        a.dedupe_key like 'command-social:'||p_run_date::text||':%'
        or (
          a.dedupe_key like 'research-social:%'
          and exists(
            select 1 from public.powerhouse_sales_actions r
            where r.action_id=nullif(a.evidence#>>'{commercial_intelligence,research_action_id}','')::uuid
              and r.executed_at>=now()-interval '24 hours'
          )
        )
      )
      and public.powerhouse_outbound_message_quality_ready_v1(a.action_id)
    order by a.priority desc,a.created_at asc
    limit v_slots
  )
  update public.powerhouse_sales_actions a
  set status='suggested',
      evidence=coalesce(a.evidence,'{}'::jsonb)||jsonb_build_object(
        'social_execution_gate',jsonb_build_object(
          'contract','powerhouse-exact-quality-social-gate-v2',
          'quality_passed',true,'exact_message_hash_verified',true,
          'daily_cap',3,'released_at',now()
        )
      ),
      updated_at=now()
  from candidates c
  where a.action_id=c.action_id;
  get diagnostics v_ready=row_count;

  return jsonb_build_object(
    'contract','powerhouse-exact-quality-social-gate-v2',
    'released_to_social_publisher',v_ready,'exact_message_quality_required',true,
    'daily_cap',3,'done_today',v_done_today,'already_released',v_already_released,'slots_before_release',v_slots,
    'run_date',p_run_date,'executed_at',now()
  );
end $function$;

REVOKE EXECUTE ON FUNCTION public.powerhouse_prepare_quality_social_comments_v1(p_run_date date) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.powerhouse_prepare_quality_social_comments_v1(p_run_date date) TO service_role;

CREATE OR REPLACE FUNCTION public.powerhouse_promote_research_to_social_v1()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
declare v_n int:=0; v_sent_today int:=0; v_slots int:=0;
begin
  select count(*)::int into v_sent_today
  from public.powerhouse_sales_actions
  where action_type='reply_post' and channel='linkedin_personal'
    and status='done'
    and executed_at>=date_trunc('day',now() at time zone 'Europe/Amsterdam') at time zone 'Europe/Amsterdam';

  v_slots:=greatest(0,3-v_sent_today);

  with candidates as (
    select a.*
    from public.powerhouse_sales_actions a
    where a.action_type='research_enrichment'
      and a.channel='internal'
      and a.status='done'
      and a.executed_at>=now()-interval '24 hours'
      and nullif(trim(coalesce(a.source_url,'')),'') is not null
      and nullif(trim(coalesce(
        a.evidence#>>'{public_research_execution,headline}',
        a.evidence#>>'{public_research_execution,summary}',''
      )),'') is not null
      and not exists(
        select 1 from public.powerhouse_sales_actions x
        where x.dedupe_key='research-social:'||a.action_id::text
      )
    order by a.priority desc,a.executed_at desc
    limit v_slots
  )
  insert into public.powerhouse_sales_actions(
    dedupe_key,subject_key,person_key,company_key,action_type,channel,priority,reason,evidence,message_draft,
    source_url,status,due_at,opportunity_key,expected_value_eur,person_name,company_name,role
  )
  select
    'research-social:'||a.action_id::text,a.subject_key,a.person_key,a.company_key,
    'reply_post','linkedin_personal',a.priority,
    'Fresh verified public research promoted into a value-adding LinkedIn context action.',
    coalesce(a.evidence,'{}'::jsonb)||jsonb_build_object(
      'headline',a.evidence#>>'{public_research_execution,headline}',
      'summary',a.evidence#>>'{public_research_execution,summary}',
      'source_ref','powerhouse_sales_action:'||a.action_id::text,
      'commercial_intelligence',
        coalesce(a.evidence->'commercial_intelligence','{}'::jsonb)||
        jsonb_build_object(
          'research_promoted',true,
          'research_action_id',a.action_id,
          'research_executed_at',a.executed_at,
          'source_context_ready',true,
          'freshness_window_hours',24
        )
    ),
    '',coalesce(a.source_url,''),'prepared',now(),a.opportunity_key,a.expected_value_eur,
    a.person_name,a.company_name,a.role
  from candidates a
  on conflict(dedupe_key) do nothing;
  get diagnostics v_n=row_count;

  return jsonb_build_object(
    'contract','powerhouse-fresh-research-promotion-v1',
    'promoted',v_n,'daily_cap',3,'already_sent_today',v_sent_today,'slots_available',v_slots,
    'freshness_window_hours',24,'executed_at',now()
  );
end $function$;

REVOKE EXECUTE ON FUNCTION public.powerhouse_promote_research_to_social_v1() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.powerhouse_promote_research_to_social_v1() TO service_role;

CREATE OR REPLACE FUNCTION public.powerhouse_reconcile_no_response_outcomes_v1(p_now timestamp with time zone DEFAULT now())
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
declare v_inserted int:=0;
begin
 insert into public.powerhouse_sales_outcomes(
   action_id,dedupe_key,outcome_type,subject_key,person_key,company_key,revenue_eur,evidence,occurred_at,
   content_key,topic_key,campaign_key,opportunity_key,channel
 )
 select
   a.action_id,'no-response-72h:'||a.action_id::text,'no_response',
   a.subject_key,a.person_key,a.company_key,0,
   jsonb_build_object(
     'contract','powerhouse-terminal-action-outcome-v1',
     'truth_class','observed_absence_window',
     'window_hours',72,
     'interpretation','No observed response within 72h; this is response-rate evidence, not rejection.',
     'message_hash',coalesce(a.evidence#>>'{commercial_intelligence,message_hash}',a.evidence->>'sent_message_hash'),
     'message_strategy',a.evidence#>>'{commercial_intelligence,message_strategy}',
     'learning_key',a.evidence#>>'{commercial_intelligence,learning_key}'
   ),
   a.executed_at+interval '72 hours',
   a.content_key,a.topic_key,a.campaign_key,a.opportunity_key,a.channel
 from public.powerhouse_sales_actions a
 where a.status='done'
   and a.executed_at is not null
   and a.executed_at<=p_now-interval '72 hours'
   and lower(replace(a.channel,' ','_')) in ('email','e-mail','linkedin_dm','linkedin')
   and not exists(select 1 from public.powerhouse_sales_outcomes o where o.action_id=a.action_id)
   and not exists(select 1 from public.powerhouse_email_reply_events e where e.action_id=a.action_id);
 get diagnostics v_inserted=row_count;
 return jsonb_build_object('contract','powerhouse-terminal-action-outcome-v1','no_response_outcomes_inserted',v_inserted,'observed_at',p_now);
end $function$;

REVOKE EXECUTE ON FUNCTION public.powerhouse_reconcile_no_response_outcomes_v1(p_now timestamp with time zone) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.powerhouse_reconcile_no_response_outcomes_v1(p_now timestamp with time zone) TO service_role;

CREATE OR REPLACE FUNCTION public.powerhouse_refresh_connection_enrichment_batch_v1(p_run_date date DEFAULT ((now() AT TIME ZONE 'Europe/Amsterdam'::text))::date, p_batch_size integer DEFAULT 200)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
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
end $function$;

REVOKE EXECUTE ON FUNCTION public.powerhouse_refresh_connection_enrichment_batch_v1(p_run_date date, p_batch_size integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.powerhouse_refresh_connection_enrichment_batch_v1(p_run_date date, p_batch_size integer) TO service_role;

CREATE OR REPLACE FUNCTION public.powerhouse_revenue_event_spine_cycle_v1(p_run_date date DEFAULT ((now() AT TIME ZONE 'Europe/Amsterdam'::text))::date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
declare v_identity jsonb; v_attribution jsonb; v_health jsonb; v_result jsonb;
begin
  v_identity:=public.powerhouse_sync_identity_graph_batch_v1(500);
  v_attribution:=public.powerhouse_refresh_revenue_attribution_snapshot_v1();
  select to_jsonb(h) into v_health from public.powerhouse_revenue_event_spine_health_v1 h;

  v_result:=jsonb_build_object(
    'contract','powerhouse-rocket-revenue-event-spine-v2','run_date',p_run_date,
    'identity_graph',v_identity,'multi_touch_attribution',v_attribution,'health',v_health,
    'orchestration',jsonb_build_object(
      'mode','bounded_incremental_runtime',
      'full_identity_maintenance_owner','powerhouse_sync_identity_graph_v1 independent maintenance',
      'runtime_identity_owner','powerhouse_sync_identity_graph_batch_v1',
      'next_best_action_owner','powerhouse_commercial_next_best_action_v5 -> revenue_command_center_snapshot_v1',
      'action_owner','powerhouse_materialize_command_center_actions_v1',
      'reason','Heavy whole-graph maintenance is outside the latency-critical commercial execution loop.'
    ),
    'executed_at',now()
  );

  insert into public.powerhouse_runtime_events(
    dedupe_key,event_type,source,subject_key,occurred_at,evidence,context,state,data_quality,confidence,updated_at
  ) values(
    'rocket-revenue-spine:'||p_run_date,'rocket_revenue_event_spine_cycle',
    'powerhouse-rocket-revenue-event-spine-v2','growth-revenue-os',now(),v_result,
    jsonb_build_object('existing_state_first',true,'reuse_first',true,'bounded_incremental_runtime',true),
    case when coalesce((v_health->>'attribution_balanced')::boolean,true) then 'actioned' else 'degraded' end,
    'VERIFIED',1,now()
  )
  on conflict(dedupe_key) do update set occurred_at=excluded.occurred_at,evidence=excluded.evidence,
    context=excluded.context,state=excluded.state,updated_at=excluded.updated_at;
  return v_result;
end $function$;

REVOKE EXECUTE ON FUNCTION public.powerhouse_revenue_event_spine_cycle_v1(p_run_date date) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.powerhouse_revenue_event_spine_cycle_v1(p_run_date date) TO service_role;

CREATE OR REPLACE FUNCTION public.powerhouse_sync_identity_graph_batch_v1(p_batch_size integer DEFAULT 500)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
declare v_now timestamptz:=now(); v_contacts int:=0; v_opps int:=0; v_events int:=0;
begin
  with candidates as (
    select *
    from public.bg_connecties
    where coalesce(nullif(trim(sleutel),''),nullif(trim(linkedin_url),''),nullif(trim(email),'')) is not null
    order by bijgewerkt_op desc nulls last
    limit greatest(1,least(coalesce(p_batch_size,500),1000))
  ), raw as (
    select
      coalesce(nullif(trim(sleutel),''),'person:'||md5(coalesce(nullif(lower(trim(linkedin_url)),''),nullif(lower(trim(email)),''),nullif(lower(trim(naam)),''),'unknown'))) entity_key,
      nullif(trim(sleutel),'') person_key,
      nullif(lower(regexp_replace(trim(coalesce(bedrijf,'')),'\s+',' ','g')),'') company_key,
      x.identifier_type,md5(lower(trim(x.identifier_value))) identifier_hash,
      greatest(.50::numeric,least(1::numeric,coalesce(prioriteit,0)/100.0)) confidence,
      jsonb_build_object('relationship_status',status,'segment',segment,'source',coalesce(bron,'bg_connecties')) evidence,
      bijgewerkt_op source_updated_at
    from candidates
    cross join lateral(values
      ('linkedin_url',nullif(linkedin_url,'')),('email',nullif(email,'')),('connection_key',nullif(sleutel,''))
    ) x(identifier_type,identifier_value)
    where x.identifier_value is not null
  ), src as (
    select distinct on(identifier_type,identifier_hash)
      entity_key,person_key,company_key,identifier_type,identifier_hash,confidence,evidence
    from raw order by identifier_type,identifier_hash,source_updated_at desc nulls last,confidence desc
  )
  insert into public.powerhouse_identity_graph_v1(
    entity_type,entity_key,person_key,company_key,identifier_type,identifier_hash,source,confidence,first_seen_at,last_seen_at,evidence
  )
  select 'person',entity_key,person_key,company_key,identifier_type,identifier_hash,'bg_connecties',confidence,v_now,v_now,evidence
  from src
  on conflict(entity_type,identifier_type,identifier_hash) do update set
    entity_key=excluded.entity_key,
    person_key=coalesce(excluded.person_key,public.powerhouse_identity_graph_v1.person_key),
    company_key=coalesce(excluded.company_key,public.powerhouse_identity_graph_v1.company_key),
    confidence=greatest(public.powerhouse_identity_graph_v1.confidence,excluded.confidence),
    last_seen_at=v_now,evidence=public.powerhouse_identity_graph_v1.evidence||excluded.evidence;
  get diagnostics v_contacts=row_count;

  with recent as (
    select *
    from public.powerhouse_opportunities
    where coalesce(nullif(trim(person_key),''),nullif(trim(company_key),''),nullif(trim(subject_key),'')) is not null
    order by updated_at desc nulls last
    limit greatest(1,least(coalesce(p_batch_size,500),1000))
  ), src as (
    select distinct on(entity_type,identifier_type,identifier_hash)
      entity_type,entity_key,person_key,company_key,identifier_type,identifier_hash,confidence,evidence
    from (
      select case when nullif(trim(person_key),'') is not null then 'person' else 'company' end entity_type,
        coalesce(nullif(trim(person_key),''),nullif(trim(company_key),''),nullif(trim(subject_key),'')) entity_key,
        nullif(trim(person_key),'') person_key,nullif(trim(company_key),'') company_key,
        case when nullif(trim(person_key),'') is not null then 'person_key' else 'company_key' end identifier_type,
        md5(lower(trim(coalesce(nullif(person_key,''),nullif(company_key,''),subject_key)))) identifier_hash,
        least(1::numeric,greatest(.25::numeric,coalesce(confidence,.5))) confidence,
        jsonb_build_object('opportunity_key',opportunity_key,'stage',stage,'status',status) evidence,
        updated_at source_updated_at
      from recent
    ) q
    order by entity_type,identifier_type,identifier_hash,source_updated_at desc nulls last,confidence desc
  )
  insert into public.powerhouse_identity_graph_v1(
    entity_type,entity_key,person_key,company_key,identifier_type,identifier_hash,source,confidence,first_seen_at,last_seen_at,evidence
  )
  select entity_type,entity_key,person_key,company_key,identifier_type,identifier_hash,'powerhouse_opportunities',confidence,v_now,v_now,evidence
  from src
  on conflict(entity_type,identifier_type,identifier_hash) do update set
    entity_key=excluded.entity_key,
    person_key=coalesce(excluded.person_key,public.powerhouse_identity_graph_v1.person_key),
    company_key=coalesce(excluded.company_key,public.powerhouse_identity_graph_v1.company_key),
    confidence=greatest(public.powerhouse_identity_graph_v1.confidence,excluded.confidence),
    last_seen_at=v_now,evidence=public.powerhouse_identity_graph_v1.evidence||excluded.evidence;
  get diagnostics v_opps=row_count;

  with recent as (
    select *
    from public.growth_events
    where is_robot is not true
      and occurred_at>=v_now-interval '30 days'
      and coalesce(nullif(trim(payload->>'person_key'),''),nullif(trim(payload->>'company_key'),''),nullif(trim(canonical),''),nullif(trim(attribution_root_key),'')) is not null
    order by occurred_at desc
    limit greatest(1,least(coalesce(p_batch_size,500),1000))
  ), raw as (
    select
      case when nullif(trim(payload->>'person_key'),'') is not null then 'person' else 'company' end entity_type,
      coalesce(nullif(trim(payload->>'person_key'),''),nullif(trim(payload->>'company_key'),''),nullif(trim(canonical),''),nullif(trim(attribution_root_key),'')) entity_key,
      nullif(trim(payload->>'person_key'),'') person_key,nullif(trim(payload->>'company_key'),'') company_key,
      case when nullif(trim(payload->>'person_key'),'') is not null then 'event_person_key'
           when nullif(trim(payload->>'company_key'),'') is not null then 'event_company_key' else 'attribution_root_key' end identifier_type,
      md5(lower(trim(coalesce(nullif(payload->>'person_key',''),nullif(payload->>'company_key',''),nullif(canonical,''),attribution_root_key)))) identifier_hash,
      occurred_at,jsonb_build_object('source','growth_events','event_type',event_type) evidence
    from recent
  ), src as (
    select distinct on(entity_type,identifier_type,identifier_hash)
      entity_type,entity_key,person_key,company_key,identifier_type,identifier_hash,occurred_at,evidence
    from raw order by entity_type,identifier_type,identifier_hash,occurred_at desc
  )
  insert into public.powerhouse_identity_graph_v1(
    entity_type,entity_key,person_key,company_key,identifier_type,identifier_hash,source,confidence,first_seen_at,last_seen_at,evidence
  )
  select entity_type,entity_key,person_key,company_key,identifier_type,identifier_hash,'growth_events',.60,v_now,occurred_at,evidence
  from src
  on conflict(entity_type,identifier_type,identifier_hash) do update set
    entity_key=excluded.entity_key,
    person_key=coalesce(excluded.person_key,public.powerhouse_identity_graph_v1.person_key),
    company_key=coalesce(excluded.company_key,public.powerhouse_identity_graph_v1.company_key),
    confidence=greatest(public.powerhouse_identity_graph_v1.confidence,excluded.confidence),
    last_seen_at=greatest(public.powerhouse_identity_graph_v1.last_seen_at,excluded.last_seen_at),
    evidence=public.powerhouse_identity_graph_v1.evidence||excluded.evidence;
  get diagnostics v_events=row_count;

  return jsonb_build_object('contract','powerhouse-identity-graph-batch-v1','batch_size',p_batch_size,
    'contacts_touched',v_contacts,'opportunities_touched',v_opps,'events_touched',v_events,
    'nodes',(select count(distinct entity_type||':'||entity_key) from public.powerhouse_identity_graph_v1),
    'identifiers',(select count(*) from public.powerhouse_identity_graph_v1),
    'bounded_incremental',true,'executed_at',v_now);
end $function$;

REVOKE EXECUTE ON FUNCTION public.powerhouse_sync_identity_graph_batch_v1(p_batch_size integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.powerhouse_sync_identity_graph_batch_v1(p_batch_size integer) TO service_role;

CREATE OR REPLACE VIEW public.powerhouse_one_commercial_loop_health_v1 WITH (security_invoker=true) AS
 SELECT now() AS measured_at,
    count(*) FILTER (WHERE created_at >= (now() - '30 days'::interval)) AS actions_30d,
    count(*) FILTER (WHERE status = 'done'::text AND executed_at >= (now() - '30 days'::interval)) AS executed_30d,
    count(*) FILTER (WHERE status = 'done'::text AND executed_at >= (now() - '30 days'::interval) AND (COALESCE(evidence #>> '{autonomous_outbound,provider_ack_verified}'::text[], 'false'::text) = 'true'::text OR COALESCE(evidence #>> '{salesrobot_execution,provider_ack_verified}'::text[], 'false'::text) = 'true'::text OR COALESCE(evidence ->> 'provider_ack_verified'::text, 'false'::text) = 'true'::text)) AS provider_ack_30d,
    count(*) FILTER (WHERE status = 'done'::text AND executed_at >= (now() - '30 days'::interval) AND (EXISTS ( SELECT 1
           FROM powerhouse_sales_outcomes o
          WHERE o.action_id = a.action_id))) AS terminal_outcome_linked_30d,
    count(*) FILTER (WHERE (status = ANY (ARRAY['suggested'::text, 'prepared'::text, 'waiting'::text])) AND COALESCE(evidence #>> '{commercial_intelligence,message_strategy}'::text[], ''::text) <> ''::text) AS pending_strategy_labeled,
    count(*) FILTER (WHERE (status = ANY (ARRAY['suggested'::text, 'prepared'::text, 'waiting'::text])) AND COALESCE(message_draft, ''::text) <> ''::text AND powerhouse_outbound_message_quality_ready_v1(action_id)) AS pending_quality_ready,
    count(*) FILTER (WHERE (status = ANY (ARRAY['suggested'::text, 'prepared'::text, 'waiting'::text])) AND COALESCE(evidence #>> '{commercial_intelligence,source_nba}'::text[], ''::text) = 'powerhouse_commercial_next_best_action_v5'::text) AS pending_from_nba_v5,
    count(*) FILTER (WHERE status = 'done'::text AND executed_at >= (now() - '30 days'::interval) AND (COALESCE(evidence #>> '{autonomous_outbound,provider_ack_verified}'::text[], 'false'::text) = 'true'::text OR COALESCE(evidence #>> '{salesrobot_execution,provider_ack_verified}'::text[], 'false'::text) = 'true'::text OR COALESCE(evidence ->> 'provider_ack_verified'::text, 'false'::text) = 'true'::text) AND (EXISTS ( SELECT 1
           FROM powerhouse_sales_outcomes o
          WHERE o.action_id = a.action_id))) AS provider_ack_outcome_linked_30d
   FROM powerhouse_sales_actions a;;
REVOKE ALL ON public.powerhouse_one_commercial_loop_health_v1 FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.powerhouse_one_commercial_loop_health_v1 TO service_role;


-- Final content-bound outbound quality and verified LinkedIn target gates.
CREATE OR REPLACE FUNCTION public.powerhouse_dispatch_linkedin_comment_autopilot_v1(p_run_date date DEFAULT ((now() AT TIME ZONE 'Europe/Amsterdam'::text))::date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
declare v_token text; v_request_id bigint; v_ready int:=0;
begin
  select count(*)::int into v_ready
  from public.powerhouse_sales_actions a
  where a.action_type='reply_post'
    and a.channel='linkedin_personal'
    and a.status='suggested'
    and a.source_url ~* '^https://(www[.])?linkedin[.]com/(posts/|feed/update/|pulse/)'
    and (
      a.dedupe_key like 'command-social:'||p_run_date::text||':%'
      or (
        a.dedupe_key like 'research-social:%'
        and exists(
          select 1 from public.powerhouse_sales_actions r
          where r.action_id=nullif(a.evidence#>>'{commercial_intelligence,research_action_id}','')::uuid
            and r.executed_at>=now()-interval '24 hours'
        )
      )
    )
    and public.powerhouse_social_message_quality_ready_v1(a.action_id);

  if v_ready=0 then
    return jsonb_build_object(
      'contract','powerhouse-linkedin-comment-autopilot-dispatch-v3',
      'dispatched',false,'reason','NO_CANONICAL_QUALITY_READY_LINKEDIN_POST_COMMENTS'
    );
  end if;

  select decrypted_secret into v_token
  from vault.decrypted_secrets
  where name='powerhouse_daily_scheduler_token'
  order by created_at desc limit 1;

  if nullif(v_token,'') is null then
    return jsonb_build_object(
      'contract','powerhouse-linkedin-comment-autopilot-dispatch-v3',
      'dispatched',false,'reason','SCHEDULER_TOKEN_MISSING','ready',v_ready
    );
  end if;

  select net.http_post(
    url:='https://adhjwmvyoixzjtmiroln.supabase.co/functions/v1/powerhouse-social-publisher',
    headers:=jsonb_build_object('content-type','application/json','x-powerhouse-token',v_token),
    body:=jsonb_build_object('runDate',p_run_date,'mode','cockpit_autopilot'),
    timeout_milliseconds:=120000
  ) into v_request_id;

  return jsonb_build_object(
    'contract','powerhouse-linkedin-comment-autopilot-dispatch-v3',
    'dispatched',true,'ready',v_ready,'request_id',v_request_id,'run_date',p_run_date
  );
end $function$;
REVOKE EXECUTE ON FUNCTION public.powerhouse_dispatch_linkedin_comment_autopilot_v1(p_run_date date) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.powerhouse_dispatch_linkedin_comment_autopilot_v1(p_run_date date) TO service_role;

CREATE OR REPLACE FUNCTION public.powerhouse_outbound_message_quality_ready_v1(p_action_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_catalog', 'extensions'
AS $function$
  select coalesce((
    select case
      when nullif(trim(coalesce(a.message_draft,'')),'') is null then false
      when lower(replace(coalesce(a.channel,''),' ','_')) in ('email','e-mail','linkedin_dm')
        or (a.channel='linkedin_personal' and a.action_type='reply_post')
      then
        coalesce(a.evidence#>>'{commercial_intelligence,quality_passed}','false')='true'
        and coalesce(a.evidence#>>'{commercial_intelligence,message_hash}','')<>''
        and a.evidence#>>'{commercial_intelligence,message_hash}'
              = encode(extensions.digest(a.message_draft::bytea,'sha256'),'hex')
        and exists(
          select 1
          from public.powerhouse_message_quality_v1 q
          where q.action_id=a.action_id
            and q.message_hash=a.evidence#>>'{commercial_intelligence,message_hash}'
            and q.passed=true
        )
      else false
    end
    from public.powerhouse_sales_actions a
    where a.action_id=p_action_id
  ),false)
$function$;
REVOKE EXECUTE ON FUNCTION public.powerhouse_outbound_message_quality_ready_v1(p_action_id uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.powerhouse_outbound_message_quality_ready_v1(p_action_id uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.powerhouse_prepare_quality_social_comments_v1(p_run_date date DEFAULT ((now() AT TIME ZONE 'Europe/Amsterdam'::text))::date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
declare v_ready int:=0; v_done_today int:=0; v_already_released int:=0; v_slots int:=0;
begin
  select count(*)::int into v_done_today
  from public.powerhouse_sales_actions
  where action_type='reply_post' and channel='linkedin_personal'
    and status='done'
    and executed_at>=date_trunc('day',now() at time zone 'Europe/Amsterdam') at time zone 'Europe/Amsterdam';

  select count(*)::int into v_already_released
  from public.powerhouse_sales_actions a
  where a.action_type='reply_post'
    and a.channel='linkedin_personal'
    and a.status in ('suggested','waiting')
    and a.source_url ~* '^https://(www[.])?linkedin[.]com/(posts/|feed/update/|pulse/)'
    and (
      a.dedupe_key like 'command-social:'||p_run_date::text||':%'
      or (
        a.dedupe_key like 'research-social:%'
        and exists(
          select 1 from public.powerhouse_sales_actions r
          where r.action_id=nullif(a.evidence#>>'{commercial_intelligence,research_action_id}','')::uuid
            and r.executed_at>=now()-interval '24 hours'
        )
      )
    );

  v_slots:=greatest(0,3-v_done_today-v_already_released);

  with candidates as (
    select a.action_id,
           row_number() over(partition by lower(trim(a.source_url))
                             order by a.priority desc,a.created_at asc,a.action_id) target_rank
    from public.powerhouse_sales_actions a
    where a.action_type='reply_post'
      and a.channel='linkedin_personal'
      and a.status='prepared'
      and a.source_url ~* '^https://(www[.])?linkedin[.]com/(posts/|feed/update/|pulse/)'
      and (
        a.dedupe_key like 'command-social:'||p_run_date::text||':%'
        or (
          a.dedupe_key like 'research-social:%'
          and exists(
            select 1 from public.powerhouse_sales_actions r
            where r.action_id=nullif(a.evidence#>>'{commercial_intelligence,research_action_id}','')::uuid
              and r.executed_at>=now()-interval '24 hours'
          )
        )
      )
      and public.powerhouse_social_message_quality_ready_v1(a.action_id)
  ), bounded as (
    select action_id from candidates where target_rank=1
    order by action_id
    limit v_slots
  )
  update public.powerhouse_sales_actions a
  set status='suggested',
      evidence=coalesce(a.evidence,'{}'::jsonb)||jsonb_build_object(
        'social_execution_gate',jsonb_build_object(
          'contract','powerhouse-exact-quality-social-gate-v4',
          'quality_passed',true,'exact_message_hash_verified',true,
          'linkedin_post_context_verified',true,'target_post_deduplicated',true,
          'daily_cap',3,'released_at',now()
        )
      ),
      updated_at=now()
  from bounded c
  where a.action_id=c.action_id;
  get diagnostics v_ready=row_count;

  return jsonb_build_object(
    'contract','powerhouse-exact-quality-social-gate-v4',
    'released_to_social_publisher',v_ready,'exact_message_quality_required',true,
    'linkedin_post_url_required',true,'target_post_dedupe_required',true,
    'daily_cap',3,'done_today',v_done_today,'already_released',v_already_released,
    'slots_before_release',v_slots,'run_date',p_run_date,'executed_at',now()
  );
end $function$;
REVOKE EXECUTE ON FUNCTION public.powerhouse_prepare_quality_social_comments_v1(p_run_date date) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.powerhouse_prepare_quality_social_comments_v1(p_run_date date) TO service_role;

CREATE OR REPLACE FUNCTION public.powerhouse_promote_research_to_social_v1()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
declare v_n int:=0; v_sent_today int:=0; v_slots int:=0;
begin
  select count(*)::int into v_sent_today
  from public.powerhouse_sales_actions
  where action_type='reply_post' and channel='linkedin_personal'
    and status='done'
    and executed_at>=date_trunc('day',now() at time zone 'Europe/Amsterdam') at time zone 'Europe/Amsterdam';

  v_slots:=greatest(0,3-v_sent_today);

  with candidates as (
    select a.*
    from public.powerhouse_sales_actions a
    where a.action_type='research_enrichment'
      and a.channel='internal'
      and a.status='done'
      and a.executed_at>=now()-interval '24 hours'
      and a.source_url ~* '^https://(www[.])?linkedin[.]com/(posts/|feed/update/|pulse/)'
      and nullif(trim(coalesce(
        a.evidence#>>'{public_research_execution,headline}',
        a.evidence#>>'{public_research_execution,summary}',''
      )),'') is not null
      and not exists(
        select 1 from public.powerhouse_sales_actions x
        where x.dedupe_key='research-social:'||a.action_id::text
      )
    order by a.priority desc,a.executed_at desc
    limit v_slots
  )
  insert into public.powerhouse_sales_actions(
    dedupe_key,subject_key,person_key,company_key,action_type,channel,priority,reason,evidence,message_draft,
    source_url,status,due_at,opportunity_key,expected_value_eur,person_name,company_name,role
  )
  select
    'research-social:'||a.action_id::text,a.subject_key,a.person_key,a.company_key,
    'reply_post','linkedin_personal',a.priority,
    'Fresh verified LinkedIn post research promoted into a value-adding reply action.',
    coalesce(a.evidence,'{}'::jsonb)||jsonb_build_object(
      'headline',a.evidence#>>'{public_research_execution,headline}',
      'summary',a.evidence#>>'{public_research_execution,summary}',
      'source_ref','powerhouse_sales_action:'||a.action_id::text,
      'commercial_intelligence',
        coalesce(a.evidence->'commercial_intelligence','{}'::jsonb)||
        jsonb_build_object(
          'research_promoted',true,'research_action_id',a.action_id,'research_executed_at',a.executed_at,
          'source_context_ready',true,'linkedin_post_context_verified',true,'freshness_window_hours',24
        )
    ),
    '',coalesce(a.source_url,''),'prepared',now(),a.opportunity_key,a.expected_value_eur,
    a.person_name,a.company_name,a.role
  from candidates a
  on conflict(dedupe_key) do nothing;
  get diagnostics v_n=row_count;

  return jsonb_build_object(
    'contract','powerhouse-linkedin-post-research-promotion-v2',
    'promoted',v_n,'daily_cap',3,'already_sent_today',v_sent_today,'slots_available',v_slots,
    'freshness_window_hours',24,'linkedin_post_url_required',true,'executed_at',now()
  );
end $function$;
REVOKE EXECUTE ON FUNCTION public.powerhouse_promote_research_to_social_v1() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.powerhouse_promote_research_to_social_v1() TO service_role;

