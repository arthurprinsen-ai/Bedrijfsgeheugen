-- Powerhouse social historical story-family uniqueness v6
-- Canonical escaped-defect regression: personal LinkedIn car/sliding-door/airco story
-- 2026-09-24 vs 2026-09-30.

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
  if v_candidate_count = 0 then return new; end if;

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

    if v_intersection >= 10 and v_overlap >= 0.30 then
      raise exception using
        errcode='P0001',
        message='STORY_FAMILY_DUPLICATE_BLOCKED',
        detail=jsonb_build_object(
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

REVOKE EXECUTE ON FUNCTION public.powerhouse_publication_story_family_guard_v2() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.powerhouse_publication_story_family_guard_v2() TO service_role;

create or replace function public.powerhouse_reserve_unique_publication_v1(
  p_publication_date date,
  p_channel text,
  p_body text,
  p_similarity_threshold numeric default 0.62,
  p_story_fingerprint text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_norm text;
  v_raw_hash text;
  v_norm_hash text;
  v_key text;
  v_existing public.powerhouse_publication_uniqueness_v1%rowtype;
  v_row public.powerhouse_publication_uniqueness_v1%rowtype;
  v_candidate text[];
  v_other text[];
  v_keywords text[];
  v_other_keywords text[];
  v_intersection integer;
  v_union integer;
  v_similarity numeric;
  v_keyword_intersection integer;
  v_keyword_union integer;
  v_keyword_similarity numeric;
  v_keyword_overlap numeric;
  v_keyword_count integer;
  v_other_keyword_count integer;
  v_best_similarity numeric := 0;
  v_best_keyword_similarity numeric := 0;
  v_best_key text := null;
begin
  perform pg_advisory_xact_lock(hashtext('powerhouse-global-post-uniqueness-v1'));

  v_norm := public.powerhouse_normalize_publication_text_v1(p_body);
  if length(v_norm) < 12 then
    return jsonb_build_object('allowed',false,'reason','CONTENT_TOO_SHORT_FOR_UNIQUENESS');
  end if;

  v_raw_hash := encode(extensions.digest(trim(coalesce(p_body,'')),'sha256'),'hex');
  v_norm_hash := encode(extensions.digest(v_norm,'sha256'),'hex');
  v_key := 'claim:' || p_publication_date::text || ':' || p_channel;

  select * into v_existing
  from public.powerhouse_publication_uniqueness_v1
  where tenant_id='canonical' and reservation_key=v_key;

  if found then
    if v_existing.raw_hash=v_raw_hash
       and v_existing.normalized_hash=v_norm_hash
       and coalesce(v_existing.story_fingerprint,'')=coalesce(p_story_fingerprint,'') then
      return jsonb_build_object(
        'allowed',true,'reason','CLAIM_ALREADY_RESERVED_SAME_CONTENT',
        'reservation_key',v_key,'raw_hash',v_raw_hash,'normalized_hash',v_norm_hash,
        'story_fingerprint',p_story_fingerprint
      );
    end if;
    return jsonb_build_object(
      'allowed',false,'reason','CLAIM_ALREADY_RESERVED_DIFFERENT_CONTENT',
      'reservation_key',v_key,'matched_reservation_key',v_existing.reservation_key
    );
  end if;

  if nullif(trim(coalesce(p_story_fingerprint,'')),'') is not null then
    select * into v_row
    from public.powerhouse_publication_uniqueness_v1
    where tenant_id='canonical' and story_fingerprint=p_story_fingerprint
    order by created_at asc limit 1;
    if found then
      return jsonb_build_object(
        'allowed',false,'reason','STORY_FINGERPRINT_DUPLICATE',
        'matched_reservation_key',v_row.reservation_key,
        'matched_channel',v_row.channel,
        'matched_publication_date',v_row.publication_date,
        'story_fingerprint',p_story_fingerprint
      );
    end if;
  end if;

  select * into v_row
  from public.powerhouse_publication_uniqueness_v1
  where tenant_id='canonical' and (raw_hash=v_raw_hash or normalized_hash=v_norm_hash)
  order by created_at asc limit 1;
  if found then
    return jsonb_build_object(
      'allowed',false,'reason','EXACT_DUPLICATE',
      'matched_reservation_key',v_row.reservation_key,
      'matched_channel',v_row.channel,
      'matched_publication_date',v_row.publication_date,
      'raw_hash',v_raw_hash,'normalized_hash',v_norm_hash
    );
  end if;

  v_candidate := public.powerhouse_publication_shingles_v1(v_norm);
  v_keywords := public.powerhouse_publication_keywords_v1(v_norm);
  v_keyword_count := coalesce(array_length(v_keywords,1),0);

  for v_row in
    select *
    from public.powerhouse_publication_uniqueness_v1
    where tenant_id='canonical'
      and normalized_text is not null
      and length(normalized_text) >= 12
    order by publication_date desc nulls last, created_at desc
    limit 2000
  loop
    v_other := public.powerhouse_publication_shingles_v1(v_row.normalized_text);
    v_other_keywords := public.powerhouse_publication_keywords_v1(v_row.normalized_text);
    v_other_keyword_count := coalesce(array_length(v_other_keywords,1),0);

    if coalesce(array_length(v_candidate,1),0)>0 and coalesce(array_length(v_other,1),0)>0 then
      select count(*) into v_intersection
      from (
        select distinct unnest(v_candidate) as x
        intersect
        select distinct unnest(v_other) as x
      ) s;
      select count(*) into v_union
      from (
        select distinct unnest(v_candidate) as x
        union
        select distinct unnest(v_other) as x
      ) s;
      v_similarity := case when v_union=0 then 0 else v_intersection::numeric/v_union::numeric end;
      if v_similarity > v_best_similarity then
        v_best_similarity := v_similarity;
        v_best_key := v_row.reservation_key;
      end if;
      if v_similarity >= p_similarity_threshold then
        return jsonb_build_object(
          'allowed',false,'reason','NEAR_DUPLICATE',
          'similarity',round(v_similarity,4),
          'threshold',p_similarity_threshold,
          'matched_reservation_key',v_row.reservation_key,
          'matched_channel',v_row.channel,
          'matched_publication_date',v_row.publication_date
        );
      end if;
    end if;

    if v_keyword_count>0 and v_other_keyword_count>0 then
      select count(*) into v_keyword_intersection
      from (
        select distinct unnest(v_keywords) as x
        intersect
        select distinct unnest(v_other_keywords) as x
      ) s;
      select count(*) into v_keyword_union
      from (
        select distinct unnest(v_keywords) as x
        union
        select distinct unnest(v_other_keywords) as x
      ) s;
      v_keyword_similarity := case when v_keyword_union=0 then 0 else v_keyword_intersection::numeric/v_keyword_union::numeric end;
      v_keyword_overlap := case
        when least(v_keyword_count,v_other_keyword_count)=0 then 0
        else v_keyword_intersection::numeric/least(v_keyword_count,v_other_keyword_count)::numeric
      end;
      if v_keyword_similarity > v_best_keyword_similarity then
        v_best_keyword_similarity := v_keyword_similarity;
        v_best_key := v_row.reservation_key;
      end if;

      if (v_keyword_intersection >= 8 and v_keyword_similarity >= 0.30)
         or (v_keyword_intersection >= 10 and v_keyword_overlap >= 0.30) then
        return jsonb_build_object(
          'allowed',false,'reason','STORY_FAMILY_DUPLICATE',
          'keyword_similarity',round(v_keyword_similarity,4),
          'keyword_overlap',round(v_keyword_overlap,4),
          'shared_keywords',v_keyword_intersection,
          'jaccard_threshold',0.30,
          'overlap_threshold',0.30,
          'matched_reservation_key',v_row.reservation_key,
          'matched_channel',v_row.channel,
          'matched_publication_date',v_row.publication_date
        );
      end if;
    end if;
  end loop;

  insert into public.powerhouse_publication_uniqueness_v1(
    tenant_id,reservation_key,publication_date,channel,raw_hash,normalized_hash,
    normalized_text,story_fingerprint,source_kind,source_ref,state
  ) values (
    'canonical',v_key,p_publication_date,p_channel,v_raw_hash,v_norm_hash,
    v_norm,nullif(trim(coalesce(p_story_fingerprint,'')),''),
    'publication_claim',v_key,'reserved'
  );

  return jsonb_build_object(
    'allowed',true,'reason','UNIQUE_RESERVED',
    'reservation_key',v_key,'raw_hash',v_raw_hash,'normalized_hash',v_norm_hash,
    'story_fingerprint',p_story_fingerprint,
    'best_historical_similarity',round(v_best_similarity,4),
    'best_keyword_similarity',round(v_best_keyword_similarity,4),
    'best_historical_match',v_best_key
  );
end;
$$;

REVOKE EXECUTE ON FUNCTION public.powerhouse_reserve_unique_publication_v1(date,text,text,numeric,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.powerhouse_reserve_unique_publication_v1(date,text,text,numeric,text) TO service_role;
