# Bedrijfsprofiel uit eigen website

- Obligation: bg-bedrijfsprofiel-20261028
- Change: tabel bg_bedrijfsprofiel (service-only), functie bg_bedrijven_voor_profiel, edge function bg-bedrijfsprofiel. Geen cron, geen wijziging in outreach.
- Evidence: meting 28 oktober 2026 in Supabase: 23.295 connecties verversd zonder externe opzoeking (fresh_external_lookup_performed false); 17.035 unieke bedrijven; bg-bedrijfsnieuws controleerde 15 per dag met 0 treffers sinds 15 oktober; 523 connecties met externe signalen, 8 met bedrijfsnieuws. Bronguards: tests/brain-bedrijfsprofiel-20261028.test.mjs.
- Status: candidate; migratie niet toegepast, functie niet uitgerold; eerste gemeten run en protected merge volgen.
