-- Acht tabellen stonden open voor iedereen met de publieke sleutel.
--
-- Op 11 september bleek een GET met de sleutel uit de paginabron gewoon rijen
-- terug te geven, onder andere uit bg_tasks — met klantnamen erin. Deze acht
-- tabellen hadden row level security uit staan én volledige rechten voor anon
-- en authenticated. Lezen, wijzigen en leegmaken kon dus iedereen.
--
-- Ze horen bij het brein en de synchronisatie: die draaien op de service-sleutel
-- en die gaat langs RLS heen. In het verkeer van de afgelopen 24 uur komt geen
-- enkele van deze tabellen voor vanaf de browser. RLS aanzetten zonder policies
-- sluit ze dus voor de buitenwereld en laat het brein werken.

do $$
declare t text;
begin
  foreach t in array array[
    'bg_ga4_sync', 'bg_buffer_sync', 'bg_buffer_ingest_status', 'bg_notion_sync',
    'notion_synced_posts', 'bg_notion_webhooks', 'bg_tasks', 'bg_post_kenmerken'
  ] loop
    if to_regclass('public.' || t) is null then
      raise notice 'tabel public.% bestaat niet meer, overgeslagen', t;
      continue;
    end if;
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
    -- Het brein en de synchronisatie draaien op de service-sleutel.
    execute format('grant all on public.%I to service_role', t);
  end loop;
end $$;
