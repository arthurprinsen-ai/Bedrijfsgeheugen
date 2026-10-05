-- Powerhouse human commercial message loop v1
-- Canonical loop: intelligence -> play/psychology -> message -> quality -> execution -> outcome/revenue -> learning.

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
revoke all on public.powerhouse_sales_playbook_v1 from public,anon,authenticated;
grant select,insert,update,delete on public.powerhouse_sales_playbook_v1 to service_role;
drop policy if exists powerhouse_sales_playbook_service_v1 on public.powerhouse_sales_playbook_v1;
create policy powerhouse_sales_playbook_service_v1 on public.powerhouse_sales_playbook_v1 for all to service_role using(true) with check(true);

insert into public.powerhouse_sales_playbook_v1(play_key,play_name,objective,psychology,message_structure,cta_style,tone_rules,prohibited,max_words,priority,source_refs) values
('value_first','Value first / social selling','Earn a reply by giving a useful observation before asking for anything.','["reciprocity","low_reactance","specificity","cognitive_fluency"]','["specific_context","useful_observation","one_open_question"]','interest_or_permission','{"human":true,"short_sentences":true,"jij_vorm":true,"light_humor_when_natural":true,"no_pressure":true}','["generic_compliment","calendar_link","service_catalogue","fake_urgency","unproven_claim","reply_guilt"]','{"linkedin_dm":80,"email":125,"e-mail":125,"linkedin_personal":70,"linkedin_comment":65}',70,'["notion:sales-relaties","notion:ai-sales-promptbibliotheek","notion:merk-communicatiestijl"]'),
('spin_diagnose','SPIN diagnose','Help the prospect articulate situation, problem and consequence without pitching.','["self_persuasion","low_reactance","curiosity","specificity"]','["observed_context","situation_or_problem_question","one_consequence_question"]','diagnostic_question','{"human":true,"curious":true,"no_pressure":true,"one_question":true}','["premature_solution","calendar_link","double_question","interrogation","unproven_claim"]','{"linkedin_dm":80,"email":125,"e-mail":125,"reply_email":110,"reply_dm":70}',80,'["notion:ai-sales-promptbibliotheek","notion:revenue-orchestrator"]'),
('challenger_insight','Challenger insight','Reframe a familiar problem with a credible unexpected insight and invite correction.','["pattern_interrupt","curiosity","contrast","authority_without_boasting"]','["specific_trigger","unexpected_insight","business_consequence","invite_correction"]','confirm_or_correct','{"human":true,"direct":true,"compact":true,"humble":true}','["fearmongering","fake_benchmark","unsupported_number","hard_close","generic_ai_claim"]','{"linkedin_dm":80,"email":130,"e-mail":130,"linkedin_personal":75}',85,'["notion:ai-sales-promptbibliotheek","notion:wat-blijft-hangen"]'),
('trigger_outreach','Trigger outreach','Use a fresh verified business trigger to make timing relevant.','["timing_relevance","specificity","loss_awareness_without_fear","low_reactance"]','["verified_trigger","likely_consequence_as_hypothesis","small_useful_offer","permission_question"]','permission_to_send_value','{"human":true,"timely":true,"hypothesis_labeled":true,"no_pressure":true}','["invented_trigger","certainty_language","fake_urgency","calendar_link","hard_pitch"]','{"linkedin_dm":80,"email":130,"e-mail":130,"linkedin_personal":75}',95,'["notion:ai-sales-promptbibliotheek","notion:revenue-orchestrator"]'),
('followup_new_angle','Follow-up: new angle','Continue a silent thread with new value rather than repeating the first ask.','["mere_exposure","novelty","low_reactance","reciprocity"]','["brief_context","new_evidence_or_angle","one_low_effort_question"]','interest_or_timing','{"human":true,"shorter_than_previous":true,"no_reply_guilt":true}','["just_following_up","did_you_see","reply_guilt","repeat_same_ask","calendar_link"]','{"linkedin_dm":60,"email":100,"e-mail":100,"reply_email":90,"reply_dm":60}',75,'["notion:sales-relaties"]'),
('graceful_close','Graceful close','Remove pressure after repeated silence and preserve future relationship.','["reactance_release","autonomy","loss_awareness_without_pressure"]','["close_loop","no_more_followup","door_open"]','no_question','{"human":true,"respectful":true,"short":true,"no_sarcasm":true}','["last_chance","deadline","guilt","question","calendar_link"]','{"linkedin_dm":55,"email":80,"e-mail":80}',65,'["notion:sales-relaties"]'),
('commitment_close','Commitment close','Turn an already-aligned conversation into the smallest concrete next commitment.','["commitment_consistency","specificity","friction_reduction"]','["agreed_outcome","missing_criterion_or_owner","one_concrete_next_step"]','specific_next_step','{"human":true,"clear":true,"decisive":true,"no_pressure":true}','["reopen_full_pitch","vague_next_step","multiple_ctas","fake_deadline"]','{"linkedin_dm":75,"email":130,"e-mail":130,"reply_email":120,"reply_dm":70}',90,'["notion:ai-sales-promptbibliotheek"]'),
('objection_response','Objection response','Acknowledge the actual objection, reduce risk and ask one diagnostic next question.','["validation","risk_reduction","specificity","autonomy"]','["acknowledge_objection","answer_with_evidence","reduce_risk","one_next_question"]','diagnostic_next_step','{"human":true,"non_defensive":true,"concise":true,"evidence_led":true}','["argumentative_tone","pressure","discount_without_reason","unproven_social_proof"]','{"reply_email":130,"reply_dm":80,"email":130,"e-mail":130,"linkedin_dm":80}',92,'["notion:ai-sales-promptbibliotheek","notion:cockpit-runbook"]'),
('value_comment','Value-adding public comment','Build recognition and credibility by adding useful context without selling.','["mere_exposure","reciprocity","pattern_relevance"]','["specific_post_context","one_useful_observation_or_nuance","optional_real_question"]','no_sales_cta','{"human":true,"natural":true,"useful":true,"light_humor_when_natural":true}','["sales_pitch","company_pitch","generic_praise","calendar_link","fake_fact"]','{"linkedin_personal":65,"linkedin_comment":65}',70,'["notion:wat-blijft-hangen","notion:linkedin-revenue-cockpit"]')
on conflict(play_key) do update set play_name=excluded.play_name,objective=excluded.objective,psychology=excluded.psychology,message_structure=excluded.message_structure,cta_style=excluded.cta_style,tone_rules=excluded.tone_rules,prohibited=excluded.prohibited,max_words=excluded.max_words,priority=excluded.priority,active=true,source_refs=excluded.source_refs,updated_at=now();

create table if not exists public.powerhouse_message_quality_v1 (
  quality_id uuid primary key default gen_random_uuid(),
  action_id uuid not null references public.powerhouse_sales_actions(action_id) on delete cascade,
  composer_version text not null,
  play_key text not null,
  channel text not null,
  message_hash text not null,
  passed boolean not null,
  score numeric(8,4) not null check(score between 0 and 1),
  checks jsonb not null default '{}'::jsonb,
  evidence jsonb not null default '{}'::jsonb,
  evaluated_at timestamptz not null default now(),
  unique(action_id,message_hash)
);
alter table public.powerhouse_message_quality_v1 enable row level security;
revoke all on public.powerhouse_message_quality_v1 from public,anon,authenticated;
grant select,insert,update,delete on public.powerhouse_message_quality_v1 to service_role;
drop policy if exists powerhouse_message_quality_service_v1 on public.powerhouse_message_quality_v1;
create policy powerhouse_message_quality_service_v1 on public.powerhouse_message_quality_v1 for all to service_role using(true) with check(true);

create or replace function public.powerhouse_outbound_message_quality_ready_v1(p_action_id uuid)
returns boolean language sql stable set search_path=public,pg_catalog as $$
  select case
    when a.action_id is null then false
    when lower(replace(coalesce(a.channel,''),' ','_')) not in ('email','e-mail','linkedin_dm') then true
    when a.action_type not in ('autonomous_email','activate_connection','email_followup','follow_up','reply_followup','reply_dm') then true
    else coalesce(a.evidence#>>'{commercial_intelligence,quality_passed}','false')='true'
      and coalesce(a.evidence#>>'{commercial_intelligence,message_hash}','')<>''
      and exists(select 1 from public.powerhouse_message_quality_v1 q where q.action_id=a.action_id and q.message_hash=a.evidence#>>'{commercial_intelligence,message_hash}' and q.passed=true)
  end
  from public.powerhouse_sales_actions a where a.action_id=p_action_id
$$;

create or replace function public.powerhouse_assert_outbound_message_quality_v1()
returns trigger language plpgsql set search_path=public,pg_catalog as $$
begin
  if lower(replace(coalesce(new.channel,''),' ','_')) in ('email','e-mail','linkedin_dm')
     and new.action_type in ('autonomous_email','activate_connection','email_followup','follow_up','reply_followup','reply_dm')
     and new.status in ('waiting','done') and new.status is distinct from old.status
     and not coalesce(public.powerhouse_outbound_message_quality_ready_v1(new.action_id),false) then
    raise exception 'OUTBOUND_COPY_QUALITY_NOT_PROVEN action_id=%',new.action_id using errcode='P0001';
  end if;
  return new;
end $$;
drop trigger if exists powerhouse_outbound_message_quality_gate_v1 on public.powerhouse_sales_actions;
create trigger powerhouse_outbound_message_quality_gate_v1 before update of status on public.powerhouse_sales_actions for each row execute function public.powerhouse_assert_outbound_message_quality_v1();

create or replace function public.powerhouse_sales_outcome_message_lineage_v1()
returns trigger language plpgsql set search_path=public,pg_catalog as $$
declare v_ci jsonb;
begin
  if new.action_id is null then return new; end if;
  select coalesce(a.evidence->'commercial_intelligence','{}'::jsonb) into v_ci from public.powerhouse_sales_actions a where a.action_id=new.action_id;
  new.evidence:=coalesce(new.evidence,'{}'::jsonb)||jsonb_build_object('message_intelligence',coalesce(v_ci,'{}'::jsonb));
  return new;
end $$;
drop trigger if exists powerhouse_sales_outcome_message_lineage_v1 on public.powerhouse_sales_outcomes;
create trigger powerhouse_sales_outcome_message_lineage_v1 before insert or update of action_id on public.powerhouse_sales_outcomes for each row execute function public.powerhouse_sales_outcome_message_lineage_v1();

create or replace view public.powerhouse_sales_play_performance_v1 with (security_invoker=true) as
select coalesce(a.evidence#>>'{commercial_intelligence,message_strategy}','unknown') play_key,a.channel,
 coalesce(a.evidence#>>'{commercial_intelligence,learning_key}',coalesce(a.evidence#>>'{commercial_intelligence,message_strategy}','unknown')||':'||lower(replace(a.channel,' ','_'))) learning_key,
 count(distinct a.action_id)::int executed_actions,count(distinct o.outcome_id)::int observed_outcomes,
 count(distinct o.outcome_id) filter(where lower(o.outcome_type) not in ('sent','delivered','queued'))::int business_outcomes,
 count(distinct o.outcome_id) filter(where lower(o.outcome_type)~'(reply|response)')::int replies,
 count(distinct o.outcome_id) filter(where lower(o.outcome_type)~'(meeting|appointment)')::int meetings,
 count(distinct o.outcome_id) filter(where lower(o.outcome_type)~'(proposal|offer)')::int proposals,
 count(distinct o.outcome_id) filter(where lower(o.outcome_type)~'(won|order|revenue)')::int wins,
 coalesce(sum(o.revenue_eur),0)::numeric realized_revenue_eur,
 round(avg(nullif((a.evidence#>>'{commercial_intelligence,quality_score}')::numeric,0)),4) avg_quality_score,
 round(coalesce(count(distinct o.outcome_id) filter(where lower(o.outcome_type)~'(reply|response|meeting|appointment|proposal|offer|won|order|revenue)')::numeric/nullif(count(distinct a.action_id),0),0),4) positive_outcome_rate,
 max(a.executed_at) last_executed_at,max(o.occurred_at) last_outcome_at
from public.powerhouse_sales_actions a left join public.powerhouse_sales_outcomes o on o.action_id=a.action_id
where a.executed_at>=now()-interval '180 days' and coalesce(a.evidence#>>'{commercial_intelligence,message_strategy}','')<>''
group by 1,2,3;
revoke all on public.powerhouse_sales_play_performance_v1 from public,anon,authenticated;
grant select on public.powerhouse_sales_play_performance_v1 to service_role;

create or replace function public.powerhouse_refresh_sales_play_learnings_v1()
returns jsonb language plpgsql security definer set search_path=public,pg_catalog as $$
declare v_n int:=0;v_total int:=0;v_mature int:=0;
begin
 insert into public.powerhouse_sales_learnings(fingerprint,subject_key,scope,hypothesis,evidence,effect,confidence,status,channel,sample_size,expires_at,updated_at)
 select 'sales-play:'||md5(p.learning_key),'powerhouse','sales_play',
 'Sales play performance must be learned from observed provider/outcome/revenue evidence, never from copy preference alone.',
 jsonb_build_object('contract','powerhouse-human-commercial-message-learning-v1','play_key',p.play_key,'channel',p.channel,'learning_key',p.learning_key,'executed_actions',p.executed_actions,'observed_outcomes',p.observed_outcomes,'business_outcomes',p.business_outcomes,'replies',p.replies,'meetings',p.meetings,'proposals',p.proposals,'wins',p.wins,'realized_revenue_eur',p.realized_revenue_eur,'avg_quality_score',p.avg_quality_score,'positive_outcome_rate',p.positive_outcome_rate,'last_outcome_at',p.last_outcome_at),
 jsonb_build_object('primary_effect','message_strategy_to_business_outcome','positive_outcome_rate',p.positive_outcome_rate,'realized_revenue_eur',p.realized_revenue_eur,'promotion_eligible',p.business_outcomes>=5,'truth_boundary','sent/delivered/queued do not count as business outcomes'),
 case when p.business_outcomes>=20 then .90 when p.business_outcomes>=10 then .80 when p.business_outcomes>=5 then .70 else .35 end,
 case when p.business_outcomes>=5 then 'active' else 'hypothesis' end,p.channel,greatest(1,p.business_outcomes),now()+interval '30 days',now()
 from public.powerhouse_sales_play_performance_v1 p where p.play_key<>'unknown'
 on conflict(fingerprint) do update set evidence=excluded.evidence,effect=excluded.effect,confidence=excluded.confidence,status=excluded.status,channel=excluded.channel,sample_size=excluded.sample_size,expires_at=excluded.expires_at,updated_at=now();
 get diagnostics v_n=row_count;
 select count(*),count(*) filter(where business_outcomes>=5) into v_total,v_mature from public.powerhouse_sales_play_performance_v1 where play_key<>'unknown';
 return jsonb_build_object('contract','powerhouse-human-commercial-message-learning-v1','strategies_seen',v_total,'strategies_with_mature_business_outcomes',v_mature,'learning_rows_touched',v_n,'truth_boundary','no strategy promotion from sends alone; >=5 business outcomes required');
end $$;
revoke execute on function public.powerhouse_refresh_sales_play_learnings_v1() from public,anon,authenticated;
grant execute on function public.powerhouse_refresh_sales_play_learnings_v1() to service_role;
