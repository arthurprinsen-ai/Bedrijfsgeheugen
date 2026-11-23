-- Correction: the obligation table names the Instagram channel 'instagram',
-- not 'instagram_company'. The first version therefore reported Instagram as
-- NO_OBLIGATION_ROW although rows exist (and are BLOCKED/FAILED for real reasons).
CREATE OR REPLACE FUNCTION public.powerhouse_missed_publication_v1(
  p_now timestamptz DEFAULT now(),
  p_lookback_days int DEFAULT 3,
  p_deadlines jsonb DEFAULT '{"blog":"09:00","linkedin_company":"10:00","linkedin_personal":"08:00","instagram":"18:00","email_newsletter":"08:00"}'
) RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path TO 'public', 'pg_temp'
AS $function$
WITH owners(channel,owner) AS (VALUES
  ('blog','powerhouse-daily-blog workflow + powerhouse-content-orchestrator'),
  ('linkedin_company','powerhouse-social-publisher'),
  ('linkedin_personal','powerhouse-social-publisher'),
  ('instagram','powerhouse-social-publisher'),
  ('email_newsletter','UNOWNED_NO_AUTHORIZED_CANONICAL_EMAIL_EXECUTOR')),
days AS (
  SELECT (p_now AT TIME ZONE 'Europe/Amsterdam')::date - g AS d
  FROM generate_series(0, GREATEST(0, LEAST(p_lookback_days, 14))) g),
expected AS (
  SELECT d.d AS publication_date, o.channel, o.owner,
         ((d.d::text||' '||(p_deadlines->>o.channel))::timestamp AT TIME ZONE 'Europe/Amsterdam') AS deadline
  FROM days d JOIN owners o ON p_deadlines ? o.channel),
missed AS (
  SELECT e.publication_date, e.channel, e.owner, e.deadline,
         coalesce(c.status,'NO_OBLIGATION_ROW') AS status,
         round(extract(epoch FROM (p_now - e.deadline))/3600.0,1) AS hours_late
  FROM expected e
  LEFT JOIN public.content_publication_obligations c
    ON c.tenant_id='canonical' AND c.publication_date=e.publication_date AND c.channel=e.channel
  WHERE e.deadline < p_now
    AND coalesce(c.status,'') NOT IN ('PUBLISHED','LIVE_PROVEN','MEASURED','LEARNED'))
SELECT jsonb_build_object(
  'contract','powerhouse-missed-publication-v1',
  'checked_at',p_now,
  'missed_count',(SELECT count(*) FROM missed),
  'missed',coalesce((SELECT jsonb_agg(to_jsonb(m) ORDER BY m.publication_date DESC, m.channel) FROM missed m),'[]'::jsonb));
$function$;
REVOKE ALL ON FUNCTION public.powerhouse_missed_publication_v1(timestamptz,int,jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.powerhouse_missed_publication_v1(timestamptz,int,jsonb) TO service_role;
