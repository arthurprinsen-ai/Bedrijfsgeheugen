create or replace view public.bg_post_prestatie as
WITH laatste AS (
  SELECT DISTINCT ON (s.post_id) s.post_id, s.metrics, s.observed_at
  FROM social_metric_snapshots s ORDER BY s.post_id, s.observed_at DESC
), m AS (
  SELECT l.post_id,
    COALESCE(NULLIF(l.metrics->>'impressions','')::numeric, NULLIF(l.metrics->>'Impressions','')::numeric, NULLIF(l.metrics->>'Views','')::numeric, 0) AS impressies,
    COALESCE(NULLIF(l.metrics->>'reach','')::numeric, NULLIF(l.metrics->>'Reach','')::numeric, 0) AS bereik,
    COALESCE(NULLIF(l.metrics->>'likes','')::numeric, NULLIF(l.metrics->>'Reactions','')::numeric, 0) AS likes,
    COALESCE(NULLIF(l.metrics->>'comments','')::numeric, NULLIF(l.metrics->>'Comments','')::numeric, 0) AS reacties,
    COALESCE(NULLIF(l.metrics->>'shares','')::numeric, NULLIF(l.metrics->>'Shares','')::numeric, 0) AS gedeeld,
    COALESCE(NULLIF(l.metrics->>'clicks','')::numeric, NULLIF(l.metrics->>'Clicks','')::numeric, 0) AS kliks,
    COALESCE(NULLIF(l.metrics->>'profile_visits','')::numeric, 0) AS profielbezoek
  FROM laatste l
)
SELECT p.post_id, p.platform, p.published_at,
  EXTRACT(dow FROM p.published_at) AS weekdag, EXTRACT(hour FROM p.published_at) AS uur,
  p.topic, p.content_pillar, p.format, p.hook_type, p.narrative_type, p.emotion, p.cta_type,
  COALESCE(m.impressies,0) AS impressies, COALESCE(m.bereik,0) AS bereik, COALESCE(m.likes,0) AS likes,
  COALESCE(m.reacties,0) AS reacties, COALESCE(m.gedeeld,0) AS gedeeld, COALESCE(m.kliks,0) AS kliks,
  COALESCE(m.profielbezoek,0) AS profielbezoek,
  round(100.0 * (COALESCE(m.likes,0) + COALESCE(m.reacties,0) + COALESCE(m.gedeeld,0)) / NULLIF(COALESCE(m.impressies,0),0), 2) AS interactie_pct
FROM social_posts p LEFT JOIN m ON m.post_id = p.post_id;
comment on view public.bg_post_prestatie is 'Prestatie per post voor bg_content_lessen. Leest metric-sleutels in beide schrijfwijzen (Buffer: Impressions/Reach/Reactions/Comments/Shares, intern: impressions/reach/likes/comments/shares). Hersteld 10 sept 2026: daarvoor telde de helft van de posts als nul bereik.';
select count(*) as posts, count(*) filter (where impressies>0) as met_bereik from public.bg_post_prestatie;