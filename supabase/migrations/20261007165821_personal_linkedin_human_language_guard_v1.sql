create or replace function public.powerhouse_guard_personal_linkedin_human_language_v1()
returns trigger
language plpgsql
set search_path = public, pg_catalog
as $$
begin
  if new.channel = 'linkedin_personal' and (
    new.body ~* '\m(runtime|heartbeat|workflow|pipeline|orchestration|readback|materializer|supabase|github|netlify|postgres(ql)?|database|sql|endpoint|deploy|commit|sha|idempotenc(y|ie)|lineage|source[_ -]?health|recovery[_ -]?due|evidence[_ -]?gap|architecture[_ -]?state|learning[_ -]?state|content[_ -]?loop)\M'
    or new.body ~* '\m[a-z][a-z0-9]*_[a-z0-9_]+\M'
  ) then
    raise exception using
      errcode = '23514',
      message = 'PERSONAL_LINKEDIN_TECHNICAL_JARGON_BLOCKED',
      detail = 'Arthur personal LinkedIn public copy must translate internal technical evidence into ordinary entrepreneur language.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_powerhouse_personal_linkedin_human_language_v1
on public.powerhouse_content_artifacts;

create trigger trg_powerhouse_personal_linkedin_human_language_v1
before insert or update of body, channel
on public.powerhouse_content_artifacts
for each row
execute function public.powerhouse_guard_personal_linkedin_human_language_v1();

comment on function public.powerhouse_guard_personal_linkedin_human_language_v1()
is 'Fail-closed public-copy gate for Arthur personal LinkedIn. Blocks internal technical system language so AI-native builder evidence is translated to human entrepreneur language before canonical content storage/publication.';
