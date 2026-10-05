-- Powerhouse Human Commercial Orchestrator v1
-- Reuses the existing sales action/outcome/relationship/NBA lineage. No parallel CRM is introduced.

create table if not exists public.powerhouse_sales_playbook_v1 (
  play_key text primary key,
  play_name text not null,
  objective text not null,
  psychology jsonb not null default '[]'::jsonb,
  message_structure jsonb not null default '[]'::jsonb,
  cta_style text not null,
  tone_rules jsonb not null default '{}'::jsonb,
  prohibited jsonb not null default '[]'::jsonb,
  max_words jsonb not null default '{}'::jsonb,
  priority integer not null default 50,
  active boolean not null default true,
  source_refs jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.powerhouse_sales_playbook_v1 enable row level security;
revoke all on public.powerhouse_sales_playbook_v1 from public, anon, authenticated;
grant select, insert, update, delete on public.powerhouse_sales_playbook_v1 to service_role;
drop policy if exists powerhouse_sales_playbook_service_v1 on public.powerhouse_sales_playbook_v1;
create policy powerhouse_sales_playbook_service_v1 on public.powerhouse_sales_playbook_v1
for all to service_role using (true) with check (true);

insert into public.powerhouse_sales_playbook_v1
(play_key,play_name,objective,psychology,message_structure,cta_style,tone_rules,prohibited,max_words,priority,source_refs)
values
('value_first','Value first / social selling','Earn a reply by giving a useful observation before asking for anything.',
 '["reciprocity","low_reactance","specificity","cognitive_fluency"]','["specific_context","useful_observation","one_open_question"]','interest_or_permission',
 '{"human":true,"short_sentences":true,"jij_vorm":true,"light_humor_when_natural":true,"no_pressure":true}',
 '["generic_compliment","calendar_link","service_catalogue","fake_urgency","unproven_claim","reply_guilt"]',
 '{"linkedin_dm":80,"email":125,"e-mail":125,"linkedin_personal":70,"linkedin_comment":65}',70,
 '["notion:sales-relaties","notion:ai-sales-promptbibliotheek","notion:merk-communicatiestijl"]'),
('spin_diagnose','SPIN diagnose','Help the prospect articulate situation, problem and consequence without pitching.',
 '["self_persuasion","low_reactance","curiosity","specificity"]','["observed_context","situation_or_problem_question","one_consequence_question"]','diagnostic_question',
 '{"human":true,"curious":true,"no_pressure":true,"one_question":true}',
 '["premature_solution","calendar_link","double_question","interrogation","unproven_claim"]',
 '{"linkedin_dm":80,"email":125,"e-mail":125,"reply_email":110,"reply_dm":70}',80,
 '["notion:ai-sales-promptbibliotheek","notion:revenue-orchestrator"]'),
('challenger_insight','Challenger insight','Reframe a familiar problem with a credible unexpected insight and invite correction.',
 '["pattern_interrupt","curiosity","contrast","authority_without_boasting"]','["specific_trigger","unexpected_insight","business_consequence","invite_correction"]','confirm_or_correct',
 '{"human":true,"direct":true,"compact":true,"humble":true}',
 '["fearmongering","fake_benchmark","unsupported_number","hard_close","generic_ai_claim"]',
 '{"linkedin_dm":80,"email":130,"e-mail":130,"linkedin_personal":75}',85,
 '["notion:ai-sales-promptbibliotheek","notion:wat-blijft-hangen"]'),
('trigger_outreach','Trigger outreach','Use a fresh verified business trigger to make timing relevant.',
 '["timing_relevance","specificity","loss_awareness_without_fear","low_reactance"]','["verified_trigger","likely_consequence_as_hypothesis","small_useful_offer","permission_question"]','permission_to_send_value',
 '{"human":true,"timely":true,"hypothesis_labeled":true,"no_pressure":true}',
 '["invented_trigger","certainty_language","fake_urgency","calendar_link","hard_pitch"]',
 '{"linkedin_dm":80,"email":130,"e-mail":130,"linkedin_personal":75}',95,
 '["notion:ai-sales-promptbibliotheek","notion:revenue-orchestrator"]'),
('followup_new_angle','Follow-up: new angle','Continue a silent thread with new value rather than repeating the first ask.',
 '["mere_exposure","novelty","low_reactance","reciprocity"]','["brief_context","new_evidence_or_angle","one_low_effort_question"]','interest_or_timing',
 '{"human":true,"shorter_than_previous":true,"no_reply_guilt":true}',
 '["just_following_up","did_you_see","reply_guilt","repeat_same_ask","calendar_link"]',
 '{"linkedin_dm":60,"email":100,"e-mail":100,"reply_email":90,"reply_dm":60}',75,
 '["notion:sales-relaties"]'),
('graceful_close','Graceful close','Remove pressure after repeated silence and preserve future relationship.',
 '["reactance_release","autonomy","loss_awareness_without_pressure"]','["close_loop","no_more_followup","door_open"]','no_question',
 '{"human":true,"respectful":true,"short":true,"no_sarcasm":true}',
 '["last_chance","deadline","guilt","question","calendar_link"]',
 '{"linkedin_dm":55,"email":80,"e-mail":80}',65,
 '["notion:sales-relaties"]'),
('commitment_close','Commitment close','Turn an already-aligned conversation into the smallest concrete next commitment.',
 '["commitment_consistency","specificity","friction_reduction"]','["agreed_outcome","missing_criterion_or_owner","one_concrete_next_step"]','specific_next_step',
 '{"human":true,"clear":true,"decisive":true,"no_pressure":true}',
 '["reopen_full_pitch","vague_next_step","multiple_ctas","fake_deadline"]',
 '{"linkedin_dm":75,"email":130,"e-mail":130,"reply_email":120,"reply_dm":70}',90,
 '["notion:ai-sales-promptbibliotheek"]'),
('objection_response','Objection response','Acknowledge the actual objection, reduce risk and ask one diagnostic next question.',
 '["validation","risk_reduction","specificity","autonomy"]','["acknowledge_objection","answer_with_evidence","reduce_risk","one_next_question"]','diagnostic_next_step',
 '{"human":true,"non_defensive":true,"concise":true,"evidence_led":true}',
 '["argumentative_tone","pressure","discount_without_reason","unproven_social_proof"]',
 '{"reply_email":130,"reply_dm":80,"email":130,"e-mail":130,"linkedin_dm":80}',92,
 '["notion:ai-sales-promptbibliotheek","notion:cockpit-runbook"]'),
('value_comment','Value-adding public comment','Build recognition and credibility by adding useful context without selling.',
 '["mere_exposure","reciprocity","pattern_relevance"]','["specific_post_context","one_useful_observation_or_nuance","optional_real_question"]','no_sales_cta',
 '{"human":true,"natural":true,"useful":true,"light_humor_when_natural":true}',
 '["sales_pitch","company_pitch","generic_praise","calendar_link","fake_fact"]',
 '{"linkedin_personal":65,"linkedin_comment":65}',70,
 '["notion:wat-blijft-hangen","notion:linkedin-revenue-cockpit"]')
on conflict (play_key) do update set
  play_name=excluded.play_name,
  objective=excluded.objective,
  psychology=excluded.psychology,
  message_structure=excluded.message_structure,
  cta_style=excluded.cta_style,
  tone_rules=excluded.tone_rules,
  prohibited=excluded.prohibited,
  max_words=excluded.max_words,
  priority=excluded.priority,
  active=true,
  source_refs=excluded.source_refs,
  updated_at=now();

create table if not exists public.powerhouse_message_quality_v1 (
  quality_id uuid primary key default gen_random_uuid(),
  action_id uuid not null references public.powerhouse_sales_actions(action_id) on delete cascade,
  composer_version text not null,
  play_key text not null,
  channel text not null,
  message_hash text not null,
  passed boolean not null,
  score numeric(8,4) not null check (score between 0 and 1),
  checks jsonb not null default '{}'::jsonb,
  evidence jsonb not null default '{}'::jsonb,
  evaluated_at timestamptz not null default now(),
  unique(action_id,message_hash)
);
alter table public.powerhouse_message_quality_v1 enable row level security;
revoke all on public.powerhouse_message_quality_v1 from public, anon, authenticated;
grant select, insert, update, delete on public.powerhouse_message_quality_v1 to service_role;
drop policy if exists powerhouse_message_quality_service_v1 on public.powerhouse_message_quality_v1;
create policy powerhouse_message_quality_service_v1 on public.powerhouse_message_quality_v1
for all to service_role using (true) with check (true);

create index if not exists idx_sales_actions_message_plan_pending_v1
on public.powerhouse_sales_actions(status,priority desc)
where status in ('prepared','suggested','waiting');

create or replace view public.powerhouse_commercial_message_plan_v1
with (security_invoker=true) as
with b as (
 select
   a.*,
   lower(replace(a.channel,' ','_')) channel_norm,
   r.relationship_warmth,r.decision_influence,r.company_intent_score,r.events_30d,r.actions_30d,r.actions_90d,
   r.positive_outcomes,r.meetings,r.proposals,r.won_outcomes,r.last_relevant_at,
   coalesce(a.evidence#>>'{commercial_intelligence,stage}',a.evidence->>'stage','') stage_hint,
   coalesce(a.evidence#>>'{commercial_intelligence,buying_window_state}',a.evidence->>'commercial_state','') buying_state_hint,
   coalesce(a.evidence#>>'{predictive_brief,hypothesis,problem}',a.evidence->>'predicted_problem') predicted_problem,
   coalesce(a.evidence#>>'{predictive_brief,prediction,buying_trigger}',a.evidence->>'trigger_type',a.evidence->>'trigger_key') predicted_buying_trigger,
   coalesce(a.evidence->>'predicted_objection',a.evidence->>'likely_objection',a.evidence#>>'{commercial_intelligence,predicted_objection}') predicted_objection,
   (a.evidence ? 'predictive_brief' or a.evidence ? 'trigger_key' or a.evidence ? 'trigger_type') has_verified_trigger
 from public.powerhouse_sales_actions a
 left join public.powerhouse_relationship_revenue_intelligence_v1 r on r.person_key=a.person_key
 where lower(replace(a.channel,' ','_')) in ('email','e-mail','linkedin_dm','linkedin_personal','linkedin_comment','reply_email','reply_dm')
), c as (
 select b.*,
 case
   when b.action_type='reply_post' or b.channel_norm in ('linkedin_personal','linkedin_comment') then 'value_comment'
   when b.predicted_objection is not null or b.action_type ~* 'objection' then 'objection_response'
   when b.action_type ~* '(follow|reminder)' and coalesce(b.actions_30d,0)>=4 then 'graceful_close'
   when b.action_type ~* '(follow|reminder)' then 'followup_new_angle'
   when coalesce(b.stage_hint,'') ~* '(decision|proposal|qualified|meeting)' or b.action_type ~* '(proposal|close)' then 'commitment_close'
   when b.has_verified_trigger and coalesce(b.company_intent_score,0)>=.40 then 'trigger_outreach'
   when coalesce(b.company_intent_score,0)>=.65 then 'challenger_insight'
   when coalesce(b.relationship_warmth,0)>=.45 or coalesce(b.events_30d,0)>0 then 'spin_diagnose'
   else 'value_first'
 end play_key
 from b
)
select
 c.action_id,c.dedupe_key,c.subject_key,c.person_key,c.company_key,c.person_name,c.company_name,c.role,c.action_type,c.channel,c.channel_norm,
 c.status,c.priority,c.reason,c.message_draft,c.source_url,c.evidence,c.opportunity_key,c.content_key,c.topic_key,c.campaign_key,c.expected_value_eur,
 -- CREATE OR REPLACE VIEW retains existing column positions and types.
 c.stage_hint,c.buying_state_hint,c.predicted_problem,c.predicted_buying_trigger,c.predicted_objection,
 coalesce(c.company_intent_score,0::numeric) intent_hint,
 coalesce(c.relationship_warmth,0::numeric) warmth_hint,
 c.has_verified_trigger,
 p.play_key,p.play_name,p.objective,p.psychology,p.message_structure,p.cta_style,p.tone_rules,p.prohibited,
 coalesce((p.max_words->>c.channel_norm)::int,(p.max_words->>'linkedin_dm')::int,(p.max_words->>'email')::int,100) max_words,
 jsonb_build_object(
   'contract','powerhouse-human-commercial-message-plan-v1',
   'play_key',p.play_key,'play_name',p.play_name,'objective',p.objective,'psychology',p.psychology,
   'message_structure',p.message_structure,'cta_style',p.cta_style,'tone_rules',p.tone_rules,'prohibited',p.prohibited,
   'max_words',coalesce((p.max_words->>c.channel_norm)::int,(p.max_words->>'linkedin_dm')::int,(p.max_words->>'email')::int,100),
   'brand_voice',jsonb_build_object(
     'jij_vorm',true,'short_sentences',true,'human',true,'concrete',true,
     'humor','light and situational only when natural; never at prospect expense',
     'positioning','Uit hoofden, in je bedrijf. En dan werkend.',
     'sales_style','help first; smallest logical commitment; no meeting push'
   ),
   'quality_contract',jsonb_build_object(
     'one_primary_problem',true,'one_cta_max',true,'generic_opening_forbidden',true,'facts_only',true,
     'hypotheses_labeled',true,'humanity_required',true,'generic_compliment_forbidden',true,'reply_guilt_forbidden',true
   ),
   'learning_key',p.play_key||':'||c.channel_norm||':'||coalesce(nullif(c.stage_hint,''),'unknown')
 ) message_plan,
 -- New intelligence is appended so existing dependent views remain valid.
 c.relationship_warmth,c.decision_influence,c.company_intent_score,c.events_30d,c.actions_30d,c.actions_90d,
 c.positive_outcomes,c.meetings,c.proposals,c.won_outcomes,c.last_relevant_at
from c
join public.powerhouse_sales_playbook_v1 p on p.play_key=c.play_key and p.active;
revoke all on public.powerhouse_commercial_message_plan_v1 from public, anon, authenticated;
grant select on public.powerhouse_commercial_message_plan_v1 to service_role;

create or replace function public.powerhouse_apply_message_plan_v1(p_action_id uuid)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_plan jsonb; v_play text;
begin
 select message_plan,play_key into v_plan,v_play
 from public.powerhouse_commercial_message_plan_v1
 where action_id=p_action_id;
 if v_plan is null then return jsonb_build_object('ok',false,'reason','MESSAGE_PLAN_NOT_ELIGIBLE','action_id',p_action_id); end if;
 update public.powerhouse_sales_actions
 set evidence=jsonb_set(coalesce(evidence,'{}'::jsonb),'{commercial_intelligence}',coalesce(evidence->'commercial_intelligence','{}'::jsonb)||v_plan,true),
     updated_at=now()
 where action_id=p_action_id;
 return jsonb_build_object('ok',true,'action_id',p_action_id,'play_key',v_play);
end $$;
revoke execute on function public.powerhouse_apply_message_plan_v1(uuid) from public, anon, authenticated;
grant execute on function public.powerhouse_apply_message_plan_v1(uuid) to service_role;

create or replace function public.powerhouse_refresh_message_plans_v1(p_limit int default 100)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_id uuid; v_n int:=0;
begin
 for v_id in
   select a.action_id
   from public.powerhouse_sales_actions a
   where a.status in ('prepared','suggested','waiting')
     and lower(replace(a.channel,' ','_')) in ('email','e-mail','linkedin_dm','linkedin_personal','linkedin_comment','reply_email','reply_dm')
     and coalesce(a.evidence#>>'{commercial_intelligence,contract}','')<>'powerhouse-human-commercial-message-plan-v1'
   order by a.priority desc,a.action_id
   limit greatest(1,least(coalesce(p_limit,100),200))
 loop
   perform public.powerhouse_apply_message_plan_v1(v_id);
   v_n:=v_n+1;
 end loop;
 return jsonb_build_object('contract','powerhouse-human-commercial-message-plan-v1','planned_actions',v_n,'executed_at',now());
end $$;
revoke execute on function public.powerhouse_refresh_message_plans_v1(int) from public, anon, authenticated;
grant execute on function public.powerhouse_refresh_message_plans_v1(int) to service_role;

create or replace function public.powerhouse_commercial_message_candidates_v1(
  p_limit integer default 10,
  p_channels text[] default null,
  p_action_ids uuid[] default null
)
returns setof public.powerhouse_commercial_message_plan_v1
language sql security invoker set search_path = public, pg_catalog as $$
 select p.*
 from public.powerhouse_commercial_message_plan_v1 p
 where p.status in ('prepared','suggested','waiting')
   and (p_channels is null or cardinality(p_channels)=0 or p.channel_norm=any(p_channels))
   and (p_action_ids is null or cardinality(p_action_ids)=0 or p.action_id=any(p_action_ids))
 order by p.priority desc,p.action_id
 limit greatest(1,least(coalesce(p_limit,10),200))
$$;
revoke execute on function public.powerhouse_commercial_message_candidates_v1(integer,text[],uuid[]) from public, anon, authenticated;
grant execute on function public.powerhouse_commercial_message_candidates_v1(integer,text[],uuid[]) to service_role;

create or replace view public.powerhouse_human_sales_message_health_v1
with (security_invoker=true) as
select now() measured_at,
 count(*) filter(where a.status in ('prepared','suggested','waiting')) pending_commercial_actions,
 count(*) filter(where a.status in ('prepared','suggested','waiting') and coalesce(a.evidence#>>'{commercial_intelligence,message_strategy}','')<>'') planned_actions,
 count(*) filter(where a.status in ('prepared','suggested','waiting') and coalesce(a.message_draft,'')<>'') drafted_actions,
 count(*) filter(where a.status in ('prepared','suggested','waiting') and q.passed=true) quality_passed_actions,
 count(*) filter(where a.status in ('prepared','suggested','waiting') and coalesce(a.message_draft,'')<>'' and q.quality_id is null) drafts_without_quality,
 count(*) filter(where a.status in ('prepared','suggested','waiting') and coalesce(a.evidence#>>'{commercial_intelligence,message_strategy}','')='') actions_without_strategy,
 count(*) filter(where a.status='done' and a.executed_at>=now()-interval '30 days' and coalesce(a.evidence#>>'{commercial_intelligence,message_strategy}','')<>'') executed_labeled_30d
from public.powerhouse_sales_actions a
left join lateral (
 select x.* from public.powerhouse_message_quality_v1 x
 where x.action_id=a.action_id order by x.evaluated_at desc limit 1
) q on true
where lower(replace(a.channel,' ','_')) in ('email','e-mail','linkedin_dm','linkedin_personal','linkedin_comment','reply_email','reply_dm');
revoke all on public.powerhouse_human_sales_message_health_v1 from public, anon, authenticated;
grant select on public.powerhouse_human_sales_message_health_v1 to service_role;
