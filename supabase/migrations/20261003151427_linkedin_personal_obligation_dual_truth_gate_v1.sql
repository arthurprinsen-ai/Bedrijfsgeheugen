create or replace function public.enforce_linkedin_personal_obligation_identity_gate_v3()
returns trigger
language plpgsql
set search_path to 'public','pg_catalog'
as $function$
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
        and coalesce((g.e->>'corporate_style')::boolean,false) is false
        and coalesce((g.e->>'corporate_voice')::boolean,false) is false
        and coalesce((g.e->>'business_topic')::boolean,false) is false
        and public.powerhouse_jsonb_true(g.e,'personal_life_topic') is true
        and (
          (
            public.powerhouse_jsonb_true(g.e,'personal_truth_verified') is true
            and public.powerhouse_jsonb_true(g.e,'arthur_anchor_verified') is true
            and public.powerhouse_jsonb_true(g.e,'first_person_claims_verified') is true
          )
          or
          (
            public.powerhouse_jsonb_true(g.e,'observational_personal_theme_verified') is true
            and public.powerhouse_jsonb_true(g.e,'public_theme_source_verified') is true
            and coalesce((g.e->>'first_person_claims_present')::boolean,true) is false
          )
        )
    ) into gate_ok;

    if not coalesce(gate_ok,false) then
      raise exception using
        errcode = 'P0001',
        message = 'LINKEDIN_PERSONAL_DISPATCH_BLOCKED: no artifact with verified personal truth or verified observational personal-life source';
    end if;
  end if;
  return new;
end;
$function$;
