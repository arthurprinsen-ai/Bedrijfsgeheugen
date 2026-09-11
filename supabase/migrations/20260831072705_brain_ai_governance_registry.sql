create table if not exists public.brain_ai_governance_registry (
  tenant_id text not null,
  use_case_id text not null,
  name text not null,
  provider text not null,
  model_id text not null,
  model_revision text,
  purpose text not null,
  owner_id text not null,
  lifecycle_status text not null default 'DRAFT' check (lifecycle_status in ('DRAFT','ASSESSING','APPROVED','ACTIVE','SUSPENDED','RETIRED')),
  risk_class text not null default 'UNCLASSIFIED' check (risk_class in ('UNCLASSIFIED','MINIMAL','LIMITED','HIGH','PROHIBITED')),
  human_oversight text not null,
  data_categories text[] not null default '{}',
  prohibited_data_categories text[] not null default '{}',
  retention_policy text,
  transparency_required boolean not null default false,
  impact_assessment_required boolean not null default false,
  approved boolean not null default false,
  approval_evidence_ids text[] not null default '{}',
  evidence_ids text[] not null default '{}',
  last_reviewed_at timestamptz,
  next_review_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (tenant_id,use_case_id),
  constraint brain_ai_governance_identity check (length(btrim(tenant_id))>0 and length(btrim(use_case_id))>0 and length(btrim(name))>0),
  constraint brain_ai_governance_active_requires_approval check (lifecycle_status <> 'ACTIVE' or (approved=true and coalesce(array_length(approval_evidence_ids,1),0)>0)),
  constraint brain_ai_governance_prohibited_never_active check (risk_class <> 'PROHIBITED' or lifecycle_status <> 'ACTIVE')
);
create index if not exists brain_ai_governance_review_idx on public.brain_ai_governance_registry (tenant_id,lifecycle_status,next_review_at);
create index if not exists brain_ai_governance_model_idx on public.brain_ai_governance_registry (tenant_id,provider,model_id,model_revision);
alter table public.brain_ai_governance_registry enable row level security;
revoke all on table public.brain_ai_governance_registry from public,anon,authenticated,service_role;
grant select,insert,update on table public.brain_ai_governance_registry to service_role;

create table if not exists public.brain_ai_governance_incidents (
  tenant_id text not null,
  incident_id text not null,
  use_case_id text not null,
  severity text not null check (severity in ('LOW','MEDIUM','HIGH','CRITICAL')),
  status text not null default 'OPEN' check (status in ('OPEN','CONTAINED','RESOLVED','ACCEPTED')),
  observed_at timestamptz not null,
  summary text not null,
  evidence_ids text[] not null default '{}',
  resolution text,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (tenant_id,incident_id),
  foreign key (tenant_id,use_case_id) references public.brain_ai_governance_registry(tenant_id,use_case_id) on delete restrict
);
create index if not exists brain_ai_governance_incidents_open_idx on public.brain_ai_governance_incidents (tenant_id,status,severity,observed_at desc);
alter table public.brain_ai_governance_incidents enable row level security;
revoke all on table public.brain_ai_governance_incidents from public,anon,authenticated,service_role;
grant select,insert,update on table public.brain_ai_governance_incidents to service_role;

create or replace function public.brain_register_ai_use_case(
  p_tenant_id text,p_use_case_id text,p_name text,p_provider text,p_model_id text,p_model_revision text,p_purpose text,p_owner_id text,p_risk_class text,p_human_oversight text,p_data_categories text[],p_prohibited_data_categories text[],p_retention_policy text,p_transparency_required boolean,p_impact_assessment_required boolean,p_evidence_ids text[]
) returns public.brain_ai_governance_registry language plpgsql security invoker set search_path=public as $$
declare v_row public.brain_ai_governance_registry;
begin
  insert into public.brain_ai_governance_registry(tenant_id,use_case_id,name,provider,model_id,model_revision,purpose,owner_id,risk_class,human_oversight,data_categories,prohibited_data_categories,retention_policy,transparency_required,impact_assessment_required,evidence_ids)
  values(p_tenant_id,p_use_case_id,p_name,p_provider,p_model_id,p_model_revision,p_purpose,p_owner_id,upper(coalesce(p_risk_class,'UNCLASSIFIED')),p_human_oversight,coalesce(p_data_categories,'{}'),coalesce(p_prohibited_data_categories,'{}'),p_retention_policy,coalesce(p_transparency_required,false),coalesce(p_impact_assessment_required,false),coalesce(p_evidence_ids,'{}'))
  on conflict (tenant_id,use_case_id) do update set name=excluded.name,provider=excluded.provider,model_id=excluded.model_id,model_revision=excluded.model_revision,purpose=excluded.purpose,owner_id=excluded.owner_id,risk_class=excluded.risk_class,human_oversight=excluded.human_oversight,data_categories=excluded.data_categories,prohibited_data_categories=excluded.prohibited_data_categories,retention_policy=excluded.retention_policy,transparency_required=excluded.transparency_required,impact_assessment_required=excluded.impact_assessment_required,evidence_ids=excluded.evidence_ids,updated_at=now()
  returning * into v_row;
  return v_row;
end; $$;
revoke all on function public.brain_register_ai_use_case(text,text,text,text,text,text,text,text,text,text,text[],text[],text,boolean,boolean,text[]) from public,anon,authenticated;
grant execute on function public.brain_register_ai_use_case(text,text,text,text,text,text,text,text,text,text,text[],text[],text,boolean,boolean,text[]) to service_role;
