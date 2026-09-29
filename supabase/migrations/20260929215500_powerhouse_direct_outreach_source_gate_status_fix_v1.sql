-- Keep direct-outreach fail-closed behavior inside the existing status enum.
create or replace function public.powerhouse_require_source_for_direct_outreach_v1()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare c text:=lower(coalesce(new.channel,''));
declare has_source boolean;
begin
  if c in ('email','e-mail','linkedin dm','linkedin_dm') then
    has_source :=
      coalesce(nullif(new.source_url,''),'') <> ''
      or coalesce(nullif(new.opportunity_key,''),'') <> ''
      or coalesce(nullif(new.subject_key,''),'') <> ''
      or coalesce(new.evidence,'{}'::jsonb) ? 'source_lineage'
      or coalesce(new.evidence,'{}'::jsonb) ? 'source_ref'
      or coalesce(new.evidence,'{}'::jsonb) ? 'predictive_signal_id';

    if not has_source or (coalesce(new.person_key,'')='' and coalesce(new.company_key,'')='') then
      if new.status in ('suggested','prepared','waiting') then new.status:='skipped'; end if;
      new.evidence:=coalesce(new.evidence,'{}'::jsonb)||jsonb_build_object(
        'source_gate','FAIL',
        'source_gate_contract','powerhouse-source-backed-all-channels-v1',
        'source_gate_reason',case when not has_source then 'NO_TRACEABLE_SOURCE_OR_TRIGGER' else 'NO_PERSON_OR_COMPANY_CONTEXT' end,
        'send_forbidden',true
      );
    else
      new.evidence:=coalesce(new.evidence,'{}'::jsonb)||jsonb_build_object(
        'source_gate','PASS',
        'source_gate_contract','powerhouse-source-backed-all-channels-v1',
        'send_forbidden',false
      );
    end if;
  end if;
  return new;
end $$;

revoke execute on function public.powerhouse_require_source_for_direct_outreach_v1() from public, anon, authenticated;
grant execute on function public.powerhouse_require_source_for_direct_outreach_v1() to service_role;
