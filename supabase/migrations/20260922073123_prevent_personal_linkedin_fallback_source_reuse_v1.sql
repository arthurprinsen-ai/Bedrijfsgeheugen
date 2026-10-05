DO $do$
DECLARE
  v_def text;
  v_old text;
  v_new text;
BEGIN
  SELECT pg_get_functiondef('public.powerhouse_prepare_daily_content_fallbacks_v1(date)'::regprocedure)
    INTO v_def;

  v_old := $old$
       and public.powerhouse_jsonb_true(
             case when jsonb_typeof(a.generation_evidence->'identity_gate_evidence')='object'
                  then a.generation_evidence->'identity_gate_evidence'
                  else coalesce(a.generation_evidence,'{}'::jsonb) end,
             'arthur_anchor_verified')
     order by md5(p_date::text || coalesce(a.title,'') || a.run_date::text)
$old$;

  v_new := $new$
       and public.powerhouse_jsonb_true(
             case when jsonb_typeof(a.generation_evidence->'identity_gate_evidence')='object'
                  then a.generation_evidence->'identity_gate_evidence'
                  else coalesce(a.generation_evidence,'{}'::jsonb) end,
             'arthur_anchor_verified')
       and not exists (
         select 1
           from public.powerhouse_content_recommendations prior
          where prior.target_channel='linkedin_personal'
            and prior.run_date < p_date
            and coalesce(prior.evidence->>'content_id','') <> ''
            and prior.evidence->>'content_id' =
                coalesce(
                  (case when jsonb_typeof(a.generation_evidence->'identity_gate_evidence')='object'
                        then a.generation_evidence->'identity_gate_evidence'
                        else coalesce(a.generation_evidence,'{}'::jsonb) end)->>'content_id',
                  'fallback-source:'||a.run_date::text
                )
       )
     order by md5(p_date::text || coalesce(a.title,'') || a.run_date::text)
$new$;

  IF position(v_old in v_def) = 0 THEN
    RAISE EXCEPTION 'expected fallback source-selection fragment not found';
  END IF;

  EXECUTE replace(v_def, v_old, v_new);
END
$do$;
