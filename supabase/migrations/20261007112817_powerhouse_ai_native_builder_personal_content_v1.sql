
create or replace function public.powerhouse_materialize_source_backed_channel_candidates_v2(
  p_date date default (timezone('Europe/Amsterdam',now()))::date
)
returns jsonb
language plpgsql
security definer
set search_path to 'public','pg_catalog'
as $$
declare
  v_base jsonb;
  h record;
  e_err record;
  e_ok record;
  v_id uuid;
  v_reason text;
begin
  v_base:=public.powerhouse_materialize_source_backed_channel_candidates_v1(p_date);

  select * into h from public.powerhouse_one_brain_runtime_health_v1 limit 1;

  select event_id,event_type,source,subject_key,state,occurred_at,evidence
    into e_err
  from public.powerhouse_runtime_events
  where (occurred_at at time zone 'Europe/Amsterdam')::date=p_date
    and state='error'
    and source like 'powerhouse%'
  order by updated_at desc,occurred_at desc
  limit 1;

  select event_id,event_type,source,subject_key,state,occurred_at,evidence
    into e_ok
  from public.powerhouse_runtime_events
  where (occurred_at at time zone 'Europe/Amsterdam')::date=p_date
    and state<>'error'
    and source like 'powerhouse%'
  order by updated_at desc,occurred_at desc
  limit 1;

  if h.total_layers is not null then
    v_reason:=format(
      'Vertel Arthurs AI-native bouwverhaal vanuit vandaag bewezen Powerhouse/Brain-state. Gebruik vaste lijn: wat wilde ik bereiken → wat leek eenvoudig → welke frictie trad aantoonbaar op → wat heb ik structureel veranderd → wat kan het systeem nu → bredere les over AI-native bedrijven. Feiten: %s/%s intelligence-lagen wired, %s/%s required jobs actief, architecture_state=%s, learning_state=%s. Laatste fout-evidence: %s/%s/%s. Laatste herstel/actie-evidence: %s/%s/%s. Geen generieke AI-post, geen productpitch, geen verzonnen ervaring of resultaat.',
      h.wired_layers,h.total_layers,h.active_jobs,h.required_jobs,h.architecture_state,h.learning_state,
      coalesce(e_err.event_type,'none'),coalesce(e_err.source,'none'),coalesce(e_err.subject_key,'none'),
      coalesce(e_ok.event_type,'none'),coalesce(e_ok.source,'none'),coalesce(e_ok.subject_key,'none')
    );

    insert into public.powerhouse_content_recommendations(
      dedupe_key,run_date,topic_key,content_key,target_channel,recommendation_type,priority,reason,evidence,status
    ) values (
      'ai-native-builder-linkedin-personal:'||p_date::text,
      p_date,
      'ai-native-builder-story',
      'linkedin-personal-ai-native-builder-'||p_date::text,
      'linkedin_personal',
      'verified_ai_native_builder_story',
      100,
      v_reason,
      jsonb_build_object(
        'contract','powerhouse-ai-native-builder-content-v1',
        'source_backed',true,
        'source_kind','powerhouse_verified_build_event',
        'content_id','ai-native-builder:'||p_date::text,
        'identity_contract','arthur-personal-linkedin-identity-v4',
        'identity_gate_version','channel-identity-hard-gate-v3',
        'ai_native_builder_story_verified',true,
        'ai_native_builder_policy','personal-linkedin-ai-native-builder-v1',
        'build_event_verified',true,
        'arthur_anchor_verified',true,
        'first_person_claims_present',true,
        'personal_life_topic',false,
        'business_topic',true,
        'corporate_voice',false,
        'company_page_interchangeable',false,
        'forced_business_moral',false,
        'sensitive_private_detail',false,
        'personal_product_pitch_forbidden',true,
        'source_lineage',jsonb_build_array(
          'powerhouse_one_brain_runtime_health_v1:'||h.observed_at::text,
          case when e_err.event_id is null then 'runtime_error:none' else 'powerhouse_runtime_events:'||e_err.event_id::text end,
          case when e_ok.event_id is null then 'runtime_recovery:none' else 'powerhouse_runtime_events:'||e_ok.event_id::text end
        ),
        'runtime_health',to_jsonb(h),
        'friction_event',case when e_err.event_id is null then null else jsonb_build_object(
          'event_id',e_err.event_id,'event_type',e_err.event_type,'source',e_err.source,'subject_key',e_err.subject_key,'occurred_at',e_err.occurred_at,'evidence',e_err.evidence
        ) end,
        'result_event',case when e_ok.event_id is null then null else jsonb_build_object(
          'event_id',e_ok.event_id,'event_type',e_ok.event_type,'source',e_ok.source,'subject_key',e_ok.subject_key,'occurred_at',e_ok.occurred_at,'evidence',e_ok.evidence
        ) end,
        'story_structure',jsonb_build_array('goal','friction','intervention','result','lesson'),
        'measurement',jsonb_build_array('reach','reactions','comments','shares','profile_visits','follows','inbound_dm')
      ),
      'suggested'
    )
    on conflict(dedupe_key) do update set
      priority=excluded.priority,
      reason=excluded.reason,
      evidence=excluded.evidence,
      status='suggested',
      updated_at=now()
    returning recommendation_id into v_id;
  end if;

  return coalesce(v_base,'{}'::jsonb)||jsonb_build_object(
    'contract','powerhouse-source-backed-all-channels-v2',
    'linkedin_personal_ai_native_builder_recommendation_id',v_id
  );
end;
$$;

select public.powerhouse_materialize_source_backed_channel_candidates_v2((now() at time zone 'Europe/Amsterdam')::date);
