# Branch-sweep als eigen Janitor-job (2026-10-29)

De sweep verwijderde 150 branches per run, maar samen met de bestaande opruimstap (12 minuten) overschreed de job de timeout van 15 minuten. De sweep staat nu in een eigen job met een timeout van 20 minuten, zodat readback en writeback van de Janitor nooit worden afgekapt.
