-- Powerhouse user-reported social duplicate negative-evidence guard v7
-- Adds a durable retired story-family registry and DB trigger backstop.

create table if not exists public.powerhouse_retired_story_families_v1 (
  tenant_id text not null default 'canonical',
  family_key text not null,
  channel_scope text not null default 'all_social',
  normalized_example text not null,
  reason text not null,
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  primary key (tenant_id, family_key)
);

alter table public.powerhouse_retired_story_families_v1 enable row level security;

revoke all on table public.powerhouse_retired_story_families_v1 from public, anon, authenticated;
grant select, insert, update on table public.powerhouse_retired_story_families_v1 to service_role;

create or replace function public.powerhouse_retired_story_family_guard_v1()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_candidate_keywords text[];
  v_other_keywords text[];
  v_candidate_count integer;
  v_other_count integer;
  v_intersection integer;
  v_overlap numeric;
  v_row public.powerhouse_retired_story_families_v1%rowtype;
begin
  if new.tenant_id <> 'canonical'
     or new.normalized_text is null
     or length(new.normalized_text) < 12 then
    return new;
  end if;

  v_candidate_keywords := public.powerhouse_publication_keywords_v1(new.normalized_text);
  v_candidate_count := coalesce(array_length(v_candidate_keywords,1),0);
  if v_candidate_count = 0 then return new; end if;

  for v_row in
    select *
    from public.powerhouse_retired_story_families_v1
    where tenant_id = new.tenant_id
      and channel_scope in ('all_social', new.channel)
  loop
    v_other_keywords := public.powerhouse_publication_keywords_v1(v_row.normalized_example);
    v_other_count := coalesce(array_length(v_other_keywords,1),0);
    if v_other_count = 0 then continue; end if;

    select count(*) into v_intersection
    from (
      select distinct unnest(v_candidate_keywords) as x
      intersect
      select distinct unnest(v_other_keywords) as x
    ) q;

    v_overlap := case
      when least(v_candidate_count,v_other_count)=0 then 0
      else v_intersection::numeric/least(v_candidate_count,v_other_count)::numeric
    end;

    if (v_intersection >= 5 and v_overlap >= 0.25)
       or (v_intersection >= 8) then
      raise exception using
        errcode='P0001',
        message='RETIRED_STORY_FAMILY_DUPLICATE_BLOCKED',
        detail=jsonb_build_object(
          'family_key',v_row.family_key,
          'channel_scope',v_row.channel_scope,
          'shared_keywords',v_intersection,
          'overlap_coefficient',round(v_overlap,4),
          'guard','powerhouse-retired-story-family-guard-v1'
        )::text;
    end if;
  end loop;
  return new;
end;
$$;

drop trigger if exists trg_powerhouse_retired_story_family_guard_v1
on public.powerhouse_publication_uniqueness_v1;

create trigger trg_powerhouse_retired_story_family_guard_v1
before insert on public.powerhouse_publication_uniqueness_v1
for each row
execute function public.powerhouse_retired_story_family_guard_v1();

revoke execute on function public.powerhouse_retired_story_family_guard_v1() from public, anon, authenticated;
grant execute on function public.powerhouse_retired_story_family_guard_v1() to service_role;

insert into public.powerhouse_retired_story_families_v1(
  tenant_id,family_key,channel_scope,normalized_example,reason,evidence
) values (
  'canonical',
  'personal_bat_on_sidewalk',
  'linkedin_personal',
  public.powerhouse_normalize_publication_text_v1(
    'Ik liep over straat en zag midden op de dag een vleermuis op het trottoir. Ik stopte, keek of het dier nog leefde, twijfelde of ik het moest aanraken of iemand moest bellen, liep uiteindelijk door en keek nog een keer om.'
  ),
  'USER_REPORTED_DUPLICATE',
  jsonb_build_object(
    'reported_at','2026-10-02',
    'source','user_feedback',
    'rule','user-reported duplicate retires the underlying story family permanently'
  )
)
on conflict (tenant_id,family_key) do update
set normalized_example=excluded.normalized_example,
    reason=excluded.reason,
    evidence=excluded.evidence;
