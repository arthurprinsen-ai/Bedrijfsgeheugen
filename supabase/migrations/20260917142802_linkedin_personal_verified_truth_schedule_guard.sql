create or replace function public.enforce_linkedin_personal_artifact_identity_gate_v3()
returns trigger
language plpgsql
set search_path = public, pg_catalog
as $$
declare
  e jsonb;
begin
  if new.channel = 'linkedin_personal'
     and new.status in ('scheduled','published','measured','learned') then
    e := case
      when jsonb_typeof(new.generation_evidence->'identity_gate_evidence') = 'object'
        then new.generation_evidence->'identity_gate_evidence'
      else coalesce(new.generation_evidence,'{}'::jsonb)
    end;
    if coalesce(e->>'identity_gate_result','') <> 'PASS'
       or public.powerhouse_jsonb_true(e,'concrete_personal_anchor') is not true
       or coalesce((e->>'corporate_style')::boolean,true) is not false
       or public.powerhouse_jsonb_true(e,'personal_truth_verified') is not true then
      raise exception using
        errcode = 'P0001',
        message = 'LINKEDIN_PERSONAL_IDENTITY_GATE_BLOCKED: verified personal truth + PASS + concrete anchor + non-corporate style required before scheduling/publishing';
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.enforce_linkedin_personal_obligation_identity_gate_v3()
returns trigger
language plpgsql
set search_path = public, pg_catalog
as $$
declare
  gate_ok boolean;
begin
  if new.channel = 'linkedin_personal'
     and new.status in ('DISPATCHED','PUBLISHED','LIVE_PROVEN','MEASURED','LEARNED') then
    select exists (
      select 1
      from public.powerhouse_content_artifacts a
      cross join lateral (
        select case
          when jsonb_typeof(a.generation_evidence->'identity_gate_evidence') = 'object'
            then a.generation_evidence->'identity_gate_evidence'
          else coalesce(a.generation_evidence,'{}'::jsonb)
        end as e
      ) g
      where a.run_date = new.publication_date
        and a.channel = 'linkedin_personal'
        and a.artifact_type = 'linkedin_post'
        and a.status not in ('blocked','failed')
        and coalesce(g.e->>'identity_gate_result','') = 'PASS'
        and public.powerhouse_jsonb_true(g.e,'concrete_personal_anchor') is true
        and coalesce((g.e->>'corporate_style')::boolean,true) is false
        and public.powerhouse_jsonb_true(g.e,'personal_truth_verified') is true
    ) into gate_ok;

    if not coalesce(gate_ok,false) then
      raise exception using
        errcode = 'P0001',
        message = 'LINKEDIN_PERSONAL_DISPATCH_BLOCKED: no artifact with explicitly verified personal truth and identity-gate PASS';
    end if;
  end if;
  return new;
end;
$$;
