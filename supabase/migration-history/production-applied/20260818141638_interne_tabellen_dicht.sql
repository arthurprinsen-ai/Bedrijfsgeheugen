-- De weergave draaide met de rechten van de eigenaar en stond open voor iedere
-- ingelogde gebruiker: bouwuren en marge waren zo op te vragen met de publieke sleutel.
alter view public.marge_per_onderdeel set (security_invoker = true);

revoke all on public.marge_per_onderdeel from anon, authenticated;
revoke all on public.bouwstenen from anon, authenticated;
revoke all on public.offerte_sjablonen from anon, authenticated;

grant all on public.marge_per_onderdeel to service_role;
grant all on public.bouwstenen to service_role;
grant all on public.offerte_sjablonen to service_role;
