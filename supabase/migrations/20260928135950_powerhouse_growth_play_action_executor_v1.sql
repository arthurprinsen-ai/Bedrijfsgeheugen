-- Powerhouse Growth Play Action Executor v1
-- Converts persuasion decisions and Growth Swarm play actions into existing canonical executors.

create or replace function public.powerhouse_execute_growth_play_actions_v1(
  p_run_date date default (now() at time zone 'Europe/Amsterdam')::date
) returns jsonb
language plpgsql
security definer
set search_path=pg_catalog,public
as $$
declare
  v_now timestamptz:=now();
  v_email int:=0;
  v_content int:=0;
  v_referral int:=0;
begin
  -- Convert qualified commercial play actions into the already-proven autonomous-email executor.
  insert into public.powerhouse_sales_actions(
    dedupe_key,subject_key,person_key,company_key,action_type,channel,priority,reason,evidence,
    message_draft,source_url,status,due_at,expected_value_eur,person_name,company_name,role
  )
  select
    'growth-executor-email:'||a.action_id::text,
    a.subject_key,a.person_key,a.company_key,'autonomous_email','email',a.priority,
    'Growth play executor routed an evidence-backed play through the canonical autonomous email transport.',
    coalesce(a.evidence,'{}'::jsonb)||jsonb_build_object(
      'contract','powerhouse-growth-play-action-executor-v1',
      'source_action_id',a.action_id,
      'source_action_type',a.action_type,
      'recipient_email',r.email,
      'email_subject',
        case a.action_type
          when 'anti_consultancy_challenge' then coalesce(nullif(a.company_name,''),'Even sparren')||': eerst drie observaties'
          when 'conditional_risk_reversal' then coalesce(nullif(a.company_name,''),'Frisse Blik')||': eerst de uitkomstcriteria scherp'
          when 'referral_activation' then 'Mag ik je één specifieke vraag stellen?'
          else coalesce(nullif(a.company_name,''),'Bedrijfsgeheugen')||': een concrete observatie'
        end,
      'authorization','user_authorized_autonomous_growth_execution_2026-09-28',
      'persuasion_optimizer',coalesce(a.evidence->'persuasion','{}'::jsonb),
      'guardrails',jsonb_build_object(
        'canonical_email_executor',true,
        'suppression_required',true,
        'cooldown_required',true,
        'provider_ack_required',true,
        'duplicate_send_forbidden',true
      )
    ),
    a.message_draft,a.source_url,'prepared',v_now,a.expected_value_eur,
    a.person_name,a.company_name,a.role
  from public.powerhouse_sales_actions a
  join public.powerhouse_relationship_revenue_intelligence_v1 r on r.person_key=a.person_key
  where a.status='suggested'
    and a.channel in ('email','internal')
    and a.action_type in ('anti_consultancy_challenge','conditional_risk_reversal','referral_activation')
    and nullif(trim(r.email),'') is not null
    and r.relationship_status in ('in_gesprek','aangeboden','rust')
    and not exists(
      select 1 from public.powerhouse_sales_outcomes o
      where o.person_key=a.person_key
        and lower(coalesce(o.outcome_type,'')) in ('unsubscribe','opt_out','do_not_contact','complaint','negative_reply')
    )
    and not exists(
      select 1 from public.powerhouse_sales_actions sent
      where sent.person_key=a.person_key and sent.channel='email' and sent.status='done'
        and sent.executed_at>=v_now-interval '30 days'
    )
  on conflict(dedupe_key) do nothing;
  get diagnostics v_email=row_count;

  -- A routed source action becomes waiting: the canonical outbound action is now its executor owner.
  update public.powerhouse_sales_actions a
  set status='waiting',
      evidence=coalesce(a.evidence,'{}'::jsonb)||jsonb_build_object(
        'executor_owner','autonomous_email',
        'executor_routed_at',v_now
      ),
      updated_at=v_now
  where a.status='suggested'
    and a.action_type in ('anti_consultancy_challenge','conditional_risk_reversal','referral_activation')
    and exists(
      select 1 from public.powerhouse_sales_actions e
      where e.dedupe_key='growth-executor-email:'||a.action_id::text
    );

  -- Route problem/switch-page work into the existing content/SEO publication intelligence.
  insert into public.powerhouse_content_recommendations(
    dedupe_key,run_date,topic_key,target_channel,recommendation_type,priority,reason,evidence,status
  )
  select
    'growth-executor-seo:'||a.action_id::text,
    p_run_date,
    coalesce(nullif(a.subject_key,''),'growth-seo'),
    'blog',
    'seo_problem_switch_page',
    a.priority,
    'Create a canonical problem-led search landing article/page from the Growth Swarm SEO action. Existing URL ownership and cannibalization must be checked before publishing.',
    coalesce(a.evidence,'{}'::jsonb)||jsonb_build_object(
      'contract','powerhouse-growth-play-action-executor-v1',
      'source_action_id',a.action_id,
      'execution_target','content_orchestrator_then_blog_publication',
      'persuasion',jsonb_build_object(
        'principles',jsonb_build_array('evidence_specificity','contrast_choice','reciprocity_value_first','autonomy_reverse_sell'),
        'must_show_options',jsonb_build_array('self_fix','improve_existing','switch','frisse_blik'),
        'fake_competitor_claims_forbidden',true
      )
    ),
    'suggested'
  from public.powerhouse_sales_actions a
  where a.status='suggested'
    and a.action_type='seo_problem_switch_page'
  on conflict(dedupe_key) do update set
    priority=excluded.priority,reason=excluded.reason,evidence=excluded.evidence,updated_at=v_now;
  get diagnostics v_content=row_count;

  update public.powerhouse_sales_actions a
  set status='waiting',
      evidence=coalesce(a.evidence,'{}'::jsonb)||jsonb_build_object(
        'executor_owner','powerhouse-content-orchestrator',
        'executor_routed_at',v_now
      ),
      updated_at=v_now
  where a.status='suggested'
    and a.action_type='seo_problem_switch_page'
    and exists(
      select 1 from public.powerhouse_content_recommendations c
      where c.dedupe_key='growth-executor-seo:'||a.action_id::text
    );

  -- Referral actions receive an explicit micro-message when enough context exists.
  update public.powerhouse_sales_actions a
  set message_draft=
      'Hoi '||coalesce(nullif(split_part(trim(a.person_name),' ',1),''),'daar')||','||chr(10)||chr(10)
      ||'Fijn dat dit je iets heeft opgeleverd. Eén gerichte vraag: welke ondernemer of directie in jouw netwerk loopt volgens jou tegen precies hetzelfde probleem aan?'||chr(10)||chr(10)
      ||'Als iemand meteen in je opkomt, maak ik een kort bericht dat je één-op-één kunt doorsturen. Geen referralprogramma en geen gedoe.'||chr(10)||chr(10)
      ||'Groet,'||chr(10)||'Arthur',
      evidence=coalesce(a.evidence,'{}'::jsonb)||jsonb_build_object(
        'persuasion',jsonb_build_object(
          'principles',jsonb_build_array('reciprocity_value_first','commitment_micro_step','autonomy_reverse_sell'),
          'generic_referral_program',false
        )
      ),
      updated_at=v_now
  where a.action_type='referral_activation'
    and a.status='suggested'
    and nullif(trim(a.message_draft),'') is null;
  get diagnostics v_referral=row_count;

  return jsonb_build_object(
    'contract','powerhouse-growth-play-action-executor-v1',
    'email_actions_routed',v_email,
    'content_actions_routed',v_content,
    'referral_messages_completed',v_referral,
    'executed_at',v_now
  );
end;
$$;

revoke execute on function public.powerhouse_execute_growth_play_actions_v1(date) from public,anon,authenticated;
grant execute on function public.powerhouse_execute_growth_play_actions_v1(date) to service_role;

create or replace function public.powerhouse_trigger_based_mkb_acquisition_cycle_v1(
  p_run_date date default (now() at time zone 'Europe/Amsterdam')::date
) returns jsonb
language plpgsql
security definer
set search_path=pg_catalog,public
as $$
declare
  v_relationship jsonb;
  v_existing_research jsonb;
  v_public_research_dispatch jsonb;
  v_trigger jsonb;
  v_growth_swarm jsonb;
  v_growth_activation jsonb;
  v_growth_plays_v2 jsonb;
  v_growth_executor jsonb;
  v_linkedin_sales_dispatch jsonb;
  v_outreach_prepare jsonb;
  v_outreach_dispatch jsonb;
  v_learning jsonb;
begin
  v_relationship:=public.powerhouse_refresh_relationship_revenue_v1(p_run_date);
  v_existing_research:=public.powerhouse_execute_relationship_research_v1(p_run_date);
  v_public_research_dispatch:=public.powerhouse_dispatch_relationship_public_research_v1(p_run_date);
  v_trigger:=public.powerhouse_refresh_trigger_based_mkb_acquisition_v1(p_run_date);
  v_growth_swarm:=public.powerhouse_refresh_growth_swarm_v1(p_run_date);
  v_growth_activation:=public.powerhouse_materialize_growth_swarm_v1(p_run_date);
  v_growth_plays_v2:=public.powerhouse_activate_all_growth_plays_v2(p_run_date);
  v_growth_executor:=public.powerhouse_execute_growth_play_actions_v1(p_run_date);
  v_linkedin_sales_dispatch:=public.powerhouse_dispatch_linkedin_sales_machine_v1(p_run_date);
  v_outreach_prepare:=public.powerhouse_prepare_autonomous_outreach_v1(p_run_date);
  v_outreach_dispatch:=public.powerhouse_dispatch_autonomous_outreach_v1(p_run_date);
  v_learning:=public.powerhouse_commercial_learning_cycle_v1(p_run_date);

  return jsonb_build_object(
    'contract','powerhouse-trigger-based-mkb-acquisition-cycle-v1',
    'relationship_revenue',v_relationship,
    'existing_evidence_research',v_existing_research,
    'public_research_dispatch',v_public_research_dispatch,
    'trigger_acquisition',v_trigger,
    'growth_swarm',v_growth_swarm,
    'growth_swarm_activation',v_growth_activation,
    'growth_plays_v2',v_growth_plays_v2,
    'growth_play_executor',v_growth_executor,
    'linkedin_sales_dispatch',v_linkedin_sales_dispatch,
    'autonomous_outreach_prepare',v_outreach_prepare,
    'autonomous_outreach_dispatch',v_outreach_dispatch,
    'commercial_learning',v_learning,
    'run_date',p_run_date,
    'executed_at',now()
  );
end;
$$;

revoke execute on function public.powerhouse_trigger_based_mkb_acquisition_cycle_v1(date) from public,anon,authenticated;
grant execute on function public.powerhouse_trigger_based_mkb_acquisition_cycle_v1(date) to service_role;
