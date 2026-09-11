create or replace view public.bg_vandaag as
 SELECT round(a.priority) AS prioriteit,
    COALESCE(NULLIF(a.person_name, ''::text), c.naam, '?'::text) AS persoon,
    COALESCE(NULLIF(a.company_name, ''::text), c.bedrijf, ''::text) AS bedrijf,
    COALESCE(NULLIF(a.role, ''::text), c.rol, ''::text) AS rol,
    a.channel AS kanaal, a.action_type AS soort, a.message_draft AS tekst_om_te_versturen, a.reason AS waarom,
    COALESCE(a.source_url, c.linkedin_url) AS link,
    CASE WHEN c.sleutel IS NOT NULL THEN 'https://www.bedrijfsgeheugen.nl/g/'::text || c.sleutel ELSE NULL::text END AS persoonlijke_link,
    a.action_id::text AS action_id
   FROM powerhouse_sales_actions a
     LEFT JOIN bg_connecties c ON c.linkedin_url = a.subject_key
  WHERE a.status = 'suggested'::text AND COALESCE(a.subject_key, ''::text) !~~* '%test%'::text
  ORDER BY a.priority DESC;
comment on view public.bg_vandaag is 'Dagoverzicht-contacten. Meetlinks op eigen domein /g/:sleutel (PR #1359, live geverifieerd 10 sept 2026) in plaats van supabase.co.';