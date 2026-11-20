-- Supabase LIVE migration: version 20261120134537
-- 2026-11-20 emergency private-data correction.
-- PW MO14 youth assessments and lineup plans must NOT be world-readable/writable.
-- These tables already used RLS, but policies USING/WITH CHECK (true) exposed data to anon.
-- The public static app does not depend on these two Supabase Data API tables.
-- Service-role, server-authenticated operations remain supported.

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
