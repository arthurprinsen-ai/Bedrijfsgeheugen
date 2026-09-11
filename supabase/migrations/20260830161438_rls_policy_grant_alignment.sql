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

grant select on table
  public.blokgebruik,
  public.blokversies,
  public.portaalblokken
  to anon, authenticated;

grant select on table public.organisaties to anon;

grant select on table
  public.bronnen,
  public.bronpublicaties,
  public.uitnodigingen
  to authenticated;

grant select, update on table
  public.cijfervoorstellen,
  public.organisaties
  to authenticated;

grant select, insert on table public.logboek to authenticated;

grant select, insert, update, delete on table
  public.klanten,
  public.leden,
  public.offertes
  to authenticated;