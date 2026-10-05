-- Canonical human commercial persuasion runtime
create table if not exists public.powerhouse_sales_playbook_v1 (
  play_key text primary key, play_name text not null, objective text not null,
  psychology jsonb not null default '[]'::jsonb, message_structure jsonb not null default '[]'::jsonb,
  cta_style text not null, tone_rules jsonb not null default '{}'::jsonb, prohibited jsonb not null default '[]'::jsonb,
  max_words jsonb not null default '{}'::jsonb, priority integer not null default 50, active boolean not null default true,
  source_refs jsonb not null default '[]'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.powerhouse_sales_playbook_v1 enable row level security;
revoke all on public.powerhouse_sales_playbook_v1 from public,anon,authenticated;
grant select,insert,update,delete on public.powerhouse_sales_playbook_v1 to service_role;
drop policy if exists powerhouse_sales_playbook_service_v1 on public.powerhouse_sales_playbook_v1;
create policy powerhouse_sales_playbook_service_v1 on public.powerhouse_sales_playbook_v1 for all to service_role using(true) with check(true);

create table if not exists public.powerhouse_message_quality_v1 (
  quality_id uuid primary key default gen_random_uuid(),
  action_id uuid not null references public.powerhouse_sales_actions(action_id) on delete cascade,
  composer_version text not null, play_key text not null, channel text not null, message_hash text not null,
  passed boolean not null, score numeric(8,4) not null check(score between 0 and 1),
  checks jsonb not null default '{}'::jsonb, evidence jsonb not null default '{}'::jsonb,
  evaluated_at timestamptz not null default now(), unique(action_id,message_hash)
);
alter table public.powerhouse_message_quality_v1 enable row level security;
revoke all on public.powerhouse_message_quality_v1 from public,anon,authenticated;
grant select,insert,update,delete on public.powerhouse_message_quality_v1 to service_role;
drop policy if exists powerhouse_message_quality_service_v1 on public.powerhouse_message_quality_v1;
create policy powerhouse_message_quality_service_v1 on public.powerhouse_message_quality_v1 for all to service_role using(true) with check(true);

insert into public.powerhouse_sales_playbook_v1
(play_key,play_name,objective,psychology,message_structure,cta_style,tone_rules,prohibited,max_words,priority,active,source_refs)
select play_key,play_name,objective,psychology,message_structure,cta_style,tone_rules,prohibited,max_words,priority,active,source_refs
from jsonb_to_recordset($plays$[{"active":true,"play_key":"trigger_outreach","priority":95,"cta_style":"permission_to_send_value","max_words":{"email":130,"e-mail":130,"linkedin_dm":80,"linkedin_personal":75},"objective":"Use a fresh verified business trigger to make timing relevant.","play_name":"Trigger outreach","prohibited":["invented_trigger","certainty_language","fake_urgency","calendar_link","hard_pitch"],"psychology":["timing_relevance","specificity","loss_awareness_without_fear","low_reactance"],"tone_rules":{"human":true,"timely":true,"no_pressure":true,"hypothesis_labeled":true},"source_refs":["notion:ai-sales-promptbibliotheek","notion:revenue-orchestrator"],"message_structure":["verified_trigger","likely_consequence_as_hypothesis","small_useful_offer","permission_question"]},{"active":true,"play_key":"objection_response","priority":92,"cta_style":"diagnostic_next_step","max_words":{"email":130,"e-mail":130,"reply_dm":80,"linkedin_dm":80,"reply_email":130},"objective":"Acknowledge the actual objection, reduce risk and ask one diagnostic next question.","play_name":"Objection response","prohibited":["argumentative_tone","pressure","discount_without_reason","unproven_social_proof"],"psychology":["validation","risk_reduction","specificity","autonomy"],"tone_rules":{"human":true,"concise":true,"evidence_led":true,"non_defensive":true},"source_refs":["notion:ai-sales-promptbibliotheek","notion:cockpit-runbook"],"message_structure":["acknowledge_objection","answer_with_evidence","reduce_risk","one_next_question"]},{"active":true,"play_key":"commitment_close","priority":90,"cta_style":"specific_next_step","max_words":{"email":130,"e-mail":130,"reply_dm":70,"linkedin_dm":75,"reply_email":120},"objective":"Turn an already-aligned conversation into the smallest concrete next commitment.","play_name":"Commitment close","prohibited":["reopen_full_pitch","vague_next_step","multiple_ctas","fake_deadline"],"psychology":["commitment_consistency","specificity","friction_reduction"],"tone_rules":{"clear":true,"human":true,"decisive":true,"no_pressure":true},"source_refs":["notion:ai-sales-promptbibliotheek"],"message_structure":["agreed_outcome","missing_criterion_or_owner","one_concrete_next_step"]},{"active":true,"play_key":"challenger_insight","priority":85,"cta_style":"confirm_or_correct","max_words":{"email":130,"e-mail":130,"linkedin_dm":80,"linkedin_personal":75},"objective":"Reframe a familiar problem with a credible unexpected insight and invite correction.","play_name":"Challenger insight","prohibited":["fearmongering","fake_benchmark","unsupported_number","hard_close","generic_ai_claim"],"psychology":["pattern_interrupt","curiosity","contrast","authority_without_boasting"],"tone_rules":{"human":true,"direct":true,"humble":true,"compact":true},"source_refs":["notion:ai-sales-promptbibliotheek","notion:wat-blijft-hangen"],"message_structure":["specific_trigger","unexpected_insight","business_consequence","invite_correction"]},{"active":true,"play_key":"spin_diagnose","priority":80,"cta_style":"diagnostic_question","max_words":{"email":125,"e-mail":125,"reply_dm":70,"linkedin_dm":80,"reply_email":110},"objective":"Help the prospect articulate situation, problem and consequence without pitching.","play_name":"SPIN diagnose","prohibited":["premature_solution","calendar_link","double_question","interrogation","unproven_claim"],"psychology":["self_persuasion","low_reactance","curiosity","specificity"],"tone_rules":{"human":true,"curious":true,"no_pressure":true,"one_question":true},"source_refs":["notion:ai-sales-promptbibliotheek","notion:revenue-orchestrator"],"message_structure":["observed_context","situation_or_problem_question","one_consequence_question"]},{"active":true,"play_key":"followup_new_angle","priority":75,"cta_style":"interest_or_timing","max_words":{"email":100,"e-mail":100,"reply_dm":60,"linkedin_dm":60,"reply_email":90},"objective":"Continue a silent thread with new value rather than repeating the first ask.","play_name":"Follow-up: new angle","prohibited":["just_following_up","did_you_see","reply_guilt","repeat_same_ask","calendar_link"],"psychology":["mere_exposure","novelty","low_reactance","reciprocity"],"tone_rules":{"human":true,"no_reply_guilt":true,"shorter_than_previous":true},"source_refs":["notion:sales-relaties"],"message_structure":["brief_context","new_evidence_or_angle","one_low_effort_question"]},{"active":true,"play_key":"value_comment","priority":70,"cta_style":"no_sales_cta","max_words":{"linkedin_comment":65,"linkedin_personal":65},"objective":"Build recognition and credibility by adding useful context without selling.","play_name":"Value-adding public comment","prohibited":["sales_pitch","company_pitch","generic_praise","calendar_link","fake_fact"],"psychology":["mere_exposure","reciprocity","pattern_relevance"],"tone_rules":{"human":true,"useful":true,"natural":true,"light_humor_when_natural":true},"source_refs":["notion:wat-blijft-hangen","notion:linkedin-revenue-cockpit"],"message_structure":["specific_post_context","one_useful_observation_or_nuance","optional_real_question"]},{"active":true,"play_key":"value_first","priority":70,"cta_style":"interest_or_permission","max_words":{"email":125,"e-mail":125,"linkedin_dm":80,"linkedin_comment":65,"linkedin_personal":70},"objective":"Earn a reply by giving a useful observation before asking for anything.","play_name":"Value first / social selling","prohibited":["generic_compliment","calendar_link","service_catalogue","fake_urgency","unproven_claim","reply_guilt"],"psychology":["reciprocity","low_reactance","specificity","cognitive_fluency"],"tone_rules":{"human":true,"jij_vorm":true,"no_pressure":true,"short_sentences":true,"light_humor_when_natural":true},"source_refs":["notion:sales-relaties","notion:ai-sales-promptbibliotheek","notion:merk-communicatiestijl"],"message_structure":["specific_context","useful_observation","one_open_question"]},{"active":true,"play_key":"graceful_close","priority":65,"cta_style":"no_question","max_words":{"email":80,"e-mail":80,"linkedin_dm":55},"objective":"Remove pressure after repeated silence and preserve future relationship.","play_name":"Graceful close","prohibited":["last_chance","deadline","guilt","question","calendar_link"],"psychology":["reactance_release","autonomy","loss_awareness_without_pressure"],"tone_rules":{"human":true,"short":true,"no_sarcasm":true,"respectful":true},"source_refs":["notion:sales-relaties"],"message_structure":["close_loop","no_more_followup","door_open"]}]$plays$::jsonb) as x(
  play_key text,play_name text,objective text,psychology jsonb,message_structure jsonb,cta_style text,
  tone_rules jsonb,prohibited jsonb,max_words jsonb,priority integer,active boolean,source_refs jsonb
)
on conflict(play_key) do update set
  play_name=excluded.play_name,objective=excluded.objective,psychology=excluded.psychology,
  message_structure=excluded.message_structure,cta_style=excluded.cta_style,tone_rules=excluded.tone_rules,
  prohibited=excluded.prohibited,max_words=excluded.max_words,priority=excluded.priority,active=excluded.active,
  source_refs=excluded.source_refs,updated_at=now();

create or replace view public.powerhouse_commercial_message_plan_v1 with (security_invoker=true) as
 WITH b AS (
         SELECT a.action_id,
            a.event_id,
            a.dedupe_key,
            a.subject_key,
            a.person_key,
            a.company_key,
            a.action_type,
            a.channel,
            a.priority,
            a.reason,
            a.evidence,
            a.message_draft,
            a.source_url,
            a.status,
            a.due_at,
            a.executed_at,
            a.outcome_id,
            a.created_at,
            a.updated_at,
            a.content_key,
            a.topic_key,
            a.campaign_key,
            a.opportunity_key,
            a.expected_value_eur,
            a.person_name,
            a.company_name,
            a.role,
            lower(replace(a.channel, ' '::text, '_'::text)) AS channel_norm,
            COALESCE(a.evidence #>> '{commercial_intelligence,stage}'::text[], a.evidence ->> 'stage'::text, ''::text) AS stage_hint,
            COALESCE(a.evidence #>> '{commercial_intelligence,buying_window_state}'::text[], a.evidence ->> 'commercial_state'::text, ''::text) AS buying_state_hint,
            COALESCE(a.evidence #>> '{predictive_brief,hypothesis,problem}'::text[], a.evidence ->> 'predicted_problem'::text) AS predicted_problem,
            COALESCE(a.evidence #>> '{predictive_brief,prediction,buying_trigger}'::text[], a.evidence ->> 'trigger_type'::text, a.evidence ->> 'trigger_key'::text) AS predicted_buying_trigger,
            COALESCE(a.evidence ->> 'observed_objection'::text, a.evidence #>> '{inbound,objection}'::text[],
                CASE
                    WHEN a.action_type ~* 'objection'::text THEN a.evidence ->> 'predicted_objection'::text
                    ELSE NULL::text
                END) AS predicted_objection,
            COALESCE((a.evidence ->> 'commercial_heat'::text)::numeric, (a.evidence #>> '{predictive_brief,prediction,probability}'::text[])::numeric, 0::numeric) AS intent_hint,
            a.evidence ? 'predictive_brief'::text OR a.evidence ? 'trigger_key'::text OR a.evidence ? 'trigger_type'::text AS has_verified_trigger,
            COALESCE((a.evidence #>> '{relationship_evidence,relationship_warmth}'::text[])::numeric, 0::numeric) AS warmth_hint,
            NULLIF(TRIM(BOTH FROM COALESCE(a.evidence ->> 'headline'::text, ''::text)), ''::text) IS NOT NULL OR NULLIF(TRIM(BOTH FROM COALESCE(a.evidence ->> 'summary'::text, ''::text)), ''::text) IS NOT NULL OR NULLIF(TRIM(BOTH FROM COALESCE(a.evidence #>> '{public_source_evidence,evidence,headline}'::text[], ''::text)), ''::text) IS NOT NULL OR NULLIF(TRIM(BOTH FROM COALESCE(a.evidence #>> '{public_source_evidence,evidence,summary}'::text[], ''::text)), ''::text) IS NOT NULL OR NULLIF(TRIM(BOTH FROM COALESCE(a.evidence #>> '{inbound,message}'::text[], ''::text)), ''::text) IS NOT NULL OR NULLIF(TRIM(BOTH FROM COALESCE(a.evidence ->> 'reply_text'::text, ''::text)), ''::text) IS NOT NULL AS human_readable_context,
            lower(COALESCE(a.evidence #>> '{public_source_evidence,evidence,headline}'::text[], a.evidence ->> 'headline'::text, ''::text)) AS source_headline,
            lower(COALESCE(a.evidence #>> '{public_source_evidence,evidence,summary}'::text[], a.evidence ->> 'summary'::text, ''::text)) AS source_summary
           FROM powerhouse_sales_actions a
          WHERE lower(replace(a.channel, ' '::text, '_'::text)) = ANY (ARRAY['email'::text, 'e-mail'::text, 'linkedin_dm'::text, 'linkedin_personal'::text, 'linkedin_comment'::text, 'reply_email'::text, 'reply_dm'::text])
        ), b2 AS (
         SELECT b.action_id,
            b.event_id,
            b.dedupe_key,
            b.subject_key,
            b.person_key,
            b.company_key,
            b.action_type,
            b.channel,
            b.priority,
            b.reason,
            b.evidence,
            b.message_draft,
            b.source_url,
            b.status,
            b.due_at,
            b.executed_at,
            b.outcome_id,
            b.created_at,
            b.updated_at,
            b.content_key,
            b.topic_key,
            b.campaign_key,
            b.opportunity_key,
            b.expected_value_eur,
            b.person_name,
            b.company_name,
            b.role,
            b.channel_norm,
            b.stage_hint,
            b.buying_state_hint,
            b.predicted_problem,
            b.predicted_buying_trigger,
            b.predicted_objection,
            b.intent_hint,
            b.has_verified_trigger,
            b.warmth_hint,
            b.human_readable_context,
            b.source_headline,
            b.source_summary,
                CASE
                    WHEN COALESCE(b.predicted_buying_trigger, ''::text) ~* 'buy_sell_ma'::text THEN (b.source_headline ~* '(overname|overnemen|bedrijf verkopen|verkooptraject|m&a|merger|acquisition|investment|investeerder|holland capital|growth partnership)'::text OR b.source_summary ~* '(overname|overnemen|bedrijf verkopen|verkooptraject|m&a|merger|investment|investeerder|holland capital|growth partnership)'::text) AND NOT (((b.source_headline || ' '::text) || b.source_summary) ~* '(talent acquisition|volume recruitment|recruitment|recruiter)'::text AND ((b.source_headline || ' '::text) || b.source_summary) !~* '(overname|overnemen|bedrijf verkopen|verkooptraject|m&a|merger|investment|investeerder|holland capital|growth partnership)'::text)
                    WHEN COALESCE(b.predicted_buying_trigger, ''::text) ~* 'ai_data_digitalisation'::text THEN b.source_headline !~* '(suppliers?|manufacturers?|directory|sitemap)'::text AND (b.source_headline ~* '(^|[^a-z])(ai|artificial intelligence|data|digital|digitalis|automation|machine learning|smart)'::text OR b.source_summary ~* '(^|[^a-z])(ai|artificial intelligence|data|digital|digitalis|automation|machine learning|smart)'::text AND b.source_summary !~* '(supplier_country_detail|suppliers from|chinese manufacturers)'::text AND (lower(b.source_summary) ~~ (('%'::text || lower(split_part(COALESCE(b.company_name, ''::text), ' '::text, 1))) || '%'::text) OR lower(b.source_summary) ~~ (('%'::text || lower(split_part(COALESCE(b.person_name, ''::text), ' '::text, 1))) || '%'::text)))
                    WHEN COALESCE(b.predicted_buying_trigger, ''::text) ~* 'erp_afas_change'::text THEN ((b.source_headline || ' '::text) || b.source_summary) ~* '(afas|erp|enterprise resource|software migration|systeemmigratie|implementatie)'::text
                    ELSE false
                END AS source_trigger_relevance
           FROM b
        ), c AS (
         SELECT b2.action_id,
            b2.event_id,
            b2.dedupe_key,
            b2.subject_key,
            b2.person_key,
            b2.company_key,
            b2.action_type,
            b2.channel,
            b2.priority,
            b2.reason,
            b2.evidence,
            b2.message_draft,
            b2.source_url,
            b2.status,
            b2.due_at,
            b2.executed_at,
            b2.outcome_id,
            b2.created_at,
            b2.updated_at,
            b2.content_key,
            b2.topic_key,
            b2.campaign_key,
            b2.opportunity_key,
            b2.expected_value_eur,
            b2.person_name,
            b2.company_name,
            b2.role,
            b2.channel_norm,
            b2.stage_hint,
            b2.buying_state_hint,
            b2.predicted_problem,
            b2.predicted_buying_trigger,
            b2.predicted_objection,
            b2.intent_hint,
            b2.has_verified_trigger,
            b2.warmth_hint,
            b2.human_readable_context,
            b2.source_headline,
            b2.source_summary,
            b2.source_trigger_relevance,
                CASE
                    WHEN b2.action_type = 'reply_post'::text OR (b2.channel_norm = ANY (ARRAY['linkedin_personal'::text, 'linkedin_comment'::text])) THEN 'value_comment'::text
                    WHEN b2.predicted_objection IS NOT NULL OR b2.action_type ~* 'objection'::text THEN 'objection_response'::text
                    WHEN b2.action_type ~* '(follow|reminder|breakup)'::text AND COALESCE((b2.evidence ->> 'touch_number'::text)::integer, 0) >= 5 THEN 'graceful_close'::text
                    WHEN b2.action_type ~* '(follow|reminder)'::text THEN 'followup_new_angle'::text
                    WHEN COALESCE(b2.stage_hint, ''::text) ~* '(decision|proposal|qualified|meeting)'::text OR b2.action_type ~* '(proposal|close)'::text THEN 'commitment_close'::text
                    WHEN b2.has_verified_trigger AND b2.human_readable_context AND b2.source_trigger_relevance AND b2.intent_hint >= 0.40 THEN 'trigger_outreach'::text
                    WHEN b2.human_readable_context AND b2.intent_hint >= 0.65 AND (NOT b2.has_verified_trigger OR b2.source_trigger_relevance) THEN 'challenger_insight'::text
                    WHEN b2.warmth_hint >= 0.45 OR b2.action_type ~* '(reply|conversation)'::text THEN 'spin_diagnose'::text
                    ELSE 'value_first'::text
                END AS play_key
           FROM b2
        )
 SELECT c.action_id,
    c.dedupe_key,
    c.subject_key,
    c.person_key,
    c.company_key,
    c.person_name,
    c.company_name,
    c.role,
    c.action_type,
    c.channel,
    c.channel_norm,
    c.status,
    c.priority,
    c.reason,
    c.message_draft,
    c.source_url,
    c.evidence,
    c.opportunity_key,
    c.content_key,
    c.topic_key,
    c.campaign_key,
    c.expected_value_eur,
    c.stage_hint,
    c.buying_state_hint,
    c.predicted_problem,
    c.predicted_buying_trigger,
    c.predicted_objection,
    c.intent_hint,
    c.warmth_hint,
    c.has_verified_trigger,
    p.play_key,
    p.play_name,
    p.objective,
    p.psychology,
    p.message_structure,
    p.cta_style,
    p.tone_rules,
    p.prohibited,
    COALESCE((p.max_words ->> c.channel_norm)::integer, (p.max_words ->> 'linkedin_dm'::text)::integer, (p.max_words ->> 'email'::text)::integer, 100) AS max_words,
    jsonb_build_object('contract', 'powerhouse-human-commercial-message-plan-v5', 'message_strategy', p.play_key, 'play_key', p.play_key, 'play_name', p.play_name, 'objective', p.objective, 'psychology', p.psychology, 'message_structure', p.message_structure, 'cta_style', p.cta_style, 'tone_rules', p.tone_rules, 'prohibited', p.prohibited, 'max_words', COALESCE((p.max_words ->> c.channel_norm)::integer, (p.max_words ->> 'linkedin_dm'::text)::integer, (p.max_words ->> 'email'::text)::integer, 100), 'human_readable_context', c.human_readable_context, 'source_trigger_relevance', c.source_trigger_relevance, 'brand_voice', jsonb_build_object('jij_vorm', true, 'short_sentences', true, 'human', true, 'concrete', true, 'humor', 'light and situational only when natural; never at prospect expense', 'positioning', 'Uit hoofden, in je bedrijf. En dan werkend.', 'sales_style', 'help first; smallest logical commitment; no meeting push', 'avoid', jsonb_build_array('corporate jargon', 'AI hype', 'generic compliment', 'fake urgency', 'pressure', 'service catalogue')), 'quality_contract', jsonb_build_object('one_primary_problem', true, 'one_cta_max', true, 'generic_opening_forbidden', true, 'facts_only', true, 'hypotheses_labeled', true, 'humanity_required', true, 'generic_compliment_forbidden', true, 'reply_guilt_forbidden', true, 'machine_taxonomy_as_personalization_forbidden', true, 'trigger_requires_human_readable_context', true, 'trigger_requires_semantic_source_match', true, 'directories_are_not_trigger_evidence', true), 'learning_key', (((p.play_key || ':'::text) || c.channel_norm) || ':'::text) || COALESCE(NULLIF(c.stage_hint, ''::text), 'unknown'::text)) AS message_plan
   FROM c
     JOIN powerhouse_sales_playbook_v1 p ON p.play_key = c.play_key AND p.active;;
revoke all on public.powerhouse_commercial_message_plan_v1 from public,anon,authenticated;
grant select on public.powerhouse_commercial_message_plan_v1 to service_role;

CREATE OR REPLACE FUNCTION public.powerhouse_apply_message_plan_v1(p_action_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
declare
  v_plan jsonb;
  v_play text;
  v_company text;
  v_channel text;
  v_stage text;
  v_persuasion jsonb;
begin
  select message_plan,play_key,company_key,channel_norm,coalesce(nullif(stage_hint,''),'consideration')
    into v_plan,v_play,v_company,v_channel,v_stage
  from public.powerhouse_commercial_message_plan_v1
  where action_id=p_action_id;

  if v_plan is null then
    return jsonb_build_object('ok',false,'reason','MESSAGE_PLAN_NOT_ELIGIBLE','action_id',p_action_id);
  end if;

  select public.powerhouse_persuasion_revenue_optimizer_v1(
    coalesce(v_company,''),
    coalesce(v_play,'value_first'),
    coalesce(v_channel,'internal'),
    coalesce(v_stage,'consideration')
  ) into v_persuasion;

  update public.powerhouse_sales_actions
  set evidence=jsonb_set(
      coalesce(evidence,'{}'::jsonb),
      '{commercial_intelligence}',
      coalesce(evidence->'commercial_intelligence','{}'::jsonb)
        || v_plan
        || jsonb_build_object('persuasion_authority',v_persuasion),
      true
    ),
    updated_at=now()
  where action_id=p_action_id;

  return jsonb_build_object(
    'ok',true,
    'action_id',p_action_id,
    'play_key',v_play,
    'persuasion_authority',v_persuasion
  );
end $function$

revoke execute on function public.powerhouse_apply_message_plan_v1(uuid) from public,anon,authenticated;
grant execute on function public.powerhouse_apply_message_plan_v1(uuid) to service_role;

CREATE OR REPLACE FUNCTION public.powerhouse_refresh_message_plans_v1(p_limit integer DEFAULT 100)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
declare
  v_id uuid;
  v_n int:=0;
begin
  for v_id in
    select a.action_id
    from public.powerhouse_sales_actions a
    where a.status in ('prepared','suggested','waiting')
      and lower(replace(a.channel,' ','_')) in ('email','e-mail','linkedin_dm','linkedin_personal','linkedin_comment','reply_email','reply_dm')
    order by a.priority desc,a.action_id
    limit greatest(1,least(coalesce(p_limit,100),500))
  loop
    perform public.powerhouse_apply_message_plan_v1(v_id);
    v_n:=v_n+1;
  end loop;

  return jsonb_build_object(
    'contract','powerhouse-human-commercial-message-plan-v5',
    'planned_actions',v_n,
    'executed_at',now()
  );
end $function$

revoke execute on function public.powerhouse_refresh_message_plans_v1(integer) from public,anon,authenticated;
grant execute on function public.powerhouse_refresh_message_plans_v1(integer) to service_role;

CREATE OR REPLACE FUNCTION public.powerhouse_commercial_message_candidates_v1(p_limit integer DEFAULT 10, p_channels text[] DEFAULT NULL::text[], p_action_ids uuid[] DEFAULT NULL::uuid[])
 RETURNS SETOF powerhouse_commercial_message_plan_v1
 LANGUAGE sql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
  select p.*
  from public.powerhouse_commercial_message_plan_v1 p
  where p.status in ('prepared','suggested','waiting')
    and (p_channels is null or cardinality(p_channels)=0 or p.channel_norm = any(p_channels))
    and (p_action_ids is null or cardinality(p_action_ids)=0 or p.action_id = any(p_action_ids))
  order by p.priority desc, p.action_id
  limit greatest(1,least(coalesce(p_limit,10),200))
$function$

revoke execute on function public.powerhouse_commercial_message_candidates_v1(integer,text[],uuid[]) from public,anon,authenticated;
grant execute on function public.powerhouse_commercial_message_candidates_v1(integer,text[],uuid[]) to service_role;

create or replace view public.powerhouse_persuasion_sales_performance_v1 with (security_invoker=true) as
 WITH labeled AS (
         SELECT a.action_id,
            a.channel,
            a.action_type,
            COALESCE(a.evidence #>> '{commercial_intelligence,message_strategy}'::text[], 'unknown'::text) AS message_strategy,
            COALESCE(a.evidence #>> '{commercial_intelligence,persuasion_authority,play_key}'::text[], 'unknown'::text) AS persuasion_play_key,
            COALESCE((a.evidence #>> '{commercial_intelligence,persuasion_authority,confidence}'::text[])::numeric, 0::numeric) AS persuasion_confidence,
            a.evidence #> '{commercial_intelligence,persuasion_authority,principles}'::text[] AS principles,
            a.executed_at
           FROM powerhouse_sales_actions a
          WHERE a.executed_at >= (now() - '180 days'::interval)
        ), expanded AS (
         SELECT l.action_id,
            l.channel,
            l.action_type,
            l.message_strategy,
            l.persuasion_play_key,
            l.persuasion_confidence,
            l.principles,
            l.executed_at,
            COALESCE(p.value, 'unknown'::text) AS principle
           FROM labeled l
             LEFT JOIN LATERAL jsonb_array_elements_text(
                CASE
                    WHEN jsonb_typeof(l.principles) = 'array'::text THEN l.principles
                    ELSE '[]'::jsonb
                END) p(value) ON true
        )
 SELECT e.channel,
    e.action_type,
    e.message_strategy,
    e.persuasion_play_key,
    e.principle,
    count(DISTINCT e.action_id)::integer AS executed_actions,
    count(DISTINCT o.outcome_id)::integer AS observed_outcomes,
    count(DISTINCT o.outcome_id) FILTER (WHERE lower(o.outcome_type) ~ '(reply|response|meeting|appointment|proposal|qualified|won|order|revenue)'::text)::integer AS positive_outcomes,
    round(COALESCE(count(DISTINCT o.outcome_id) FILTER (WHERE lower(o.outcome_type) ~ '(reply|response|meeting|appointment|proposal|qualified|won|order|revenue)'::text)::numeric / NULLIF(count(DISTINCT e.action_id), 0)::numeric, 0::numeric), 4) AS positive_outcome_rate,
    COALESCE(sum(o.revenue_eur), 0::numeric) AS realized_revenue_eur,
    round(avg(e.persuasion_confidence), 4) AS avg_persuasion_confidence
   FROM expanded e
     LEFT JOIN powerhouse_sales_outcomes o ON o.action_id = e.action_id
  GROUP BY e.channel, e.action_type, e.message_strategy, e.persuasion_play_key, e.principle;;
revoke all on public.powerhouse_persuasion_sales_performance_v1 from public,anon,authenticated;
grant select on public.powerhouse_persuasion_sales_performance_v1 to service_role;

create or replace view public.powerhouse_human_commercial_end_to_end_health_v1 with (security_invoker=true) as
 SELECT now() AS measured_at,
    count(*) FILTER (WHERE a.status = ANY (ARRAY['prepared'::text, 'suggested'::text, 'waiting'::text])) AS pending_actions,
    count(*) FILTER (WHERE (a.status = ANY (ARRAY['prepared'::text, 'suggested'::text, 'waiting'::text])) AND COALESCE(a.evidence #>> '{commercial_intelligence,message_strategy}'::text[], ''::text) <> ''::text) AS strategy_labeled,
    count(*) FILTER (WHERE (a.status = ANY (ARRAY['prepared'::text, 'suggested'::text, 'waiting'::text])) AND (a.evidence #> '{commercial_intelligence,persuasion_authority}'::text[]) IS NOT NULL) AS persuasion_labeled,
    count(*) FILTER (WHERE (a.status = ANY (ARRAY['prepared'::text, 'suggested'::text, 'waiting'::text])) AND COALESCE(a.evidence #>> '{commercial_intelligence,quality_passed}'::text[], 'false'::text) = 'true'::text) AS quality_passed,
    count(*) FILTER (WHERE (a.status = ANY (ARRAY['prepared'::text, 'suggested'::text, 'waiting'::text])) AND COALESCE(a.message_draft, ''::text) <> ''::text) AS drafts_ready,
    count(*) FILTER (WHERE a.status = 'done'::text AND a.executed_at >= (now() - '30 days'::interval)) AS executed_30d,
    count(*) FILTER (WHERE a.status = 'done'::text AND a.executed_at >= (now() - '30 days'::interval) AND (COALESCE(a.evidence #>> '{autonomous_outbound,provider_ack_verified}'::text[], 'false'::text) = 'true'::text OR COALESCE(a.evidence #>> '{salesrobot_execution,provider_ack_verified}'::text[], 'false'::text) = 'true'::text)) AS provider_ack_30d,
    count(DISTINCT o.outcome_id) FILTER (WHERE o.occurred_at >= (now() - '30 days'::interval)) AS outcomes_30d,
    COALESCE(sum(o.revenue_eur) FILTER (WHERE o.occurred_at >= (now() - '30 days'::interval)), 0::numeric) AS revenue_30d
   FROM powerhouse_sales_actions a
     LEFT JOIN powerhouse_sales_outcomes o ON o.action_id = a.action_id
  WHERE lower(replace(a.channel, ' '::text, '_'::text)) = ANY (ARRAY['email'::text, 'e-mail'::text, 'linkedin_dm'::text, 'linkedin_personal'::text, 'linkedin_comment'::text, 'reply_email'::text, 'reply_dm'::text]);;
revoke all on public.powerhouse_human_commercial_end_to_end_health_v1 from public,anon,authenticated;
grant select on public.powerhouse_human_commercial_end_to_end_health_v1 to service_role;

select public.powerhouse_refresh_message_plans_v1(500);
