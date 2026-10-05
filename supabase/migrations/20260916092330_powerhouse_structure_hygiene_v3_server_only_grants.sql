-- Powerhouse Structure Hygiene v3 — make intentional server-only tables explicit.
-- These tables already have RLS enabled and no policies, so anon/authenticated
-- have no effective row access. This migration removes latent broad table grants
-- inherited from older defaults. service_role access is unchanged.

revoke all on table public.bg_bedrijf_gecheckt from anon, authenticated;
revoke all on table public.bg_bedrijfsnieuws from anon, authenticated;
revoke all on table public.bg_externe_signalen from anon, authenticated;
revoke all on table public.bg_functie_aanroep from anon, authenticated;
revoke all on table public.bg_gezondheid from anon, authenticated;
revoke all on table public.bg_interacties from anon, authenticated;
revoke all on table public.bg_signaal_onderwerpen from anon, authenticated;
revoke all on table public.bg_uitkomst_bronnen_gezien from anon, authenticated;
revoke all on table public.bg_zoekprestaties from anon, authenticated;
revoke all on table public.bg_zoekwoordkansen from anon, authenticated;
revoke all on table public.connector_definitions from anon, authenticated;
revoke all on table public.connector_executions from anon, authenticated;
revoke all on table public.connector_reviews from anon, authenticated;
revoke all on table public.powerhouse_resource_factors from anon, authenticated;
revoke all on table public.revenue_learning_applications from anon, authenticated;
revoke all on table public.revenue_learning_decisions from anon, authenticated;
revoke all on table public.revenue_learning_evidence from anon, authenticated;
revoke all on table public.revenue_learning_obligations from anon, authenticated;
revoke all on table public.revenue_learning_projections from anon, authenticated;
revoke all on table public.revenue_learnings from anon, authenticated;
revoke all on table public.social_experiments from anon, authenticated;
revoke all on table public.social_learning_applications from anon, authenticated;
revoke all on table public.social_learning_decisions from anon, authenticated;
revoke all on table public.social_learning_evaluations from anon, authenticated;
revoke all on table public.social_learning_obligations from anon, authenticated;
revoke all on table public.social_learning_projections from anon, authenticated;
revoke all on table public.social_learnings from anon, authenticated;
revoke all on table public.social_metric_snapshots from anon, authenticated;
revoke all on table public.social_posts from anon, authenticated;
