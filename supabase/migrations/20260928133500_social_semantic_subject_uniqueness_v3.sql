-- Semantic subject/example uniqueness hardening.
-- Fingerprint: powerhouse-social-semantic-subject-uniqueness-v3
-- Extends v1/v2 with a cross-channel distinctive-anchor gate so a concrete anecdote
-- (for example a printer incident) cannot return under different wording.

CREATE OR REPLACE FUNCTION public.powerhouse_publication_distinctive_keywords_v1(p_text text)
RETURNS text[]
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT coalesce(array_agg(DISTINCT w ORDER BY w), ARRAY[]::text[])
  FROM unnest(public.powerhouse_publication_keywords_v1(p_text)) AS w
  WHERE length(w) >= 6
    AND w NOT IN (
      'familie','kinderen','school','hockey','sporten','vakantie','weekend','tuinen','tuinieren',
      'werken','bedrijf','bedrijven','klanten','mensen','collega','collegas','thuis','telefoon',
      'mobiel','auto','autos','reizen','reizen','ouders','vader','moeder','dochter','zonen',
      'dagelijks','persoonlijk','ervaring','ervaringen','probleem','problemen','oplossing','oplossingen'
    );
$$;

CREATE OR REPLACE FUNCTION public.powerhouse_reserve_unique_publication_v1(
  p_publication_date date,
  p_channel text,
  p_body text,
  p_similarity_threshold numeric DEFAULT 0.62,
  p_story_fingerprint text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_norm text;
  v_raw_hash text;
  v_norm_hash text;
  v_key text;
  v_existing public.powerhouse_publication_uniqueness_v1%ROWTYPE;
  v_row public.powerhouse_publication_uniqueness_v1%ROWTYPE;
  v_candidate text[];
  v_other text[];
  v_keywords text[];
  v_other_keywords text[];
  v_distinctive text[];
  v_other_distinctive text[];
  v_intersection integer;
  v_union integer;
  v_similarity numeric;
  v_keyword_intersection integer;
  v_keyword_union integer;
  v_keyword_similarity numeric;
  v_distinctive_intersection integer;
  v_distinctive_anchor text;
  v_best_similarity numeric := 0;
  v_best_keyword_similarity numeric := 0;
  v_best_key text := null;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('powerhouse-global-post-uniqueness-v1'));

  v_norm := public.powerhouse_normalize_publication_text_v1(p_body);
  IF length(v_norm) < 12 THEN
    RETURN jsonb_build_object('allowed',false,'reason','CONTENT_TOO_SHORT_FOR_UNIQUENESS');
  END IF;

  v_raw_hash := encode(extensions.digest(trim(coalesce(p_body,'')),'sha256'),'hex');
  v_norm_hash := encode(extensions.digest(v_norm,'sha256'),'hex');
  v_key := 'claim:' || p_publication_date::text || ':' || p_channel;

  SELECT * INTO v_existing
  FROM public.powerhouse_publication_uniqueness_v1
  WHERE tenant_id='canonical' AND reservation_key=v_key;

  IF FOUND THEN
    IF v_existing.raw_hash=v_raw_hash
       AND v_existing.normalized_hash=v_norm_hash
       AND coalesce(v_existing.story_fingerprint,'')=coalesce(p_story_fingerprint,'') THEN
      RETURN jsonb_build_object(
        'allowed',true,'reason','CLAIM_ALREADY_RESERVED_SAME_CONTENT',
        'reservation_key',v_key,'raw_hash',v_raw_hash,'normalized_hash',v_norm_hash,
        'story_fingerprint',p_story_fingerprint
      );
    END IF;
    RETURN jsonb_build_object(
      'allowed',false,'reason','CLAIM_ALREADY_RESERVED_DIFFERENT_CONTENT',
      'reservation_key',v_key,'matched_reservation_key',v_existing.reservation_key
    );
  END IF;

  IF nullif(trim(coalesce(p_story_fingerprint,'')),'') IS NOT NULL THEN
    SELECT * INTO v_row
    FROM public.powerhouse_publication_uniqueness_v1
    WHERE tenant_id='canonical'
      AND story_fingerprint=p_story_fingerprint
    ORDER BY created_at ASC
    LIMIT 1;

    IF FOUND THEN
      RETURN jsonb_build_object(
        'allowed',false,'reason','STORY_FINGERPRINT_DUPLICATE',
        'matched_reservation_key',v_row.reservation_key,
        'matched_channel',v_row.channel,
        'matched_publication_date',v_row.publication_date,
        'story_fingerprint',p_story_fingerprint
      );
    END IF;
  END IF;

  SELECT * INTO v_row
  FROM public.powerhouse_publication_uniqueness_v1
  WHERE tenant_id='canonical'
    AND (raw_hash=v_raw_hash OR normalized_hash=v_norm_hash)
  ORDER BY created_at ASC
  LIMIT 1;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'allowed',false,'reason','EXACT_DUPLICATE',
      'matched_reservation_key',v_row.reservation_key,
      'matched_channel',v_row.channel,
      'matched_publication_date',v_row.publication_date,
      'raw_hash',v_raw_hash,'normalized_hash',v_norm_hash
    );
  END IF;

  v_candidate := public.powerhouse_publication_shingles_v1(v_norm);
  v_keywords := public.powerhouse_publication_keywords_v1(v_norm);
  v_distinctive := public.powerhouse_publication_distinctive_keywords_v1(v_norm);

  FOR v_row IN
    SELECT *
    FROM public.powerhouse_publication_uniqueness_v1
    WHERE tenant_id='canonical'
      AND normalized_text IS NOT NULL
      AND length(normalized_text) >= 12
    ORDER BY publication_date DESC NULLS LAST, created_at DESC
    LIMIT 2500
  LOOP
    v_other := public.powerhouse_publication_shingles_v1(v_row.normalized_text);
    v_other_keywords := public.powerhouse_publication_keywords_v1(v_row.normalized_text);
    v_other_distinctive := public.powerhouse_publication_distinctive_keywords_v1(v_row.normalized_text);

    IF coalesce(array_length(v_candidate,1),0) > 0 AND coalesce(array_length(v_other,1),0) > 0 THEN
      SELECT count(*) INTO v_intersection
      FROM (SELECT DISTINCT unnest(v_candidate) AS x INTERSECT SELECT DISTINCT unnest(v_other) AS x) s;
      SELECT count(*) INTO v_union
      FROM (SELECT DISTINCT unnest(v_candidate) AS x UNION SELECT DISTINCT unnest(v_other) AS x) s;
      v_similarity := CASE WHEN v_union=0 THEN 0 ELSE v_intersection::numeric/v_union::numeric END;
      IF v_similarity > v_best_similarity THEN
        v_best_similarity := v_similarity;
        v_best_key := v_row.reservation_key;
      END IF;
      IF v_similarity >= p_similarity_threshold THEN
        RETURN jsonb_build_object(
          'allowed',false,'reason','NEAR_DUPLICATE','similarity',round(v_similarity,4),
          'threshold',p_similarity_threshold,'matched_reservation_key',v_row.reservation_key,
          'matched_channel',v_row.channel,'matched_publication_date',v_row.publication_date
        );
      END IF;
    END IF;

    IF coalesce(array_length(v_keywords,1),0) > 0 AND coalesce(array_length(v_other_keywords,1),0) > 0 THEN
      SELECT count(*) INTO v_keyword_intersection
      FROM (SELECT DISTINCT unnest(v_keywords) AS x INTERSECT SELECT DISTINCT unnest(v_other_keywords) AS x) s;
      SELECT count(*) INTO v_keyword_union
      FROM (SELECT DISTINCT unnest(v_keywords) AS x UNION SELECT DISTINCT unnest(v_other_keywords) AS x) s;
      v_keyword_similarity := CASE WHEN v_keyword_union=0 THEN 0 ELSE v_keyword_intersection::numeric/v_keyword_union::numeric END;
      IF v_keyword_similarity > v_best_keyword_similarity THEN
        v_best_keyword_similarity := v_keyword_similarity;
        v_best_key := v_row.reservation_key;
      END IF;
      IF v_keyword_intersection >= 8 AND v_keyword_similarity >= 0.30 THEN
        RETURN jsonb_build_object(
          'allowed',false,'reason','STORY_KEYWORD_DUPLICATE','keyword_similarity',round(v_keyword_similarity,4),
          'shared_keywords',v_keyword_intersection,'keyword_threshold',0.30,
          'matched_reservation_key',v_row.reservation_key,'matched_channel',v_row.channel,
          'matched_publication_date',v_row.publication_date
        );
      END IF;
    END IF;

    IF coalesce(array_length(v_distinctive,1),0) > 0 AND coalesce(array_length(v_other_distinctive,1),0) > 0 THEN
      SELECT count(*), min(x) INTO v_distinctive_intersection, v_distinctive_anchor
      FROM (
        SELECT DISTINCT unnest(v_distinctive) AS x
        INTERSECT
        SELECT DISTINCT unnest(v_other_distinctive) AS x
      ) s;

      IF coalesce(v_distinctive_intersection,0) >= 2
         OR (coalesce(v_distinctive_intersection,0) = 1 AND length(coalesce(v_distinctive_anchor,'')) >= 7) THEN
        RETURN jsonb_build_object(
          'allowed',false,'reason','SEMANTIC_SUBJECT_DUPLICATE',
          'shared_distinctive_anchors',v_distinctive_intersection,
          'representative_anchor',v_distinctive_anchor,
          'matched_reservation_key',v_row.reservation_key,
          'matched_channel',v_row.channel,
          'matched_publication_date',v_row.publication_date
        );
      END IF;
    END IF;
  END LOOP;

  INSERT INTO public.powerhouse_publication_uniqueness_v1(
    tenant_id,reservation_key,publication_date,channel,raw_hash,normalized_hash,
    normalized_text,story_fingerprint,source_kind,source_ref,state
  ) VALUES (
    'canonical',v_key,p_publication_date,p_channel,v_raw_hash,v_norm_hash,
    v_norm,nullif(trim(coalesce(p_story_fingerprint,'')),''),
    'publication_claim',v_key,'reserved'
  );

  RETURN jsonb_build_object(
    'allowed',true,'reason','UNIQUE_RESERVED',
    'reservation_key',v_key,'raw_hash',v_raw_hash,'normalized_hash',v_norm_hash,
    'story_fingerprint',p_story_fingerprint,
    'best_historical_similarity',round(v_best_similarity,4),
    'best_keyword_similarity',round(v_best_keyword_similarity,4),
    'best_historical_match',v_best_key
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.powerhouse_publication_distinctive_keywords_v1(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.powerhouse_publication_distinctive_keywords_v1(text) TO service_role;
REVOKE EXECUTE ON FUNCTION public.powerhouse_reserve_unique_publication_v1(date,text,text,numeric,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.powerhouse_reserve_unique_publication_v1(date,text,text,numeric,text) TO service_role;
