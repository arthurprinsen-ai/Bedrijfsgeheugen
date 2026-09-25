-- Global publication uniqueness gate.
-- Fingerprint: powerhouse-global-post-uniqueness-v1
-- Exact duplicate + near-duplicate protection across historical social publications.

CREATE TABLE IF NOT EXISTS public.powerhouse_publication_uniqueness_v1 (
  id bigserial PRIMARY KEY,
  tenant_id text NOT NULL DEFAULT 'canonical',
  reservation_key text NOT NULL,
  publication_date date,
  channel text,
  raw_hash text,
  normalized_hash text,
  normalized_text text,
  source_kind text NOT NULL,
  source_ref text,
  state text NOT NULL DEFAULT 'reserved',
  external_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT powerhouse_publication_uniqueness_v1_reservation_key_uq UNIQUE (tenant_id,reservation_key)
);

CREATE UNIQUE INDEX IF NOT EXISTS powerhouse_publication_uniqueness_v1_raw_hash_uq
  ON public.powerhouse_publication_uniqueness_v1(tenant_id,raw_hash)
  WHERE raw_hash IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS powerhouse_publication_uniqueness_v1_normalized_hash_uq
  ON public.powerhouse_publication_uniqueness_v1(tenant_id,normalized_hash)
  WHERE normalized_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS powerhouse_publication_uniqueness_v1_date_idx
  ON public.powerhouse_publication_uniqueness_v1(tenant_id,publication_date DESC);

ALTER TABLE public.powerhouse_publication_uniqueness_v1 ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.powerhouse_normalize_publication_text_v1(p_text text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT trim(
    regexp_replace(
      regexp_replace(
        regexp_replace(
          lower(coalesce(p_text,'')),
          'https?://[^[:space:]]+',
          ' ',
          'gi'
        ),
        '[^[:alnum:]À-ÿ]+',
        ' ',
        'g'
      ),
      '[[:space:]]+',
      ' ',
      'g'
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.powerhouse_publication_shingles_v1(p_text text)
RETURNS text[]
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  words text[];
  result text[] := ARRAY[]::text[];
  i integer;
  n integer;
BEGIN
  words := regexp_split_to_array(public.powerhouse_normalize_publication_text_v1(p_text), '[[:space:]]+');
  n := coalesce(array_length(words,1),0);
  IF n = 0 THEN
    RETURN result;
  END IF;
  IF n < 3 THEN
    RETURN words;
  END IF;
  FOR i IN 1..(n-2) LOOP
    result := array_append(result, words[i] || ' ' || words[i+1] || ' ' || words[i+2]);
  END LOOP;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.powerhouse_reserve_unique_publication_v1(
  p_publication_date date,
  p_channel text,
  p_body text,
  p_similarity_threshold numeric DEFAULT 0.62
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
  v_intersection integer;
  v_union integer;
  v_similarity numeric;
  v_best_similarity numeric := 0;
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
    IF v_existing.raw_hash=v_raw_hash AND v_existing.normalized_hash=v_norm_hash THEN
      RETURN jsonb_build_object(
        'allowed',true,'reason','CLAIM_ALREADY_RESERVED_SAME_CONTENT',
        'reservation_key',v_key,'raw_hash',v_raw_hash,'normalized_hash',v_norm_hash
      );
    END IF;
    RETURN jsonb_build_object(
      'allowed',false,'reason','CLAIM_ALREADY_RESERVED_DIFFERENT_CONTENT',
      'reservation_key',v_key,'matched_reservation_key',v_existing.reservation_key
    );
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

  FOR v_row IN
    SELECT *
    FROM public.powerhouse_publication_uniqueness_v1
    WHERE tenant_id='canonical'
      AND normalized_text IS NOT NULL
      AND length(normalized_text) >= 12
    ORDER BY publication_date DESC NULLS LAST, created_at DESC
    LIMIT 1000
  LOOP
    v_other := public.powerhouse_publication_shingles_v1(v_row.normalized_text);
    IF coalesce(array_length(v_candidate,1),0)=0 OR coalesce(array_length(v_other,1),0)=0 THEN
      CONTINUE;
    END IF;

    SELECT count(*) INTO v_intersection
    FROM (
      SELECT DISTINCT unnest(v_candidate) AS x
      INTERSECT
      SELECT DISTINCT unnest(v_other) AS x
    ) s;

    SELECT count(*) INTO v_union
    FROM (
      SELECT DISTINCT unnest(v_candidate) AS x
      UNION
      SELECT DISTINCT unnest(v_other) AS x
    ) s;

    v_similarity := CASE WHEN v_union=0 THEN 0 ELSE v_intersection::numeric/v_union::numeric END;

    IF v_similarity > v_best_similarity THEN
      v_best_similarity := v_similarity;
      v_best_key := v_row.reservation_key;
    END IF;

    IF v_similarity >= p_similarity_threshold THEN
      RETURN jsonb_build_object(
        'allowed',false,'reason','NEAR_DUPLICATE',
        'similarity',round(v_similarity,4),
        'threshold',p_similarity_threshold,
        'matched_reservation_key',v_row.reservation_key,
        'matched_channel',v_row.channel,
        'matched_publication_date',v_row.publication_date,
        'raw_hash',v_raw_hash,'normalized_hash',v_norm_hash
      );
    END IF;
  END LOOP;

  INSERT INTO public.powerhouse_publication_uniqueness_v1(
    tenant_id,reservation_key,publication_date,channel,raw_hash,normalized_hash,
    normalized_text,source_kind,source_ref,state
  ) VALUES (
    'canonical',v_key,p_publication_date,p_channel,v_raw_hash,v_norm_hash,
    v_norm,'publication_claim',v_key,'reserved'
  );

  RETURN jsonb_build_object(
    'allowed',true,'reason','UNIQUE_RESERVED',
    'reservation_key',v_key,'raw_hash',v_raw_hash,'normalized_hash',v_norm_hash,
    'best_historical_similarity',round(v_best_similarity,4),
    'best_historical_match',v_best_key
  );
END;
$$;

REVOKE ALL ON FUNCTION public.powerhouse_reserve_unique_publication_v1(date,text,text,numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.powerhouse_reserve_unique_publication_v1(date,text,text,numeric) TO service_role;

-- Backfill known published/scheduled artifacts with text for near-duplicate protection.
INSERT INTO public.powerhouse_publication_uniqueness_v1(
  tenant_id,reservation_key,publication_date,channel,raw_hash,normalized_hash,
  normalized_text,source_kind,source_ref,state,created_at,updated_at
)
SELECT
  'canonical',
  'history-artifact:'||run_date::text||':'||channel,
  run_date,
  channel,
  encode(extensions.digest(trim(body),'sha256'),'hex'),
  encode(extensions.digest(public.powerhouse_normalize_publication_text_v1(body),'sha256'),'hex'),
  public.powerhouse_normalize_publication_text_v1(body),
  'powerhouse_content_artifacts',
  run_date::text||':'||channel,
  status,
  created_at,
  updated_at
FROM public.powerhouse_content_artifacts
WHERE status IN ('published','scheduled')
  AND length(trim(body)) >= 12
ON CONFLICT DO NOTHING;

-- Backfill provider-side historical exact hashes, including older posts whose text is not retained.
INSERT INTO public.powerhouse_publication_uniqueness_v1(
  tenant_id,reservation_key,publication_date,channel,raw_hash,
  source_kind,source_ref,state,external_id,created_at,updated_at
)
SELECT
  tenant_id,
  'history-social:'||post_id,
  (published_at AT TIME ZONE 'Europe/Amsterdam')::date,
  coalesce(channel_kind,platform),
  content_hash,
  'social_posts',
  post_id,
  'published',
  external_post_id,
  coalesce(published_at,created_at),
  updated_at
FROM public.social_posts
WHERE tenant_id='canonical'
  AND content_hash IS NOT NULL
ON CONFLICT DO NOTHING;
