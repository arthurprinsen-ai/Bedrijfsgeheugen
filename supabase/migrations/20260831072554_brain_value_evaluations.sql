create table if not exists public.brain_value_evaluations (
  tenant_id text not null,
  outcome_id text not null,
  horizon_days integer not null check (horizon_days in (30,90,180)),
  due_at timestamptz not null,
  status text not null default 'PENDING' check (status in ('PENDING','DUE','COMPLETED','FAILED','CANCELLED')),
  result jsonb,
  evidence_ids text[] not null default '{}',
  verified boolean not null default false,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (tenant_id,outcome_id,horizon_days)
);
create index if not exists brain_value_evaluations_due_idx on public.brain_value_evaluations (tenant_id,status,due_at);
alter table public.brain_value_evaluations enable row level security;
revoke all on table public.brain_value_evaluations from public,anon,authenticated,service_role;
grant select,insert,update on table public.brain_value_evaluations to service_role;

create or replace function public.brain_schedule_value_evaluations(p_tenant_id text,p_outcome_id text,p_observed_at timestamptz)
returns setof public.brain_value_evaluations
language plpgsql security invoker set search_path=public as $$
begin
  if nullif(btrim(p_tenant_id),'') is null or nullif(btrim(p_outcome_id),'') is null or p_observed_at is null then raise exception 'VALIDATION_ERROR'; end if;
  insert into public.brain_value_evaluations(tenant_id,outcome_id,horizon_days,due_at)
  values
    (p_tenant_id,p_outcome_id,30,p_observed_at+interval '30 days'),
    (p_tenant_id,p_outcome_id,90,p_observed_at+interval '90 days'),
    (p_tenant_id,p_outcome_id,180,p_observed_at+interval '180 days')
  on conflict (tenant_id,outcome_id,horizon_days) do nothing;
  return query select * from public.brain_value_evaluations where tenant_id=p_tenant_id and outcome_id=p_outcome_id order by horizon_days;
end; $$;
revoke all on function public.brain_schedule_value_evaluations(text,text,timestamptz) from public,anon,authenticated;
grant execute on function public.brain_schedule_value_evaluations(text,text,timestamptz) to service_role;

create or replace function public.brain_complete_value_evaluation(p_tenant_id text,p_outcome_id text,p_horizon_days integer,p_result jsonb,p_evidence_ids text[])
returns public.brain_value_evaluations
language plpgsql security invoker set search_path=public as $$
declare v_row public.brain_value_evaluations;
begin
  if p_horizon_days not in (30,90,180) or coalesce(array_length(p_evidence_ids,1),0)=0 then raise exception 'VERIFICATION_EVIDENCE_REQUIRED'; end if;
  update public.brain_value_evaluations set status='COMPLETED',result=p_result,evidence_ids=p_evidence_ids,verified=true,verified_at=now(),updated_at=now()
   where tenant_id=p_tenant_id and outcome_id=p_outcome_id and horizon_days=p_horizon_days
   returning * into v_row;
  if not found then raise exception 'VALUE_EVALUATION_NOT_FOUND'; end if;
  return v_row;
end; $$;
revoke all on function public.brain_complete_value_evaluation(text,text,integer,jsonb,text[]) from public,anon,authenticated;
grant execute on function public.brain_complete_value_evaluation(text,text,integer,jsonb,text[]) to service_role;
