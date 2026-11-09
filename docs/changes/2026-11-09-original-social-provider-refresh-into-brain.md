# De ontbrekende BRAIN-vervolgmeting: gebouwd in de bestaande leercyclus

De bestaande Powerhouse-postketen heeft inmiddels één verantwoordelijke publicatie-executor, een zesuurse originele provider-meting, een per-post handoff-audit en de bestaande BRAIN-evaluator op minuut 39. Op 9 november kwam er een nieuw legitiem Windsor-resultaat bij dezelfde LinkedIn-bedrijfspost waarvan een oudere provideropname al geëvalueerd was. De evaluator accepteerde uitsluitend de status van nooit eerder gemeten posts; latere metingen bleven definitief liggen. Dit is de oorzaak van `WAITING_BRAIN_REFRESH`, niet een fout van Windsor of een ontbrekende nieuwe scheduler.

## Correctie

De **bestaande** functie `public.powerhouse_backfill_social_learning_applications_v1` gebruikt nu het echte unieke `application_id + source_event_id`. Zij selecteert binnen 24 uur tot acht dagen na originele publicatie meerdere onafhankelijk verifieerbare postbron-events, ook als de bestaande applicatiestatus al `PROVIDER_METRICS_OBSERVED_*` is. De evaluatie krijgt haar eigen onveranderlijke ID en is bij herhaling een no-op. Niet geëvalueerde observaties krijgen een eerlijke descriptieve evaluatie; het originele TESTING-leerregister krijgt een bronreferentie, maar een tweede snapshot van één post telt **niet** als een tweede onafhankelijke steekproef. Causale effectgrootte, vertrouwen en actuele omzet blijven onaangeroerd.

## Doorwerking

De huidige `bg_social_lus_cyclus` blijft de enige variabele/hypothese voor de bestaande generator kiezen en leest de originele `bg_social_lus_meting` als uitgangssituatie. De originele `social_learnings` ontvangen nieuwe bronbewijzen. Voordat de volledige lus als 'zelfverbeterend' mag worden gemeld, moet een **volgende natuurlijke content-generatie** aantonen dat deze bewijsreferenties een expliciete redactie- of experimentbeslissing hebben beïnvloed, gevolgd door een echt gepubliceerde post en onafhankelijke provider- en conversiemeetgegevens. Zonder die readback blijft de eindstatus onvolledig.

## Borging

Geen nieuwe scheduler, writer, recordstore, CRM, social post of omzeilde OAuth. Nieuwe provider-observatie is een nieuw `source_event_id`, geen vrijbrief om dubbel te posten. Herhaal exact dezelfde writer twee keer als idempotentietest en verifieer beide bronnen onafhankelijke. Beveiliging: geen uitbreiding van public/anon/authenticated EXECUTE op bestaande SECURITY DEFINER-functie; alleen `service_role`.

Reparatie-bron: `supabase/migrations/20261109152200_original_social_provider_refresh_learning_v1.sql`. Regressie: `tests/brain-original-provider-refresh-learning-20261109.test.mjs`; eigenaar: originele minuut39-runtime, incident https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198.
