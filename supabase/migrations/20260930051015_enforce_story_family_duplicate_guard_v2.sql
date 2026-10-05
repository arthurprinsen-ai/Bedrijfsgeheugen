create or replace function public.powerhouse_publication_story_family_guard_v2()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_candidate_keywords text[];
  v_other_keywords text[];
  v_intersection integer;
  v_candidate_count integer;
  v_other_count integer;
  v_overlap numeric;
  v_row public.powerhouse_publication_uniqueness_v1%rowtype;
begin
  if new.tenant_id <> 'canonical'
     or new.normalized_text is null
     or length(new.normalized_text) < 12 then
    return new;
  end if;

  v_candidate_keywords := public.powerhouse_publication_keywords_v1(new.normalized_text);
  v_candidate_count := coalesce(array_length(v_candidate_keywords,1),0);

  if v_candidate_count = 0 then
    return new;
  end if;

  for v_row in
    select *
    from public.powerhouse_publication_uniqueness_v1
    where tenant_id = new.tenant_id
      and normalized_text is not null
      and length(normalized_text) >= 12
      and reservation_key <> new.reservation_key
    order by publication_date desc nulls last, created_at desc
    limit 2000
  loop
    v_other_keywords := public.powerhouse_publication_keywords_v1(v_row.normalized_text);
    v_other_count := coalesce(array_length(v_other_keywords,1),0);
    if v_other_count = 0 then
      continue;
    end if;

    select count(*) into v_intersection
    from (
      select distinct unnest(v_candidate_keywords) as x
      intersect
      select distinct unnest(v_other_keywords) as x
    ) q;

    v_overlap := case
      when least(v_candidate_count,v_other_count)=0 then 0
      else v_intersection::numeric / least(v_candidate_count,v_other_count)::numeric
    end;

    if v_intersection >= 10 and v_overlap >= 0.30 then
      raise exception using
        errcode = 'P0001',
        message = 'STORY_FAMILY_DUPLICATE_BLOCKED',
        detail = jsonb_build_object(
          'matched_reservation_key',v_row.reservation_key,
          'matched_channel',v_row.channel,
          'matched_publication_date',v_row.publication_date,
          'shared_keywords',v_intersection,
          'overlap_coefficient',round(v_overlap,4),
          'guard','powerhouse-publication-story-family-guard-v2'
        )::text;
    end if;
  end loop;

  return new;
end;
$$;

drop trigger if exists trg_powerhouse_publication_story_family_guard_v2
on public.powerhouse_publication_uniqueness_v1;

create trigger trg_powerhouse_publication_story_family_guard_v2
before insert on public.powerhouse_publication_uniqueness_v1
for each row
execute function public.powerhouse_publication_story_family_guard_v2();
