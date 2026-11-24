CREATE OR REPLACE FUNCTION public.enforce_linkedin_personal_artifact_identity_gate_v3()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
declare
  e jsonb;
  truth_ok boolean;
  observational_ok boolean;
  builder_ok boolean;
begin
  -- Preserve the original identity gate and decode only losslessly serialized JSON objects.
  if new.channel='linkedin_personal' and jsonb_typeof(new.generation_evidence)='string'
     and pg_input_is_valid(new.generation_evidence#>>'{}','jsonb') then
    if jsonb_typeof((new.generation_evidence#>>'{}')::jsonb)='object' then
      new.generation_evidence := (new.generation_evidence#>>'{}')::jsonb;
    end if;
  end if;
  if new.channel='linkedin_personal'
     and new.status in ('scheduled','published','measured','learned') then
    e := case
      when jsonb_typeof(public.powerhouse_jsonb_object_v1(new.generation_evidence)->'identity_gate_evidence')='object'
        then public.powerhouse_jsonb_object_v1(new.generation_evidence)->'identity_gate_evidence'
      else public.powerhouse_jsonb_object_v1(new.generation_evidence)
    end;

    truth_ok :=
      public.powerhouse_jsonb_true(e,'personal_truth_verified') is true
      and public.powerhouse_jsonb_true(e,'arthur_anchor_verified') is true
      and public.powerhouse_jsonb_true(e,'first_person_claims_verified') is true
      and public.powerhouse_jsonb_true(e,'concrete_personal_anchor') is true
      and coalesce(e->>'identity_gate_result','PASS')='PASS';

    observational_ok :=
      public.powerhouse_jsonb_true(e,'observational_personal_theme_verified') is true
      and public.powerhouse_jsonb_true(e,'public_theme_source_verified') is true
      and coalesce((e->>'first_person_claims_present')::boolean,true)=false
      and public.powerhouse_jsonb_true(e,'personal_life_topic') is true
      and coalesce((e->>'business_topic')::boolean,false)=false;

    builder_ok :=
      public.powerhouse_jsonb_true(e,'ai_native_builder_story_verified') is true
      and coalesce(e->>'ai_native_builder_policy','')='personal-linkedin-ai-native-builder-v1'
      and public.powerhouse_jsonb_true(e,'build_event_verified') is true
      and public.powerhouse_jsonb_true(e,'arthur_anchor_verified') is true
      and coalesce((e->>'business_topic')::boolean,false)=true
      and coalesce((e->>'first_person_claims_present')::boolean,false)=true
      and jsonb_typeof(e->'source_lineage')='array'
      and jsonb_array_length(e->'source_lineage')>0;

    if coalesce((e->>'corporate_style')::boolean,false)=true
       or coalesce((e->>'corporate_voice')::boolean,false)=true
       or coalesce((e->>'company_page_interchangeable')::boolean,false)=true
       or not (truth_ok or observational_ok or builder_ok) then
      raise exception using
        errcode='P0001',
        message='LINKEDIN_PERSONAL_IDENTITY_GATE_BLOCKED: verified personal truth, verified observational personal-life source, or verified AI-native builder-event lineage required before scheduling/publishing';
    end if;
  end if;
  return new;
end;
$function$
;
update public.powerhouse_content_artifacts
set generation_evidence = (generation_evidence#>>'{}')::jsonb
where channel='linkedin_personal' and jsonb_typeof(generation_evidence)='string'
and case when pg_input_is_valid(generation_evidence#>>'{}','jsonb') then jsonb_typeof((generation_evidence#>>'{}')::jsonb)='object' else false end;;
