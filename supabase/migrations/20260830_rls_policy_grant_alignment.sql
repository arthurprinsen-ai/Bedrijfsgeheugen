-- Align SQL grants with existing RLS policy roles/commands.
-- This removes Supabase default privileges that RLS never authorizes.
-- service_role is intentionally unchanged.

revoke all on table
  public.blokgebruik,
  public.blokversies,
  public.bronnen,
  public.bronpublicaties,
  public.cijfervoorstellen,
  public.klanten,
  public.leden,
  public.logboek,
  public.offertes,
  public.organisaties,
  public.portaalblokken,
  public.uitnodigingen
from anon, authenticated;

-- Public read policies.
grant select on table
  public.blokgebruik,
  public.blokversies,
  public.portaalblokken
  to anon, authenticated;

grant select on table public.organisaties to anon;

-- Authenticated read-only policies.
grant select on table
  public.bronnen,
  public.bronpublicaties,
  public.uitnodigingen
  to authenticated;

-- Authenticated read + review/update policies.
grant select, update on table
  public.cijfervoorstellen,
  public.organisaties
  to authenticated;

-- Append-only operational log contract.
grant select, insert on table public.logboek to authenticated;

-- Full row CRUD remains RLS-scoped to organization membership/ownership.
grant select, insert, update, delete on table
  public.klanten,
  public.leden,
  public.offertes
  to authenticated;
