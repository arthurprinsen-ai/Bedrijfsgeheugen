-- Final view access contract. This migration intentionally sorts after the
-- earlier same-day hardening migrations so later replay cannot reopen access.

alter view public.gewijzigd_per_plek set (security_invoker = true);
alter view public.kerncijfers_publiek set (security_invoker = true);
alter view public.laatste_bronwaarden set (security_invoker = true);
alter view public.portaal_publiek set (security_invoker = true);
alter view public.relevante_publicaties set (security_invoker = true);
alter view public.te_beoordelen set (security_invoker = true);
alter view public.wijzigingen set (security_invoker = true);
alter view public.wijzigingen_publiek set (security_invoker = true);
alter view public.prijsadvies set (security_invoker = true);
alter view public.hergebruik_rendement set (security_invoker = true);

revoke all on table
  public.gewijzigd_per_plek,
  public.kerncijfers_publiek,
  public.laatste_bronwaarden,
  public.portaal_publiek,
  public.relevante_publicaties,
  public.te_beoordelen,
  public.wijzigingen,
  public.wijzigingen_publiek,
  public.prijsadvies,
  public.hergebruik_rendement
from anon, authenticated, service_role;

-- Public read projections.
grant select on table
  public.gewijzigd_per_plek,
  public.kerncijfers_publiek,
  public.portaal_publiek,
  public.wijzigingen,
  public.wijzigingen_publiek
  to anon, authenticated, service_role;

-- Signed-in operational projections.
grant select on table
  public.laatste_bronwaarden,
  public.relevante_publicaties,
  public.te_beoordelen
  to authenticated, service_role;

-- Internal intelligence remains server-only.
grant select on table
  public.prijsadvies,
  public.hergebruik_rendement
  to service_role;
