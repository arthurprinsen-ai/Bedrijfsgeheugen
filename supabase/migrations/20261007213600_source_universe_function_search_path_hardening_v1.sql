-- Source Universe hardening: pin SQL helper search paths after advisor readback.
-- Append-only follow-up so preview and production replay the exact same security state.

alter function public.powerhouse_intelligence_domain_from_text_v1(text)
  set search_path to 'pg_catalog';

alter function public.powerhouse_intelligence_impact_score_v1(
  numeric,numeric,numeric,numeric,numeric,numeric
)
  set search_path to 'pg_catalog';

revoke execute on function public.powerhouse_intelligence_domain_from_text_v1(text)
  from public, anon, authenticated;
grant execute on function public.powerhouse_intelligence_domain_from_text_v1(text)
  to service_role;

revoke execute on function public.powerhouse_intelligence_impact_score_v1(
  numeric,numeric,numeric,numeric,numeric,numeric
)
  from public, anon, authenticated;
grant execute on function public.powerhouse_intelligence_impact_score_v1(
  numeric,numeric,numeric,numeric,numeric,numeric
)
  to service_role;
