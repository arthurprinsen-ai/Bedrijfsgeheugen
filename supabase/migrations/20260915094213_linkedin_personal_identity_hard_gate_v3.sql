create or replace function enforce_linkedin_personal_artifact_identity_gate_v3()
returns trigger
language plpgsql
as $$
begin
  if new.channel = 'linkedin_personal'
     and new.status in ('scheduled','published','measured','learned') then
    if coalesce(new.generation_evidence->>'identity_gate_result','') <> 'PASS'
       or coalesce((new.generation_evidence->>'concrete_personal_anchor')::boolean,false) is not true
       or coalesce((new.generation_evidence->>'corporate_style')::boolean,true) is not false then
      raise exception using
        errcode = 'P0001',
        message = 'LINKEDIN_PERSONAL_IDENTITY_GATE_BLOCKED: PASS + concrete_personal_anchor=true + corporate_style=false required before scheduling/publishing';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_linkedin_personal_artifact_identity_gate_v3 on powerhouse_content_artifacts;
create trigger trg_linkedin_personal_artifact_identity_gate_v3
before insert or update on powerhouse_content_artifacts
for each row
execute function enforce_linkedin_personal_artifact_identity_gate_v3();

create or replace function enforce_linkedin_personal_obligation_identity_gate_v3()
returns trigger
language plpgsql
as $$
declare
  gate_ok boolean;
begin
  if new.channel = 'linkedin_personal'
     and new.status in ('DISPATCHED','PUBLISHED','LIVE_PROVEN','MEASURED','LEARNED') then
    select exists (
      select 1
      from powerhouse_content_artifacts a
      where a.run_date = new.publication_date
        and a.channel = 'linkedin_personal'
        and a.artifact_type = 'linkedin_post'
        and a.status not in ('blocked','failed')
        and coalesce(a.generation_evidence->>'identity_gate_result','') = 'PASS'
        and coalesce((a.generation_evidence->>'concrete_personal_anchor')::boolean,false) is true
        and coalesce((a.generation_evidence->>'corporate_style')::boolean,true) is false
    ) into gate_ok;

    if not coalesce(gate_ok,false) then
      raise exception using
        errcode = 'P0001',
        message = 'LINKEDIN_PERSONAL_DISPATCH_BLOCKED: no identity-gate PASS artifact with concrete personal anchor and non-corporate style';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_linkedin_personal_obligation_identity_gate_v3 on content_publication_obligations;
create trigger trg_linkedin_personal_obligation_identity_gate_v3
before insert or update on content_publication_obligations
for each row
execute function enforce_linkedin_personal_obligation_identity_gate_v3();
