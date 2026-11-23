-- Security emergency 2026-11-20: avoid publishing evaluations about minor hockey players.
-- Existing PW MO14 v7/v9 coach pages store their own plans locally and do not call these Data API tables.
-- Preserve PostgreSQL service_role for server-authorized operations.
BEGIN;
ALTER TABLE public.pw_beoordelingen ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pw_opstellingen ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public.pw_beoordelingen FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.pw_opstellingen FROM anon, authenticated;

DROP POLICY IF EXISTS pw_beoordelingen_insert_anon ON public.pw_beoordelingen;
DROP POLICY IF EXISTS pw_beoordelingen_select_anon ON public.pw_beoordelingen;
DROP POLICY IF EXISTS pw_opstellingen_insert_anon ON public.pw_opstellingen;
DROP POLICY IF EXISTS pw_opstellingen_select_anon ON public.pw_opstellingen;

COMMENT ON TABLE public.pw_beoordelingen IS 'Private minor player evaluations. Server-authorized access only. No anonymous Data API access.';
COMMENT ON TABLE public.pw_opstellingen IS 'Private hockey lineup plans. Server-authorized access only. No anonymous Data API access.';
COMMIT;