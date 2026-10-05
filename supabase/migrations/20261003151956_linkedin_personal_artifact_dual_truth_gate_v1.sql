create or replace function public.enforce_linkedin_personal_artifact_identity_gate_v3()
returns trigger
language plpgsql
set search_path to 'public','pg_catalog'
as $function$
declare
  e jsonb;
  truth_ok boolean;
  observational_ok boolean;
begin
  if new.channel = 'linkedin_personal'
     and new.status in ('scheduled','published','measured','learned') then
    e := case
      when jsonb_typeof(new.generation_evidence->'identity_gate_evidence') = 'object'
        then new.generation_evidence->'identity_gate_evidence'
      else coalesce(new.generation_evidence,'{}'::jsonb)
    end;

    truth_ok :=
      public.powerhouse_jsonb_true(e,'personal_truth_verified') is true
      and public.powerhouse_jsonb_true(e,'arthur_anchor_verified') is true
      and public.powerhouse_jsonb_true(e,'first_person_claims_verified') is true
      and public.powerhouse_jsonb_true(e,'concrete_personal_anchor') is true
      and coalesce(e->>'identity_gate_result','PASS') = 'PASS';

    observational_ok :=
      public.powerhouse_jsonb_true(e,'observational_personal_theme_verified') is true
      and public.powerhouse_jsonb_true(e,'public_theme_source_verified') is true
      and coalesce((e->>'first_person_claims_present')::boolean,true) is false
      and public.powerhouse_jsonb_true(e,'personal_life_topic') is true
      and coalesce((e->>'business_topic')::boolean,false) is false;

    if coalesce((e->>'corporate_style')::boolean,false) is true
       or coalesce((e->>'corporate_voice')::boolean,false) is true
       or not (truth_ok or observational_ok) then
      raise exception using
        errcode = 'P0001',
        message = 'LINKEDIN_PERSONAL_IDENTITY_GATE_BLOCKED: verified personal truth or verified observational personal-life source required before scheduling/publishing';
    end if;
  end if;
  return new;
end;
$function$;
