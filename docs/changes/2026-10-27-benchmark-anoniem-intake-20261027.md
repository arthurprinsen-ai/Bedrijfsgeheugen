# Anoniem meedoen aan de benchmark: eigen route in plaats van Make (27 okt 2026)

- Het AI-scan benchmarkformulier stuurde naar een Make-webhook. Er kwam geen rij in Supabase en het benchmarkrapport telde die inzendingen niet mee.
- Nieuw: tabel `benchmark_anoniem_inzendingen` (branche, omvangklasse, uren per jaar, bron `ai-scan`), afgeschermd met RLS en zonder rechten voor anon of authenticated.
- Nieuw: edge function `bg-benchmark-intake` (verify_jwt false) met alleen de site-origin toegestaan. Validatie in `_shared/benchmark-intake.mjs`.
- Aggregaat `benchmark_anoniem_branche`: alleen groepen met minimaal 5 deelnemers.
- `ai-scan.html` stuurt nu naar de edge function.
- Bewust niet gedaan: de bestaande benchmark-projectie (`frisse_blik`, geverifieerde organisatie) is niet gewijzigd.
- Live getest: geldige inzending van site-origin gaf 200 en een rij; vreemde origin gaf 403. Die testrij (Zorg, 777 uur) staat nog in de tabel, de verwijdering is geannuleerd.
