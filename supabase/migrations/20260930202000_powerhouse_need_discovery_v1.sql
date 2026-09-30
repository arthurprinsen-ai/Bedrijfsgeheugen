-- Powerhouse need discovery v1
-- Applies one evidence-bounded next question to every prepared direct sales action.

create table if not exists public.powerhouse_need_discovery_events_v1 (
  event_id uuid primary key default gen_random_uuid(),
  subject_key text not null,
  person_key text,
  company_key text,
  channel text not null,
  stage text not null check(stage in ('goal','situation','problem','impact','urgency','value','decision','complete')),
  question_key text,
  answer_text text,
  answer_source text not null default 'buyer_words',
  action_id uuid,
  evidence jsonb not null default '{}'::jsonb,
  observed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
alter table public.powerhouse_need_discovery_events_v1 enable row level security;
revoke all on public.powerhouse_need_discovery_events_v1 from public,anon,authenticated;
grant select,insert,update,delete on public.powerhouse_need_discovery_events_v1 to service_role;
create index if not exists powerhouse_need_discovery_subject_idx on public.powerhouse_need_discovery_events_v1(subject_key,observed_at desc);

create or replace view public.powerhouse_need_discovery_profiles_v1
with (security_invoker=true) as
with ranked as (
  select e.*,row_number() over(partition by subject_key,stage order by observed_at desc,event_id desc) rn
  from public.powerhouse_need_discovery_events_v1 e
), latest as (
  select * from ranked where rn=1
)
select subject_key,max(person_key) person_key,max(company_key) company_key,
  max(answer_text) filter(where stage='goal') desired_result,
  max(answer_text) filter(where stage='situation') current_approach,
  max(answer_text) filter(where stage='problem') problem_example,
  max(answer_text) filter(where stage='impact') business_impact,
  max(answer_text) filter(where stage='urgency') urgency,
  max(answer_text) filter(where stage='value') success_metric,
  max(answer_text) filter(where stage='decision') decision_process,
  max(observed_at) last_observed_at
from latest group by subject_key;
revoke all on public.powerhouse_need_discovery_profiles_v1 from public,anon,authenticated;
grant select on public.powerhouse_need_discovery_profiles_v1 to service_role;

create or replace function public.powerhouse_need_discovery_context_v1(
  p_subject_key text,p_evidence jsonb default '{}'::jsonb
) returns jsonb language sql stable security definer set search_path = pg_catalog, public as $$
with profile as (
  select * from public.powerhouse_need_discovery_profiles_v1 where subject_key=p_subject_key
), merged as (
  select
    coalesce(nullif(p_evidence->>'desired_result',''),desired_result) desired_result,
    coalesce(nullif(p_evidence->>'current_approach',''),current_approach) current_approach,
    coalesce(nullif(p_evidence->>'problem_example',''),problem_example) problem_example,
    coalesce(nullif(p_evidence->>'business_impact',''),business_impact) business_impact,
    coalesce(nullif(p_evidence->>'urgency',''),urgency) urgency,
    coalesce(nullif(p_evidence->>'success_metric',''),success_metric) success_metric,
    coalesce(nullif(p_evidence->>'decision_process',''),decision_process) decision_process
  from (select 1) x left join profile on true
), next as (
  select *,
    case when desired_result is null then 'goal' when current_approach is null then 'situation'
      when problem_example is null then 'problem' when business_impact is null then 'impact'
      when urgency is null then 'urgency' when success_metric is null then 'value'
      when decision_process is null then 'decision' else 'complete' end stage
  from merged
)
select jsonb_build_object(
  'contract','powerhouse-need-discovery-v1','stage',stage,
  'next_question',case stage
    when 'goal' then 'Wat wil je de komende zes maanden concreet verbeteren?'
    when 'situation' then 'Hoe regelen jullie dit nu, en met hoeveel mensen?'
    when 'problem' then 'Wanneer liep dit voor het laatst mis, en wat gebeurde er toen?'
    when 'impact' then 'Wat kost dit aan tijd, geld, klanten of afhankelijkheid van jou?'
    when 'urgency' then 'Waarom wil je dit nu oplossen, en wat gebeurt er als je niets verandert?'
    when 'value' then 'Wat moet er aantoonbaar beter zijn om een investering te rechtvaardigen?'
    when 'decision' then 'Wie beslist hierover, en wanneer moet een volgende stap duidelijk zijn?'
    else 'Welke concrete vervolgstap wil je nu afspreken?' end,
  'problem_confirmed',problem_example is not null,'impact_confirmed',business_impact is not null,
  'urgency_confirmed',urgency is not null,'decision_ready',decision_process is not null,
  'may_pitch',problem_example is not null and business_impact is not null and urgency is not null,
  'truth_rule','unknown stays unknown'
) from next;
$$;
revoke execute on function public.powerhouse_need_discovery_context_v1(text,jsonb) from public,anon,authenticated;
grant execute on function public.powerhouse_need_discovery_context_v1(text,jsonb) to service_role;

create or replace function public.powerhouse_apply_need_discovery_v1()
returns jsonb language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_updated integer:=0;
begin
  with contexts as (
    select a.action_id,public.powerhouse_need_discovery_context_v1(a.subject_key,coalesce(a.evidence,'{}'::jsonb)) ctx
    from public.powerhouse_sales_actions a
    where a.status='prepared' and a.channel in ('email','linkedin_dm')
      and a.action_type in ('autonomous_email','linkedin_dm','followup','authorized_private_followup')
      and a.due_at<=now()
  )
  update public.powerhouse_sales_actions a
  set evidence=coalesce(a.evidence,'{}'::jsonb)||jsonb_build_object('need_discovery',c.ctx),
      message_draft=case
        when coalesce(c.ctx->>'stage','complete')='complete' then a.message_draft
        when position(c.ctx->>'next_question' in coalesce(a.message_draft,''))>0 then a.message_draft
        when position(chr(10)||chr(10)||'Groet,' in coalesce(a.message_draft,''))>0 then
          replace(a.message_draft,chr(10)||chr(10)||'Groet,',chr(10)||chr(10)||'Om goed aan te sluiten: '||(c.ctx->>'next_question')||chr(10)||chr(10)||'Groet,')
        else coalesce(a.message_draft,'')||chr(10)||chr(10)||'Om goed aan te sluiten: '||(c.ctx->>'next_question')
      end,
      updated_at=now()
  from contexts c where a.action_id=c.action_id;
  get diagnostics v_updated=row_count;
  return jsonb_build_object('contract','powerhouse-need-discovery-v1','updated_actions',v_updated,'executed_at',now());
end;
$$;
revoke execute on function public.powerhouse_apply_need_discovery_v1() from public,anon,authenticated;
grant execute on function public.powerhouse_apply_need_discovery_v1() to service_role;
