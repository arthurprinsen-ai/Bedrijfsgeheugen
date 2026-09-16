-- Fail-closed execution guards, policy promotion authority and scheduled maintenance.

create or replace function public.powerhouse_guard_experiment_linked_action_v1()
returns trigger language plpgsql set search_path = public, pg_catalog as $$
declare v_exp text; v_assignment public.powerhouse_experiment_assignments%rowtype;
begin
  v_exp:=nullif(coalesce(new.evidence->>'experiment_key',''),'');
  if v_exp is null then return new; end if;
  if nullif(coalesce(new.subject_key,''),'') is null then raise exception 'experiment-linked action requires subject_key'; end if;
  select * into v_assignment from public.powerhouse_experiment_assignments where experiment_key=v_exp and subject_key=new.subject_key;
  if not found then raise exception 'prospective assignment required before experiment-linked action'; end if;
  if v_assignment.assignment_arm<>'treatment' then raise exception 'holdout assignment cannot execute treatment'; end if;
  if coalesce(new.created_at,now())<v_assignment.assigned_at then raise exception 'experiment-linked action predates assignment'; end if;
  if v_assignment.measurement_horizon_end<=now() then raise exception 'experiment assignment horizon already expired'; end if;
  new.evidence:=coalesce(new.evidence,'{}'::jsonb)||jsonb_build_object('assignment_id',v_assignment.assignment_id,'assignment_arm',v_assignment.assignment_arm,'prospective_assignment_verified',true);
  return new;
end;$$;
drop trigger if exists powerhouse_guard_experiment_linked_action_v1 on public.powerhouse_sales_actions;
create trigger powerhouse_guard_experiment_linked_action_v1 before insert or update of evidence,subject_key on public.powerhouse_sales_actions for each row execute function public.powerhouse_guard_experiment_linked_action_v1();

create or replace function public.powerhouse_promote_policy_if_proven_v1(p_experiment_key text)
returns jsonb language plpgsql security definer set search_path = public, pg_catalog as $$
declare v_policy public.powerhouse_experiment_policies%rowtype; v_effect record; v_actionable boolean:=false; v_bad integer:=0; v_version_id uuid;
begin
  select * into v_policy from public.powerhouse_experiment_policies where experiment_key=p_experiment_key;
  if not found then raise exception 'experiment policy not found'; end if;
  select * into v_effect from public.powerhouse_experiment_effect_estimates_v1 where experiment_key=p_experiment_key;
  if not found then return jsonb_build_object('promoted',false,'reason','no_effect_estimate'); end if;
  select coalesce(bool_or(calibration_may_influence_next_actions),false) into v_actionable from public.powerhouse_calibration_actionability_v1 where experiment_key=p_experiment_key;
  select count(*) into v_bad from public.powerhouse_experiment_collision_contamination_v1 where experiment_key=p_experiment_key and (experiment_collision or holdout_contaminated);
  if not v_effect.sample_floor_met then return jsonb_build_object('promoted',false,'reason','sample_floor_not_met','matured_treatment',v_effect.matured_treatment,'matured_holdout',v_effect.matured_holdout); end if;
  if not v_actionable then return jsonb_build_object('promoted',false,'reason','calibration_actionability_false'); end if;
  if v_bad>0 then return jsonb_build_object('promoted',false,'reason','collision_or_contamination','bad_assignments',v_bad); end if;
  if v_effect.observed_effect_state<>'observed_positive_uplift' then return jsonb_build_object('promoted',false,'reason',v_effect.observed_effect_state); end if;
  update public.powerhouse_policy_versions set decision_state='demoted',demoted_at=now() where experiment_key=p_experiment_key and decision_state='promoted' and policy_version<>v_policy.policy_version;
  insert into public.powerhouse_policy_versions(experiment_key,policy_version,decision_state,promoted_at,effect_snapshot,evidence)
  values(p_experiment_key,v_policy.policy_version,'promoted',now(),to_jsonb(v_effect),jsonb_build_object('source','powerhouse_promote_policy_if_proven_v1','calibration_actionable',v_actionable,'collision_or_contamination_count',v_bad))
  on conflict(experiment_key,policy_version) do update set decision_state='promoted',promoted_at=now(),demoted_at=null,effect_snapshot=excluded.effect_snapshot,evidence=excluded.evidence
  returning version_id into v_version_id;
  insert into public.powerhouse_sales_learnings(fingerprint,subject_key,scope,hypothesis,evidence,effect,confidence,status,sample_size)
  values('policy-proof:'||p_experiment_key||':'||v_policy.policy_version,p_experiment_key,'experiment_policy','Prospective treatment policy outperformed holdout on observed realized revenue per matured assignment.',jsonb_build_object('confidence_source','observed_calibration_policy_proof','experiment_key',p_experiment_key,'policy_version',v_policy.policy_version,'promotion_version_id',v_version_id),to_jsonb(v_effect),1,'proven',(v_effect.matured_treatment+v_effect.matured_holdout)::integer)
  on conflict(fingerprint) do update set evidence=excluded.evidence,effect=excluded.effect,confidence=excluded.confidence,status=excluded.status,sample_size=excluded.sample_size,updated_at=now();
  return jsonb_build_object('promoted',true,'experiment_key',p_experiment_key,'policy_version',v_policy.policy_version,'version_id',v_version_id,'effect',to_jsonb(v_effect));
end;$$;
revoke execute on function public.powerhouse_promote_policy_if_proven_v1(text) from public,anon,authenticated;
grant execute on function public.powerhouse_promote_policy_if_proven_v1(text) to service_role;

create or replace function public.powerhouse_demote_policy_v1(p_experiment_key text,p_policy_version text,p_reason text,p_evidence jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = public, pg_catalog as $$
declare v_count integer;
begin
  if nullif(trim(p_reason),'') is null then raise exception 'demotion reason required'; end if;
  update public.powerhouse_policy_versions set decision_state='demoted',demoted_at=now(),evidence=coalesce(evidence,'{}'::jsonb)||jsonb_build_object('demotion_reason',p_reason,'demotion_evidence',coalesce(p_evidence,'{}'::jsonb)) where experiment_key=p_experiment_key and policy_version=p_policy_version and decision_state='promoted';
  get diagnostics v_count=row_count;
  update public.powerhouse_sales_learnings set status='retired',evidence=coalesce(evidence,'{}'::jsonb)||jsonb_build_object('demotion_reason',p_reason,'demoted_at',now()) where fingerprint='policy-proof:'||p_experiment_key||':'||p_policy_version;
  return jsonb_build_object('demoted',v_count>0,'experiment_key',p_experiment_key,'policy_version',p_policy_version,'reason',p_reason);
end;$$;
revoke execute on function public.powerhouse_demote_policy_v1(text,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.powerhouse_demote_policy_v1(text,text,text,jsonb) to service_role;

create or replace view public.powerhouse_next_action_policy_authority_v1 as
select v.experiment_key,v.policy_version,v.promoted_at,v.effect_snapshot,v.evidence,p.primary_metric,p.segmentation,p.guardrails,p.status as experiment_status
from public.powerhouse_policy_versions v
join public.powerhouse_experiment_policies p on p.experiment_key=v.experiment_key and p.policy_version=v.policy_version
where v.decision_state='promoted' and p.status='active';
alter view public.powerhouse_next_action_policy_authority_v1 set (security_invoker=true);
revoke all on table public.powerhouse_next_action_policy_authority_v1 from public,anon,authenticated;
grant select on table public.powerhouse_next_action_policy_authority_v1 to service_role;

create or replace view public.powerhouse_experiment_operating_dashboard_v1 as
select p.experiment_key,p.policy_version,p.status,p.treatment_pct,p.measurement_horizon_hours,p.min_matured_per_arm,p.primary_metric,
 e.matured_treatment,e.matured_holdout,e.treatment_revenue_per_assignment,e.holdout_revenue_per_assignment,e.revenue_uplift_per_assignment,e.treatment_outcome_rate,e.holdout_outcome_rate,e.sample_floor_met,e.observed_effect_state,
 coalesce((select count(*) from public.powerhouse_experiment_collision_contamination_v1 c where c.experiment_key=p.experiment_key and c.experiment_collision),0)::bigint as collision_rows,
 coalesce((select count(*) from public.powerhouse_experiment_collision_contamination_v1 c where c.experiment_key=p.experiment_key and c.holdout_contaminated),0)::bigint as contaminated_holdouts,
 exists(select 1 from public.powerhouse_next_action_policy_authority_v1 n where n.experiment_key=p.experiment_key and n.policy_version=p.policy_version) as currently_authoritative_for_next_actions
from public.powerhouse_experiment_policies p
left join public.powerhouse_experiment_effect_estimates_v1 e on e.experiment_key=p.experiment_key;
alter view public.powerhouse_experiment_operating_dashboard_v1 set (security_invoker=true);
revoke all on table public.powerhouse_experiment_operating_dashboard_v1 from public,anon,authenticated;
grant select on table public.powerhouse_experiment_operating_dashboard_v1 to service_role;

create or replace function public.powerhouse_evidence_daily_maintenance_v1()
returns jsonb language plpgsql security definer set search_path = public, pg_catalog as $$
declare v_close jsonb; v_truth jsonb; v_health jsonb; r record; v_promotions jsonb:='[]'::jsonb; v_one jsonb;
begin
  v_close:=public.powerhouse_close_matured_no_response_v1();
  select to_jsonb(h) into v_health from public.powerhouse_experiment_evidence_health_v1 h;
  begin
    v_truth:=public.powerhouse_market_truth_daily_v1((now() at time zone 'Europe/Amsterdam')::date);
  exception when others then
    v_truth:=jsonb_build_object('error',sqlerrm);
  end;
  for r in select experiment_key from public.powerhouse_experiment_policies where status='active' loop
    begin
      v_one:=public.powerhouse_promote_policy_if_proven_v1(r.experiment_key);
    exception when others then
      v_one:=jsonb_build_object('promoted',false,'experiment_key',r.experiment_key,'error',sqlerrm);
    end;
    v_promotions:=v_promotions||jsonb_build_array(v_one);
  end loop;
  return jsonb_build_object('close',v_close,'health',v_health,'market_truth',v_truth,'promotion_checks',v_promotions,'ran_at',now());
end;$$;
revoke execute on function public.powerhouse_evidence_daily_maintenance_v1() from public,anon,authenticated;
grant execute on function public.powerhouse_evidence_daily_maintenance_v1() to service_role;

select cron.unschedule(jobid) from cron.job where jobname='powerhouse-evidence-maintenance-hourly-v1';
select cron.schedule('powerhouse-evidence-maintenance-hourly-v1','17 * * * *',$$select public.powerhouse_evidence_daily_maintenance_v1();$$);

comment on function public.powerhouse_guard_experiment_linked_action_v1() is 'Fail-closed action guard: experiment-linked sales actions require an existing prospective treatment assignment; holdout treatment is blocked.';
comment on function public.powerhouse_promote_policy_if_proven_v1(text) is 'Promotes a policy version only when sample floor, calibration actionability, positive observed uplift and clean contamination/collision gates are all satisfied.';
comment on view public.powerhouse_next_action_policy_authority_v1 is 'Single canonical read authority for policy versions allowed to influence Next Best Action. Empty means baseline/default behavior only.';
comment on view public.powerhouse_experiment_operating_dashboard_v1 is 'Human-readable experiment operating readback across policy, sample maturity, observed effect, contamination and NBA authority.';
