alter table public.offerte_sjablonen
  add column if not exists voorstel_data jsonb,
  add column if not exists is_standaard boolean not null default false;

comment on column public.offerte_sjablonen.voorstel_data is
  'Volledige voorstelgegevens in de vorm die maak-voorstel.js leest: titel, rollen, fasen, onderdelen (met sprints en stories), instap, portaal, afspraken, vervolg. Dezelfde onderdelen-vorm als offertes.inhoud, zodat deck en portaal uit een bron komen.';
comment on column public.offerte_sjablonen.is_standaard is
  'Het sjabloon dat standaard wordt gepakt als er om een voorstel wordt gevraagd.';
